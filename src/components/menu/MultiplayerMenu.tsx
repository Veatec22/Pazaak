import { ArrowLeft, Dices, Gamepad2, Key, Plus, Search, Users, X } from 'lucide-react';
import { useState } from 'react';

import { useI18n } from '../../net/useI18n';
import { getRandomNickname, useLobby, useNickname } from '../../net/useLobby';
import { MenuButton } from './MenuButton';
import { MenuScreen } from './MenuScreen';

type Tab = 'none' | 'join' | 'search';

export function MultiplayerMenu({
  onPlayFriend,
  onJoinRoom,
  onHotSeat,
  onLeave,
}: {
  onPlayFriend: () => void;
  onJoinRoom: (roomId: string) => void;
  onHotSeat: () => void;
  onLeave: () => void;
}) {
  const { t } = useI18n();
  const [nickname, setNickname] = useNickname();
  const [activeTab, setActiveTab] = useState<Tab>('none');
  const [joinCode, setJoinCode] = useState('');
  const { activeGames, connecting } = useLobby(activeTab === 'search');

  const toggle = (tab: Tab) => setActiveTab((cur) => (cur === tab ? 'none' : tab));

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let code = joinCode.trim();
    const urlMatch = /[#&]room=([^&]+)/.exec(code);
    if (urlMatch) code = decodeURIComponent(urlMatch[1]);
    if (code) onJoinRoom(code);
  };

  return (
    <MenuScreen variant="pz-multi-menu" onBack={onLeave} backLabel={t('btn_back')}>
      <h2>{t('multiplayer')}</h2>

      <div className="pz-nickname-panel">
        <label htmlFor="nickname">{t('your_nickname')}</label>
        <div className="pz-nickname-input-group">
          <input
            id="nickname"
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            onBlur={() => {
              if (!nickname.trim()) {
                setNickname(getRandomNickname());
              }
            }}
            maxLength={20}
            placeholder={t('placeholder_nickname')}
          />
          <button
            className="pz-btn icon-btn"
            onClick={() => setNickname(getRandomNickname())}
            title={t('placeholder_nickname')}
            aria-label="Randomize Name"
          >
            <Dices size={18} />
          </button>
        </div>
      </div>

      <div className="pz-lobby-actions">
        <MenuButton icon={Plus} title={t('create_match')} primary onClick={onPlayFriend} />
        <MenuButton icon={Key} title={t('join_via_code')} primary active={activeTab === 'join'} onClick={() => toggle('join')} />

        {activeTab === 'join' ? (
          <div className="pz-modal-overlay" onClick={() => setActiveTab('none')}>
            <div className="pz-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="pz-modal-header">
                <h3>{t('join_match_title')}</h3>
                <button className="pz-modal-close" onClick={() => setActiveTab('none')}>
                  <X size={20} />
                </button>
              </div>
              <div className="pz-modal-body">
                <form className="pz-join-form" onSubmit={handleJoinSubmit}>
                  <input
                    type="text"
                    placeholder={t('placeholder_join')}
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    autoFocus
                  />
                  <button className="pz-btn primary" type="submit" disabled={!joinCode.trim()}>
                    <Key size={16} style={{ marginRight: '6px' }} />
                    {t('btn_connect')}
                  </button>
                </form>
              </div>
            </div>
          </div>
        ) : null}

        <MenuButton icon={Search} title={t('browse_matches')} primary active={activeTab === 'search'} onClick={() => toggle('search')} />

        {activeTab === 'search' ? (
          <div className="pz-modal-overlay" onClick={() => setActiveTab('none')}>
            <div className="pz-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="pz-modal-header">
                <h3>{t('active_servers')}</h3>
                <button className="pz-modal-close" onClick={() => setActiveTab('none')}>
                  <X size={20} />
                </button>
              </div>
              <div className="pz-modal-body">
                {connecting ? (
                  <div className="pz-lobby-status">
                    <span className="pz-spinner"></span> {t('scanning_holonet')}
                  </div>
                ) : activeGames.length === 0 ? (
                  <div className="pz-lobby-empty">{t('no_active_games')}</div>
                ) : (
                  <div className="pz-server-grid">
                    {activeGames.map((game) => (
                      <div className="pz-server-card" key={game.peerId}>
                        <div className="pz-server-info">
                          <span className="pz-server-host">{game.hostName}</span>
                          <span className="pz-server-code">
                            {t('server_code')}: {game.roomId}
                          </span>
                        </div>
                        <button className="pz-btn primary sm" onClick={() => onJoinRoom(game.roomId)}>
                          <Users size={14} style={{ marginRight: '6px' }} />
                          {t('btn_join')}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
        <MenuButton icon={Gamepad2} title={t('pass_and_play')} primary onClick={onHotSeat} />
        <MenuButton icon={ArrowLeft} title={t('btn_back')} onClick={onLeave} />
      </div>
    </MenuScreen>
  );
}
