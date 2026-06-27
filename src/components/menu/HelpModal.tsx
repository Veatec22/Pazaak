import { useState } from 'react';
import { X } from 'lucide-react';

import { useI18n } from '../../net/useI18n';

export function HelpModal({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<'rules' | 'about' | 'license'>('rules');

  const MIT_LICENSE = `MIT License

Copyright (c) 2026 Veatec22

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`;

  return (
    <div className="pz-modal-overlay" onClick={onClose}>
      <div className="pz-modal-card pz-help-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pz-modal-header" style={{ marginBottom: '12px', borderBottom: 'none', paddingBottom: '0' }}>
          <h3>{t('help_title')}</h3>
          <button className="pz-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="pz-modal-tabs" style={{ display: 'flex', justifyContent: 'center', gap: '16px', borderBottom: '1px solid var(--border)', marginBottom: '16px' }}>
          <button
            className={`pz-tab-btn ${activeTab === 'rules' ? 'active' : ''}`}
            onClick={() => setActiveTab('rules')}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'rules' ? '3px solid #1ab28c' : '3px solid transparent',
              color: activeTab === 'rules' ? 'var(--text-bright)' : 'var(--text)',
              padding: '8px 4px',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.9rem',
              transition: 'all 0.2s',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              outline: 'none'
            }}
          >
            {t('tab_rules')}
          </button>
          <button
            className={`pz-tab-btn ${activeTab === 'about' ? 'active' : ''}`}
            onClick={() => setActiveTab('about')}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'about' ? '3px solid #1ab28c' : '3px solid transparent',
              color: activeTab === 'about' ? 'var(--text-bright)' : 'var(--text)',
              padding: '8px 4px',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.9rem',
              transition: 'all 0.2s',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              outline: 'none'
            }}
          >
            {t('tab_about')}
          </button>
          <button
            className={`pz-tab-btn ${activeTab === 'license' ? 'active' : ''}`}
            onClick={() => setActiveTab('license')}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'license' ? '3px solid #1ab28c' : '3px solid transparent',
              color: activeTab === 'license' ? 'var(--text-bright)' : 'var(--text)',
              padding: '8px 4px',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.9rem',
              transition: 'all 0.2s',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              outline: 'none'
            }}
          >
            {t('tab_license')}
          </button>
        </div>

        {activeTab === 'rules' && (
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
        )}

        {activeTab === 'about' && (
          <div className="pz-modal-body pz-help-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p>{t('about_p1')}</p>
            
            <h4 style={{ margin: '12px 0 4px', color: '#1ab28c', fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
              {t('about_legal_title')}
            </h4>
            <p style={{ fontSize: '0.9rem', opacity: 0.85, lineHeight: 1.5 }}>{t('about_legal')}</p>
          </div>
        )}

        {activeTab === 'license' && (
          <div className="pz-modal-body pz-help-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p>{t('license_intro')}</p>
            <pre style={{
              whiteSpace: 'pre-wrap',
              fontFamily: 'monospace',
              fontSize: '0.78rem',
              opacity: 0.8,
              background: 'rgba(0, 0, 0, 0.4)',
              padding: '12px',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              margin: 0,
              lineHeight: 1.4,
              color: 'var(--text-bright)'
            }}>
              {MIT_LICENSE}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
