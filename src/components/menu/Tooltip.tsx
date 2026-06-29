import { useState, type ReactNode } from 'react';

export function Tooltip({ content, children }: { content: string; children: ReactNode }) {
  const [dismissedByClick, setDismissedByClick] = useState(false);

  if (!content) return <>{children}</>;
  return (
    <div
      className={`pz-tooltip-wrapper ${dismissedByClick ? 'is-click-dismissed' : ''}`}
      onClick={() => setDismissedByClick(true)}
      onPointerLeave={() => setDismissedByClick(false)}
      onBlur={() => setDismissedByClick(false)}
    >
      {children}
      <div className="pz-tooltip-bubble" role="tooltip">
        {content}
      </div>
    </div>
  );
}
