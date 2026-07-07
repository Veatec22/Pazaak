import { describe, expect, it } from 'vitest';

import {
  backIntentForRoute,
  forfeitTargetForRoute,
  isGameRoute,
  parentRouteForRoute,
  parseRouteFromHash,
  routeToHash,
  type Route,
} from './navigation';

describe('navigation route rules', () => {
  it.each([
    [{ mode: 'single-menu' }, { mode: 'main-menu' }],
    [{ mode: 'multi-menu' }, { mode: 'main-menu' }],
    [{ mode: 'deck-builder' }, { mode: 'main-menu' }],
    [{ mode: 'quick-setup' }, { mode: 'single-menu' }],
    [{ mode: 'quick-opponent', pool: 'flip' }, { mode: 'quick-setup' }],
    [{ mode: 'campaign' }, { mode: 'single-menu' }],
  ] satisfies Array<[Route, Route]>)('moves back from %o to its menu parent %o', (route, parent) => {
    expect(parentRouteForRoute(route)).toEqual(parent);
    expect(backIntentForRoute(route)).toEqual({ type: 'navigate', target: parent });
  });

  it.each([
    [{ mode: 'quick-game', pool: 'classic' }, { mode: 'quick-opponent', pool: 'classic' }],
    [{ mode: 'campaign-game', difficulty: 'hard' }, { mode: 'campaign' }],
    [{ mode: 'hotseat' }, { mode: 'multi-menu' }],
    [{ mode: 'online', roomId: 'abc123', isHost: false }, { mode: 'multi-menu' }],
  ] satisfies Array<[Route, Route]>)('prompts forfeit before leaving %o', (route, target) => {
    expect(isGameRoute(route)).toBe(true);
    expect(forfeitTargetForRoute(route)).toEqual(target);
    expect(backIntentForRoute(route)).toEqual({ type: 'forfeit', target });
  });

  it('lets the shell handle back on the main menu', () => {
    expect(parentRouteForRoute({ mode: 'main-menu' })).toBeNull();
    expect(backIntentForRoute({ mode: 'main-menu' })).toEqual({ type: 'exit' });
  });

  it.each([
    ['#singleplayer', { mode: 'single-menu' }],
    ['#multiplayer', { mode: 'multi-menu' }],
    ['#deck-builder', { mode: 'deck-builder' }],
    ['#quick', { mode: 'quick-setup' }],
    ['#quick-opponent=flip', { mode: 'quick-opponent', pool: 'flip' }],
    ['#quick=flip', { mode: 'quick-game', pool: 'flip' }],
    ['#quick=flip&companion=bastila', { mode: 'quick-game', pool: 'flip', companion: 'bastila' }],
    ['#quick=builder', { mode: 'quick-game', pool: 'builder' }],
    ['#campaign=normal', { mode: 'campaign-game', difficulty: 'normal' }],
    ['#room=abc123', { mode: 'online', roomId: 'abc123', isHost: true }],
  ] satisfies Array<[string, Route]>)('parses %s', (hash, route) => {
    expect(parseRouteFromHash(hash, (roomId) => roomId === 'abc123')).toEqual(route);
  });

  it.each([
    [{ mode: 'main-menu' }, ''],
    [{ mode: 'single-menu' }, '#singleplayer'],
    [{ mode: 'multi-menu' }, '#multiplayer'],
    [{ mode: 'deck-builder' }, '#deck-builder'],
    [{ mode: 'quick-setup' }, '#quick'],
    [{ mode: 'quick-opponent', pool: 'mix' }, '#quick-opponent=mix'],
    [{ mode: 'quick-game', pool: 'mix' }, '#quick=mix'],
    [{ mode: 'quick-game', pool: 'mix', companion: 'canderous' }, '#quick=mix&companion=canderous'],
    [{ mode: 'quick-game', pool: 'builder' }, '#quick=builder'],
    [{ mode: 'campaign' }, '#campaign'],
    [{ mode: 'campaign-game', difficulty: 'hardcore' }, '#campaign=hardcore'],
    [{ mode: 'hotseat' }, '#hotseat'],
    [{ mode: 'online', roomId: 'room 1', isHost: false }, '#room=room%201'],
  ] satisfies Array<[Route, string]>)('serializes %o', (route, hash) => {
    expect(routeToHash(route)).toBe(hash);
  });
});
