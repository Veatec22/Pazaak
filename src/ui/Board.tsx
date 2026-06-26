import { useState } from 'react';

import type { Seat } from '../engine';
import { tableCardArt } from './cardArt';
import type { DisplayCard, MatchController } from './controller';
import { primePazaakSounds } from './sounds';
import './board.css';

const SEATS: Seat[] = [0, 1];
const TABLE_SLOTS = Array.from({ length: 9 }, (_, i) => i);

export function Board({ controller }: { controller: MatchController }) {
  const { display, view, mySeat, activeSeat, banner, busy, finished, status, online, connection, act, reset } =
    controller;
  const [activeOption, setActiveOption] = useState<Record<number, number>>({});

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
      const turn = finished ? '' : busy ? '…' : view?.your_turn ? 'Your turn' : "Opponent's turn";
      return [status, turn].filter(Boolean).join(' · ');
    }
    return `Set ${display.setNumber} · hot-seat (pass & play)${finished ? '' : ` · Player ${mySeat + 1} to move`}`;
  })();

  return (
    <div className="pz-root" onPointerDown={primePazaakSounds}>
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
          const label = online ? (seat === mySeat ? 'You' : 'Opponent') : `Player ${seat + 1}`;
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

              {display.standing[seat] ? <div className="pz-standing">STANDING</div> : <div className="pz-standing-spacer" />}
            </section>
          );
        })}
      </div>

      {/* Local seat's hand (online: always yours; hot-seat: the seat to move). */}
      <div className="pz-hand-area">
        <div className="pz-hand">
          {[0, 1, 2, 3].map((i) => {
            const code = view?.you.hand[i];
            if (!code) return <div key={i} className="pz-hand-card empty" />;
            const options = view!.you.hand_options[i] ?? [code];
            const opt = activeOption[i] ?? 0;
            const label = options[opt];
            const playable = canPlayHand && playableHand.has(i);
            return (
              <div key={i} className="pz-hand-slot">
                <div
                  className={`pz-hand-card ${playable ? 'playable' : ''}`}
                  style={{ backgroundImage: `url(${tableCardArt(label)})` }}
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
                    title="Flip card"
                  >
                    ⇅
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="pz-actions">
          <button className="pz-btn" disabled={!yourTurn} onClick={() => act({ type: 'end_turn' })}>
            End Turn
          </button>
          <button className="pz-btn primary" disabled={!yourTurn} onClick={() => act({ type: 'stand' })}>
            Stand
          </button>
          {finished && reset ? (
            <button className="pz-btn" onClick={reset}>
              New Match
            </button>
          ) : null}
        </div>
      </div>

      {banner ? (
        <div className={`pz-banner ${banner.kind}`}>
          <div>{banner.text}</div>
          {banner.kind === 'match' && reset ? (
            <button className="pz-btn primary" onClick={reset}>
              Play again
            </button>
          ) : null}
        </div>
      ) : null}

      {dropped ? (
        <div className="pz-overlay">
          <div className="pz-spinner" />
          <div>{status}</div>
          <small>The match resumes automatically when they reconnect.</small>
        </div>
      ) : waiting ? (
        <div className="pz-overlay light">
          <div className="pz-spinner" />
          <div>{status}</div>
        </div>
      ) : null}
    </div>
  );
}

function TableCard({ card }: { card: DisplayCard }) {
  return (
    <div className="pz-card" style={{ backgroundImage: `url(${tableCardArt(card.label)})` }}>
      <span>{card.label}</span>
    </div>
  );
}
