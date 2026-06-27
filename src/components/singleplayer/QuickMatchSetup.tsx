import { Layers, Plus, Repeat } from 'lucide-react';

import type { CardPool } from '../../engine';
import { useI18n } from '../../net/useI18n';
import { MenuButton } from '../menu/MenuButton';
import { MenuScreen } from '../menu/MenuScreen';

/** Quick match: pick the card pool your side deck is drawn from, then play a one-off. */
export function QuickMatchSetup({ onPick, onLeave }: { onPick: (pool: CardPool) => void; onLeave: () => void }) {
  const { t } = useI18n();
  return (
    <MenuScreen variant="pz-quick-setup" onBack={onLeave} backLabel={t('btn_back')}>
      <h2>{t('quick_play')}</h2>
      <p className="pz-tag">{t('quick_choose_pool')}</p>

      <div className="pz-lobby-actions">
        <MenuButton icon={Repeat} title={t('pool_flip')} desc={t('pool_flip_desc')} primary onClick={() => onPick('flip')} />
        <MenuButton icon={Layers} title={t('pool_mix')} desc={t('pool_mix_desc')} onClick={() => onPick('mix')} />
        <MenuButton icon={Plus} title={t('pool_classic')} desc={t('pool_classic_desc')} onClick={() => onPick('classic')} />
      </div>
    </MenuScreen>
  );
}
