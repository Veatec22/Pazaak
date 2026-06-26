/** Maps engine card codes/labels to the extracted KotOR II pazaak art in /public/pazaak. */

const ICON_BASE = '/pazaak/icons';
const CARD_BASE = '/pazaak/cards';

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

/**
 * Face art for a card on the table, chosen from its label the way KotOR does: green for
 * main-deck values, blue for +, red for -, gold for the "double"/tie-breaker cards.
 */
export function tableCardArt(label: string): string {
  if (label === 'x2' || label === 'D' || label.endsWith('T')) return `${CARD_BASE}/pcards_gold_p.png`;
  if (/^\d+$/.test(label)) return `${CARD_BASE}/pcards_generic_p.png`; // main-deck draw
  if (label.startsWith('-')) return `${CARD_BASE}/pcards_neg_p.png`;
  return `${CARD_BASE}/pcards_pos_p.png`;
}

export const CARD_BACK = `${CARD_BASE}/pcards_back_p.png`;
