import { ArrowLeft, Trophy, Zap } from 'lucide-react';

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
        <MenuButton icon={Zap} title={t('quick_play')} primary onClick={onQuickMatch} />
        <MenuButton icon={Trophy} title={t('campaign')} primary onClick={onCampaign} />
        <MenuButton icon={ArrowLeft} title={t('btn_back')} onClick={onLeave} />
      </div>
    </MenuScreen>
  );
}
