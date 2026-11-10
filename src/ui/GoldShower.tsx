import { useEffect, useState, type CSSProperties } from 'react';

import { bakedStyle, useBakedSprites, useViewportUnit, type BakeSpec } from './bakedCards';

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

// Mirrors the drop-shadow on .pz-shower-face, so the baked sprites match the CSS fallback.
const CARD_SHADOW = { dy: 8, blur: 12, opacity: 0.5 };

interface ShowerCard {
  /** Card width in vmin. */
  w: number;
  blur: number;
  /** Seconds until the card has fallen off the bottom of the screen. */
  gone: number;
  style: CSSProperties;
}

const CARDS: ShowerCard[] = (() => {
  const rand = scatter(20);
  return Array.from({ length: COUNT }, (_, i) => {
    const near = rand();
    const left = `${(i / COUNT) * 100 + (rand() - 0.5) * 8}%`;
    const w = 6 + near * 6;
    const blur = near > 0.8 ? 1.5 : 0;
    const fall = 3.6 - near * 1.2;
    const delay = rand() * 1.3;
    return {
      w,
      blur,
      gone: fall + delay,
      style: {
        left,
        '--w': `${w}vmin`,
        '--blur': `${blur}px`,
        '--fall': `${fall}s`,
        '--delay': `${delay}s`,
        '--spin': `${1.6 + rand() * 1.8}s`,
        '--axis': AXES[i % AXES.length],
      } as CSSProperties,
    };
  });
})();

const SHOWER_MS = Math.max(...CARDS.map((c) => c.gone)) * 1000 + 300;

/** Gold side-deck cards raining over the table when a match is won. Plays once. */
export function GoldShower() {
  const { vmin } = useViewportUnit();
  // Two sprites per card, front then back, with the blur and shadow baked in.
  const sprites = useBakedSprites(`${vmin}`, () =>
    CARDS.flatMap((c): BakeSpec[] => {
      const look = { width: c.w * vmin, blur: c.blur, shadow: CARD_SHADOW };
      return [
        { art: 'pcards_gold_p', ...look },
        { art: 'pcards_back_p', ...look },
      ];
    }),
  );
  // Once the last card is off screen the layers are only dead weight under the banner.
  const [done, setDone] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setDone(true), SHOWER_MS);
    return () => window.clearTimeout(timer);
  }, []);
  if (done) return null;

  const face = (i: number, side: 0 | 1) =>
    sprites ? (
      <div className={`pz-shower-face baked ${side ? 'back' : ''}`} style={bakedStyle(sprites[i * 2 + side])} />
    ) : (
      <div className={`pz-shower-face ${side ? 'back' : ''}`} style={{ backgroundImage: `url(${side ? BACK : GOLD})` }} />
    );

  return (
    <div className="pz-shower" aria-hidden>
      {CARDS.map((card, i) => (
        <div key={i} className="pz-shower-card" style={card.style}>
          <div className="pz-shower-fall">
            <div className="pz-shower-spin">
              {face(i, 0)}
              {face(i, 1)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
