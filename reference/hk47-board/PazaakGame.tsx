import { useEffect, useRef, useState } from 'react';

import { playUiSound, primeUiSounds } from '../../audio/uiSounds';
import {
  abandonPazaakGame,
  createPazaakGame,
  sendPazaakAction,
  type PazaakAction,
  type PazaakEvent,
  type PazaakState,
} from '../../api/pazaak';
import { CARD_BACK, tableCardArt } from './assets';
import { box, RAW } from './layout';
import { playPazaakSound, primePazaakSounds } from './sounds';
import './pazaak.css';

const PANEL = '/pazaak/panels/pnl_pazaakgam_pc.png';
const TURN_LIGHT = '/pazaak/bits/pz_playerliteon.png';

// HK-47 has no synthesized voice yet (a later, bonus step) — a text barb stands in.
const WIN_LINES = [
  'Statement: Improbable. Your victory is a statistical anomaly I will not repeat.',
  'Concession: You won, meatbag. Savour it; such moments are rare for your kind.',
];
const LOSS_LINES = [
  'Mockery: Another flawless calculation. Your defeat was never in question, meatbag.',
  'Statement: I have crushed you utterly. It was deeply satisfying.',
];

interface DisplayCard {
  key: string;
  label: string;
}

interface Display {
  tables: [DisplayCard[], DisplayCard[]];
  totals: [number, number];
  standing: [boolean, boolean];
  score: { you: number; opponent: number };
  setNumber: number;
}

const EMPTY: Display = {
  tables: [[], []],
  totals: [0, 0],
  standing: [false, false],
  score: { you: 0, opponent: 0 },
  setNumber: 1,
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
let cardSeq = 0;

export function PazaakGame({ onClose }: { onClose: () => void }) {
  const [display, setDisplay] = useState<Display>(EMPTY);
  const [view, setView] = useState<PazaakState | null>(null);
  const [banner, setBanner] = useState<{ text: string; taunt?: string } | null>(null);
  const [busy, setBusy] = useState(true);
  const [finished, setFinished] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeOption, setActiveOption] = useState<Record<number, number>>({});

  const gameIdRef = useRef<string | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return; // guard StrictMode double-invoke
    startedRef.current = true;
    primeUiSounds();
    primePazaakSounds();
    void (async () => {
      try {
        const game = await createPazaakGame();
        gameIdRef.current = game.game_id;
        await replay(game.opening_events);
        setView(game.state);
        if (game.state.your_turn) playPazaakSound('startturn');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'failed to start pazaak');
      } finally {
        setBusy(false);
      }
    })();
    return () => {
      if (gameIdRef.current) abandonPazaakGame(gameIdRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function appendCard(actor: 0 | 1, label: string, total: number) {
    setDisplay((d) => {
      const tables: [DisplayCard[], DisplayCard[]] = [d.tables[0], d.tables[1]];
      tables[actor] = [...tables[actor], { key: `c${cardSeq++}`, label }];
      const totals: [number, number] = [d.totals[0], d.totals[1]];
      totals[actor] = total;
      return { ...d, tables, totals };
    });
  }

  async function replay(events: PazaakEvent[]) {
    for (const ev of events) {
      switch (ev.type) {
        case 'draw':
          appendCard(ev.actor ?? 0, ev.card ?? '?', ev.total ?? 0);
          playPazaakSound((ev.total ?? 0) > 20 ? 'warnbust' : 'drawmain');
          await sleep(420);
          break;
        case 'play':
          appendCard(ev.actor ?? 0, ev.card ?? '?', ev.total ?? 0);
          playPazaakSound('playside');
          await sleep(420);
          break;
        case 'stand':
          setDisplay((d) => {
            const standing: [boolean, boolean] = [d.standing[0], d.standing[1]];
            standing[ev.actor ?? 0] = true;
            return { ...d, standing };
          });
          playUiSound('click');
          await sleep(260);
          break;
        case 'end_turn':
          await sleep(160);
          break;
        case 'set_over': {
          const won = ev.winner === 'you';
          const tie = ev.winner == null;
          await sleep(280);
          playPazaakSound(won ? 'winset' : tie ? 'drawmain' : 'loseset');
          setBanner({
            text: tie
              ? `Tie ${ev.totals?.you}–${ev.totals?.opponent}. Replaying the set.`
              : `${won ? 'You win the set' : 'HK-47 wins the set'} · ${ev.totals?.you}–${ev.totals?.opponent}`,
          });
          await sleep(1400);
          setDisplay((d) => ({
            tables: [[], []],
            totals: [0, 0],
            standing: [false, false],
            score: {
              you: d.score.you + (won ? 1 : 0),
              opponent: d.score.opponent + (!won && !tie ? 1 : 0),
            },
            setNumber: d.setNumber + 1,
          }));
          setBanner(null);
          await sleep(240);
          break;
        }
        case 'match_over': {
          const won = ev.voice_cue === 'PLAYER_WON';
          playPazaakSound(won ? 'winmatch' : 'losematch');
          const lines = won ? WIN_LINES : LOSS_LINES;
          setBanner({
            text: won ? 'You win the match.' : 'HK-47 wins the match.',
            taunt: lines[Math.floor(Math.random() * lines.length)],
          });
          setFinished(true);
          break;
        }
      }
    }
  }

  async function act(action: PazaakAction) {
    const gameId = gameIdRef.current;
    if (!gameId || busy || finished) return;
    setBusy(true);
    setError(null);
    setActiveOption({});
    try {
      const result = await sendPazaakAction(gameId, action);
      await replay(result.events);
      setView(result.state);
      if (result.state.your_turn) playPazaakSound('startturn');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'action failed');
    } finally {
      setBusy(false);
    }
  }

  const yourTurn = !!view?.your_turn && !busy && !finished;
  const canPlayHand = yourTurn && !view!.you.played_this_turn;
  const playableHand = new Set(
    (yourTurn ? view!.legal_actions : [])
      .filter((a) => a.type === 'play' && a.hand_index != null)
      .map((a) => a.hand_index as number),
  );

  return (
    <div className="pz-overlay" role="dialog" aria-label="Pazaak">
      <div className="pz-stage">
        <button className="pz-leave" onClick={onClose} aria-label="Leave game">
          ✕
        </button>
        <div className="pz-board" style={{ backgroundImage: `url(${PANEL})` }}>
          {/* names + totals */}
          <div className="pz-name" style={box(RAW.LBL_PLRNAME)}>You</div>
          <div className="pz-name pz-right" style={box(RAW.LBL_NPCNAME)}>HK-47</div>
          <div className={`pz-total ${display.totals[0] > 20 ? 'bust' : ''}`} style={box(RAW.LBL_PLRTOTAL)}>
            {display.totals[0]}
          </div>
          <div className={`pz-total ${display.totals[1] > 20 ? 'bust' : ''}`} style={box(RAW.LBL_NPCTOTAL)}>
            {display.totals[1]}
          </div>

          {/* turn lights */}
          {yourTurn ? <img className="pz-light" src={TURN_LIGHT} style={box(RAW.LBL_PLRTURN)} alt="" /> : null}
          {!yourTurn && !finished ? (
            <img className="pz-light" src={TURN_LIGHT} style={box(RAW.LBL_NPCTURN)} alt="" />
          ) : null}

          {/* set-win pips */}
          {[0, 1, 2].map((i) => (
            <div
              key={`ps${i}`}
              className={`pz-pip ${i < display.score.you ? 'on' : ''}`}
              style={box(RAW[`LBL_PLRSCORE${i}`])}
            />
          ))}
          {[0, 1, 2].map((i) => (
            <div
              key={`ns${i}`}
              className={`pz-pip ${i < display.score.opponent ? 'on' : ''}`}
              style={box(RAW[`LBL_NPCSCORE${i}`])}
            />
          ))}

          {/* tables */}
          {display.tables[0].slice(0, 9).map((card, i) => (
            <TableCard key={card.key} card={card} style={box(RAW[`BTN_PLR${i}`])} />
          ))}
          {display.tables[1].slice(0, 9).map((card, i) => (
            <TableCard key={card.key} card={card} style={box(RAW[`BTN_NPC${i}`])} />
          ))}

          {/* player hand + flip controls */}
          {[0, 1, 2, 3].map((i) => {
            const code = view?.you.hand[i];
            if (!code) return null;
            const options = view!.you.hand_options[i] ?? [code];
            const active = activeOption[i] ?? 0;
            const label = options[active];
            const playable = canPlayHand && playableHand.has(i);
            return (
              <div
                key={`h${i}`}
                className={`pz-card pz-hand-card ${playable ? 'playable' : ''}`}
                style={{ ...box(RAW[`BTN_PLRSIDE${i}`]), backgroundImage: `url(${tableCardArt(label)})` }}
                onClick={() => playable && void act({ type: 'play', hand_index: i, option_index: active })}
                title={label}
              >
                <span>{label}</span>
              </div>
            );
          })}
          {[0, 1, 2, 3].map((i) => {
            const code = view?.you.hand[i];
            const options = code ? view!.you.hand_options[i] ?? [] : [];
            if (options.length <= 1) return null;
            return (
              <button
                key={`f${i}`}
                className="pz-flip"
                style={box(RAW[`BTN_FLIP${i}`])}
                disabled={!canPlayHand}
                onClick={() => {
                  playUiSound('click');
                  setActiveOption((prev) => ({ ...prev, [i]: ((prev[i] ?? 0) + 1) % options.length }));
                }}
                title="Flip card"
              >
                ⇅
              </button>
            );
          })}

          {/* opponent hand backs */}
          {[0, 1, 2, 3].map((i) =>
            i < (view?.opponent.hand_size ?? 0) ? (
              <div
                key={`ob${i}`}
                className="pz-card-back"
                style={{ ...box(RAW[`BTN_NPCSIDE${i}`]), backgroundImage: `url(${CARD_BACK})` }}
              />
            ) : null,
          )}

          {/* action buttons */}
          <button
            className="pz-action"
            style={box(RAW.BTN_XTEXT)}
            disabled={!yourTurn}
            onClick={() => void act({ type: 'end_turn' })}
          >
            End Turn
          </button>
          <button
            className="pz-action"
            style={box(RAW.BTN_YTEXT)}
            disabled={!yourTurn}
            onClick={() => void act({ type: 'stand' })}
          >
            Stand
          </button>
          <button className="pz-action forfeit" style={box(RAW.BTN_FORFEITGAME)} onClick={onClose}>
            {finished ? 'Leave' : 'Forfeit Game'}
          </button>

          {banner ? (
            <div className="pz-banner">
              <div>{banner.text}</div>
              {banner.taunt ? <span className="pz-taunt">{banner.taunt}</span> : null}
            </div>
          ) : null}
        </div>
        {error ? <div className="pz-error">{error}</div> : null}
      </div>
    </div>
  );
}

function TableCard({ card, style }: { card: DisplayCard; style: React.CSSProperties }) {
  return (
    <div className="pz-card" style={{ ...style, backgroundImage: `url(${tableCardArt(card.label)})` }}>
      <span>{card.label}</span>
    </div>
  );
}
