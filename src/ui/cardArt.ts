

const BASE = import.meta.env.BASE_URL;
const CARD_BASE = `${BASE}pazaak/cards`;




export function familyForCode(code: string): string {
  if (code.startsWith('±')) return 'flip';
  return code.startsWith('-') ? 'minus' : 'plus';
}









export function cardArt(label: string, family: string): string {
  if (family === 'flip') {
    return label.startsWith('-') ? `${CARD_BASE}/pcards_dblneg_p.png` : `${CARD_BASE}/pcards_dblpos_p.png`;
  }
  if (family === 'main' || /^\d+$/.test(label)) return `${CARD_BASE}/pcards_generic_p.png`;
  if (label.startsWith('-')) return `${CARD_BASE}/pcards_neg_p.png`;
  return `${CARD_BASE}/pcards_pos_p.png`;
}

export const CARD_BACK = `${CARD_BASE}/pcards_back_p.png`;
