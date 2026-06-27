import { Download, HelpCircle, Languages, Volume2, VolumeX } from 'lucide-react';
import { useEffect, useState } from 'react';

import { MusicControls } from '../../music/MusicControls';
import { useI18n } from '../../net/useI18n';
import { useSfxMute } from '../../ui/sounds';
import { GithubIcon } from './GithubIcon';
import { HelpModal } from './HelpModal';
import { Tooltip } from './Tooltip';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => void;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function githubRepoUrl(): string {
  if (typeof window === 'undefined') return 'https://github.com/Veatec22/Pazaak';
  const host = window.location.hostname;
  if (host.endsWith('.github.io')) {
    const username = host.split('.')[0];
    const repo = window.location.pathname.split('/').filter(Boolean)[0] || '';
    return `https://github.com/${username}/${repo}`;
  }
  return 'https://github.com/Veatec22/Pazaak';
}

const ICON = `${import.meta.env.BASE_URL}brand/icon-192.png`;

export function TopBar({ hasLeaveButton = false }: { hasLeaveButton?: boolean }) {
  const { lang, setLanguage, t } = useI18n();
  const [showHelp, setShowHelp] = useState(false);
  const { muted: sfxMuted, toggle: toggleSfx } = useSfxMute();
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setInstallPrompt(null);
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') setInstallPrompt(null);
  };

  return (
    <>
      {showLangDropdown ? <div className="pz-dropdown-backdrop" onClick={() => setShowLangDropdown(false)} /> : null}

      <div className="pz-top-bar">
        <img
          src={ICON}
          alt="Pazaak"
          className={`pz-topbar-icon ${hasLeaveButton ? 'has-leave' : ''}`}
        />
        <MusicControls />

        <Tooltip content={sfxMuted ? t('sfx_unmute') : t('sfx_mute')}>
          <button
            className="pz-topbar-btn"
            onClick={toggleSfx}
            aria-label="Toggle SFX"
            data-no-click-sound
          >
            {sfxMuted ? <VolumeX size={20} strokeWidth={3} /> : <Volume2 size={20} strokeWidth={3} />}
          </button>
        </Tooltip>

        <div className="pz-lang-container">
          <Tooltip content="Change Language / Zmień Język">
            <button
              className={`pz-topbar-btn ${showLangDropdown ? 'active' : ''}`}
              onClick={() => setShowLangDropdown((v) => !v)}
              aria-label="Change Language"
            >
              <Languages size={20} strokeWidth={3} />
            </button>
          </Tooltip>
          {showLangDropdown ? (
            <div className="pz-lang-dropdown">
              <button
                className={`pz-lang-item ${lang === 'pl' ? 'active' : ''}`}
                onClick={() => {
                  setLanguage('pl');
                  setShowLangDropdown(false);
                }}
              >
                <span>🇵🇱 Polski</span>
                {lang === 'pl' ? <span className="pz-tick">✓</span> : null}
              </button>
              <button
                className={`pz-lang-item ${lang === 'en' ? 'active' : ''}`}
                onClick={() => {
                  setLanguage('en');
                  setShowLangDropdown(false);
                }}
              >
                <span>🇬🇧 English</span>
                {lang === 'en' ? <span className="pz-tick">✓</span> : null}
              </button>
            </div>
          ) : null}
        </div>

        {installPrompt ? (
          <Tooltip content={t('install_app')}>
            <button className="pz-topbar-btn pz-install-btn" onClick={install} aria-label={t('install_app')}>
              <Download size={20} strokeWidth={3} />
            </button>
          </Tooltip>
        ) : null}

        <Tooltip content={t('help_title')}>
          <button className="pz-topbar-btn" onClick={() => setShowHelp(true)} aria-label={t('help_title')}>
            <HelpCircle size={20} strokeWidth={3} />
          </button>
        </Tooltip>

        <Tooltip content="GitHub Repository">
          <a
            href={githubRepoUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="pz-github-link"
            aria-label="GitHub Repository"
          >
            <GithubIcon size={20} strokeWidth={3} />
          </a>
        </Tooltip>
      </div>

      {showHelp ? <HelpModal onClose={() => setShowHelp(false)} /> : null}
    </>
  );
}
