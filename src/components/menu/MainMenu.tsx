import { User, Users } from 'lucide-react';

import { useI18n } from '../../net/useI18n';
import { MenuButton } from './MenuButton';
import { MenuScreen } from './MenuScreen';

export function MainMenu({
  onGoSinglePlayer,
  onGoMultiplayer,
}: {
  onGoSinglePlayer: () => void;
  onGoMultiplayer: () => void;
}) {
  const { t } = useI18n();

  return (
    <MenuScreen variant="pz-main-menu">
      <div className="pz-lobby-actions">
        <MenuButton icon={User} title={t('single_player')} primary onClick={onGoSinglePlayer} />
        <MenuButton icon={Users} title={t('multiplayer')} primary onClick={onGoMultiplayer} />
      </div>
    </MenuScreen>
  );
}
