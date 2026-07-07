import type { CardPool, Difficulty } from './engine';

export type Route =
  | { mode: 'main-menu' }
  | { mode: 'deck-builder' }
  | { mode: 'single-menu' }
  | { mode: 'quick-setup' }
  | { mode: 'quick-opponent'; pool: CardPool }
  | { mode: 'quick-game'; pool: CardPool; companion?: string }
  | { mode: 'campaign' }
  | { mode: 'campaign-game'; difficulty: Difficulty }
  | { mode: 'multi-menu' }
  | { mode: 'hotseat' }
  | { mode: 'online'; roomId: string; isHost: boolean };

export type BackIntent =
  | { type: 'exit' }
  | { type: 'navigate'; target: Route }
  | { type: 'forfeit'; target: Route };

const POOLS = ['classic', 'flip', 'mix', 'builder'] as const satisfies readonly CardPool[];
const DIFFICULTIES = ['easy', 'normal', 'hard', 'hardcore'] as const satisfies readonly Difficulty[];

export const hostKey = (id: string) => `pz-host-${id}`;

export function parseRouteFromHash(hash: string, isHostForRoom: (roomId: string) => boolean): Route {
  const room = /[#&]room=([^&]+)/.exec(hash);
  if (room) {
    const roomId = decodeURIComponent(room[1]);
    return { mode: 'online', roomId, isHost: isHostForRoom(roomId) };
  }
  if (hash === '#multiplayer') return { mode: 'multi-menu' };
  if (hash === '#singleplayer') return { mode: 'single-menu' };
  if (hash === '#deck-builder') return { mode: 'deck-builder' };
  if (hash === '#hotseat') return { mode: 'hotseat' };

  const quickOpponent = /^#quick-opponent=([a-z]+)$/.exec(hash);
  if (quickOpponent) {
    const pool = quickOpponent[1];
    return isCardPool(pool) ? { mode: 'quick-opponent', pool } : { mode: 'quick-setup' };
  }

  const quick = /^#quick(?:=([a-z]+))?(?:&companion=([a-z0-9-]+))?$/.exec(hash);
  if (quick) {
    const pool = quick[1];
    const companion = quick[2];
    return isCardPool(pool) ? { mode: 'quick-game', pool, ...(companion ? { companion } : {}) } : { mode: 'quick-setup' };
  }

  const campaign = /^#campaign(?:=([a-z]+))?$/.exec(hash);
  if (campaign) {
    const difficulty = campaign[1];
    return isDifficulty(difficulty) ? { mode: 'campaign-game', difficulty } : { mode: 'campaign' };
  }

  return { mode: 'main-menu' };
}

export function parseCurrentRoute(): Route {
  return parseRouteFromHash(location.hash, (roomId) => sessionStorage.getItem(hostKey(roomId)) === '1');
}

export function routeToHash(route: Route): string {
  switch (route.mode) {
    case 'main-menu':
      return '';
    case 'single-menu':
      return '#singleplayer';
    case 'deck-builder':
      return '#deck-builder';
    case 'quick-setup':
      return '#quick';
    case 'quick-opponent':
      return `#quick-opponent=${route.pool}`;
    case 'quick-game':
      return `#quick=${route.pool}${route.companion ? `&companion=${route.companion}` : ''}`;
    case 'campaign':
      return '#campaign';
    case 'campaign-game':
      return `#campaign=${route.difficulty}`;
    case 'multi-menu':
      return '#multiplayer';
    case 'hotseat':
      return '#hotseat';
    case 'online':
      return `#room=${encodeURIComponent(route.roomId)}`;
  }
}

export function routeToUrl(route: Route): string {
  const hash = routeToHash(route);
  return `${location.pathname}${location.search}${hash}`;
}

export function inviteUrlForRoom(roomId: string): string {
  return `${location.origin}${routeToUrl({ mode: 'online', roomId, isHost: false })}`;
}

export function isGameRoute(route: Route): boolean {
  return (
    route.mode === 'quick-game' ||
    route.mode === 'campaign-game' ||
    route.mode === 'hotseat' ||
    route.mode === 'online'
  );
}

export function parentRouteForRoute(route: Route): Route | null {
  switch (route.mode) {
    case 'main-menu':
      return null;
    case 'deck-builder':
      return { mode: 'main-menu' };
    case 'single-menu':
    case 'multi-menu':
      return { mode: 'main-menu' };
    case 'quick-setup':
      return { mode: 'single-menu' };
    case 'quick-opponent':
      return { mode: 'quick-setup' };
    case 'quick-game':
      return { mode: 'quick-opponent', pool: route.pool };
    case 'campaign':
      return { mode: 'single-menu' };
    case 'campaign-game':
      return { mode: 'campaign' };
    case 'hotseat':
    case 'online':
      return { mode: 'multi-menu' };
  }
}

export function forfeitTargetForRoute(route: Route): Route {
  return parentRouteForRoute(route) ?? { mode: 'main-menu' };
}

export function backIntentForRoute(route: Route): BackIntent {
  if (isGameRoute(route)) return { type: 'forfeit', target: forfeitTargetForRoute(route) };
  const parent = parentRouteForRoute(route);
  return parent ? { type: 'navigate', target: parent } : { type: 'exit' };
}

function isCardPool(value: string | undefined): value is CardPool {
  return POOLS.includes(value as CardPool);
}

function isDifficulty(value: string | undefined): value is Difficulty {
  return DIFFICULTIES.includes(value as Difficulty);
}
