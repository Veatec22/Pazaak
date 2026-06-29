import { beforeEach, describe, expect, it } from 'vitest';

import { CAMPAIGN_LENGTH } from '../engine';
import { applyResult, type CampaignProgress, FRESH, isComplete, loadProgress, restarted, saveProgress } from './campaign';

describe('applyResult', () => {
  it('a win advances one tier', () => {
    expect(applyResult({ tier: 0, everCompleted: false }, true, 'normal')).toEqual({ tier: 1, everCompleted: false });
  });

  it('beating the last tier completes the run and sets the badge', () => {
    const onLast: CampaignProgress = { tier: CAMPAIGN_LENGTH - 1, everCompleted: false };
    const after = applyResult(onLast, true, 'normal');
    expect(after.tier).toBe(CAMPAIGN_LENGTH);
    expect(isComplete(after)).toBe(true);
    expect(after.everCompleted).toBe(true);
  });

  it('an ordinary loss keeps progress (retry the same opponent)', () => {
    const p: CampaignProgress = { tier: 2, everCompleted: false };
    expect(applyResult(p, false, 'normal')).toEqual(p);
    expect(applyResult(p, false, 'hard')).toEqual(p);
    expect(applyResult(p, false, 'easy')).toEqual(p);
  });

  it('a hardcore loss wipes the run to tier 0 but keeps the badge', () => {
    expect(applyResult({ tier: 3, everCompleted: true }, false, 'hardcore')).toEqual({ tier: 0, everCompleted: true });
  });

  it('never advances past the final tier', () => {
    const done: CampaignProgress = { tier: CAMPAIGN_LENGTH, everCompleted: true };
    expect(applyResult(done, true, 'normal').tier).toBe(CAMPAIGN_LENGTH);
  });
});

describe('restarted', () => {
  it('resets to tier 0 and keeps the completion badge', () => {
    expect(restarted({ tier: 4, everCompleted: true })).toEqual({ tier: 0, everCompleted: true });
    expect(restarted({ tier: 2, everCompleted: false })).toEqual({ tier: 0, everCompleted: false });
  });
});

describe('storage', () => {
  beforeEach(() => localStorage.clear());

  it('defaults to a fresh run', () => {
    expect(loadProgress('easy')).toEqual(FRESH);
  });

  it('persists per difficulty independently', () => {
    saveProgress('easy', { tier: 3, everCompleted: false });
    saveProgress('hardcore', { tier: 1, everCompleted: true });
    expect(loadProgress('easy')).toEqual({ tier: 3, everCompleted: false });
    expect(loadProgress('hardcore')).toEqual({ tier: 1, everCompleted: true });
    expect(loadProgress('normal')).toEqual(FRESH);
  });

  it('clamps a corrupt/oversized tier on load', () => {
    localStorage.setItem('pz-campaign-hard', JSON.stringify({ tier: 999, everCompleted: true }));
    expect(loadProgress('hard')).toEqual({ tier: CAMPAIGN_LENGTH, everCompleted: true });
  });
});
