import { ArrowLeft, Dice1, Dice2, Dice3, Dice4 } from 'lucide-react';
import type { ComponentType } from 'react';

import { CAMPAIGN_LENGTH, type Difficulty } from '../../engine';
import { loadProgress } from '../../campaign/campaign';
import { useI18n } from '../../net/useI18n';
import { MenuScreen } from '../menu/MenuScreen';

const DIFFICULTIES: { id: Difficulty; icon: ComponentType<{ size?: number }> }[] = [
  { id: 'easy', icon: Dice1 },
  { id: 'normal', icon: Dice2 },
  { id: 'hard', icon: Dice3 },
  { id: 'hardcore', icon: Dice4 },
];

export function CampaignScreen({ onPick, onLeave }: { onPick: (difficulty: Difficulty) => void; onLeave: () => void }) {
  const { t } = useI18n();

  return (
    <MenuScreen variant="pz-campaign-screen" onBack={onLeave} backLabel={t('btn_back')}>
      <h2>{t('campaign')}</h2>
      <p className="pz-tag">{t('campaign_choose_difficulty')}</p>

      <div className="pz-lobby-actions">
        {DIFFICULTIES.map(({ id, icon: Icon }) => {
          const p = loadProgress(id);
          const progressLabel = p.everCompleted
            ? t('campaign_completed_badge')
            : p.tier === 0
              ? t('campaign_not_started')
              : t('campaign_progress', { tier: Math.min(p.tier + 1, CAMPAIGN_LENGTH), total: CAMPAIGN_LENGTH });
          return (
            <button key={id} className="pz-btn big primary pz-difficulty" onClick={() => onPick(id)}>
              <span className="pz-btn-title">
                <Icon size={20} />
                {t(`difficulty_${id}`)}
              </span>
              <small>{t(`difficulty_${id}_desc`)}</small>
              <span className="pz-campaign-pips" aria-label={progressLabel} title={progressLabel}>
                {Array.from({ length: CAMPAIGN_LENGTH }, (_, i) => (
                  <span key={i} className={`pz-campaign-pip ${i < p.tier ? 'on' : ''}`} />
                ))}
              </span>
            </button>
          );
        })}
        <button className="pz-btn big" onClick={onLeave}>
          <span className="pz-btn-title">
            <ArrowLeft size={20} />
            {t('btn_back')}
          </span>
        </button>
      </div>
    </MenuScreen>
  );
}
