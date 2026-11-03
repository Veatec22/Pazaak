import { Shuffle } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

import { COMPANION_LIST, COMPANIONS, randomCompanionId } from '../../companions/companions';
import type { CardPool } from '../../engine';
import { useI18n } from '../../net/useI18n';
import { primeCompanionVoice } from '../../ui/companionVoice';
import { tiltHandlers } from '../../ui/pointerTilt';
import { MenuScreen } from '../menu/MenuScreen';

// How long the chosen portrait holds the spotlight before the match starts.
const PICK_MS = 420;

const prefersReducedMotion = () => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function OpponentSelectScreen({
  pool,
  onPick,
  onLeave,
}: {
  pool: CardPool;
  onPick: (companionId?: string) => void;
  onLeave: () => void;
}) {
  const { t } = useI18n();
  const fitRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [picked, setPicked] = useState<string | null>(null);

  useLayoutEffect(() => {
    const fit = fitRef.current;
    const grid = gridRef.current;
    if (!fit || !grid) return;

    const measure = () => {
      const availW = fit.clientWidth;
      const availH = fit.clientHeight;
      const naturalW = grid.scrollWidth;
      const naturalH = grid.scrollHeight;
      if (!naturalW || !naturalH) return;
      setScale(Math.min(1, availW / naturalW, availH / naturalH));
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(fit);
    ro.observe(grid);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!picked) return;
    const timer = setTimeout(() => onPick(picked), PICK_MS);
    return () => clearTimeout(timer);
  }, [picked, onPick]);

  // The chosen portrait steps forward while the rest fall back; a random pick lights up
  // the companion it landed on, so the player sees who they drew.
  function choose(companionId: string) {
    if (picked) return;
    const companion = COMPANIONS[companionId];
    if (companion) primeCompanionVoice(companion);
    if (prefersReducedMotion()) {
      onPick(companionId);
      return;
    }
    setPicked(companionId);
  }

  const tileState = (tile: string) => (picked ? (picked === tile ? 'picked' : 'passed') : '');

  return (
    <MenuScreen variant="pz-opponent-select" showLogo={false} onBack={onLeave} backLabel={t('btn_back')}>
      <h2>{t('quick_play')}</h2>
      <p className="pz-tag">{t('quick_choose_opponent')} · {t(`pool_${pool}`)}</p>

      <div className="pz-opponent-fit" ref={fitRef}>
        <div
          className={`pz-opponent-grid ${picked ? 'has-pick' : ''}`}
          ref={gridRef}
          style={{ transform: `scale(${scale})` }}
        >
          <OpponentTile
            index={0}
            state={tileState('random')}
            name={t('opponent_random')}
            artClassName="pz-opponent-tile-random"
            onClick={() => choose(randomCompanionId())}
          >
            <Shuffle size={32} />
          </OpponentTile>
          {COMPANION_LIST.map((companion, i) => (
            <OpponentTile
              key={companion.id}
              index={i + 1}
              state={tileState(companion.id)}
              name={companion.name}
              onClick={() => choose(companion.id)}
            >
              <img src={companion.portrait} alt="" />
            </OpponentTile>
          ))}
        </div>
      </div>

      <button className="pz-btn" onClick={onLeave}>
        {t('btn_back')}
      </button>
    </MenuScreen>
  );
}

/** A portrait that tilts toward the pointer like a card held to the light. */
function OpponentTile({
  index,
  state,
  name,
  artClassName = '',
  onClick,
  children,
}: {
  index: number;
  state: string;
  name: string;
  artClassName?: string;
  onClick: () => void;
  children: ReactNode;
}) {
  const artRef = useRef<HTMLSpanElement>(null);
  const { onPointerMove, onPointerLeave, settle } = tiltHandlers(artRef);

  return (
    <button
      className={`pz-opponent-tile ${state}`}
      style={{ ['--ti' as string]: index } as CSSProperties}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      onClick={() => {
        settle();
        onClick();
      }}
    >
      <span ref={artRef} className={`pz-opponent-tile-art pz-tilt ${artClassName}`}>
        {children}
      </span>
      <span className="pz-opponent-tile-name">{name}</span>
    </button>
  );
}
