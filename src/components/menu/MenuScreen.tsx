import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';

import { TopBar } from './TopBar';

/**
 * Shared menu chrome: the `.pz-lobby` shell + TopBar + optional back button + the centred
 * content column. Every menu screen renders its body inside this.
 */
export function MenuScreen({
  variant,
  onBack,
  backLabel,
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
      {onBack ? (
        <button className="pz-leave" onClick={onBack}>
          <ArrowLeft size={16} /> {backLabel}
        </button>
      ) : null}
      <div className="pz-lobby-content">{children}</div>
    </div>
  );
}
