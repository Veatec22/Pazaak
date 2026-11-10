import { useState, useEffect, useLayoutEffect, useRef, type AnimationEvent, type CSSProperties } from 'react';
import { X, Copy, Share2, ArrowLeft, SkipForward, Lock, Flag, ArrowLeftRight } from 'lucide-react';

import type { Seat } from '../engine';
import { cardArt, CARD_BACK, familyForCode } from './cardArt';
import type { DisplayCard, MatchController } from './controller';
import { primePazaakSounds } from './sounds';
import { onCompanionVoice } from './companionVoice';
import { buzz } from './haptics';
import { nameFit } from './nameFit';
import { useI18n } from '../net/useI18n';
import { inviteUrlForRoom } from '../navigation';
import { useCopyToClipboard } from './clipboard';
import { RollingTotal } from './RollingTotal';
import { preloadCardArt } from './bakedCards';
import { GoldShower } from './GoldShower';
import { MatchSummary } from './MatchSummary';
import { ShuffleDeck } from './ShuffleDeck';
import { useMatchRecord, useTableMoments } from './tableMoments';
import { TopBar } from '../Lobby';
import './board.css';

const SEATS: Seat[] = [0, 1];
const TABLE_SLOTS = Array.from({ length: 9 }, (_, i) => i);
const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)';
// The dark rim traced around card art; mirrors --pz-card-edge in board.surface.css.
const CARD_EDGE =
  'drop-shadow(0.5px 0 0 rgba(22, 13, 6, 0.85)) drop-shadow(-0.5px 0 0 rgba(22, 13, 6, 0.85)) drop-shadow(0 0.5px 0 rgba(22, 13, 6, 0.85)) drop-shadow(0 -0.5px 0 rgba(22, 13, 6, 0.85))';
// Cards already on the table when the board mounts appear in place instead of flying.
const FLIGHT_SETTLE_MS = 300;

/**
 * Where a side card leaves from: the clicked hand card, or the hand slot the opponent
 * played from. Face-down origins turn the card over on the way.
 */
interface FlightOrigin {
  cx: number;
  cy: number;
  height?: number;
  faceDown?: boolean;
}

function originOf(el: Element | null | undefined, faceDown?: boolean): FlightOrigin | undefined {
  if (!el) return undefined;
  const rect = el.getBoundingClientRect();
  return { cx: rect.left + rect.width / 2, cy: rect.top + rect.height / 2, height: rect.height, faceDown };
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function Board({
  controller,
  onForfeit,
  roomId,
  isHost,
  contextDetail,
}: {
  controller: MatchController;
  onForfeit?: () => void;
  roomId?: string;
  isHost?: boolean;
  contextDetail?: string;
}) {
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
    opponentCompanion,
    connection,
    act,
    reset,
    endSlot,
    handDealAnimation = true,
    handSwapAnimation = false,
  } = controller;
  const [activeOption, setActiveOption] = useState<Record<number, number>>({});
  const [showForfeitConfirm, setShowForfeitConfirm] = useState(false);
  const [knownHands, setKnownHands] = useState<Partial<Record<Seat, Array<string | undefined>>>>({});
  const handEls = useRef<Partial<Record<Seat, HTMLDivElement | null>>>({});
  const gridEls = useRef<Partial<Record<Seat, HTMLDivElement | null>>>({});
  const playedFrom = useRef<Partial<Record<Seat, { at: number; origin: FlightOrigin }>>>({});
  const [mountedAt] = useState(() => performance.now());
  const { t } = useI18n();
  const { moments, leaving, decidedBy } = useTableMoments(display);
  const setRecords = useMatchRecord(display);
  const bustIds = moments.map((m) => (m?.kind === 'bust' ? m.id : 0)).join(',');

  // The win shower's art, fetched ahead so its first frame is already baked.
  useEffect(() => preloadCardArt('pcards_gold_p', 'pcards_back_p'), []);

  // Going over 20 jolts the cards on that seat's table, in step with the red flash.
  useEffect(() => {
    if (prefersReducedMotion()) return;
    moments.forEach((moment, seat) => {
      const grid = gridEls.current[seat as Seat];
      if (moment?.kind !== 'bust' || !grid || typeof grid.animate !== 'function') return;
      grid.animate(
        [
          { transform: 'translate(0, 0)' },
          { transform: 'translate(-6px, 2px)' },
          { transform: 'translate(5px, -2px)' },
          { transform: 'translate(-4px, 1px)' },
          { transform: 'translate(2px, 0)' },
          { transform: 'translate(0, 0)' },
        ],
        { duration: 420, easing: 'ease-out' },
      );
    });
    // Keyed on the bust ids: replay only when a new bust happens, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bustIds]);

  // Phones feel the big moments: your own bust or 20, and how the match ended.
  const momentIds = moments.map((m) => m?.id ?? 0).join(',');
  const buzzedMoments = useRef(new Set<number>());
  useEffect(() => {
    moments.forEach((moment, seat) => {
      // Hot seat shares one phone, so both seats' moments count there.
      if (!moment || buzzedMoments.current.has(moment.id) || (seat !== mySeat && (online || vsBot))) return;
      buzzedMoments.current.add(moment.id);
      buzz(moment.kind === 'bust' ? 'bust' : 'twenty');
    });
    // Keyed on the moment ids: buzz once per new moment, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [momentIds]);
  const matchOver = banner?.kind === 'match' ? (banner.tone ?? 'neutral') : null;
  useEffect(() => {
    if (matchOver) buzz(matchOver === 'lose' ? 'lose' : 'win');
  }, [matchOver]);

  useEffect(() => {
    const handler = () => setShowForfeitConfirm(true);
    window.addEventListener('pz-trigger-forfeit', handler);
    return () => window.removeEventListener('pz-trigger-forfeit', handler);
  }, []);

  useEffect(() => {
    if (!view) return;
    setKnownHands((prev) => ({ ...prev, [mySeat]: [...view.you.hand] }));
  }, [mySeat, view]);

  const [copiedLink, copy] = useCopyToClipboard();

  const url = roomId ? inviteUrlForRoom(roomId) : '';

  const share = () => {
    if (navigator.share) void navigator.share({ title: 'Pazaak', text: t('share_message'), url }).catch(() => {});
    else copy(url);
  };

  const canShare = typeof navigator !== 'undefined' && !!navigator.share && !!url;

  const dropped = online && connection === 'disconnected';
  const waiting = online && connection === 'connecting' && !view && !isHost;
  const hotSeat = !online && !vsBot;
  const seatLabel = (seat: Seat) =>
    online || vsBot
      ? seat === mySeat
        ? t('you')
        : (opponentCompanion?.name ?? t('opponent'))
      : t('player_seat', { player: seat + 1 });
  // A lost match drains the board of colour, and the deciding set's cards crumble away.
  const defeated = banner?.kind === 'match' && banner.tone === 'lose';
  const crumble = !hotSeat && decidedBy != null && decidedBy !== mySeat;
  const opponentHandSlots =
    view?.opponent.hand_slots ??
    Array.from({ length: 4 }, (_, i) => i < (view?.opponent.hand_size ?? 4));
  // Which slot of the opponent's hand emptied last, so their played card leaves from it.
  const slotsKey = opponentHandSlots.join();
  const [opponentHand, setOpponentHand] = useState({ key: slotsKey, slots: opponentHandSlots, vacated: -1 });
  if (opponentHand.key !== slotsKey) {
    setOpponentHand({
      key: slotsKey,
      slots: opponentHandSlots,
      vacated: opponentHandSlots.findIndex((held, i) => !held && opponentHand.slots[i]),
    });
  }

  const yourTurn = !!view?.your_turn && !busy && !finished;
  const canPlayHand = yourTurn && !view!.you.played_this_turn;
  const playableHand = new Set(
    (yourTurn ? view!.legal_actions : [])
      .filter((a) => a.type === 'play' && a.hand_index != null)
      .map((a) => a.hand_index as number),
  );

  function play(handIndex: number, from: DOMRect) {
    if (!canPlayHand || !playableHand.has(handIndex)) return;
    primePazaakSounds();
    playedFrom.current[mySeat] = {
      at: display.tables[mySeat].length,
      origin: { cx: from.left + from.width / 2, cy: from.top + from.height / 2, height: from.height },
    };
    act({ type: 'play', hand_index: handIndex, option_index: activeOption[handIndex] ?? 0 });
    setActiveOption({});
  }

  function flightOrigin(seat: Seat, slot: number): FlightOrigin | undefined {
    if (performance.now() - mountedAt < FLIGHT_SETTLE_MS) return undefined;
    const played = playedFrom.current[seat];
    if (played?.at === slot) return played.origin;
    const hand = handEls.current[seat];
    if (seat !== mySeat) {
      const from = hand?.children[opponentHand.vacated]?.lastElementChild;
      if (from) return originOf(from, true);
    }
    // Otherwise from the middle of the hand, at table-card size.
    const centre = originOf(hand);
    return centre && { cx: centre.cx, cy: centre.cy };
  }

  function flipOption(handIndex: number) {
    const options = view?.you.hand_options[handIndex] ?? [];
    if (!canPlayHand || options.length < 2) return;
    setActiveOption((p) => ({ ...p, [handIndex]: ((p[handIndex] ?? 0) + 1) % options.length }));
  }

  // Keyboard play: E ends the turn, S stands, 1–4 play a hand card and Shift+1–4 flips its
  // sign. Physical key codes, so the keys stay put on any layout. Re-subscribed every
  // render so the handler always sees the current turn.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.repeat || showForfeitConfirm) return;
      // Any open dialog (help, data wipe, dropped connection) keeps the table out of reach.
      if (document.querySelector('.pz-modal-overlay')) return;
      if (e.target instanceof Element && e.target.closest('input, textarea, select, [contenteditable="true"]')) return;
      const digit = /^(?:Digit|Numpad)([1-4])$/.exec(e.code);
      if (e.code === 'KeyE' && yourTurn) act({ type: 'end_turn' });
      else if (e.code === 'KeyS' && yourTurn) act({ type: 'stand' });
      else if (digit && e.shiftKey) flipOption(Number(digit[1]) - 1);
      else if (digit) {
        const i = Number(digit[1]) - 1;
        const card = handEls.current[mySeat]?.children[i]?.querySelector('.pz-hand-flip-shell');
        if (card) play(i, card.getBoundingClientRect());
        else return;
      } else return;
      e.preventDefault();
      primePazaakSounds();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const subtitle = (() => {
    if (online) return t(status);
    if (vsBot) return `Set ${display.setNumber}`;
    return t('pass_and_play_subtitle', { set: display.setNumber });
  })();

  return (
    <div className={`pz-root ${defeated ? 'defeated' : ''}`} onPointerDown={primePazaakSounds}>
      <TopBar />
      <header className="pz-header">
        <div className="pz-sub">
          {online ? <span className={`pz-conn ${connection ?? 'connecting'}`} aria-hidden /> : null}
          {subtitle}
        </div>
      </header>

      <div className="pz-playfield">
        <div className="pz-tables">
          {SEATS.map((seat) => {
            const active = seat === activeSeat;
            const total = display.totals[seat];
            const label = seatLabel(seat);

            const isYou = seat === mySeat;
            const showSeatActions = isYou || hotSeat;
            const seatCanAct = isYou && yourTurn;

            const moment = moments[seat];
            const leavingCards = leaving?.[seat] ?? [];

            return (
              <section key={seat} className={`pz-player ${isYou ? 'you' : ''} ${active ? 'active' : ''} ${display.standing[seat] ? 'standing' : ''}`}>
                <span className="pz-player-ring" aria-hidden />
                {moment ? <div key={moment.id} className={`pz-moment ${moment.kind}`} aria-hidden /> : null}
                {display.standing[seat] ? (
                  <div className="pz-stand-stamp" aria-hidden>{t('standing_label')}</div>
                ) : null}
                <div className="pz-player-content">
                  <div className="pz-player-head pz-mobile-rail pz-board-rail">
                    <span className="pz-pname">
                      {!isYou && opponentCompanion ? <CompanionAvatar portrait={opponentCompanion.portrait} /> : null}
                      <span className="pz-pname-text" style={nameFit(label)}>
                        {label}
                      </span>
                    </span>
                    <RollingTotal value={total} />
                    <div className="pz-pips">
                      {[0, 1, 2].map((i) => (
                        <span key={i} className={`pz-pip ${i < display.scores[seat] ? 'on' : ''}`} />
                      ))}
                    </div>
                    {showSeatActions ? (
                          <div className="pz-player-actions">
                            <div className="pz-actions">
                              <button className="pz-btn primary" disabled={!seatCanAct} onClick={() => act({ type: 'end_turn' })} aria-keyshortcuts="E">
                                <SkipForward size={16} />
                                {t('btn_end_turn')}
                                <kbd className="pz-kbd" aria-hidden>E</kbd>
                              </button>
                              <button className="pz-btn primary" disabled={!seatCanAct} onClick={() => act({ type: 'stand' })} aria-keyshortcuts="S">
                                <Lock size={16} />
                                {t('btn_stand')}
                                <kbd className="pz-kbd" aria-hidden>S</kbd>
                              </button>
                              {!finished && onForfeit ? (
                                <button
                                  className="pz-btn"
                                  disabled={!isYou}
                                  onClick={() => setShowForfeitConfirm(true)}
                                >
                                  <Flag size={16} />
                                  {t('btn_forfeit')}
                                </button>
                              ) : null}
                              {finished && reset ? (
                                <button className="pz-btn" onClick={reset}>
                                  {t('btn_new_match')}
                                </button>
                              ) : null}
                            </div>
                          </div>
                    ) : (
                      <div className="pz-rail-info">
                        <span className="pz-rail-info-main">
                          {online ? <span className={`pz-conn ${connection ?? 'connecting'}`} aria-hidden /> : null}
                          {subtitle}
                        </span>
                        {contextDetail ? <span className="pz-rail-info-detail">{contextDetail}</span> : null}
                      </div>
                    )}
                  </div>

                  <div className="pz-player-body">
                    <div className="pz-board-row">
                      <div className="pz-grid" ref={(el) => { gridEls.current[seat] = el; }}>
                        {TABLE_SLOTS.map((i) => {
                          const card = display.tables[seat][i];
                          return card ? (
                            <TableCard
                              key={card.key}
                              card={card}
                              origin={card.family === 'main' ? undefined : () => flightOrigin(seat, i)}
                            />
                          ) : (
                            <div key={i} className="pz-slot" />
                          );
                        })}
                      </div>
                      {leavingCards.length ? (
                        // The finished set's cards sweep off above the fresh, empty table.
                        <div className={`pz-grid pz-grid-leaving ${crumble ? 'crumble' : ''}`} aria-hidden>
                          {TABLE_SLOTS.map((i) => {
                            const card = leavingCards[i];
                            return card ? (
                              <div
                                key={card.key}
                                className="pz-card leaving"
                                style={{ backgroundImage: `url(${cardArt(card.label, card.family)})`, ['--li' as string]: i } as CSSProperties}
                              >
                                <span>{card.label}</span>
                              </div>
                            ) : (
                              <div key={i} />
                            );
                          })}
                        </div>
                      ) : null}
                    </div>

                    <div className="pz-player-hand-container">
                      <div className="pz-hand" ref={(el) => { handEls.current[seat] = el; }}>
                        {[0, 1, 2, 3].map((i) => {
                          if (isYou) {
                            const code = view?.you.hand[i];
                            if (!code) {
                              return (
                                <div key={i} className="pz-hand-slot">
                                  <span className="pz-flip-spacer" />
                                  <div className="pz-hand-card empty" />
                                </div>
                              );
                            }
                            const options = view!.you.hand_options[i] ?? [code];
                            const opt = activeOption[i] ?? 0;
                            const label = options[opt];
                            const playable = seat === activeSeat && canPlayHand && playableHand.has(i);
                            return (
                              <div key={i} className="pz-hand-slot">
                                <kbd className="pz-kbd pz-hand-kbd" aria-hidden>
                                  {i + 1}
                                </kbd>
                                {options.length > 1 ? (
                                  <button
                                    className="pz-flip"
                                    disabled={!canPlayHand}
                                    onClick={() => flipOption(i)}
                                    title={`${t('flip_card')} (Shift+${i + 1})`}
                                    aria-keyshortcuts={`Shift+${i + 1}`}
                                  >
                                    <ArrowLeftRight size={14} />
                                  </button>
                                ) : (
                                  <span className="pz-flip-spacer" />
                                )}
                                <HandCardFlip
                                  code={code}
                                  label={label}
                                  dealIn={handDealAnimation}
                                  swapMode={handSwapAnimation ? 'reveal' : undefined}
                                  playable={playable}
                                  index={i}
                                  onClick={(rect) => play(i, rect)}
                                />
                              </div>
                            );
                          }
                          const knownCode = knownHands[seat]?.[i];
                          const occupied = opponentHandSlots[i];
                          return (
                            <div key={i} className="pz-hand-slot">
                              <span className="pz-flip-spacer" />
                              {occupied ? (
                                <HandCardFlip
                                  code={knownCode}
                                  dealIn={handDealAnimation}
                                  swapMode={handSwapAnimation ? 'hide' : 'hidden'}
                                  index={i}
                                />
                              ) : (
                                <div className="pz-hand-card empty" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className={`pz-hand-actions ${showSeatActions ? '' : 'ghost'}`} aria-hidden={!showSeatActions}>
                      <div className="pz-actions">
                        <button className="pz-btn primary" disabled={!seatCanAct} onClick={() => act({ type: 'end_turn' })} aria-keyshortcuts="E">
                          <SkipForward size={16} />
                          {t('btn_end_turn')}
                          <kbd className="pz-kbd" aria-hidden>E</kbd>
                        </button>
                        <button className="pz-btn primary" disabled={!seatCanAct} onClick={() => act({ type: 'stand' })} aria-keyshortcuts="S">
                          <Lock size={16} />
                          {t('btn_stand')}
                          <kbd className="pz-kbd" aria-hidden>S</kbd>
                        </button>
                        {!finished && onForfeit ? (
                          <button className="pz-btn" disabled={!isYou} onClick={() => setShowForfeitConfirm(true)}>
                            <Flag size={16} />
                            {t('btn_forfeit')}
                          </button>
                        ) : null}
                        {finished && reset ? (
                          <button className="pz-btn" onClick={reset}>
                            {t('btn_new_match')}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      </div>

      {banner?.kind === 'match' && banner.tone !== 'lose' ? <GoldShower /> : null}

      {banner ? (
        <div className={`pz-banner ${banner.kind} ${banner.tone ?? ''}`}>
          <span className="pz-banner-sheen" aria-hidden />
          <div>{banner.text}</div>
          {banner.kind === 'match' && setRecords.length ? (
            <MatchSummary
              sets={setRecords}
              seats={hotSeat ? [0, 1] : [mySeat, (1 - mySeat) as Seat]}
              labels={{ 0: seatLabel(0), 1: seatLabel(1) }}
            />
          ) : null}
          {banner.kind === 'match'
            ? (
                <div className="pz-banner-actions">
                  {endSlot ?? (reset ? (
                    <button className="pz-btn primary" onClick={reset}>
                      {t('btn_play_again')}
                    </button>
                  ) : null)}
                </div>
              )
            : null}
        </div>
      ) : null}

      {dropped ? (
        <div className="pz-modal-overlay">
          <div className="pz-modal-card" style={{ maxWidth: '420px', textAlign: 'left' }} onClick={(e) => e.stopPropagation()}>
            <div className="pz-modal-header" style={{ borderBottom: 'none', paddingBottom: '0', marginBottom: '8px' }}>
              <h3>{t('waiting_opponent')}</h3>
            </div>
            
            <div className="pz-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '12px 0 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="pz-spinner" style={{ width: '20px', height: '20px', borderWidth: '2.5px', margin: 0 }} />
                <span style={{ fontSize: '1rem', color: 'var(--text-bright)', fontWeight: 600 }}>{t(status)}</span>
              </div>
              <p style={{ fontSize: '0.88rem', opacity: 0.8, margin: 0 }}>{t('reconnect_warning')}</p>
              
              {roomId ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.78rem', opacity: 0.7, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t('invite_link')}</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input readOnly value={url} className="pz-share-url" style={{ flex: 1, padding: '8px 12px', background: 'rgba(0, 0, 0, 0.4)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-bright)', fontSize: '0.9rem' }} onFocus={(e) => e.currentTarget.select()} />
                      <button className="pz-btn" onClick={() => copy(url)}>
                        <Copy size={14} />
                        {copiedLink ? t('btn_copied') : t('btn_copy')}
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px', borderTop: roomId ? 'none' : '1px solid var(--border)', paddingTop: roomId ? '0' : '16px' }}>
                {canShare ? (
                  <button className="pz-btn primary" style={{ flex: 1 }} onClick={share}>
                    <Share2 size={16} />
                    {t('btn_share_link')}
                  </button>
                ) : null}
                {onForfeit ? (
                  <button className="pz-btn" style={{ flex: 1 }} onClick={onForfeit}>
                    <ArrowLeft size={16} />
                    {t('btn_end_game')}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : waiting ? (
        <div className="pz-overlay light">
          <ShuffleDeck state="shuffling" size="large" />
          <div>{t(status)}</div>
        </div>
      ) : null}

      {showForfeitConfirm && onForfeit ? (
        <div className="pz-modal-overlay" onClick={() => setShowForfeitConfirm(false)}>
          <div className="pz-modal-card" style={{ maxWidth: '380px' }} onClick={(e) => e.stopPropagation()}>
            <div className="pz-modal-header">
              <h3>{t('btn_forfeit')}</h3>
              <button className="pz-modal-close" onClick={() => setShowForfeitConfirm(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="pz-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', textAlign: 'center', padding: '16px 0 0' }}>
              <p style={{ fontSize: '1.05rem', color: 'var(--text-bright)', fontWeight: 600, margin: 0 }}>
                {t('confirm_forfeit')}
              </p>
              <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                <button className="pz-btn primary" style={{ flex: 1 }} onClick={onForfeit}>
                  {t('btn_yes')}
                </button>
                <button className="pz-btn" style={{ flex: 1 }} onClick={() => setShowForfeitConfirm(false)}>
                  {t('btn_no')}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** The opponent's portrait; it lights up while they speak. */
function CompanionAvatar({ portrait }: { portrait: string }) {
  const [speaking, setSpeaking] = useState(false);
  useEffect(() => onCompanionVoice(setSpeaking), []);

  return <img className={`pz-companion-avatar ${speaking ? 'speaking' : ''}`} src={portrait} alt="" />;
}

function TableCard({ card, origin }: { card: DisplayCard; origin?: () => FlightOrigin | undefined }) {
  const ref = useRef<HTMLDivElement>(null);

  // A played side card travels from the hand to its slot; deck draws keep the CSS deal-in.
  // Cards that leave face down turn over halfway, swapping the back for the face.
  useLayoutEffect(() => {
    const el = ref.current;
    const from = origin?.();
    if (!el || !from || typeof el.animate !== 'function' || prefersReducedMotion()) return;
    const to = el.getBoundingClientRect();
    const dx = from.cx - (to.left + to.width / 2);
    const dy = from.cy - (to.top + to.height / 2);
    const scale = from.height ? from.height / to.height : 1;
    const lifted = `${CARD_EDGE} drop-shadow(0 14px 18px rgba(0, 0, 0, 0.55))`;
    const settled = `${CARD_EDGE} drop-shadow(0 2px 3px rgba(0, 0, 0, 0.4))`;
    const timing = { duration: from.faceDown ? 480 : 420, easing: EASE_OUT };
    el.classList.add('flying');
    const flights: Animation[] = [];
    if (from.faceDown) {
      const back = `url(${CARD_BACK})`;
      const face = `url(${cardArt(card.label, card.family)})`;
      const at = (t: number, turn: number) =>
        `perspective(600px) translate(${dx * (1 - t)}px, ${dy * (1 - t)}px) scale(${scale + (1 - scale) * t}) rotateY(${turn}deg)`;
      // The art swap is its own animation: sharing keyframes with the transform would pull
      // the whole flight off the compositor and onto the main thread.
      flights.push(
        el.animate(
          [
            { transform: at(0, 180), filter: lifted },
            { transform: at(0.5, 90), offset: 0.5 },
            { transform: at(1, 0), filter: settled },
          ],
          timing,
        ),
        el.animate(
          [
            { backgroundImage: back },
            { backgroundImage: back, offset: 0.5 },
            { backgroundImage: face, offset: 0.5 },
            { backgroundImage: face },
          ],
          timing,
        ),
      );
      const label = el.querySelector('span');
      if (label) {
        flights.push(
          label.animate([{ opacity: 0 }, { opacity: 0, offset: 0.5 }, { opacity: 1, offset: 0.5 }, { opacity: 1 }], timing),
        );
      }
    } else {
      flights.push(
        el.animate(
          [
            { transform: `translate(${dx}px, ${dy}px) scale(${scale})`, filter: lifted },
            { transform: 'none', filter: settled },
          ],
          timing,
        ),
      );
    }
    flights[0].onfinish = () => el.classList.replace('flying', 'flown');
    return () => {
      flights[0].onfinish = null;
      flights.forEach((flight) => flight.cancel());
      el.classList.remove('flying');
    };
    // Mount-only: the flight describes how this card arrived, not later re-renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={ref} className="pz-card" style={{ backgroundImage: `url(${cardArt(card.label, card.family)})` }}>
      <span>{card.label}</span>
    </div>
  );
}

function HandCardFlip({
  code,
  label,
  dealIn,
  swapMode,
  playable,
  index,
  onClick,
}: {
  code?: string;
  label?: string;
  dealIn: boolean;
  swapMode?: 'reveal' | 'hide' | 'hidden';
  playable?: boolean;
  index: number;
  onClick?: (rect: DOMRect) => void;
}) {
  const nextLabel = label ?? code;
  // Turning a ± card over: the old face tips away edge-on, then the new one comes up.
  const [face, setFace] = useState<{ code?: string; label?: string; phase: 'idle' | 'out' | 'in' }>({
    code,
    label: nextLabel,
    phase: 'idle',
  });
  if (face.phase === 'idle' && (face.code !== code || face.label !== nextLabel)) {
    const turn = face.code === code && !!nextLabel && !prefersReducedMotion();
    setFace(turn ? { ...face, phase: 'out' } : { code, label: nextLabel, phase: 'idle' });
  }
  const frontLabel = face.phase === 'out' ? face.label : nextLabel;
  const turnClass = face.phase === 'idle' ? '' : `sign-${face.phase} ${nextLabel?.startsWith('-') ? 'down' : 'up'}`;
  const settleTurn = (e: AnimationEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    if (face.phase === 'out') setFace({ code, label: nextLabel, phase: 'in' });
    // Settle on the newest label: the sign may have changed again while this face came up.
    else if (face.phase === 'in') setFace({ code, label: nextLabel, phase: 'idle' });
  };
  const frontFamily = code ? familyForCode(code) : 'plus';
  const frontImage = frontLabel ? cardArt(frontLabel, frontFamily) : CARD_BACK;
  const isHidden = swapMode === 'hidden' || swapMode === 'hide';
  const innerClass = [
    'pz-hand-flip-inner',
    isHidden && 'is-facedown',
    swapMode === 'reveal' && 'pz-seat-swap-reveal',
    swapMode === 'hide' && 'pz-seat-swap-hide',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={`pz-hand-flip-shell ${dealIn ? 'pz-deal-in' : ''} ${playable ? 'playable' : ''}`}
      style={{ ['--di' as string]: index } as CSSProperties}
      onClick={onClick ? (e) => onClick(e.currentTarget.getBoundingClientRect()) : undefined}
      title={frontLabel}
    >
      <div className={innerClass}>
        <div
          className={`pz-hand-card pz-hand-face pz-hand-front ${turnClass}`}
          style={{ backgroundImage: `url(${frontImage})` }}
          onAnimationEnd={settleTurn}
        >
          {frontLabel ? <span>{frontLabel}</span> : null}
        </div>
        <div className="pz-hand-card pz-hand-face pz-hand-back" style={{ backgroundImage: `url(${CARD_BACK})` }} />
      </div>
    </div>
  );
}
