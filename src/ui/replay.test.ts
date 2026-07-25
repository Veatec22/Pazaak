import { describe, expect, it } from 'vitest';

import { setBannerText } from './replay';

const translate = (key: string) => key;

describe('set result banner', () => {
  it('explains a nine-card win to the winner', () => {
    expect(setBannerText(translate, 0, [19, 20], 0, 'nine-cards')).toBe('you_nine_cards_set');
  });

  it('explains a nine-card win to the loser', () => {
    expect(setBannerText(translate, 1, [20, 19], 0, 'nine-cards')).toBe('opponent_nine_cards_set');
  });

  it('explains a nine-card win in pass-and-play', () => {
    expect(setBannerText(translate, 1, [20, 19], null, 'nine-cards')).toBe('player_nine_cards_set');
  });
});
