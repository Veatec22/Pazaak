import { useCallback, useEffect, useRef, useState } from 'react';


import { CampaignGame } from './components/singleplayer/CampaignGame';
import { CampaignScreen } from './components/singleplayer/CampaignScreen';
import { QuickGame } from './components/singleplayer/QuickGame';
import { QuickMatchSetup } from './components/singleplayer/QuickMatchSetup';
import { DeckBuilderScreen, MainMenu, MultiplayerMenu, SinglePlayerMenu, WaitingRoom } from './Lobby';
import { MusicProvider } from './music/MusicProvider';
import { getSavedNickname, useLobbyAnnouncer } from './net/useLobby';
import { useOnlineMatch } from './net/useOnlineMatch';
import {
  backIntentForRoute,
  forfeitTargetForRoute,
  hostKey,
  parseCurrentRoute,
  routeToUrl,
  type Route,
} from './navigation';
import { Board } from './ui/Board';
import { installClickSound } from './ui/uiSounds';
import { useMatch } from './ui/useMatch';

const newRoomId = () => Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 6);

export default function App() {
  const initialRoute = useRef(parseCurrentRoute());
  const routeRef = useRef<Route>(initialRoute.current);
  const historyInitialized = useRef(false);
  const pendingHistoryBackTarget = useRef<Route | null>(null);
  const [route, setRoute] = useState<Route>(initialRoute.current);

  const setCurrentRoute = useCallback((next: Route) => {
    routeRef.current = next;
    setRoute(next);
  }, []);

  const writeRoute = useCallback((next: Route, replace = false) => {
    const state = { pazaakRoute: next.mode };
    if (replace) history.replaceState(state, '', routeToUrl(next));
    else history.pushState(state, '', routeToUrl(next));
  }, []);

  const navigate = useCallback(
    (next: Route, options?: { replace?: boolean }) => {
      setCurrentRoute(next);
      writeRoute(next, options?.replace ?? false);
    },
    [setCurrentRoute, writeRoute],
  );

  const navigateBackOneLevel = useCallback(() => {
    const intent = backIntentForRoute(routeRef.current);
    if (intent.type === 'navigate') {
      pendingHistoryBackTarget.current = intent.target;
      history.back();
    } else if (intent.type === 'forfeit') {
      window.dispatchEvent(new CustomEvent('pz-trigger-forfeit'));
    }
  }, []);

  const leaveCurrentGame = useCallback(() => {
    const target = forfeitTargetForRoute(routeRef.current);
    pendingHistoryBackTarget.current = target;
    history.back();
  }, []);

  useEffect(() => {
    if (historyInitialized.current) return;
    historyInitialized.current = true;
    writeRoute(routeRef.current, true);
    if (routeRef.current.mode !== 'main-menu') {
      writeRoute(routeRef.current);
    }
  }, [writeRoute]);

  useEffect(() => {
    const onPopState = () => {
      const target = pendingHistoryBackTarget.current;
      if (target) {
        pendingHistoryBackTarget.current = null;
        setCurrentRoute(target);
        writeRoute(target, true);
        return;
      }

      const intent = backIntentForRoute(routeRef.current);
      if (intent.type === 'exit') {
        history.back();
        return;
      }

      if (intent.type === 'navigate') {
        setCurrentRoute(intent.target);
        writeRoute(intent.target, true);
        return;
      }

      writeRoute(routeRef.current);
      window.dispatchEvent(new CustomEvent('pz-trigger-forfeit'));
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [setCurrentRoute, writeRoute]);

  useEffect(() => installClickSound(), []);

  const playFriend = useCallback(() => {
    const id = newRoomId();
    sessionStorage.setItem(hostKey(id), '1');
    navigate({ mode: 'online', roomId: id, isHost: true });
  }, [navigate]);

  const joinRoom = useCallback((roomId: string) => {
    navigate({ mode: 'online', roomId, isHost: sessionStorage.getItem(hostKey(roomId)) === '1' });
  }, [navigate]);

  let content;
  if (route.mode === 'main-menu') {
    content = (
      <MainMenu
        onGoSinglePlayer={() => navigate({ mode: 'single-menu' })}
        onGoMultiplayer={() => navigate({ mode: 'multi-menu' })}
        onGoDeckBuilder={() => navigate({ mode: 'deck-builder' })}
      />
    );
  } else if (route.mode === 'deck-builder') {
    content = <DeckBuilderScreen onLeave={navigateBackOneLevel} />;
  } else if (route.mode === 'single-menu') {
    content = (
      <SinglePlayerMenu
        onQuickMatch={() => navigate({ mode: 'quick-setup' })}
        onCampaign={() => navigate({ mode: 'campaign' })}
        onLeave={navigateBackOneLevel}
      />
    );
  } else if (route.mode === 'quick-setup') {
    content = (
      <QuickMatchSetup
        onPick={(pool) => navigate({ mode: 'quick-game', pool })}
        onLeave={navigateBackOneLevel}
      />
    );
  } else if (route.mode === 'quick-game') {
    content = <QuickGame pool={route.pool} onLeave={leaveCurrentGame} />;
  } else if (route.mode === 'campaign') {
    content = (
      <CampaignScreen
        onPick={(difficulty) => navigate({ mode: 'campaign-game', difficulty })}
        onLeave={navigateBackOneLevel}
      />
    );
  } else if (route.mode === 'campaign-game') {
    content = <CampaignGame difficulty={route.difficulty} onLeave={leaveCurrentGame} />;
  } else if (route.mode === 'multi-menu') {
    content = (
      <MultiplayerMenu
        onPlayFriend={playFriend}
        onJoinRoom={joinRoom}
        onHotSeat={() => navigate({ mode: 'hotseat' })}
        onLeave={navigateBackOneLevel}
      />
    );
  } else if (route.mode === 'hotseat') {
    content = <HotSeatGame onLeave={leaveCurrentGame} />;
  } else {
    content = <OnlineGame roomId={route.roomId} isHost={route.isHost} onLeave={leaveCurrentGame} />;
  }

  return (
    <MusicProvider>
      <div className="pz-app">
        {content}
      </div>
    </MusicProvider>
  );
}

function HotSeatGame({ onLeave }: { onLeave: () => void }) {
  const controller = useMatch();
  return (
    <>
      <Board controller={controller} onForfeit={onLeave} />
    </>
  );
}

function OnlineGame({ roomId, isHost, onLeave }: { roomId: string; isHost: boolean; onLeave: () => void }) {
  const controller = useOnlineMatch(roomId, isHost);
  const nickname = getSavedNickname();

  useLobbyAnnouncer(roomId, nickname, isHost && controller.connection === 'connecting');

  return (
    <>
      <Board controller={controller} onForfeit={onLeave} roomId={roomId} isHost={isHost} />
      {controller.onlineLobby && !controller.view && !controller.finished ? (
        <WaitingRoom roomId={roomId} onLeave={onLeave} lobby={controller.onlineLobby} />
      ) : null}
    </>
  );
}
