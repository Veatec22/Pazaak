import type { ReactNode } from 'react';

export function Tooltip({ content, children }: { content: string; children: ReactNode }) {
  if (!content) return <>{children}</>;
  return (
    <div className="pz-tooltip-wrapper">
      {children}
      <div className="pz-tooltip-bubble" role="tooltip">
        {content}
      </div>
    </div>
  );
}
