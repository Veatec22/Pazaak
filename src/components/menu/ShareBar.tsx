import { Copy, Share2 } from 'lucide-react';
import { useState } from 'react';

import { useI18n } from '../../net/useI18n';

/** Slim in-game invite bar shown to the host while a match is live. */
export function ShareBar({ roomId }: { roomId: string }) {
  const { t } = useI18n();
  const url = `${location.origin}${location.pathname}#room=${roomId}`;
  const [copied, setCopied] = useState(false);

  const copy = () => {
    void navigator.clipboard?.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const share = () => {
    if (navigator.share) void navigator.share({ title: 'Pazaak', text: 'Join my pazaak game', url }).catch(() => {});
    else copy();
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
