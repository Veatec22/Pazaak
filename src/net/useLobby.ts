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

/**
 * Hook for guests to listen for active games in the global lobby room.
 */
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

    // When we join, existing hosts will trigger onPeerJoin and send us announcements.
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

    // Timeout connecting indicator if no peers are found after 4s (lobby is just empty)
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

/**
 * Hook for hosts to advertise their game room in the global lobby room.
 */
export function useLobbyAnnouncer(roomId: string, hostName: string, active: boolean) {
  useEffect(() => {
    if (!active) return;

    const room = createRoom(LOBBY_ROOM_ID);
    const [sendAnnounce] = room.makeAction('announce') as unknown as [(m: LobbyAnnounceMessage, target?: string) => Promise<unknown>, unknown];

    // Broadcast our presence immediately to all existing peers in the lobby
    const announceAll = () => {
      void sendAnnounce({ roomId, hostName });
    };

    // When a new peer joins the lobby, send them our host announcement directly
    room.onPeerJoin((peerId) => {
      void sendAnnounce({ roomId, hostName }, peerId);
    });

    // Small delay to ensure WebRTC stack is ready before broadcasting initial announce
    const delay = setTimeout(announceAll, 1000);

    return () => {
      clearTimeout(delay);
      void room.leave();
    };
  }, [roomId, hostName, active]);
}
