/**
 * Single-player deck data: the two independent difficulty dimensions.
 *
 *  A) **Campaign progression** — the AI opponent's deck gets stronger each match. Grounded
 *     in KotOR II's `pazaakdecks.2da` 5-tier ladder (VeryEasy → VeryHard). The gold cards
 *     (Double / Tie-Breaker) and the dual cards (1&2 / 2&4 / 3&6) are removed everywhere, so
 *     the only families in play are plus / minus / flip. Tiers 1–3 are the real KotOR decks
 *     (gold stripped); tiers 4–5 are rebuilt flip-heavy (the originals leaned on the removed
 *     dual/gold cards) — more flips = more AI flexibility = harder.
 *
 *  B) **Player handicap (difficulty)** — restricts which cards the *player* draws their side
 *     deck from: easy = flip only (most flexible), normal = flip + classic, hard / hardcore =
 *     classic (+/−) only. Hardcore additionally resets the campaign on a loss.
 *
 * Quick-match "modes" are the same three pools, chosen freely for a one-off match.
 */

import { card, FULL_COLLECTION, SIDE_DECK_SIZE, type SideCard } from './cards';
import type { Rng } from './rng';

export type CardPool = 'classic' | 'flip' | 'mix';
export type Difficulty = 'easy' | 'normal' | 'hard' | 'hardcore';

const byFamily = (families: string[]): SideCard[] => FULL_COLLECTION.filter((c) => families.includes(c.family));

/** The card pools the player's side deck can be drawn from (no duals, no gold). */
export const POOLS: Record<CardPool, readonly SideCard[]> = {
  classic: byFamily(['plus', 'minus']), // +1..+6, -1..-6
  flip: byFamily(['flip']), // ±1..±6
  mix: byFamily(['plus', 'minus', 'flip']),
};

/** Which pool each campaign difficulty hands the player. */
export const DIFFICULTY_POOL: Record<Difficulty, CardPool> = {
  easy: 'flip',
  normal: 'mix',
  hard: 'classic',
  hardcore: 'classic',
};

/** A random 10-card side deck sampled (with duplicates) from a pool. */
export function deckFromPool(rng: Rng, pool: CardPool): SideCard[] {
  const src = POOLS[pool];
  return Array.from({ length: SIDE_DECK_SIZE }, () => src[rng.randint(0, src.length - 1)]);
}

/** The player's side deck for a campaign difficulty (or quick-match mode → its pool). */
export function playerDeck(rng: Rng, difficulty: Difficulty): SideCard[] {
  return deckFromPool(rng, DIFFICULTY_POOL[difficulty]);
}

export interface CampaignTier {
  name: string;
  codes: readonly string[];
}

/**
 * The 5 AI opponent decks, weakest → strongest (one per campaign match). Tiers 1–3 are the
 * KotOR II decks with gold removed; tiers 4–5 are flip-heavy rebuilds.
 */
export const CAMPAIGN_TIERS: readonly CampaignTier[] = [
  { name: 'VeryEasy', codes: ['+3', '-3', '+4', '-4', '+5', '-5', '+5', '-3', '+4', '-5'] },
  { name: 'Easy', codes: ['+1', '+2', '+3', '+4', '+5', '-6', '-4', '-3', '-2', '-1'] },
  { name: 'Average', codes: ['±1', '±2', '+3', '+4', '+5', '+6', '±5', '-6', '±4', '±6'] },
  { name: 'Hard', codes: ['±3', '±4', '±5', '±6', '±6', '+6', '-6', '±4', '+5', '±5'] },
  { name: 'VeryHard', codes: ['±6', '±5', '±6', '±4', '±5', '±6', '±3', '±6', '±5', '±4'] },
];

export const CAMPAIGN_LENGTH = CAMPAIGN_TIERS.length;

/** The AI side deck for campaign match `tierIndex` (0-based). */
export function aiDeck(tierIndex: number): SideCard[] {
  const tier = CAMPAIGN_TIERS[tierIndex];
  if (!tier) throw new Error(`no campaign tier ${tierIndex}`);
  return tier.codes.map(card);
}
