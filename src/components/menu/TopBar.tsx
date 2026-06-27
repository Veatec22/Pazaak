import { Download, HelpCircle, Languages } from 'lucide-react';
import { useEffect, useState } from 'react';

import { MusicControls } from '../../music/MusicControls';
import { useI18n } from '../../net/useI18n';
import { GithubIcon } from './GithubIcon';
import { HelpModal } from './HelpModal';

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

/** The persistent top-right bar: music, language, install (PWA), help, GitHub. */
export function TopBar() {
  const { lang, setLanguage, t } = useI18n();
  const [showHelp, setShowHelp] = useState(false);
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
        <MusicControls />

        <div className="pz-lang-container">
          <button
            className={`pz-topbar-btn ${showLangDropdown ? 'active' : ''}`}
            onClick={() => setShowLangDropdown((v) => !v)}
            title="Change Language / Zmień Język"
            aria-label="Change Language"
          >
            <Languages size={20} />
          </button>
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
          <button className="pz-topbar-btn pz-install-btn" onClick={install} title={t('install_app')} aria-label={t('install_app')}>
            <Download size={20} />
          </button>
        ) : null}

        <button className="pz-topbar-btn" onClick={() => setShowHelp(true)} title={t('help_title')} aria-label={t('help_title')}>
          <HelpCircle size={20} />
        </button>

        <a
          href={githubRepoUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="pz-github-link"
          aria-label="GitHub Repository"
        >
          <GithubIcon size={20} />
        </a>
      </div>

      {showHelp ? <HelpModal onClose={() => setShowHelp(false)} /> : null}
    </>
  );
}
