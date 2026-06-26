

const BASE = import.meta.env.BASE_URL;
const ICON_BASE = `${BASE}pazaak/icons`;
const CARD_BASE = `${BASE}pazaak/cards`;


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


export function familyForCode(code: string): string {
  if (code.startsWith('±')) return 'flip';
  if (code.includes('&')) return 'dual';
  if (code === 'D') return 'double';
  if (code === 'T') return 'tiebreak';
  return code.startsWith('-') ? 'minus' : 'plus';
}









export function cardArt(label: string, family: string): string {
  if (family === 'flip' || family === 'dual') {
    return label.startsWith('-') ? `${CARD_BASE}/pcards_dblneg_p.png` : `${CARD_BASE}/pcards_dblpos_p.png`;
  }
  if (family === 'main' || /^\d+$/.test(label)) return `${CARD_BASE}/pcards_generic_p.png`;
  if (label.startsWith('-')) return `${CARD_BASE}/pcards_neg_p.png`;
  return `${CARD_BASE}/pcards_pos_p.png`;
}

export const CARD_BACK = `${CARD_BASE}/pcards_back_p.png`;
