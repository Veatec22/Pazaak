import { Gamepad2, Layers, Trophy } from 'lucide-react';

import { useI18n } from '../../net/useI18n';
import { MenuButton } from './MenuButton';
import { MenuScreen } from './MenuScreen';

export function SinglePlayerMenu({
  onQuickMatch,
  onCampaign,
  onLeave,
}: {
  onQuickMatch: () => void;
  onCampaign: () => void;
  onLeave: () => void;
}) {
  const { t } = useI18n();

  return (
    <MenuScreen variant="pz-single-menu" onBack={onLeave} backLabel={t('btn_back')}>
      <h2>{t('single_player_title')}</h2>

      <div className="pz-lobby-actions">
        <MenuButton icon={Gamepad2} title={t('quick_play')} desc={t('quick_play_desc')} primary onClick={onQuickMatch} />
        <MenuButton icon={Trophy} title={t('campaign')} desc={t('campaign_desc')} onClick={onCampaign} />
        <MenuButton icon={Layers} title={t('deck_builder')} desc={t('deck_builder_desc')} disabled />
      </div>
    </MenuScreen>
  );
}
