import { useState } from 'react';
import { X, ArrowLeftRight } from 'lucide-react';

import { useI18n } from '../../net/useI18n';
import { cardArt, familyForCode } from '../../ui/cardArt';

function HelpCard({ code, title, desc, flip }: { code: string; title: string; desc: string; flip?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '108px' }}>
      <div
        style={{
          position: 'relative',
          width: '88px',
          aspectRatio: '104 / 128',
          backgroundImage: `url(${cardArt(code, familyForCode(code))})`,
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: '38%',
            transform: 'translateY(-50%)',
            fontWeight: 800,
            fontSize: '1.05rem',
            color: '#fff',
            textShadow: '0 1px 4px rgba(0, 0, 0, 0.9)',
          }}
        >
          {code}
        </span>
        {flip ? (
          <span
            style={{
              position: 'absolute',
              bottom: '-7px',
              right: '-7px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '24px',
              height: '24px',
              borderRadius: '6px',
              background: 'rgba(0, 0, 0, 0.7)',
              border: '1px solid var(--accent)',
              color: 'var(--accent-bright)',
              boxShadow: '0 0 10px rgba(26, 178, 140, 0.5)',
            }}
          >
            <ArrowLeftRight size={13} />
          </span>
        ) : null}
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontWeight: 700, color: 'var(--text-bright)', fontSize: '0.82rem', letterSpacing: '0.03em' }}>{title}</div>
        <div style={{ fontSize: '0.74rem', opacity: 0.8, lineHeight: 1.3, marginTop: '2px' }}>{desc}</div>
      </div>
    </div>
  );
}

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
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                flexWrap: 'wrap',
                gap: '20px',
                margin: '14px 0 4px',
                padding: '16px 12px',
                background: 'rgba(0, 0, 0, 0.25)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
              }}
            >
              <HelpCard code="+3" title={t('help_card_plus')} desc={t('help_card_plus_desc')} />
              <HelpCard code="-2" title={t('help_card_minus')} desc={t('help_card_minus_desc')} />
              <HelpCard code="±4" title={t('help_card_flip')} desc={t('help_card_flip_desc')} flip />
            </div>

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
