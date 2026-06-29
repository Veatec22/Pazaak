import { ArrowLeft, ArrowLeftRight, Landmark } from 'lucide-react';

import type { CardPool } from '../../engine';
import { useI18n } from '../../net/useI18n';
import { MenuButton } from '../menu/MenuButton';
import { MenuScreen } from '../menu/MenuScreen';

export function QuickMatchSetup({ onPick, onLeave }: { onPick: (pool: CardPool) => void; onLeave: () => void }) {
  const { t } = useI18n();
  return (
    <MenuScreen variant="pz-quick-setup" onBack={onLeave} backLabel={t('btn_back')}>
      <h2>{t('quick_play')}</h2>
      <p className="pz-tag">{t('quick_choose_pool')}</p>

      <div className="pz-lobby-actions">
        <MenuButton icon={ArrowLeftRight} title={t('pool_flip')} primary onClick={() => onPick('flip')} />
        <MenuButton icon={MixedPoolIcon} title={t('pool_mix')} primary onClick={() => onPick('mix')} />
        <MenuButton icon={Landmark} title={t('pool_classic')} primary onClick={() => onPick('classic')} />
        <MenuButton icon={ArrowLeft} title={t('btn_back')} onClick={onLeave} />
      </div>
    </MenuScreen>
  );
}

function MixedPoolIcon({ size = 20 }: { size?: number }) {
  const iconSize = Math.max(12, Math.round(size * 0.72));
  return (
    <span className="pz-combo-icon" aria-hidden>
      <ArrowLeftRight size={iconSize} />
      <Landmark size={iconSize} />
    </span>
  );
}
