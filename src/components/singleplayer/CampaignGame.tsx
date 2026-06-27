import { useState } from 'react';

import { CAMPAIGN_LENGTH, type Difficulty, DIFFICULTY_POOL } from '../../engine';
import { useCampaign } from '../../campaign/useCampaign';
import { useI18n } from '../../net/useI18n';
import { Board } from '../../ui/Board';
import { useSinglePlayerMatch } from '../../ui/useSinglePlayerMatch';

import { MenuScreen } from '../menu/MenuScreen';

const clampTier = (t: number) => Math.min(Math.max(t, 0), CAMPAIGN_LENGTH - 1);

export function CampaignGame({ difficulty, onLeave }: { difficulty: Difficulty; onLeave: () => void }) {
  const campaign = useCampaign(difficulty);
  const [tier, setTier] = useState(() => clampTier(campaign.tier));
  const [matchKey, setMatchKey] = useState(0);
  const [phase, setPhase] = useState<'play' | 'complete'>(() => (campaign.complete ? 'complete' : 'play'));

  if (phase === 'complete') {
    return (
      <CampaignComplete
        difficulty={difficulty}
        onRestart={() => {
          campaign.restart();
          setTier(0);
          setMatchKey((k) => k + 1);
          setPhase('play');
        }}
        onLeave={onLeave}
      />
    );
  }

  return (
    <CampaignMatch
      key={matchKey}
      difficulty={difficulty}
      tier={tier}
      total={campaign.length}
      onResolved={campaign.record}
      onContinue={() => {
        setTier(clampTier(campaign.tier));
        setMatchKey((k) => k + 1);
      }}
      onComplete={() => setPhase('complete')}
      onLeave={onLeave}
    />
  );
}

function CampaignMatch({
  difficulty,
  tier,
  total,
  onResolved,
  onContinue,
  onComplete,
  onLeave,
}: {
  difficulty: Difficulty;
  tier: number;
  total: number;
  onResolved: (won: boolean) => void;
  onContinue: () => void;
  onComplete: () => void;
  onLeave: () => void;
}) {
  const { t } = useI18n();
  const [result, setResult] = useState<boolean | null>(null);
  const controller = useSinglePlayerMatch({
    pool: DIFFICULTY_POOL[difficulty],
    tierIndex: tier,
    onResult: (won) => {
      setResult(won);
      onResolved(won);
    },
  });

  const isLast = tier >= total - 1;
  const endSlot =
    result === null ? undefined : (
      <>
        {result && isLast ? (
          <button className="pz-btn primary" onClick={onComplete}>
            {t('campaign_complete_title')}
          </button>
        ) : (
          <button className="pz-btn primary" onClick={onContinue}>
            {result ? t('btn_next_opponent') : t('btn_retry')}
          </button>
        )}
        <button className="pz-btn" onClick={onLeave}>
          {t('btn_menu')}
        </button>
      </>
    );

  return (
    <>
      <div className="pz-sp-tier">{t('campaign_opponent', { tier: tier + 1, total })}</div>
      <Board controller={{ ...controller, endSlot }} onForfeit={onLeave} />
    </>
  );
}

function CampaignComplete({
  difficulty,
  onRestart,
  onLeave,
}: {
  difficulty: Difficulty;
  onRestart: () => void;
  onLeave: () => void;
}) {
  const { t } = useI18n();
  return (
    <MenuScreen variant="pz-campaign-complete" onBack={onLeave} backLabel={t('btn_menu')}>
      <div className="pz-icon-container">
        <h1>{t('campaign_complete_title')}</h1>
      </div>
      <p className="pz-tag">{t('campaign_complete_msg', { difficulty: t(`difficulty_${difficulty}`) })}</p>
      <div className="pz-lobby-actions">
        <button className="pz-btn primary big" onClick={onRestart}>
          {t('btn_restart')}
        </button>
        <button className="pz-btn big" onClick={onLeave}>
          {t('btn_menu')}
        </button>
      </div>
    </MenuScreen>
  );
}
