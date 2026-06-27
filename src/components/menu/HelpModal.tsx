import { X } from 'lucide-react';

import { useI18n } from '../../net/useI18n';

export function HelpModal({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  return (
    <div className="pz-modal-overlay" onClick={onClose}>
      <div className="pz-modal-card pz-help-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pz-modal-header">
          <h3>{t('help_title')}</h3>
          <button className="pz-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="pz-modal-body pz-help-body">
          <p>{t('help_p1')}</p>

          <h4>{t('help_h1')}</h4>
          <p>{t('help_p2')}</p>

          <h4>{t('help_h2')}</h4>
          <ul>
            <li>{t('help_li1')}</li>
            <li>{t('help_li2')}</li>
            <li>{t('help_li3')}</li>
          </ul>

          <h4>{t('help_h3')}</h4>
          <p>{t('help_p3')}</p>

          <h4>{t('help_h4')}</h4>
          <ul>
            <li>{t('help_li4')}</li>
            <li>{t('help_li5')}</li>
            <li>{t('help_li6')}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
