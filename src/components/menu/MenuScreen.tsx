import { type CSSProperties, type ReactNode } from 'react';

import { TopBar } from './TopBar';

const LOGO = `${import.meta.env.BASE_URL}brand/logo.png`;

export function MenuScreen({
  variant,
  topBar = true,
  showLogo = true,
  children,
}: {
  variant?: string;
  onBack?: () => void;
  backLabel?: string;
  topBar?: boolean;
  showLogo?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={`pz-lobby ${variant ?? ''}`}>
      {topBar ? <TopBar /> : null}
      {showLogo ? (
        <div className="pz-lobby-header">
          <div className="pz-logo-wrap">
            <img className="pz-logo-img" src={LOGO} alt="Pazaak Logo" />
            <span className="pz-logo-glint" style={{ ['--logo' as string]: `url(${LOGO})` } as CSSProperties} aria-hidden />
          </div>
        </div>
      ) : null}
      <div className="pz-lobby-content">
        {children}
      </div>
    </div>
  );
}
