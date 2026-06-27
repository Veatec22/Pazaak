import type { CardPool } from '../../engine';
import { useI18n } from '../../net/useI18n';
import { Board } from '../../ui/Board';
import { useSinglePlayerMatch } from '../../ui/useSinglePlayerMatch';
import { LeaveButton } from '../menu/LeaveButton';

/** A one-off quick match vs a random-tier bot, with the chosen card pool. */
export function QuickGame({ pool, onLeave }: { pool: CardPool; onLeave: () => void }) {
  const { t } = useI18n();
  const controller = useSinglePlayerMatch({ pool }); // random opponent tier

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
      <LeaveButton onLeave={onLeave} />
      <Board controller={{ ...controller, endSlot }} />
    </>
  );
}
