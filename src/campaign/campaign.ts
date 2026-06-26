/**
 * Campaign progress + persistence. One save slot per difficulty (so starting a hardcore run
 * never wipes an easy run), kept in localStorage. The reducer is pure for easy testing; the
 * storage wrappers are thin.
 *
 *  - `tier` = the next match to play, 0..CAMPAIGN_LENGTH. `tier === CAMPAIGN_LENGTH` means the
 *    run is complete (all opponents beaten).
 *  - `everCompleted` = sticky "beat this difficulty at least once" badge — survives a restart
 *    and a hardcore wipe.
 *
 * Result handling: a win advances a tier (and sets the badge on the final win); a loss on
 * **hardcore** resets the run to tier 0 (badge preserved), any other loss leaves progress
 * untouched (retry the same opponent).
 */

import { CAMPAIGN_LENGTH, type Difficulty } from '../engine';

export interface CampaignProgress {
  tier: number;
  everCompleted: boolean;
}

export const FRESH: CampaignProgress = { tier: 0, everCompleted: false };

export const isComplete = (p: CampaignProgress): boolean => p.tier >= CAMPAIGN_LENGTH;

/** Pure reducer: fold a match result into progress. */
export function applyResult(progress: CampaignProgress, won: boolean, difficulty: Difficulty): CampaignProgress {
  if (won) {
    const tier = Math.min(progress.tier + 1, CAMPAIGN_LENGTH);
    return { tier, everCompleted: progress.everCompleted || tier >= CAMPAIGN_LENGTH };
  }
  if (difficulty === 'hardcore') {
    return { tier: 0, everCompleted: progress.everCompleted }; // permadeath wipes the run
  }
  return progress; // ordinary loss: retry the same opponent, no progress lost
}

/** Restart a run from the beginning, keeping the completion badge. */
export const restarted = (progress: CampaignProgress): CampaignProgress => ({ tier: 0, everCompleted: progress.everCompleted });

// -- storage -----------------------------------------------------------------

const key = (difficulty: Difficulty) => `pz-campaign-${difficulty}`;

export function loadProgress(difficulty: Difficulty): CampaignProgress {
  try {
    const raw = localStorage.getItem(key(difficulty));
    if (!raw) return FRESH;
    const p = JSON.parse(raw) as Partial<CampaignProgress>;
    const tier = typeof p.tier === 'number' ? Math.max(0, Math.min(p.tier, CAMPAIGN_LENGTH)) : 0;
    return { tier, everCompleted: !!p.everCompleted };
  } catch {
    return FRESH;
  }
}

export function saveProgress(difficulty: Difficulty, progress: CampaignProgress): void {
  try {
    localStorage.setItem(key(difficulty), JSON.stringify(progress));
  } catch {
    // storage unavailable (private mode / quota) — progress just won't persist
  }
}
