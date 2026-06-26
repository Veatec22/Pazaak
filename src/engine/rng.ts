/**
 * A small seedable RNG, the TS stand-in for Python's `random.Random`.
 *
 * Parity with the Python engine is established by pinning *inputs* (first player, the
 * decks, the main-deck draw order) on shared fixtures — exactly how the Python tests
 * themselves work — not by reproducing CPython's Mersenne Twister byte-for-byte. The
 * interface below mirrors the handful of `random.Random` methods the engine uses.
 */
export interface Rng {
  /** Inclusive integer in [a, b], like `random.randint`. */
  randint(a: number, b: number): number;
  /** Fisher-Yates shuffle in place, like `random.shuffle`. */
  shuffle<T>(list: T[]): void;
  /** `k` distinct elements drawn without replacement, like `random.sample`. */
  sample<T>(list: readonly T[], k: number): T[];
}

/** Deterministic mulberry32-based RNG. Same seed → same stream (within JS). */
export class SeededRng implements Rng {
  private state: number;

  constructor(seed = Date.now() >>> 0) {
    this.state = seed >>> 0;
  }

  private next(): number {
    // mulberry32
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  randint(a: number, b: number): number {
    return a + Math.floor(this.next() * (b - a + 1));
  }

  shuffle<T>(list: T[]): void {
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
  }

  sample<T>(list: readonly T[], k: number): T[] {
    const pool = [...list];
    this.shuffle(pool);
    return pool.slice(0, k);
  }
}
