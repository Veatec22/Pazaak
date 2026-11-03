import { Fragment, type CSSProperties } from 'react';

import type { Seat } from '../engine';
import { useI18n } from '../net/useI18n';
import { nameFit } from './nameFit';
import type { SetRecord } from './tableMoments';

// The first set's totals appear once the banner has landed, then one set at a time.
const FIRST_SET_MS = 380;
const PER_SET_MS = 280;

const totalState = (total: number) => (total > 20 ? 'bust' : total === 20 ? 'pazaak' : '');

/**
 * The match in review: each set's totals revealed in turn, the winner of each set
 * marked, then the tally of 20s, busts and side cards played.
 */
export function MatchSummary({
  sets,
  seats,
  labels,
}: {
  sets: SetRecord[];
  /** Column order: the viewer's own seat first when there is one. */
  seats: [Seat, Seat];
  labels: Record<Seat, string>;
}) {
  const { t } = useI18n();

  const tally = (count: (set: SetRecord, seat: Seat) => number) =>
    seats.map((seat) => sets.reduce((sum, set) => sum + count(set, seat), 0));
  const stats = [
    { key: 'stat_twenty', values: tally((s, seat) => (s.totals[seat] === 20 ? 1 : 0)) },
    { key: 'stat_bust', values: tally((s, seat) => (s.totals[seat] > 20 ? 1 : 0)) },
    { key: 'stat_side', values: tally((s, seat) => s.sideCards[seat]) },
  ];

  return (
    <div
      className="pz-summary"
      style={{ ['--stats-delay' as string]: `${FIRST_SET_MS + sets.length * PER_SET_MS + 120}ms` } as CSSProperties}
    >
      <span />
      {seats.map((seat) => (
        <span key={seat} className="pz-summary-head">
          <span style={nameFit(labels[seat])}>{labels[seat]}</span>
        </span>
      ))}

      {sets.map((set, i) => (
        <Fragment key={i}>
          <span className="pz-summary-label">
            {t('summary_set')} {i + 1}
          </span>
          {seats.map((seat) => (
            <span
              key={seat}
              className={`pz-summary-score ${set.winner === seat ? 'won' : ''}`}
              style={{ ['--reveal' as string]: `${FIRST_SET_MS + i * PER_SET_MS}ms` } as CSSProperties}
            >
              <span className={`pz-summary-total ${totalState(set.totals[seat])}`}>{set.totals[seat]}</span>
            </span>
          ))}
        </Fragment>
      ))}

      <span className="pz-summary-rule pz-summary-stat" />
      {stats.map(({ key, values }) => (
        <Fragment key={key}>
          <span className="pz-summary-label pz-summary-stat">{t(key)}</span>
          {values.map((value, i) => (
            <span key={i} className="pz-summary-stat pz-summary-value">
              {value}
            </span>
          ))}
        </Fragment>
      ))}
    </div>
  );
}
