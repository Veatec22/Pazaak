import { getCompanion } from '../../companions/companions';
import type { CardPool } from '../../engine';
import { useI18n } from '../../net/useI18n';
import { Board } from '../../ui/Board';
import { useSinglePlayerMatch } from '../../ui/useSinglePlayerMatch';


export function QuickGame({ pool, companionId, onLeave }: { pool: CardPool; companionId?: string; onLeave: () => void }) {
  const { t } = useI18n();
  const companion = getCompanion(companionId);
  const controller = useSinglePlayerMatch({ pool, companion });

  const endSlot = (
    <>
      <button className="pz-btn primary" onClick={controller.reset}>
        {t('btn_new_match')}
      </button>
      <button className="pz-btn" onClick={onLeave}>
        {t('btn_menu')}
      </button>
    </>
  );

  return (
    <>
      <Board controller={{ ...controller, endSlot }} onForfeit={onLeave} />
    </>
  );
}
