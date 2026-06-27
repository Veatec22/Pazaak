import { Flame, Shield, Skull, Swords } from 'lucide-react';
import type { ComponentType } from 'react';

import { CAMPAIGN_LENGTH, type Difficulty } from '../../engine';
import { loadProgress } from '../../campaign/campaign';
import { useI18n } from '../../net/useI18n';
import { MenuScreen } from '../menu/MenuScreen';

const DIFFICULTIES: { id: Difficulty; icon: ComponentType<{ size?: number }> }[] = [
  { id: 'easy', icon: Shield },
  { id: 'normal', icon: Swords },
  { id: 'hard', icon: Flame },
  { id: 'hardcore', icon: Skull },
];

/** Pick a campaign difficulty; each card shows its saved progress. */
export function CampaignScreen({ onPick, onLeave }: { onPick: (difficulty: Difficulty) => void; onLeave: () => void }) {
  const { t } = useI18n();

  return (
    <MenuScreen variant="pz-campaign-screen" onBack={onLeave} backLabel={t('btn_back')}>
      <h2>{t('campaign')}</h2>
      <p className="pz-tag">{t('campaign_choose_difficulty')}</p>

      <div className="pz-lobby-actions">
        {DIFFICULTIES.map(({ id, icon: Icon }) => {
          const p = loadProgress(id);
          const progress = p.everCompleted
            ? t('campaign_completed_badge')
            : p.tier === 0
              ? t('campaign_not_started')
              : t('campaign_progress', { tier: Math.min(p.tier + 1, CAMPAIGN_LENGTH), total: CAMPAIGN_LENGTH });
          return (
            <button key={id} className="pz-btn big pz-difficulty" onClick={() => onPick(id)}>
              <span className="pz-btn-title">
                <Icon size={20} />
                {t(`difficulty_${id}`)}
              </span>
              <small>{t(`difficulty_${id}_desc`)}</small>
              <span className={`pz-diff-progress ${p.everCompleted ? 'done' : ''}`}>{progress}</span>
            </button>
          );
        })}
      </div>
    </MenuScreen>
  );
}
