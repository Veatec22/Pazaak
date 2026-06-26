/** Maps engine card codes/labels to the extracted KotOR II pazaak art in /public/pazaak. */

const BASE = import.meta.env.BASE_URL;
const ICON_BASE = `${BASE}pazaak/icons`;
const CARD_BASE = `${BASE}pazaak/cards`;

// Side-card code -> inventory icon (ii_pazcard_NNN), in the game's own item order.
const CODE_TO_ICON: Record<string, number> = {
  '+1': 1, '+2': 2, '+3': 3, '+4': 4, '+5': 5, '+6': 6,
  '-1': 7, '-2': 8, '-3': 9, '-4': 10, '-5': 11, '-6': 12,
  '±1': 13, '±2': 14, '±3': 15, '±4': 16, '±5': 17, '±6': 18,
  '1&2': 19, D: 20, T: 21, '2&4': 22, '3&6': 23,
};

export function iconForCode(code: string): string {
  const n = CODE_TO_ICON[code];
  return n ? `${ICON_BASE}/ii_pazcard_${String(n).padStart(3, '0')}.png` : '';
}

/** The side-card family implied by a hand card's `code` (e.g. "±3" → flip, "2&4" → dual). */
export function familyForCode(code: string): string {
  if (code.startsWith('±')) return 'flip';
  if (code.includes('&')) return 'dual';
  if (code === 'D') return 'double';
  if (code === 'T') return 'tiebreak';
  return code.startsWith('-') ? 'minus' : 'plus';
}

/**
 * Face art for a card, chosen from its `family` the way KotOR does:
 *   - main-deck draws → green generic,
 *   - **flippable cards (flip ± and dual N&M) → the two-tone art** (`pcards_dbl*`), with the
 *     active side's colour on top — these are the cards you can rotate,
 *   - plain +/- → solid blue / red.
 * Gold ("double"/"tie-breaker") art is intentionally unused: those cards are eliminated.
 */
export function cardArt(label: string, family: string): string {
  if (family === 'flip' || family === 'dual') {
    return label.startsWith('-') ? `${CARD_BASE}/pcards_dblneg_p.png` : `${CARD_BASE}/pcards_dblpos_p.png`;
  }
  if (family === 'main' || /^\d+$/.test(label)) return `${CARD_BASE}/pcards_generic_p.png`;
  if (label.startsWith('-')) return `${CARD_BASE}/pcards_neg_p.png`;
  return `${CARD_BASE}/pcards_pos_p.png`;
}

export const CARD_BACK = `${CARD_BASE}/pcards_back_p.png`;
