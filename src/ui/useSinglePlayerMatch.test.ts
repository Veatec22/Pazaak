import { describe, expect, it } from 'vitest';

import { BOT_DELAY_MS } from './useSinglePlayerMatch';

describe('single-player bot pacing', () => {
  it('keeps bot decisions quick but not instant', () => {
    expect(BOT_DELAY_MS).toBeGreaterThanOrEqual(250);
    expect(BOT_DELAY_MS).toBeLessThanOrEqual(400);
  });
});
