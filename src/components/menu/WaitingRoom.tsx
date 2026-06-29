import { ArrowLeft, Copy, Share2 } from 'lucide-react';
import { useState } from 'react';

import { useI18n } from '../../net/useI18n';

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
    if (navigator.share) void navigator.share({ title: 'Pazaak', text: t('share_message'), url }).catch(() => {});
    else copy(url, setCopiedLink);
  };

  const canShare = typeof navigator !== 'undefined' && !!navigator.share;

  return (
    <div className="pz-modal-overlay" onClick={onLeave}>
      <div className="pz-modal-card" style={{ maxWidth: '420px', textAlign: 'left' }} onClick={(e) => e.stopPropagation()}>
        <div className="pz-modal-header" style={{ borderBottom: 'none', paddingBottom: '0', marginBottom: '8px' }}>
          <h3>{t('room_created')}</h3>
        </div>

        <div className="pz-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '12px 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="pz-pulse-dot" style={{ display: 'inline-block', width: '8px', height: '8px', background: '#1ab28c', borderRadius: '50%', boxShadow: '0 0 8px #1ab28c' }} />
            <span style={{ fontSize: '1rem', color: 'var(--text-bright)', fontWeight: 600 }}>{t('waiting_opponent')}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.78rem', opacity: 0.7, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t('room_code')}</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input readOnly value={roomId} className="pz-share-url" style={{ flex: 1, padding: '8px 12px', background: 'rgba(0, 0, 0, 0.4)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-bright)', fontSize: '0.9rem', fontFamily: 'monospace' }} />
                <button className="pz-btn" onClick={() => copy(roomId, setCopiedCode)}>
                  <Copy size={14} style={{ marginRight: '6px' }} />
                  {copiedCode ? t('btn_copied') : t('btn_copy')}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.78rem', opacity: 0.7, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t('invite_link')}</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input readOnly value={url} className="pz-share-url" style={{ flex: 1, padding: '8px 12px', background: 'rgba(0, 0, 0, 0.4)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-bright)', fontSize: '0.9rem' }} onFocus={(e) => e.currentTarget.select()} />
                <button className="pz-btn" onClick={() => copy(url, setCopiedLink)}>
                  <Copy size={14} style={{ marginRight: '6px' }} />
                  {copiedLink ? t('btn_copied') : t('btn_copy')}
                </button>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            {canShare ? (
              <button className="pz-btn primary" style={{ flex: 1 }} onClick={share}>
                <Share2 size={16} style={{ marginRight: '6px' }} />
                {t('btn_share_link')}
              </button>
            ) : null}
            <button className="pz-btn" style={{ flex: 1 }} onClick={onLeave}>
              <ArrowLeft size={16} style={{ marginRight: '6px' }} />
              {t('btn_cancel')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
