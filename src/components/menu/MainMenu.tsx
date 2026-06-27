import { Gamepad2, User, Users } from 'lucide-react';

import { useI18n } from '../../net/useI18n';
import { MenuButton } from './MenuButton';
import { MenuScreen } from './MenuScreen';

const LOGO = `${import.meta.env.BASE_URL}brand/logo-256.png`;

export function MainMenu({
  onGoSinglePlayer,
  onGoMultiplayer,
  onHotSeat,
}: {
  onGoSinglePlayer: () => void;
  onGoMultiplayer: () => void;
  onHotSeat: () => void;
}) {
  const { t } = useI18n();

  return (
    <MenuScreen variant="pz-main-menu">
      <div className="pz-logo-container">
        <img className="pz-logo-img" src={LOGO} alt="" width={104} height={104} />
        <h1>Pazaak</h1>
        <div className="pz-logo-subtitle">{t('logo_subtitle')}</div>
      </div>
      <p className="pz-tag">{t('menu_tagline')}</p>

      <div className="pz-lobby-actions">
        <MenuButton icon={User} title={t('single_player')} desc={t('single_player_desc')} primary onClick={onGoSinglePlayer} />
        <MenuButton icon={Users} title={t('multiplayer')} desc={t('multiplayer_desc')} onClick={onGoMultiplayer} />
        <MenuButton icon={Gamepad2} title={t('pass_and_play')} desc={t('pass_and_play_desc')} onClick={onHotSeat} />
      </div>
    </MenuScreen>
  );
}
