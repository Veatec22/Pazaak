import { useCallback, useEffect, useRef, useState } from 'react';

import { MatchSession, PazaakGame, randomSideDeck, SeededRng } from '../engine';
import type { ActionDict, Seat, SeatState } from '../engine';
import type { MatchController } from '../ui/controller';
import { useReplay } from '../ui/replay';
import { playPazaakSound, primePazaakSounds } from '../ui/sounds';
import { actChannel, type ActMessage, createRoom, type Room, syncChannel, type SyncMessage } from './protocol';

const HOST_SEAT: Seat = 0;
const GUEST_SEAT: Seat = 1;

/**
 * Networked controller over a Trystero room. The **host** (room creator) owns the single
 * `MatchSession` — all RNG lives there — and broadcasts the public event stream plus the
 * guest's per-seat snapshot. The **guest** is a thin renderer: it replays what the host
 * sends and ships its own actions back up. Both share `Board` and the replay engine.
 */
export function useOnlineMatch(roomId: string, isHost: boolean): MatchController {
  const mySeat: Seat = isHost ? HOST_SEAT : GUEST_SEAT;
  const { display, banner, finished, replay, resetDisplay, showSnapshot } = useReplay(mySeat);
  const [view, setView] = useState<SeatState | null>(null);
  const [activeSeat, setActiveSeat] = useState<Seat | null>(null);
  const [busy, setBusy] = useState(true);
  const [connection, setConnection] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [status, setStatus] = useState(
    isHost ? 'Share the link — waiting for your friend to join…' : 'Connecting to the host…',
  );

  const sessionRef = useRef<MatchSession | null>(null);
  const roomRef = useRef<Room | null>(null);
  const sendSyncRef = useRef<((m: SyncMessage) => void) | null>(null);
  const sendActRef = useRef<((m: ActMessage) => void) | null>(null);
  const peerRef = useRef<string | null>(null);
  const viewRef = useRef<SeatState | null>(null);
  const chainRef = useRef<Promise<void>>(Promise.resolve());

  const putView = useCallback((v: SeatState | null) => {
    viewRef.current = v;
    setView(v);
  }, []);

  // -- host side ---------------------------------------------------------------

  const settleHost = useCallback(() => {
    const s = sessionRef.current;
    if (!s) return;
    if (s.isOver) {
      setActiveSeat(null);
      putView(s.stateFor(HOST_SEAT));
      setBusy(false);
      return;
    }
    const seat = s.current!;
    setActiveSeat(seat);
    putView(s.stateFor(HOST_SEAT));
    setBusy(false);
    if (seat === HOST_SEAT) playPazaakSound('startturn');
  }, [putView]);

  const applyHost = useCallback(
    (action: ActionDict, fromSeat: Seat) => {
      const s = sessionRef.current;
      if (!s || s.isOver || s.current !== fromSeat) return;
      void (async () => {
        setBusy(true);
        putView(null);
        const events = s.apply(action);
        sendSyncRef.current?.({ kind: 'events', events, state: s.stateFor(GUEST_SEAT) });
        await replay(events);
        settleHost();
      })();
    },
    [putView, replay, settleHost],
  );

  const startHostGame = useCallback(() => {
    const rng = new SeededRng((Math.random() * 1e9) >>> 0);
    const game = new PazaakGame(randomSideDeck(rng), randomSideDeck(rng), { rng });
    const s = new MatchSession(game);
    sessionRef.current = s;
    void (async () => {
      resetDisplay();
      putView(null);
      setBusy(true);
      sendSyncRef.current?.({ kind: 'start', events: s.openingEvents, state: s.stateFor(GUEST_SEAT) });
      await replay(s.openingEvents);
      settleHost();
    })();
  }, [putView, replay, resetDisplay, settleHost]);

  // -- guest side --------------------------------------------------------------

  const settleGuest = useCallback((st: SeatState) => {
    putView(st);
    setActiveSeat(st.over ? null : st.your_turn ? GUEST_SEAT : HOST_SEAT);
    setBusy(false);
    if (st.your_turn && !st.over) playPazaakSound('startturn');
  }, [putView]);

  const handleSync = useCallback(
    (msg: SyncMessage) => {
      chainRef.current = chainRef.current.then(async () => {
        setBusy(true);
        if (msg.kind === 'resume') {
          // Reconnect: rebuild the board straight from the snapshot, no animation.
          showSnapshot(msg.state);
          settleGuest(msg.state);
          return;
        }
        putView(null);
        if (msg.kind === 'start') resetDisplay();
        await replay(msg.events);
        settleGuest(msg.state);
      });
    },
    [putView, replay, resetDisplay, settleGuest, showSnapshot],
  );

  // -- room wiring -------------------------------------------------------------

  useEffect(() => {
    // No StrictMode "run once" guard here: the cleanup leaves the room, so guarding the
    // re-mount would leave us with a room that was created then abandoned. Instead we create
    // and leave per effect lifecycle — StrictMode just does an extra join/leave in dev.
    primePazaakSounds();

    const room = createRoom(roomId);
    roomRef.current = room;
    const syncCh = syncChannel(room);
    const actCh = actChannel(room);
    sendSyncRef.current = (m) => void syncCh.send(m, peerRef.current ?? undefined);
    sendActRef.current = (m) => void actCh.send(m, peerRef.current ?? undefined);

    if (isHost) {
      actCh.get((m) => applyHost(m.action, GUEST_SEAT));
    } else {
      syncCh.get((m) => handleSync(m));
    }

    room.onPeerJoin((id) => {
      peerRef.current = id;
      setConnection('connected');
      if (isHost) {
        setStatus('Friend connected.');
        if (!sessionRef.current) startHostGame();
        // A returning guest gets a resync snapshot so its board rebuilds where we left off.
        else sendSyncRef.current?.({ kind: 'resume', state: sessionRef.current.stateFor(GUEST_SEAT) });
      } else {
        setStatus('Connected to the host.');
      }
    });

    room.onPeerLeave((id) => {
      if (peerRef.current === id) peerRef.current = null;
      setConnection('disconnected');
      setStatus(isHost ? 'Friend disconnected — waiting for them to return…' : 'Lost the host — trying to reconnect…');
      setBusy(true);
    });

    return () => {
      void room.leave();
      roomRef.current = null;
    };
  }, [roomId, isHost, applyHost, handleSync, startHostGame]);

  // -- action entry point ------------------------------------------------------

  const act = useCallback(
    (action: ActionDict) => {
      if (finished) return;
      const v = viewRef.current;
      if (!v || !v.your_turn) return;
      if (isHost) {
        applyHost(action, HOST_SEAT);
      } else {
        putView(null); // lock controls until the host echoes the result
        setBusy(true);
        sendActRef.current?.({ action });
      }
    },
    [applyHost, finished, isHost, putView],
  );

  const reset = useCallback(() => {
    if (isHost && peerRef.current) startHostGame();
  }, [isHost, startHostGame]);

  return {
    display,
    view,
    mySeat,
    activeSeat,
    banner,
    busy,
    finished,
    status,
    online: true,
    connection,
    act,
    reset: isHost ? reset : undefined,
  };
}
