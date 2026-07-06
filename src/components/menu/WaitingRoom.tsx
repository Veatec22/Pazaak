import { ArrowLeft, Copy, Share2 } from 'lucide-react';
import { ReactQRCode } from '@lglab/react-qr-code';

import { useI18n } from '../../net/useI18n';
import { inviteUrlForRoom } from '../../navigation';
import { useCopyToClipboard } from '../../ui/clipboard';

const QR_ICON = `${import.meta.env.BASE_URL}brand/icon-192.png`;
const QR_SIZE = 184;
const QR_ICON_SIZE = 38;

export function WaitingRoom({ roomId, onLeave }: { roomId: string; onLeave: () => void }) {
  const { t } = useI18n();
  const url = inviteUrlForRoom(roomId);
  const [copiedLink, copy] = useCopyToClipboard();

  const share = () => {
    if (navigator.share) void navigator.share({ title: 'Pazaak', text: t('share_message'), url }).catch(() => {});
    else copy(url);
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

          <div className="pz-invite-qr-panel">
            <div className="pz-invite-qr" data-testid="invite-qr" data-value={url}>
              <ReactQRCode
                value={url}
                size={QR_SIZE}
                level="H"
                marginSize={4}
                background="#f7fffb"
                dataModulesSettings={{ color: '#07130f', style: 'rounded' }}
                finderPatternOuterSettings={{ color: '#07130f', style: 'rounded' }}
                finderPatternInnerSettings={{ color: '#1ab28c', style: 'rounded' }}
                imageSettings={{
                  src: QR_ICON,
                  width: QR_ICON_SIZE,
                  height: QR_ICON_SIZE,
                  excavate: true,
                }}
                svgProps={{ role: 'img', 'aria-label': t('invite_qr_label') }}
              />
            </div>
            <div className="pz-invite-qr-caption">{t('scan_qr_to_join')}</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.78rem', opacity: 0.7, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t('invite_link')}</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input readOnly value={url} className="pz-share-url" style={{ flex: 1, padding: '8px 12px', background: 'rgba(0, 0, 0, 0.4)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-bright)', fontSize: '0.9rem' }} onFocus={(e) => e.currentTarget.select()} />
                <button className="pz-btn" onClick={() => copy(url)}>
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
