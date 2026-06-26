import { useState } from 'react';
import {
  User,
  Users,
  Gamepad2,
  Dices,
  Plus,
  Key,
  Search,
  ArrowLeft,
  X,
  Copy,
  Share2,
  HelpCircle,
  Languages,
  Trophy,
  Layers,
} from 'lucide-react';
import { useLobby, useNickname, getRandomNickname } from './net/useLobby';
import { useI18n } from './net/useI18n';
import './lobby.css';

// -----------------------------------------------------------------------------
// GITHUB ICON (CUSTOM SVG COMPONENT)
// -----------------------------------------------------------------------------

function GithubIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={(size * 96) / 98}
      viewBox="0 0 98 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block' }}
    >
      <g clipPath="url(#clip0_730_27126)">
        <path
          d="M41.4395 69.3848C28.8066 67.8535 19.9062 58.7617 19.9062 46.9902C19.9062 42.2051 21.6289 37.0371 24.5 33.5918C23.2559 30.4336 23.4473 23.7344 24.8828 20.959C28.7109 20.4805 33.8789 22.4902 36.9414 25.2656C40.5781 24.1172 44.4062 23.543 49.0957 23.543C53.7852 23.543 57.6133 24.1172 61.0586 25.1699C64.0254 22.4902 69.2891 20.4805 73.1172 20.959C74.457 23.543 74.6484 30.2422 73.4043 33.4961C76.4668 37.1328 78.0937 42.0137 78.0937 46.9902C78.0937 58.7617 69.1934 67.6621 56.3691 69.2891C59.623 71.3945 61.8242 75.9883 61.8242 81.252L61.8242 91.2051C61.8242 94.0762 64.2168 95.7031 67.0879 94.5547C84.4102 87.9512 98 70.6289 98 49.1914C98 22.1074 75.9883 6.69539e-07 48.9043 4.309e-07C21.8203 1.92261e-07 -1.9479e-07 22.1074 -4.3343e-07 49.1914C-6.20631e-07 70.4375 13.4941 88.0469 31.6777 94.6504C34.2617 95.6074 36.75 93.8848 36.75 91.3008L36.75 83.6445C35.4102 84.2188 33.6875 84.6016 32.1562 84.6016C25.8398 84.6016 22.1074 81.1563 19.4277 74.7441C18.375 72.1602 17.2266 70.6289 15.0254 70.3418C13.877 70.2461 13.4941 69.7676 13.4941 69.1934C13.4941 68.0449 15.4082 67.1836 17.3223 67.1836C20.0977 67.1836 22.4902 68.9063 24.9785 72.4473C26.8926 75.2227 28.9023 76.4668 31.2949 76.4668C33.6875 76.4668 35.2187 75.6055 37.4199 73.4043C39.0469 71.7773 40.291 70.3418 41.4395 69.3848Z"
          fill="currentColor"
        />
      </g>
      <defs>
        <clipPath id="clip0_730_27126">
          <rect width="98" height="96" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}

// -----------------------------------------------------------------------------
// TOP BAR (SHARED HEADER WITH GITHUB LINK & HELP & i18n SWITCHER)
// -----------------------------------------------------------------------------

export function TopBar() {
  const [showHelp, setShowHelp] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const { lang, setLanguage, t } = useI18n();

  const getGithubRepoUrl = () => {
    if (typeof window === 'undefined') return 'https://github.com/Veatec22/Pazaak';
    const host = window.location.hostname;
    const path = window.location.pathname;
    if (host.endsWith('.github.io')) {
      const username = host.split('.')[0];
      const repo = path.split('/').filter(Boolean)[0] || '';
      return `https://github.com/${username}/${repo}`;
    }
    return 'https://github.com/Veatec22/Pazaak';
  };

  return (
    <>
      {showLangDropdown && (
        <div className="pz-dropdown-backdrop" onClick={() => setShowLangDropdown(false)} />
      )}

      <div className="pz-top-bar">
        <div className="pz-lang-container">
          <button
            className={`pz-topbar-btn ${showLangDropdown ? 'active' : ''}`}
            onClick={() => setShowLangDropdown(!showLangDropdown)}
            title="Change Language / Zmień Język"
            aria-label="Change Language"
          >
            <Languages size={20} />
          </button>
          {showLangDropdown && (
            <div className="pz-lang-dropdown">
              <button
                className={`pz-lang-item ${lang === 'pl' ? 'active' : ''}`}
                onClick={() => {
                  setLanguage('pl');
                  setShowLangDropdown(false);
                }}
              >
                <span>🇵🇱 Polski</span>
                {lang === 'pl' && <span className="pz-tick">✓</span>}
              </button>
              <button
                className={`pz-lang-item ${lang === 'en' ? 'active' : ''}`}
                onClick={() => {
                  setLanguage('en');
                  setShowLangDropdown(false);
                }}
              >
                <span>🇬🇧 English</span>
                {lang === 'en' && <span className="pz-tick">✓</span>}
              </button>
            </div>
          )}
        </div>
        <button
          className="pz-topbar-btn"
          onClick={() => setShowHelp(true)}
          title={t('help_title')}
          aria-label={t('help_title')}
        >
          <HelpCircle size={20} />
        </button>
        <a
          href={getGithubRepoUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="pz-github-link"
          aria-label="GitHub Repository"
        >
          <GithubIcon size={20} />
        </a>
      </div>

      {showHelp && (
        <div className="pz-modal-overlay" onClick={() => setShowHelp(false)}>
          <div className="pz-modal-card pz-help-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pz-modal-header">
              <h3>{t('help_title')}</h3>
              <button className="pz-modal-close" onClick={() => setShowHelp(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="pz-modal-body pz-help-body">
              <p>{t('help_p1')}</p>

              <h4>{t('help_h1')}</h4>
              <p>{t('help_p2')}</p>

              <h4>{t('help_h2')}</h4>
              <ul>
                <li>{t('help_li1')}</li>
                <li>{t('help_li2')}</li>
                <li>{t('help_li3')}</li>
              </ul>

              <h4>{t('help_h3')}</h4>
              <p>{t('help_p3')}</p>

              <h4>{t('help_h4')}</h4>
              <ul>
                <li>{t('help_li4')}</li>
                <li>{t('help_li5')}</li>
                <li>{t('help_li6')}</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// -----------------------------------------------------------------------------
// MAIN MENU
// -----------------------------------------------------------------------------

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
    <div className="pz-lobby pz-main-menu">
      <TopBar />
      <div className="pz-logo-container">
        <h1>Pazaak</h1>
        <div className="pz-logo-subtitle">{t('logo_subtitle')}</div>
      </div>
      <p className="pz-tag">{t('menu_tagline')}</p>

      <div className="pz-lobby-actions">
        <button className="pz-btn primary big" onClick={onGoSinglePlayer}>
          <span className="pz-btn-title">
            <User size={20} />
            {t('single_player')}
          </span>
          <small>{t('single_player_desc')}</small>
        </button>

        <button className="pz-btn big" onClick={onGoMultiplayer}>
          <span className="pz-btn-title">
            <Users size={20} />
            {t('multiplayer')}
          </span>
          <small>{t('multiplayer_desc')}</small>
        </button>

        <button className="pz-btn big" onClick={onHotSeat}>
          <span className="pz-btn-title">
            <Gamepad2 size={20} />
            {t('pass_and_play')}
          </span>
          <small>{t('pass_and_play_desc')}</small>
        </button>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// MULTIPLAYER MENU
// -----------------------------------------------------------------------------

export function MultiplayerMenu({
  onPlayFriend,
  onLeave,
}: {
  onPlayFriend: () => void;
  onLeave: () => void;
}) {
  const [nickname, setNickname] = useNickname();
  const [activeTab, setActiveTab] = useState<'none' | 'join' | 'search'>('none');
  const [joinCode, setJoinCode] = useState('');
  const { t } = useI18n();

  // Only connect to the lobby room when the search list is open
  const { activeGames, connecting } = useLobby(activeTab === 'search');

  const handleRandomizeName = () => {
    setNickname(getRandomNickname());
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let code = joinCode.trim();
    const urlMatch = /[#&]room=([^&]+)/.exec(code);
    if (urlMatch) {
      code = decodeURIComponent(urlMatch[1]);
    }
    if (code) {
      location.hash = `room=${code}`;
    }
  };

  return (
    <div className="pz-lobby pz-multi-menu">
      <TopBar />
      <button className="pz-leave" onClick={onLeave}>
        <ArrowLeft size={16} /> {t('btn_back')}
      </button>

      <h2>{t('multiplayer')}</h2>

      {/* Nickname Panel */}
      <div className="pz-nickname-panel">
        <label htmlFor="nickname">{t('your_nickname')}</label>
        <div className="pz-nickname-input-group">
          <input
            id="nickname"
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={20}
            placeholder={t('placeholder_nickname')}
          />
          <button
            className="pz-btn icon-btn"
            onClick={handleRandomizeName}
            title={t('placeholder_nickname')}
            aria-label="Randomize Name"
          >
            <Dices size={18} />
          </button>
        </div>
      </div>

      <div className="pz-lobby-actions">
        <button className="pz-btn primary big" onClick={onPlayFriend}>
          <span className="pz-btn-title">
            <Plus size={20} />
            {t('create_match')}
          </span>
          <small>{t('create_match_desc')}</small>
        </button>

        <button
          className={`pz-btn big ${activeTab === 'join' ? 'active' : ''}`}
          onClick={() => setActiveTab(activeTab === 'join' ? 'none' : 'join')}
        >
          <span className="pz-btn-title">
            <Key size={20} />
            {t('join_via_code')}
          </span>
          <small>{t('join_via_code_desc')}</small>
        </button>

        {activeTab === 'join' && (
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
        )}

        <button
          className={`pz-btn big ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => setActiveTab(activeTab === 'search' ? 'none' : 'search')}
        >
          <span className="pz-btn-title">
            <Search size={20} />
            {t('browse_matches')}
          </span>
          <small>{t('browse_matches_desc')}</small>
        </button>

        {activeTab === 'search' && (
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
                        <button
                          className="pz-btn primary sm"
                          onClick={() => {
                            location.hash = `room=${game.roomId}`;
                          }}
                        >
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
        )}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// WAITING ROOM SCREEN
// -----------------------------------------------------------------------------

export function WaitingRoom({ roomId, onLeave }: { roomId: string; onLeave: () => void }) {
  const url = `${location.origin}${location.pathname}#room=${roomId}`;
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const { t } = useI18n();

  const copyLink = () => {
    void navigator.clipboard?.writeText(url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  const copyCode = () => {
    void navigator.clipboard?.writeText(roomId).then(() => {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    });
  };

  const share = () => {
    if (navigator.share) {
      void navigator.share({ title: 'Pazaak', text: 'Join my pazaak game', url }).catch(() => {});
    } else {
      copyLink();
    }
  };

  const canShare = typeof navigator !== 'undefined' && !!navigator.share;

  return (
    <div className="pz-lobby pz-waiting-room">
      <button className="pz-leave" onClick={onLeave}>
        <ArrowLeft size={16} /> {t('btn_cancel')}
      </button>

      <div className="pz-waiting-card">
        <div className="pz-waiting-header">
          <h2>{t('room_created')}</h2>
          <div className="pz-pulse-status">
            <span className="pz-pulse-dot"></span> {t('waiting_opponent')}
          </div>
        </div>

        <div className="pz-waiting-fields">
          <div className="pz-waiting-field">
            <label>{t('room_code')}</label>
            <div className="pz-input-row">
              <input readOnly value={roomId} className="pz-share-url" />
              <button className="pz-btn" onClick={copyCode}>
                <Copy size={14} style={{ marginRight: '6px' }} />
                {copiedCode ? t('btn_copied') : t('btn_copy')}
              </button>
            </div>
          </div>

          <div className="pz-waiting-field">
            <label>{t('invite_link')}</label>
            <div className="pz-input-row">
              <input readOnly value={url} className="pz-share-url" onFocus={(e) => e.currentTarget.select()} />
              <button className="pz-btn" onClick={copyLink}>
                <Copy size={14} style={{ marginRight: '6px' }} />
                {copiedLink ? t('btn_copied') : t('btn_copy')}
              </button>
            </div>
          </div>
        </div>

        <div className="pz-waiting-actions">
          {canShare && (
            <button className="pz-btn primary" onClick={share}>
              <Share2 size={16} style={{ marginRight: '8px' }} />
              {t('btn_share_link')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// SHARE BAR (TOP HEADER IN ACTIVE ONLINE GAME)
// -----------------------------------------------------------------------------

export function ShareBar({ roomId }: { roomId: string }) {
  const url = `${location.origin}${location.pathname}#room=${roomId}`;
  const [copied, setCopied] = useState(false);
  const { t } = useI18n();

  const copy = () => {
    void navigator.clipboard?.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const share = () => {
    if (navigator.share) {
      void navigator.share({ title: 'Pazaak', text: 'Join my pazaak game', url }).catch(() => {});
    } else {
      copy();
    }
  };

  const canShare = typeof navigator !== 'undefined' && !!navigator.share;

  return (
    <div className="pz-share">
      <span className="pz-share-label">
        {t('match_room')}: <strong>{roomId}</strong>
      </span>
      <input className="pz-share-url" readOnly value={url} onFocus={(e) => e.currentTarget.select()} />
      <button className="pz-btn" onClick={copy}>
        <Copy size={14} style={{ marginRight: '6px' }} />
        {copied ? t('btn_copied') : t('btn_copy')}
      </button>
      {canShare ? (
        <button className="pz-btn primary" onClick={share}>
          <Share2 size={14} style={{ marginRight: '6px' }} />
          {t('btn_share_link')}
        </button>
      ) : null}
    </div>
  );
}

// -----------------------------------------------------------------------------
// SINGLE PLAYER MENU
// -----------------------------------------------------------------------------

export function SinglePlayerMenu({
  onPlayBot,
  onLeave,
}: {
  onPlayBot: () => void;
  onLeave: () => void;
}) {
  const { t } = useI18n();

  return (
    <div className="pz-lobby pz-single-menu">
      <TopBar />
      <button className="pz-leave" onClick={onLeave}>
        <ArrowLeft size={16} /> {t('btn_back')}
      </button>

      <h2>{t('single_player_title')}</h2>

      <div className="pz-lobby-actions">
        <button className="pz-btn primary big" onClick={onPlayBot}>
          <span className="pz-btn-title">
            <Gamepad2 size={20} />
            {t('quick_play')}
          </span>
          <small>{t('quick_play_desc')}</small>
        </button>

        <button className="pz-btn big disabled" disabled title={t('campaign_desc')}>
          <span className="pz-btn-title">
            <Trophy size={20} />
            {t('campaign')}
          </span>
          <small>{t('campaign_desc')}</small>
        </button>

        <button className="pz-btn big disabled" disabled title={t('deck_builder_desc')}>
          <span className="pz-btn-title">
            <Layers size={20} />
            {t('deck_builder')}
          </span>
          <small>{t('deck_builder_desc')}</small>
        </button>
      </div>
    </div>
  );
}

