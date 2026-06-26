import { useCallback, useEffect, useState } from 'react';

import { MainMenu, MultiplayerMenu, ShareBar, WaitingRoom } from './Lobby';
import { useOnlineMatch } from './net/useOnlineMatch';
import { getSavedNickname, useLobbyAnnouncer } from './net/useLobby';
import { Board } from './ui/Board';
import { useMatch } from './ui/useMatch';

type Route =
  | { mode: 'main-menu' }
  | { mode: 'multi-menu' }
  | { mode: 'hotseat' }
  | { mode: 'online'; roomId: string; isHost: boolean };

const hostKey = (id: string) => `pz-host-${id}`;

function parseRoute(): Route {
  const m = /[#&]room=([^&]+)/.exec(location.hash);
  if (m) {
    const roomId = decodeURIComponent(m[1]);
    return { mode: 'online', roomId, isHost: sessionStorage.getItem(hostKey(roomId)) === '1' };
  }
  const multi = location.hash === '#multiplayer';
  if (multi) return { mode: 'multi-menu' };
  return { mode: 'main-menu' };
}

const newRoomId = () => Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 6);

export default function App() {
  const [route, setRoute] = useState<Route>(parseRoute);

  useEffect(() => {
    const onHash = () => setRoute(parseRoute());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const goToMultiplayer = useCallback(() => {
    location.hash = 'multiplayer';
  }, []);

  const playFriend = useCallback(() => {
    const id = newRoomId();
    sessionStorage.setItem(hostKey(id), '1');
    location.hash = `room=${id}`; // triggers hashchange → parseRoute (isHost true)
  }, []);

  const hotSeat = useCallback(() => {
    location.hash = '';
    setRoute({ mode: 'hotseat' });
  }, []);

  const leave = useCallback(() => {
    history.pushState('', '', location.pathname + location.search);
    setRoute({ mode: 'main-menu' });
  }, []);

  if (route.mode === 'main-menu') {
    return <MainMenu onGoMultiplayer={goToMultiplayer} onHotSeat={hotSeat} />;
  }
  if (route.mode === 'multi-menu') {
    return <MultiplayerMenu onPlayFriend={playFriend} onLeave={leave} />;
  }
  if (route.mode === 'hotseat') {
    return <HotSeatGame onLeave={leave} />;
  }
  return <OnlineGame roomId={route.roomId} isHost={route.isHost} onLeave={leave} />;
}

function HotSeatGame({ onLeave }: { onLeave: () => void }) {
  const controller = useMatch();
  return (
    <>
      <LeaveButton onLeave={onLeave} />
      <Board controller={controller} />
    </>
  );
}

function OnlineGame({ roomId, isHost, onLeave }: { roomId: string; isHost: boolean; onLeave: () => void }) {
  const controller = useOnlineMatch(roomId, isHost);
  const nickname = getSavedNickname();

  // Announce the game room in the global lobby as long as host is waiting
  useLobbyAnnouncer(roomId, nickname, isHost && controller.connection === 'connecting');

  if (isHost && controller.connection === 'connecting') {
    return (
      <>
        <LeaveButton onLeave={onLeave} />
        <WaitingRoom roomId={roomId} onLeave={onLeave} />
      </>
    );
  }

  return (
    <>
      <LeaveButton onLeave={onLeave} />
      {isHost ? <ShareBar roomId={roomId} /> : null}
      <Board controller={controller} />
    </>
  );
}

function LeaveButton({ onLeave }: { onLeave: () => void }) {
  return (
    <button className="pz-leave" onClick={onLeave} aria-label="Back to menu">
      ← Menu
    </button>
  );
}
