import type { PointerEvent, RefObject } from 'react';

const canTilt = () =>
  !!window.matchMedia?.('(hover: hover) and (pointer: fine)').matches &&
  !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Pointer handlers that tilt `target` toward the mouse like a card held to the light.
 * The element needs the `pz-tilt` class for its transitions and glare; touch and
 * reduced motion leave it flat.
 */
export function tiltHandlers(
  target: RefObject<HTMLElement | null>,
  { maxDeg = 10, scale = 1.08, perspective = 320 }: { maxDeg?: number; scale?: number; perspective?: number } = {},
) {
  const settle = () => {
    const el = target.current;
    if (!el) return;
    el.classList.remove('tilting');
    el.style.transform = '';
  };

  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    const el = target.current;
    if (!el || e.pointerType !== 'mouse' || (el as HTMLButtonElement).disabled || !canTilt()) return;
    const rect = el.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
    el.classList.add('tilting');
    el.style.transform = `perspective(${perspective}px) rotateX(${((0.5 - y) * 2 * maxDeg).toFixed(2)}deg) rotateY(${((x - 0.5) * 2 * maxDeg).toFixed(2)}deg) scale(${scale})`;
    el.style.setProperty('--gx', `${(x * 100).toFixed(1)}%`);
    el.style.setProperty('--gy', `${(y * 100).toFixed(1)}%`);
  };

  return { onPointerMove, onPointerLeave: settle, settle };
}
