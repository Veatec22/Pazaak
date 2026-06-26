import { useCallback, useEffect, useState } from 'react';
import { faker } from '@faker-js/faker';
import { createRoom, type LobbyAnnounceMessage } from './protocol';

const LOBBY_ROOM_ID = 'pazaak-global-lobby';

const NICKNAME_KEY = 'pz-nickname';

export function getRandomNickname(): string {
  return faker.internet.username().slice(0, 20);
}

export function getSavedNickname(): string {
  if (typeof window === 'undefined') return 'HK-47';
  let name = localStorage.getItem(NICKNAME_KEY);
  if (!name) {
    name = getRandomNickname();
    localStorage.setItem(NICKNAME_KEY, name);
  }
  return name;
}

export function useNickname() {
  const [nickname, setNicknameState] = useState(getSavedNickname);

  const setNickname = useCallback((name: string) => {
    const trimmed = name.trim().slice(0, 20) || 'Player';
    localStorage.setItem(NICKNAME_KEY, trimmed);
    setNicknameState(trimmed);
  }, []);

  return [nickname, setNickname] as const;
}

export interface ActiveGame {
  peerId: string;
  roomId: string;
  hostName: string;
}




export function useLobby(active: boolean) {
  const [activeGames, setActiveGames] = useState<ActiveGame[]>([]);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    if (!active) {
      setActiveGames([]);
      setConnecting(false);
      return;
    }

    setConnecting(true);
    const room = createRoom(LOBBY_ROOM_ID);
    const [_, getAnnounce] = room.makeAction('announce') as unknown as [unknown, (cb: (m: LobbyAnnounceMessage, peerId: string) => void) => void];


    getAnnounce((data, peerId) => {
      setConnecting(false);
      setActiveGames((prev) => {
        const exists = prev.some((g) => g.peerId === peerId);
        if (exists) {
          return prev.map((g) =>
            g.peerId === peerId ? { peerId, roomId: data.roomId, hostName: data.hostName } : g,
          );
        }
        return [...prev, { peerId, roomId: data.roomId, hostName: data.hostName }];
      });
    });

    room.onPeerLeave((peerId) => {
      setActiveGames((prev) => prev.filter((g) => g.peerId !== peerId));
    });


    const timeout = setTimeout(() => {
      setConnecting(false);
    }, 4000);

    return () => {
      clearTimeout(timeout);
      void room.leave();
    };
  }, [active]);

  return { activeGames, connecting };
}




export function useLobbyAnnouncer(roomId: string, hostName: string, active: boolean) {
  useEffect(() => {
    if (!active) return;

    const room = createRoom(LOBBY_ROOM_ID);
    const [sendAnnounce] = room.makeAction('announce') as unknown as [(m: LobbyAnnounceMessage, target?: string) => Promise<unknown>, unknown];


    const announceAll = () => {
      void sendAnnounce({ roomId, hostName });
    };


    room.onPeerJoin((peerId) => {
      void sendAnnounce({ roomId, hostName }, peerId);
    });


    const delay = setTimeout(announceAll, 1000);

    return () => {
      clearTimeout(delay);
      void room.leave();
    };
  }, [roomId, hostName, active]);
}
