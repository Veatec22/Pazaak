import { useCallback, useEffect, useState } from 'react';


import { CampaignGame } from './components/singleplayer/CampaignGame';
import { CampaignScreen } from './components/singleplayer/CampaignScreen';
import { QuickGame } from './components/singleplayer/QuickGame';
import { QuickMatchSetup } from './components/singleplayer/QuickMatchSetup';
import type { CardPool, Difficulty } from './engine';
import { MainMenu, MultiplayerMenu, SinglePlayerMenu, WaitingRoom } from './Lobby';
import { MusicProvider } from './music/MusicProvider';
import { getSavedNickname, useLobbyAnnouncer } from './net/useLobby';
import { useOnlineMatch } from './net/useOnlineMatch';
import { useI18n } from './net/useI18n';
import { Board } from './ui/Board';
import { installClickSound } from './ui/uiSounds';
import { useMatch } from './ui/useMatch';

type Route =
  | { mode: 'main-menu' }
  | { mode: 'single-menu' }
  | { mode: 'quick-setup' }
  | { mode: 'quick-game'; pool: CardPool }
  | { mode: 'campaign' }
  | { mode: 'campaign-game'; difficulty: Difficulty }
  | { mode: 'multi-menu' }
  | { mode: 'hotseat' }
  | { mode: 'online'; roomId: string; isHost: boolean };

const hostKey = (id: string) => `pz-host-${id}`;
const POOLS = ['classic', 'flip', 'mix'];
const DIFFICULTIES = ['easy', 'normal', 'hard', 'hardcore'];

function parseRoute(): Route {
  const hash = location.hash;
  const room = /[#&]room=([^&]+)/.exec(hash);
  if (room) {
    const roomId = decodeURIComponent(room[1]);
    return { mode: 'online', roomId, isHost: sessionStorage.getItem(hostKey(roomId)) === '1' };
  }
  if (hash === '#multiplayer') return { mode: 'multi-menu' };
  if (hash === '#singleplayer') return { mode: 'single-menu' };
  if (hash === '#hotseat') return { mode: 'hotseat' };

  const quick = /^#quick(?:=([a-z]+))?$/.exec(hash);
  if (quick) {
    const pool = quick[1];
    return POOLS.includes(pool) ? { mode: 'quick-game', pool: pool as CardPool } : { mode: 'quick-setup' };
  }
  const camp = /^#campaign(?:=([a-z]+))?$/.exec(hash);
  if (camp) {
    const d = camp[1];
    return DIFFICULTIES.includes(d) ? { mode: 'campaign-game', difficulty: d as Difficulty } : { mode: 'campaign' };
  }
  return { mode: 'main-menu' };
}

const newRoomId = () => Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 6);
const go = (hash: string) => () => {
  location.hash = hash;
};

export default function App() {
  const [route, setRoute] = useState<Route>(parseRoute);
  const { t } = useI18n();
  const [programmaticTransition, setProgrammaticTransition] = useState(false);

  const handleLeave = useCallback((targetHash: string) => {
    setProgrammaticTransition(true);
    const hash = targetHash.startsWith('#') ? targetHash : (targetHash ? `#${targetHash}` : '#');
    window.location.replace(window.location.pathname + window.location.search + hash);
  }, []);

  useEffect(() => {
    const onHash = (e: HashChangeEvent) => {
      const currentMode = route.mode;
      const isGame = currentMode === 'quick-game' || currentMode === 'campaign-game' || currentMode === 'online' || currentMode === 'hotseat';
      
      const newRoute = parseRoute();
      const isNewGame = newRoute.mode === 'quick-game' || newRoute.mode === 'campaign-game' || newRoute.mode === 'online' || newRoute.mode === 'hotseat';

      if (isGame && !isNewGame && !programmaticTransition) {
        // Intercept browser back button / swipe back from active game
        // Revert the hash change to stay in game
        const oldHash = new URL(e.oldURL).hash;
        location.hash = oldHash;
        
        // Trigger forfeit modal in Board.tsx
        window.dispatchEvent(new CustomEvent('pz-trigger-forfeit'));
      } else {
        // Normal transition
        setProgrammaticTransition(false);
        setRoute(newRoute);
      }
    };

    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [route, programmaticTransition]);

  useEffect(() => {
    // Push dummy state to enable popstate interception on home page
    if (route.mode === 'main-menu') {
      if (location.hash === '' || location.hash === '#') {
        history.replaceState({ root: true }, '');
        history.pushState(null, '');
      }
    }
  }, [route.mode]);

  useEffect(() => {
    const onPopState = () => {
      if (route.mode === 'main-menu') {
        const confirmExit = window.confirm(t('confirm_exit'));
        if (confirmExit) {
          // Let them go back (exit the app)
          history.back();
        } else {
          // Push dummy state again to stay
          history.pushState(null, '');
        }
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [route.mode, t]);

  useEffect(() => installClickSound(), []); // KotOR click cue on every button press

  const playFriend = useCallback(() => {
    const id = newRoomId();
    sessionStorage.setItem(hostKey(id), '1');
    location.hash = `room=${id}`;
  }, []);

  const leave = useCallback(() => {
    history.pushState('', '', location.pathname + location.search);
    setRoute({ mode: 'main-menu' });
  }, []);

  let content;
  if (route.mode === 'main-menu') {
    content = <MainMenu onGoSinglePlayer={go('singleplayer')} onGoMultiplayer={go('multiplayer')} />;
  } else if (route.mode === 'single-menu') {
    content = <SinglePlayerMenu onQuickMatch={go('quick')} onCampaign={go('campaign')} onLeave={leave} />;
  } else if (route.mode === 'quick-setup') {
    content = <QuickMatchSetup onPick={(pool) => (location.hash = `quick=${pool}`)} onLeave={go('singleplayer')} />;
  } else if (route.mode === 'quick-game') {
    content = <QuickGame pool={route.pool} onLeave={() => handleLeave('singleplayer')} />;
  } else if (route.mode === 'campaign') {
    content = <CampaignScreen onPick={(d) => (location.hash = `campaign=${d}`)} onLeave={go('singleplayer')} />;
  } else if (route.mode === 'campaign-game') {
    content = <CampaignGame difficulty={route.difficulty} onLeave={() => handleLeave('campaign')} />;
  } else if (route.mode === 'multi-menu') {
    content = <MultiplayerMenu onPlayFriend={playFriend} onHotSeat={go('hotseat')} onLeave={leave} />;
  } else if (route.mode === 'hotseat') {
    content = <HotSeatGame onLeave={() => handleLeave('multiplayer')} />;
  } else {
    content = <OnlineGame roomId={route.roomId} isHost={route.isHost} onLeave={() => handleLeave('multiplayer')} />;
  }

  // MusicProvider owns the persistent <audio>, so the cantina music keeps playing across
  // every screen; the controls themselves live in the TopBar.
  return <MusicProvider>{content}</MusicProvider>;
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
      {isHost && controller.connection === 'connecting' ? (
        <WaitingRoom roomId={roomId} onLeave={onLeave} />
      ) : null}
    </>
  );
}
