import { ArrowLeft, Copy, Share2 } from 'lucide-react';
import { useState } from 'react';

import { useI18n } from '../../net/useI18n';
import { MenuScreen } from './MenuScreen';

export function WaitingRoom({ roomId, onLeave }: { roomId: string; onLeave: () => void }) {
  const { t } = useI18n();
  const url = `${location.origin}${location.pathname}#room=${roomId}`;
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const copy = (text: string, mark: (v: boolean) => void) => {
    void navigator.clipboard?.writeText(text).then(() => {
      mark(true);
      setTimeout(() => mark(false), 2000);
    });
  };

  const share = () => {
    if (navigator.share) void navigator.share({ title: 'Pazaak', text: 'Join my pazaak game', url }).catch(() => {});
    else copy(url, setCopiedLink);
  };

  const canShare = typeof navigator !== 'undefined' && !!navigator.share;

  return (
    <MenuScreen variant="pz-waiting-room" topBar={false} onBack={onLeave} backLabel={t('btn_cancel')}>
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
              <button className="pz-btn" onClick={() => copy(roomId, setCopiedCode)}>
                <Copy size={14} style={{ marginRight: '6px' }} />
                {copiedCode ? t('btn_copied') : t('btn_copy')}
              </button>
            </div>
          </div>

          <div className="pz-waiting-field">
            <label>{t('invite_link')}</label>
            <div className="pz-input-row">
              <input readOnly value={url} className="pz-share-url" onFocus={(e) => e.currentTarget.select()} />
              <button className="pz-btn" onClick={() => copy(url, setCopiedLink)}>
                <Copy size={14} style={{ marginRight: '6px' }} />
                {copiedLink ? t('btn_copied') : t('btn_copy')}
              </button>
            </div>
          </div>
        </div>

        <div className="pz-waiting-actions">
          {canShare ? (
            <button className="pz-btn primary" onClick={share}>
              <Share2 size={16} style={{ marginRight: '8px' }} />
              {t('btn_share_link')}
            </button>
          ) : null}
          <button className="pz-btn" onClick={onLeave}>
            <ArrowLeft size={16} style={{ marginRight: '8px' }} />
            {t('btn_cancel')}
          </button>
        </div>
      </div>
    </MenuScreen>
  );
}
