import { joinRoom, selfId } from 'trystero/torrent';

import type { ActionDict, PazaakEvent, SeatState } from '../engine';

/** Trystero app namespace — peers only meet others using the same appId + room id. */
export const APP_ID = 'pazaak-1v1-hk47';

/**
 * Peer discovery rides Trystero's **torrent** strategy over public WebTorrent trackers —
 * its most battle-tested signalling path. (Nostr relays rate-limited / timed out, and the
 * MQTT brokers connected but didn't reliably relay the handshake.) Still zero owned
 * infrastructure: trackers only carry the WebRTC offer/answer; the match itself runs over
 * the direct peer-to-peer data channel. `undefined` here means "use the built-in trackers".
 */
const RELAY_URLS: string[] | undefined = undefined;

/**
 * Host → guest. The host owns the single engine and broadcasts the public event stream plus
 * the guest's own per-seat snapshot (which already hides the host's hand). `start` is the
 * first message of a (re)match; `events` carries each subsequent turn's animation + state.
 */
export type SyncMessage =
  | { kind: 'start'; events: PazaakEvent[]; state: SeatState }
  | { kind: 'events'; events: PazaakEvent[]; state: SeatState }
  // Reconnect resync: render the board straight from the snapshot, no animation.
  | { kind: 'resume'; state: SeatState };

/** Guest → host: an action to apply on the guest's behalf (host validates the turn). */
export interface ActMessage {
  action: ActionDict;
}

/** Host → lobby: announce hosting status to peers in the lobby. */
export interface LobbyAnnounceMessage {
  roomId: string;
  hostName: string;
}

export type Room = ReturnType<typeof joinRoom>;

export function createRoom(roomId: string): Room {
  return joinRoom({ appId: APP_ID, ...(RELAY_URLS ? { relayUrls: RELAY_URLS } : {}) }, roomId);
}

type Sender<T> = (data: T, target?: string | string[]) => Promise<unknown>;
type Receiver<T> = (cb: (data: T, peerId: string) => void) => void;

/**
 * Typed channels over Trystero's `makeAction`. The cast localises the one place our typed
 * messages meet Trystero's structural `DataPayload` (JSON) constraint, which plain
 * interfaces don't satisfy without an index signature.
 */
export function syncChannel(room: Room): { send: Sender<SyncMessage>; get: Receiver<SyncMessage> } {
  const [send, get] = room.makeAction('sync') as unknown as [Sender<SyncMessage>, Receiver<SyncMessage>];
  return { send, get };
}

export function actChannel(room: Room): { send: Sender<ActMessage>; get: Receiver<ActMessage> } {
  const [send, get] = room.makeAction('act') as unknown as [Sender<ActMessage>, Receiver<ActMessage>];
  return { send, get };
}

export { selfId };
