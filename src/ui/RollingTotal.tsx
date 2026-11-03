import { useEffect, useRef, useState, type CSSProperties } from 'react';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Which way the digits roll: up as the total climbs, back down when a minus card lowers it. */
type RollDirection = 'up' | 'down';

/** The seat total, its digits rolling to each new value. Padded to two places so the rail never reflows. */
export function RollingTotal({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const lastValue = useRef(value);
  const [trend, setTrend] = useState<{ value: number; direction: RollDirection }>({ value, direction: 'up' });
  if (trend.value !== value) {
    setTrend({ value, direction: value < trend.value ? 'down' : 'up' });
  }

  // Going bust rattles the number once the new digits have rolled in.
  useEffect(() => {
    const was = lastValue.current;
    lastValue.current = value;
    const el = ref.current;
    if (was === value || value <= 20 || !el || typeof el.animate !== 'function' || prefersReducedMotion()) return;
    el.animate(
      [
        { transform: 'translateX(0)' },
        { transform: 'translateX(-5px)' },
        { transform: 'translateX(4px)' },
        { transform: 'translateX(-3px)' },
        { transform: 'translateX(2px)' },
        { transform: 'translateX(0)' },
      ],
      { duration: 380, delay: 220, easing: 'ease-out' },
    );
  }, [value]);

  const state = value > 20 ? 'bust' : value === 20 ? 'pazaak' : '';
  const chars = String(value).padStart(2, ' ').split('');
  return (
    <span ref={ref} className={`pz-total ${state}`}>
      <span className="pz-sr">{value}</span>
      {chars.map((char, i) => (
        <RollingDigit key={i} char={char} direction={trend.direction} delay={i === chars.length - 1 ? 0 : 40} />
      ))}
    </span>
  );
}

/** One digit wheel: the old digit rolls out one way while the new one rolls in behind it. */
function RollingDigit({ char, direction, delay }: { char: string; direction: RollDirection; delay: number }) {
  const [roll, setRoll] = useState({ cur: char, prev: char, turn: 0, direction });
  if (roll.cur !== char) {
    setRoll({ cur: char, prev: prefersReducedMotion() ? char : roll.cur, turn: roll.turn + 1, direction });
  }
  const { cur, prev, turn } = roll;
  const rolling = prev !== cur;
  const settle = () => setRoll((r) => (r.turn === turn ? { ...r, prev: r.cur } : r));

  return (
    <span
      className={`pz-roll ${roll.direction}`}
      aria-hidden
      style={{ ['--roll-delay' as string]: `${delay}ms` } as CSSProperties}
    >
      {rolling ? (
        <span key={`out${turn}`} className="out">
          {prev}
        </span>
      ) : null}
      <span key={`in${turn}`} className={rolling ? 'in' : undefined} onAnimationEnd={settle}>
        {cur}
      </span>
    </span>
  );
}
