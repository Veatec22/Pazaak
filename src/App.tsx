import { useCallback, useEffect, useState } from 'react';

import { Lobby, ShareBar } from './Lobby';
import { useOnlineMatch } from './net/useOnlineMatch';
import { Board } from './ui/Board';
import { useMatch } from './ui/useMatch';

type Route = { mode: 'lobby' } | { mode: 'hotseat' } | { mode: 'online'; roomId: string; isHost: boolean };

const hostKey = (id: string) => `pz-host-${id}`;

function parseRoute(): Route {
  const m = /[#&]room=([^&]+)/.exec(location.hash);
  if (m) {
    const roomId = decodeURIComponent(m[1]);
    return { mode: 'online', roomId, isHost: sessionStorage.getItem(hostKey(roomId)) === '1' };
  }
  return { mode: 'lobby' };
}

const newRoomId = () => Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 6);

export default function App() {
  const [route, setRoute] = useState<Route>(parseRoute);

  useEffect(() => {
    const onHash = () => setRoute(parseRoute());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const playFriend = useCallback(() => {
    const id = newRoomId();
    sessionStorage.setItem(hostKey(id), '1');
    location.hash = `room=${id}`; // triggers hashchange → parseRoute (isHost true)
  }, []);

  const hotSeat = useCallback(() => setRoute({ mode: 'hotseat' }), []);

  const leave = useCallback(() => {
    history.pushState('', '', location.pathname + location.search);
    setRoute({ mode: 'lobby' });
  }, []);

  if (route.mode === 'lobby') return <Lobby onPlayFriend={playFriend} onHotSeat={hotSeat} />;
  if (route.mode === 'hotseat') return <HotSeatGame onLeave={leave} />;
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
