import { type ReactNode } from 'react';

import { TopBar } from './TopBar';

const LOGO = `${import.meta.env.BASE_URL}brand/logo.png`;

export function MenuScreen({
  variant,
  topBar = true,
  children,
}: {
  variant?: string;
  onBack?: () => void;
  backLabel?: string;
  topBar?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={`pz-lobby ${variant ?? ''}`}>
      {topBar ? <TopBar /> : null}
      <div className="pz-lobby-header">
        <img className="pz-logo-img" src={LOGO} alt="Pazaak Logo" />
      </div>
      <div className="pz-lobby-content">
        {children}
      </div>
    </div>
  );
}
