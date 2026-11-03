import { isSfxMuted } from './sounds';

export type Haptic = 'bust' | 'twenty' | 'win' | 'lose';

// Vibration patterns in ms (buzz, pause, buzz, ...): a bust jolts twice, 20 is one crisp
// tap, a won match rattles off a little fanfare and a lost one is a single long drone.
const PATTERNS: Record<Haptic, number[]> = {
  bust: [70, 50, 70],
  twenty: [35],
  win: [60, 50, 60, 50, 180],
  lose: [260],
};

/** Buzz the phone for a moment at the table. Silent wherever sound is muted or there's no vibration motor. */
export function buzz(haptic: Haptic): void {
  if (isSfxMuted() || typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  navigator.vibrate(PATTERNS[haptic]);
}
