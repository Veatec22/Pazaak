







export interface Rng {

  randint(a: number, b: number): number;

  shuffle<T>(list: T[]): void;

  sample<T>(list: readonly T[], k: number): T[];
}


export class SeededRng implements Rng {
  private state: number;

  constructor(seed = Date.now() >>> 0) {
    this.state = seed >>> 0;
  }

  private next(): number {

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
