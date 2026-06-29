import { joinRoom } from 'trystero/torrent';

import type { ActionDict, PazaakEvent, SeatState } from '../engine';


const APP_ID = 'pazaak-1v1-hk47';








const RELAY_URLS: string[] | undefined = undefined;






export type SyncMessage =
  | { kind: 'start'; events: PazaakEvent[]; state: SeatState }
  | { kind: 'events'; events: PazaakEvent[]; state: SeatState }

  | { kind: 'resume'; state: SeatState };


export interface ActMessage {
  action: ActionDict;
}


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






export function syncChannel(room: Room): { send: Sender<SyncMessage>; get: Receiver<SyncMessage> } {
  const [send, get] = room.makeAction('sync') as unknown as [Sender<SyncMessage>, Receiver<SyncMessage>];
  return { send, get };
}

export function actChannel(room: Room): { send: Sender<ActMessage>; get: Receiver<ActMessage> } {
  const [send, get] = room.makeAction('act') as unknown as [Sender<ActMessage>, Receiver<ActMessage>];
  return { send, get };
}
