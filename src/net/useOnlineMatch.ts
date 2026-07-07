import { useCallback, useEffect, useRef, useState } from 'react';

import { deckFromPool, MatchSession, PazaakGame, SeededRng } from '../engine';
import type { ActionDict, CardPool, Seat, SeatState } from '../engine';
import type { MatchController } from '../ui/controller';
import { useReplay } from '../ui/replay';
import { playPazaakSound, primePazaakSounds } from '../ui/sounds';
import { actChannel, type ActMessage, createRoom, type Room, syncChannel, type SyncMessage } from './protocol';
import { getSavedNickname } from './useLobby';

const HOST_SEAT: Seat = 0;
const GUEST_SEAT: Seat = 1;
const DEAL_PAUSE_MS = 650;
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));







export function useOnlineMatch(roomId: string, isHost: boolean): MatchController {
  const mySeat: Seat = isHost ? HOST_SEAT : GUEST_SEAT;
  const { display, banner, finished, replay, resetDisplay, showSnapshot } = useReplay(mySeat);
  const [view, setView] = useState<SeatState | null>(null);
  const [activeSeat, setActiveSeat] = useState<Seat | null>(null);
  const [busy, setBusy] = useState(true);
  const [connection, setConnection] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [status, setStatus] = useState(
    isHost ? 'status_waiting_for_friend' : 'status_connecting_to_host',
  );
  const [lobbyMode, setLobbyModeState] = useState<CardPool>('mix');
  const [guestName, setGuestName] = useState<string | null>(null);
  const [guestReady, setGuestReadyState] = useState(false);
  const [ready, setReady] = useState(false);
  const [kicked, setKicked] = useState(false);

  const sessionRef = useRef<MatchSession | null>(null);
  const roomRef = useRef<Room | null>(null);
  const sendSyncRef = useRef<((m: SyncMessage) => void) | null>(null);
  const sendActRef = useRef<((m: ActMessage) => void) | null>(null);
  const peerRef = useRef<string | null>(null);
  const viewRef = useRef<SeatState | null>(null);
  const chainRef = useRef<Promise<void>>(Promise.resolve());
  const lobbyModeRef = useRef<CardPool>('mix');
  const guestReadyRef = useRef(false);

  const putView = useCallback((v: SeatState | null) => {
    viewRef.current = v;
    setView(v);
  }, []);



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

  const publishLobby = useCallback(() => {
    sendSyncRef.current?.({
      kind: 'lobby',
      mode: lobbyModeRef.current,
      guestReady: guestReadyRef.current,
    });
  }, []);

  const setLobbyMode = useCallback(
    (mode: CardPool) => {
      if (!isHost || sessionRef.current) return;
      lobbyModeRef.current = mode;
      guestReadyRef.current = false;
      setLobbyModeState(mode);
      setGuestReadyState(false);
      publishLobby();
    },
    [isHost, publishLobby],
  );

  const clearGuestLobbyState = useCallback(() => {
    peerRef.current = null;
    guestReadyRef.current = false;
    setGuestName(null);
    setGuestReadyState(false);
  }, []);

  const kickGuest = useCallback(() => {
    if (!isHost || !peerRef.current || sessionRef.current) return;
    const peerId = peerRef.current;
    sendSyncRef.current?.({ kind: 'kicked' });
    window.setTimeout(() => roomRef.current?.getPeers()[peerId]?.close(), 150);
    clearGuestLobbyState();
    setConnection('connecting');
    setStatus('status_waiting_for_friend');
    setBusy(true);
  }, [clearGuestLobbyState, isHost]);

  const applyHost = useCallback(
    (action: ActionDict, fromSeat: Seat) => {
      const s = sessionRef.current;
      if (!s || s.isOver || s.current !== fromSeat) return;
      void (async () => {
        setBusy(true);
        const events = s.apply(action);
        sendSyncRef.current?.({ kind: 'events', events, state: s.stateFor(GUEST_SEAT) });
        if (action.type === 'play' && fromSeat === HOST_SEAT) putView(s.stateFor(HOST_SEAT));
        await replay(events);
        settleHost();
      })();
    },
    [putView, replay, settleHost],
  );

  const startHostGame = useCallback(() => {
    if (!isHost || !peerRef.current || !guestReadyRef.current) return;
    const rng = new SeededRng((Math.random() * 1e9) >>> 0);
    const game = new PazaakGame(deckFromPool(rng, lobbyModeRef.current), deckFromPool(rng, lobbyModeRef.current), { rng });
    const s = new MatchSession(game);
    sessionRef.current = s;
    void (async () => {
      resetDisplay();
      setBusy(true);
      putView(s.stateFor(HOST_SEAT));
      sendSyncRef.current?.({ kind: 'start', events: s.openingEvents, state: s.stateFor(GUEST_SEAT) });
      await sleep(DEAL_PAUSE_MS);
      await replay(s.openingEvents);
      settleHost();
    })();
  }, [isHost, putView, replay, resetDisplay, settleHost]);



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
        if (msg.kind === 'lobby') {
          lobbyModeRef.current = msg.mode;
          guestReadyRef.current = msg.guestReady;
          setLobbyModeState(msg.mode);
          setGuestReadyState(msg.guestReady);
          if (!isHost) setReady(msg.guestReady);
          setBusy(true);
          return;
        }
        if (msg.kind === 'kicked') {
          setKicked(true);
          setConnection('disconnected');
          setStatus('status_kicked');
          setReady(false);
          setBusy(true);
          await roomRef.current?.leave();
          return;
        }
        if (msg.kind === 'resume') {

          showSnapshot(msg.state);
          settleGuest(msg.state);
          return;
        }
        if (msg.kind === 'start') {
          resetDisplay();
          putView(msg.state);
          await sleep(DEAL_PAUSE_MS);
        }
        await replay(msg.events);
        settleGuest(msg.state);
      });
    },
    [isHost, putView, replay, resetDisplay, settleGuest, showSnapshot],
  );



  useEffect(() => {



    primePazaakSounds();

    const room = createRoom(roomId);
    roomRef.current = room;
    const syncCh = syncChannel(room);
    const actCh = actChannel(room);
    sendSyncRef.current = (m) => void syncCh.send(m, peerRef.current ?? undefined);
    sendActRef.current = (m) => void actCh.send(m, peerRef.current ?? undefined);

    if (isHost) {
      actCh.get((m) => {
        if (m.kind === 'hello') {
          setGuestName(m.nickname);
          publishLobby();
          return;
        }
        if (m.kind === 'ready') {
          setGuestName(m.nickname);
          guestReadyRef.current = m.ready;
          setGuestReadyState(m.ready);
          publishLobby();
          return;
        }
        applyHost(m.action, GUEST_SEAT);
      });
    } else {
      syncCh.get((m) => handleSync(m));
    }

    room.onPeerJoin((id) => {
      peerRef.current = id;
      setConnection('connected');
      if (isHost) {
        setStatus('status_friend_connected');
        if (sessionRef.current) sendSyncRef.current?.({ kind: 'resume', state: sessionRef.current.stateFor(GUEST_SEAT) });
        else publishLobby();
      } else {
        setStatus('status_connected_to_host');
        setKicked(false);
        sendActRef.current?.({ kind: 'hello', nickname: getSavedNickname() });
      }
    });

    room.onPeerLeave((id) => {
      const wasCurrentPeer = peerRef.current === id;
      if (isHost && !wasCurrentPeer) return;
      if (wasCurrentPeer) peerRef.current = null;
      setConnection('disconnected');
      setStatus(isHost ? 'status_friend_disconnected' : 'status_host_disconnected');
      setBusy(true);
      if (isHost && !sessionRef.current) {
        clearGuestLobbyState();
      }
    });

    return () => {
      void room.leave();
      roomRef.current = null;
    };
  }, [roomId, isHost, applyHost, clearGuestLobbyState, handleSync, publishLobby]);



  const act = useCallback(
    (action: ActionDict) => {
      if (finished) return;
      const v = viewRef.current;
      if (!v || !v.your_turn) return;
      if (isHost) {
        applyHost(action, HOST_SEAT);
      } else {
        setBusy(true);
        sendActRef.current?.({ kind: 'action', action });
      }
    },
    [applyHost, finished, isHost],
  );

  const toggleReady = useCallback(() => {
    if (isHost || sessionRef.current) return;
    const next = !ready;
    setReady(next);
    sendActRef.current?.({ kind: 'ready', ready: next, nickname: getSavedNickname() });
  }, [isHost, ready]);

  const reset = useCallback(() => {
    if (isHost && peerRef.current && guestReadyRef.current) startHostGame();
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
    onlineLobby: {
      isHost,
      connected: connection === 'connected',
      mode: lobbyMode,
      guestName,
      guestReady,
      ready,
      kicked,
      canStart: isHost && connection === 'connected' && guestReady && !sessionRef.current,
      setMode: setLobbyMode,
      toggleReady,
      kick: isHost ? kickGuest : undefined,
      start: startHostGame,
    },
    act,
    reset: isHost ? reset : undefined,
  };
}
