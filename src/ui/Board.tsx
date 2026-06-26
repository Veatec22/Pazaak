import { useState } from 'react';

import type { Seat } from '../engine';
import { cardArt, CARD_BACK, familyForCode } from './cardArt';
import type { DisplayCard, MatchController } from './controller';
import { primePazaakSounds } from './sounds';
import { useI18n } from '../net/useI18n';
import { TopBar } from '../Lobby';
import './board.css';

const SEATS: Seat[] = [0, 1];
const TABLE_SLOTS = Array.from({ length: 9 }, (_, i) => i);

export function Board({ controller }: { controller: MatchController }) {
  const {
    display,
    view,
    mySeat,
    activeSeat,
    banner,
    busy,
    finished,
    status,
    online,
    vsBot,
    connection,
    act,
    reset,
  } = controller;
  const [activeOption, setActiveOption] = useState<Record<number, number>>({});
  const { t } = useI18n();

  const dropped = online && connection === 'disconnected';
  const waiting = online && connection === 'connecting' && !view;

  const yourTurn = !!view?.your_turn && !busy && !finished;
  const canPlayHand = yourTurn && !view!.you.played_this_turn;
  const playableHand = new Set(
    (yourTurn ? view!.legal_actions : [])
      .filter((a) => a.type === 'play' && a.hand_index != null)
      .map((a) => a.hand_index as number),
  );

  function play(handIndex: number) {
    if (!canPlayHand || !playableHand.has(handIndex)) return;
    primePazaakSounds();
    act({ type: 'play', hand_index: handIndex, option_index: activeOption[handIndex] ?? 0 });
    setActiveOption({});
  }

  const subtitle = (() => {
    if (online) {
      const turn = finished ? '' : busy ? '…' : view?.your_turn ? t('your_turn') : t('opponents_turn');
      return [t(status), turn].filter(Boolean).join(' · ');
    }
    if (vsBot) {
      const turn = finished ? '' : busy ? '…' : view?.your_turn ? t('your_turn') : t('opponents_turn');
      return [`Set ${display.setNumber}`, turn].filter(Boolean).join(' · ');
    }
    const setSubtitle = t('pass_and_play_subtitle', { set: display.setNumber });
    const moveSubtitle = finished ? '' : ` · ${t('player_to_move', { player: mySeat + 1 })}`;
    return `${setSubtitle}${moveSubtitle}`;
  })();

  return (
    <div className="pz-root" onPointerDown={primePazaakSounds}>
      <TopBar />
      <header className="pz-header">
        <h1>Pazaak</h1>
        <div className="pz-sub">
          {online ? <span className={`pz-conn ${connection ?? 'connecting'}`} aria-hidden /> : null}
          {subtitle}
        </div>
      </header>

      <div className="pz-tables">
        {SEATS.map((seat) => {
          const active = seat === activeSeat;
          const total = display.totals[seat];
          const label = (online || vsBot)
            ? seat === mySeat
              ? t('you')
              : t('opponent')
            : t('player_seat', { player: seat + 1 });

          const isYou = seat === mySeat;
          const title = isYou ? t('player_hand_title') : t('opponent_hand_title');

          return (
            <section key={seat} className={`pz-player ${active ? 'active' : ''}`}>
              <div className="pz-player-head">
                <span className="pz-pname">{label}</span>
                <div className="pz-pips">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className={`pz-pip ${i < display.scores[seat] ? 'on' : ''}`} />
                  ))}
                </div>
                <span className={`pz-total ${total > 20 ? 'bust' : ''}`}>{total}</span>
              </div>

              <div className="pz-grid">
                {TABLE_SLOTS.map((i) => {
                  const card = display.tables[seat][i];
                  return card ? <TableCard key={card.key} card={card} /> : <div key={i} className="pz-slot" />;
                })}
              </div>

              {display.standing[seat] ? (
                <div className="pz-standing">{t('standing_label')}</div>
              ) : (
                <div className="pz-standing-spacer" />
              )}

              <div className="pz-player-hand-container">
                <div className="pz-hand-title">{title}</div>
                <div className="pz-hand">
                  {[0, 1, 2, 3].map((i) => {
                    if (isYou) {
                      const code = view?.you.hand[i];
                      if (!code) return <div key={i} className="pz-hand-card empty" />;
                      const options = view!.you.hand_options[i] ?? [code];
                      const opt = activeOption[i] ?? 0;
                      const label = options[opt];
                      const playable = seat === activeSeat && canPlayHand && playableHand.has(i);
                      return (
                        <div key={i} className="pz-hand-slot">
                          <div
                            className={`pz-hand-card ${playable ? 'playable' : ''}`}
                            style={{ backgroundImage: `url(${cardArt(label, familyForCode(code))})` }}
                            onClick={() => play(i)}
                            title={label}
                          >
                            <span>{label}</span>
                          </div>
                          {options.length > 1 ? (
                            <button
                              className="pz-flip"
                              disabled={!canPlayHand}
                              onClick={() => setActiveOption((p) => ({ ...p, [i]: ((p[i] ?? 0) + 1) % options.length }))}
                              title={t('flip_card')}
                            >
                              ⇅
                            </button>
                          ) : null}
                        </div>
                      );
                    } else {
                      const oppHandSize = view?.opponent.hand_size ?? 4;
                      if (i < oppHandSize) {
                        return (
                          <div key={i} className="pz-hand-slot">
                            <div
                              className="pz-hand-card facedown"
                              style={{ backgroundImage: `url(${CARD_BACK})` }}
                            />
                          </div>
                        );
                      }
                      return <div key={i} className="pz-hand-card empty" />;
                    }
                  })}
                </div>
              </div>
            </section>
          );
        })}
      </div>

      { }
      <div className="pz-hand-area">
        <div className="pz-actions">
          <button className="pz-btn" disabled={!yourTurn} onClick={() => act({ type: 'end_turn' })}>
            {t('btn_end_turn')}
          </button>
          <button className="pz-btn primary" disabled={!yourTurn} onClick={() => act({ type: 'stand' })}>
            {t('btn_stand')}
          </button>
          {finished && reset ? (
            <button className="pz-btn" onClick={reset}>
              {t('btn_new_match')}
            </button>
          ) : null}
        </div>
      </div>

      {banner ? (
        <div className={`pz-banner ${banner.kind}`}>
          <div>{banner.text}</div>
          {banner.kind === 'match' && reset ? (
            <button className="pz-btn primary" onClick={reset}>
              {t('btn_play_again')}
            </button>
          ) : null}
        </div>
      ) : null}

      {dropped ? (
        <div className="pz-overlay">
          <div className="pz-spinner" />
          <div>{t(status)}</div>
          <small>{t('reconnect_warning')}</small>
        </div>
      ) : waiting ? (
        <div className="pz-overlay light">
          <div className="pz-spinner" />
          <div>{t(status)}</div>
        </div>
      ) : null}
    </div>
  );
}

function TableCard({ card }: { card: DisplayCard }) {
  return (
    <div className="pz-card" style={{ backgroundImage: `url(${cardArt(card.label, card.family)})` }}>
      <span>{card.label}</span>
    </div>
  );
}
