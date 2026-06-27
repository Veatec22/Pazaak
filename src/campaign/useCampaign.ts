import { useCallback, useEffect, useState } from 'react';

import { CAMPAIGN_LENGTH, type Difficulty } from '../engine';
import { applyResult, type CampaignProgress, isComplete, loadProgress, restarted, saveProgress } from './campaign';

export interface Campaign {
  progress: CampaignProgress;
    tier: number;
  complete: boolean;
  length: number;
    record: (won: boolean) => void;
    restart: () => void;
}

export function useCampaign(difficulty: Difficulty): Campaign {
  const [progress, setProgress] = useState<CampaignProgress>(() => loadProgress(difficulty));

  useEffect(() => {
    setProgress(loadProgress(difficulty));
  }, [difficulty]);

  const record = useCallback(
    (won: boolean) =>
      setProgress((p) => {
        const next = applyResult(p, won, difficulty);
        saveProgress(difficulty, next);
        return next;
      }),
    [difficulty],
  );

  const restart = useCallback(
    () =>
      setProgress((p) => {
        const next = restarted(p);
        saveProgress(difficulty, next);
        return next;
      }),
    [difficulty],
  );

  return {
    progress,
    tier: progress.tier,
    complete: isComplete(progress),
    length: CAMPAIGN_LENGTH,
    record,
    restart,
  };
}
