import { card, FULL_COLLECTION, SIDE_DECK_SIZE, type BuiltInCardPool, type CardPool, type Rng, type SideCard, deckFromPool } from '../engine';

export const CUSTOM_DECK_STORAGE_KEY = 'pz-custom-side-deck';

const VALID_CODES = new Set(FULL_COLLECTION.map((c) => c.code));

export function normalizeDeckCodes(value: unknown): string[] | null {
  if (!Array.isArray(value) || value.length !== SIDE_DECK_SIZE) return null;
  const codes = value.map((item) => (typeof item === 'string' ? item : ''));
  return codes.every((code) => VALID_CODES.has(code)) ? codes : null;
}

export function loadCustomDeckCodes(): string[] | null {
  try {
    const raw = localStorage.getItem(CUSTOM_DECK_STORAGE_KEY);
    return raw ? normalizeDeckCodes(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function saveCustomDeckCodes(codes: string[]): void {
  const normalized = normalizeDeckCodes(codes);
  if (!normalized) throw new Error(`custom deck must contain exactly ${SIDE_DECK_SIZE} valid cards`);
  localStorage.setItem(CUSTOM_DECK_STORAGE_KEY, JSON.stringify(normalized));
}

export function deckFromCodes(codes: readonly string[]): SideCard[] {
  const normalized = normalizeDeckCodes([...codes]);
  if (!normalized) throw new Error(`custom deck must contain exactly ${SIDE_DECK_SIZE} valid cards`);
  return normalized.map(card);
}

export function sideDeckForPool(rng: Rng, pool: CardPool, customCodes = loadCustomDeckCodes()): SideCard[] {
  if (pool === 'builder') {
    return customCodes ? deckFromCodes(customCodes) : deckFromPool(rng, 'mix');
  }
  return deckFromPool(rng, pool as BuiltInCardPool);
}
