
import { card, FULL_COLLECTION, SIDE_DECK_SIZE, type SideCard } from './cards';
import type { Rng } from './rng';

export type BuiltInCardPool = 'classic' | 'flip' | 'mix';
export type CardPool = BuiltInCardPool | 'builder';
export type Difficulty = 'easy' | 'normal' | 'hard' | 'hardcore';

const byFamily = (families: string[]): SideCard[] => FULL_COLLECTION.filter((c) => families.includes(c.family));

export const POOLS: Record<BuiltInCardPool, readonly SideCard[]> = {
  classic: byFamily(['plus', 'minus']),
  flip: byFamily(['flip']),
  mix: byFamily(['plus', 'minus', 'flip']),
};

export const DIFFICULTY_POOL: Record<Difficulty, BuiltInCardPool> = {
  easy: 'flip',
  normal: 'mix',
  hard: 'classic',
  hardcore: 'classic',
};

export function deckFromPool(rng: Rng, pool: BuiltInCardPool): SideCard[] {
  const src = POOLS[pool];
  return Array.from({ length: SIDE_DECK_SIZE }, () => src[rng.randint(0, src.length - 1)]);
}

export function playerDeck(rng: Rng, difficulty: Difficulty): SideCard[] {
  return deckFromPool(rng, DIFFICULTY_POOL[difficulty]);
}

export interface CampaignTier {
  name: string;
  codes: readonly string[];
}

export const CAMPAIGN_TIERS: readonly CampaignTier[] = [
  { name: 'VeryEasy', codes: ['+3', '-3', '+4', '-4', '+5', '-5', '+5', '-3', '+4', '-5'] },
  { name: 'Easy', codes: ['+1', '+2', '+3', '+4', '+5', '-6', '-4', '-3', '-2', '-1'] },
  { name: 'Average', codes: ['±1', '±2', '+3', '+4', '+5', '+6', '±5', '-6', '±4', '±6'] },
  { name: 'Hard', codes: ['±3', '±4', '±5', '±6', '±6', '+6', '-6', '±4', '+5', '±5'] },
  { name: 'VeryHard', codes: ['±6', '±5', '±6', '±4', '±5', '±6', '±3', '±6', '±5', '±4'] },
];

export const CAMPAIGN_LENGTH = CAMPAIGN_TIERS.length;

export function aiDeck(tierIndex: number): SideCard[] {
  const tier = CAMPAIGN_TIERS[tierIndex];
  if (!tier) throw new Error(`no campaign tier ${tierIndex}`);
  return tier.codes.map(card);
}
