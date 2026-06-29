import { Trash2, X } from 'lucide-react';

import { useI18n } from '../../net/useI18n';

export function WipeDataModal({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();

  const wipe = () => {
    try {
      localStorage.clear();
    } catch {
      void 0;
    }
    window.location.replace(window.location.pathname + window.location.search);
  };

  return (
    <div className="pz-modal-overlay" onClick={onClose}>
      <div className="pz-modal-card" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
        <div className="pz-modal-header">
          <h3>{t('settings_wipe')}</h3>
          <button className="pz-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="pz-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '18px', padding: '14px 0 0' }}>
          <p style={{ fontSize: '0.88rem', opacity: 0.85, margin: 0, lineHeight: 1.5 }}>{t('settings_wipe_desc')}</p>
          <span style={{ fontSize: '0.98rem', color: 'var(--text-bright)', fontWeight: 600 }}>{t('settings_wipe_confirm')}</span>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              className="pz-btn"
              style={{ flex: 1, gap: '8px', borderColor: 'rgba(255, 107, 107, 0.6)', color: '#ffd9d6' }}
              onClick={wipe}
            >
              <Trash2 size={16} />
              {t('btn_yes')}
            </button>
            <button className="pz-btn" style={{ flex: 1 }} onClick={onClose}>
              {t('btn_no')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
