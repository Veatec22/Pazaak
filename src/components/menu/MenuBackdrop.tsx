import { type CSSProperties } from 'react';

import { bakedStyle, useBakedSprites, useViewportUnit, type BakeSpec } from '../../ui/bakedCards';

import './menuBackdrop.css';

const CARDS = `${import.meta.env.BASE_URL}pazaak/cards`;

interface FallingCard {
  art: string;
  /** Horizontal lane, % of the viewport width. */
  x: number;
  /** Card width in vmin. */
  w: number;
  /** Distance from the viewer; near cards (> 1) are the out-of-focus foreground. */
  depth: number;
  blur: number;
  /** Brightness: far cards sit darker in the room. */
  lit: number;
  /** Seconds to fall the height of the screen, and for one full tumble. */
  fall: number;
  spin: number;
  /** Tumble axis for rotate3d. */
  axis: string;
  /** Where in its fall the card starts (0–1), so the screen is populated on load. */
  phase: number;
  /** Resting height (vh) when motion is reduced. */
  rest: number;
}

/**
 * Side-deck cards tumbling down past the cantina's holo-table. Nearer cards are
 * bigger, faster and out of focus; far ones are small, slow and dark.
 */
const FALLING_CARDS: FallingCard[] = [
  { art: 'pcards_pos_p', x: 6, w: 13, depth: 0.5, blur: 1.2, lit: 0.62, fall: 26, spin: 14, axis: '1, 0.4, 0.1', phase: 0.12, rest: 14 },
  { art: 'pcards_neg_p', x: 84, w: 10, depth: 0.3, blur: 2.5, lit: 0.42, fall: 34, spin: 18, axis: '0.3, 1, 0.2', phase: 0.5, rest: 10 },
  { art: 'pcards_gold_p', x: 14, w: 16, depth: 0.7, blur: 0.8, lit: 0.66, fall: 22, spin: 12, axis: '0.8, 0.8, 0.1', phase: 0.72, rest: 60 },
  { art: 'pcards_generic_p', x: 74, w: 13, depth: 0.6, blur: 1.2, lit: 0.56, fall: 24, spin: 16, axis: '1, 0.2, 0.3', phase: 0.3, rest: 70 },
  { art: 'pcards_dblneg_p', x: 36, w: 8, depth: 0.2, blur: 3.5, lit: 0.34, fall: 40, spin: 20, axis: '0.2, 1, 0.5', phase: 0.86, rest: 84 },
  { art: 'pcards_pos_p', x: 58, w: 7, depth: 0.15, blur: 4, lit: 0.3, fall: 44, spin: 22, axis: '0.7, 0.3, 1', phase: 0.04, rest: 30 },
  { art: 'pcards_neg_p', x: 25, w: 9, depth: 0.25, blur: 3, lit: 0.38, fall: 38, spin: 19, axis: '0.6, 1, 0', phase: 0.6, rest: 42 },
  { art: 'pcards_generic_p', x: 46, w: 10, depth: 0.35, blur: 2.2, lit: 0.44, fall: 32, spin: 17, axis: '1, 0.7, 0.2', phase: 0.24, rest: 56 },
  { art: 'pcards_dblpos_p', x: 66, w: 11, depth: 0.4, blur: 2, lit: 0.48, fall: 30, spin: 15, axis: '0.5, 1, 0.4', phase: 0.78, rest: 22 },
  { art: 'pcards_gold_p', x: 92, w: 9, depth: 0.3, blur: 2.8, lit: 0.4, fall: 36, spin: 21, axis: '0.9, 0.3, 0.6', phase: 0.66, rest: 52 },
  { art: 'pcards_dblpos_p', x: 86, w: 28, depth: 1.4, blur: 11, lit: 0.32, fall: 16, spin: 11, axis: '1, 0.5, 0', phase: 0.42, rest: 38 },
  { art: 'pcards_gold_p', x: -6, w: 24, depth: 1.2, blur: 9, lit: 0.3, fall: 19, spin: 13, axis: '0.4, 1, 0.3', phase: 0.92, rest: 80 },
];

const cardStyle = (c: FallingCard): CSSProperties =>
  ({
    left: `${c.x}%`,
    '--w': `${c.w}vmin`,
    '--blur': `${c.blur}px`,
    '--lit': c.lit,
    '--fall': `${c.fall}s`,
    '--fall-delay': `${-c.phase * c.fall}s`,
    '--spin': `${c.spin}s`,
    '--spin-delay': `${-c.phase * c.spin * 3}s`,
    '--axis': c.axis,
    '--rest': `${c.rest}vh`,
    // Foreground cards are pure blur; a shadow under them would read as a smudge.
    ...(c.depth > 1 ? { '--shadow': 'drop-shadow(0 0 0 transparent)' } : {}),
  }) as CSSProperties;

// Mirrors the filter on .pz-bd-face, so the baked sprites match the CSS fallback.
const CARD_SHADOW = { dy: 18, blur: 24, opacity: 0.6 };
// Portrait cards are drawn larger; mirrors the media query on .pz-bd-card.
const PORTRAIT_SCALE = 1.6;

export function MenuBackdrop({ quiet = false }: { quiet?: boolean }) {
  const { vmin, portrait } = useViewportUnit();
  // Two sprites per card, front then back, each with that card's blur and dimming baked in.
  const sprites = useBakedSprites(`${vmin}:${portrait}`, () =>
    FALLING_CARDS.flatMap((c): BakeSpec[] => {
      const look = {
        width: c.w * vmin * (portrait ? PORTRAIT_SCALE : 1),
        blur: c.blur,
        lit: c.lit,
        shadow: c.depth > 1 ? undefined : CARD_SHADOW,
      };
      return [
        { art: c.art, ...look },
        { art: 'pcards_back_p', ...look },
      ];
    }),
  );
  const face = (i: number, side: 0 | 1, art: string) =>
    sprites ? (
      <div className={`pz-bd-face baked ${side ? 'back' : ''}`} style={bakedStyle(sprites[i * 2 + side])} />
    ) : (
      <div className={`pz-bd-face ${side ? 'back' : ''}`} style={{ backgroundImage: `url(${CARDS}/${art}.png)` }} />
    );

  return (
    <div className={`pz-backdrop ${quiet ? 'quiet' : ''}`} aria-hidden>
      <div className="pz-bd-table">
        <div className="pz-bd-grid" />
      </div>
      <div className="pz-bd-light" />
      <div className="pz-bd-cards">
        {FALLING_CARDS.map((card, i) => (
          <div key={i} className="pz-bd-card" style={cardStyle(card)}>
            <div className="pz-bd-fall">
              <div className="pz-bd-spin">
                {face(i, 0, card.art)}
                {face(i, 1, 'pcards_back_p')}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="pz-bd-grain" />
    </div>
  );
}
