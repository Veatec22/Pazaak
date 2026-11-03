import type { CSSProperties } from 'react';

const GOLD = `${import.meta.env.BASE_URL}pazaak/cards/pcards_gold_p.png`;
const BACK = `${import.meta.env.BASE_URL}pazaak/cards/pcards_back_p.png`;
const COUNT = 26;

// Deterministic scatter, so every match win falls the same way and render stays pure.
function scatter(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const AXES = ['1, 0.4, 0.1', '0.3, 1, 0.2', '0.8, 0.8, 0.1', '1, 0.2, 0.4', '0.2, 1, 0.6'];

const CARDS: CSSProperties[] = (() => {
  const rand = scatter(20);
  return Array.from({ length: COUNT }, (_, i) => {
    const near = rand();
    return {
      left: `${(i / COUNT) * 100 + (rand() - 0.5) * 8}%`,
      '--w': `${6 + near * 6}vmin`,
      '--blur': `${near > 0.8 ? 1.5 : 0}px`,
      '--fall': `${3.6 - near * 1.2}s`,
      '--delay': `${rand() * 1.3}s`,
      '--spin': `${1.6 + rand() * 1.8}s`,
      '--axis': AXES[i % AXES.length],
    } as CSSProperties;
  });
})();

/** Gold side-deck cards raining over the table when a match is won. Plays once. */
export function GoldShower() {
  return (
    <div className="pz-shower" aria-hidden>
      {CARDS.map((style, i) => (
        <div key={i} className="pz-shower-card" style={style}>
          <div className="pz-shower-fall">
            <div className="pz-shower-spin">
              <div className="pz-shower-face" style={{ backgroundImage: `url(${GOLD})` }} />
              <div className="pz-shower-face back" style={{ backgroundImage: `url(${BACK})` }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
