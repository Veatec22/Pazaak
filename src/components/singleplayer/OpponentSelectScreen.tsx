import { Shuffle } from 'lucide-react';
import { useLayoutEffect, useRef, useState } from 'react';

import { COMPANION_LIST, randomCompanionId } from '../../companions/companions';
import type { CardPool } from '../../engine';
import { useI18n } from '../../net/useI18n';
import { MenuScreen } from '../menu/MenuScreen';

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

  return (
    <MenuScreen variant="pz-opponent-select" showLogo={false} onBack={onLeave} backLabel={t('btn_back')}>
      <h2>{t('quick_play')}</h2>
      <p className="pz-tag">{t('quick_choose_opponent')} · {t(`pool_${pool}`)}</p>

      <div className="pz-opponent-fit" ref={fitRef}>
        <div
          className="pz-opponent-grid"
          ref={gridRef}
          style={{ transform: `scale(${scale})` }}
        >
          <button className="pz-opponent-tile" onClick={() => onPick(randomCompanionId())}>
            <span className="pz-opponent-tile-art pz-opponent-tile-random">
              <Shuffle size={32} />
            </span>
            <span className="pz-opponent-tile-name">{t('opponent_random')}</span>
          </button>
          {COMPANION_LIST.map((companion) => (
            <button key={companion.id} className="pz-opponent-tile" onClick={() => onPick(companion.id)}>
              <span className="pz-opponent-tile-art">
                <img src={companion.portrait} alt="" />
              </span>
              <span className="pz-opponent-tile-name">{companion.name}</span>
            </button>
          ))}
        </div>
      </div>

      <button className="pz-btn" onClick={onLeave}>
        {t('btn_back')}
      </button>
    </MenuScreen>
  );
}
