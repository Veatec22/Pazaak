import { useState, useEffect, type CSSProperties } from 'react';
import { X, Copy, Share2, ArrowLeft, SkipForward, Lock, Flag, ArrowLeftRight } from 'lucide-react';

import type { Seat } from '../engine';
import { cardArt, CARD_BACK, familyForCode } from './cardArt';
import type { DisplayCard, MatchController } from './controller';
import { primePazaakSounds } from './sounds';
import { useI18n } from '../net/useI18n';
import { TopBar } from '../Lobby';
import './board.css';

const SEATS: Seat[] = [0, 1];
const TABLE_SLOTS = Array.from({ length: 9 }, (_, i) => i);

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
  const { t } = useI18n();

  useEffect(() => {
    const handler = () => setShowForfeitConfirm(true);
    window.addEventListener('pz-trigger-forfeit', handler);
    return () => window.removeEventListener('pz-trigger-forfeit', handler);
  }, []);

  useEffect(() => {
    if (!view) return;
    setKnownHands((prev) => ({ ...prev, [mySeat]: [...view.you.hand] }));
  }, [mySeat, view]);

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const url = roomId ? `${window.location.origin}${window.location.pathname}#room=${roomId}` : '';

  const copy = (text: string, mark: (v: boolean) => void) => {
    void navigator.clipboard?.writeText(text).then(() => {
      mark(true);
      setTimeout(() => mark(false), 2000);
    });
  };

  const share = () => {
    if (navigator.share) void navigator.share({ title: 'Pazaak', text: t('share_message'), url }).catch(() => {});
    else copy(url, setCopiedLink);
  };

  const canShare = typeof navigator !== 'undefined' && !!navigator.share && !!url;

  const dropped = online && connection === 'disconnected';
  const waiting = online && connection === 'connecting' && !view && !isHost;
  const hotSeat = !online && !vsBot;

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
    if (online) return t(status);
    if (vsBot) return `Set ${display.setNumber}`;
    return t('pass_and_play_subtitle', { set: display.setNumber });
  })();

  return (
    <div className="pz-root" onPointerDown={primePazaakSounds}>
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
            const label = (online || vsBot)
              ? seat === mySeat
                ? t('you')
                : t('opponent')
              : t('player_seat', { player: seat + 1 });

            const isYou = seat === mySeat;
            const showSeatActions = isYou || hotSeat;
            const seatCanAct = isYou && yourTurn;

            return (
              <section key={seat} className={`pz-player ${isYou ? 'you' : ''} ${active ? 'active' : ''} ${display.standing[seat] ? 'standing' : ''}`}>
                {display.standing[seat] ? (
                  <div className="pz-stand-stamp" aria-hidden>{t('standing_label')}</div>
                ) : null}
                <div className="pz-player-content">
                  <div className="pz-player-head pz-mobile-rail pz-board-rail">
                    <span className="pz-pname">{label}</span>
                    <span className={`pz-total ${total > 20 ? 'bust' : ''}`}>{total}</span>
                    <div className="pz-pips">
                      {[0, 1, 2].map((i) => (
                        <span key={i} className={`pz-pip ${i < display.scores[seat] ? 'on' : ''}`} />
                      ))}
                    </div>
                    {showSeatActions ? (
                          <div className="pz-player-actions">
                            <div className="pz-actions">
                              <button className="pz-btn primary" disabled={!seatCanAct} onClick={() => act({ type: 'end_turn' })}>
                                <SkipForward size={16} />
                                {t('btn_end_turn')}
                              </button>
                              <button className="pz-btn primary" disabled={!seatCanAct} onClick={() => act({ type: 'stand' })}>
                                <Lock size={16} />
                                {t('btn_stand')}
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
                      <div className="pz-grid">
                        {TABLE_SLOTS.map((i) => {
                          const card = display.tables[seat][i];
                          return card ? <TableCard key={card.key} card={card} /> : <div key={i} className="pz-slot" />;
                        })}
                      </div>

                    </div>

                    <div className="pz-player-hand-container">
                      <div className="pz-hand">
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
                                {options.length > 1 ? (
                                  <button
                                    className="pz-flip"
                                    disabled={!canPlayHand}
                                    onClick={() => setActiveOption((p) => ({ ...p, [i]: ((p[i] ?? 0) + 1) % options.length }))}
                                    title={t('flip_card')}
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
                                  onClick={() => play(i)}
                                />
                              </div>
                            );
                          }
                          const oppHandSize = view?.opponent.hand_size ?? 4;
                          const knownCode = knownHands[seat]?.[i];
                          return (
                            <div key={i} className="pz-hand-slot">
                              <span className="pz-flip-spacer" />
                              {i < oppHandSize ? (
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
                        <button className="pz-btn primary" disabled={!seatCanAct} onClick={() => act({ type: 'end_turn' })}>
                          <SkipForward size={16} />
                          {t('btn_end_turn')}
                        </button>
                        <button className="pz-btn primary" disabled={!seatCanAct} onClick={() => act({ type: 'stand' })}>
                          <Lock size={16} />
                          {t('btn_stand')}
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

      {banner ? (
        <div className={`pz-banner ${banner.kind} ${banner.tone ?? ''}`}>
          <div>{banner.text}</div>
          {banner.kind === 'match'
            ? (endSlot ?? (reset ? (
                <button className="pz-btn primary" onClick={reset}>
                  {t('btn_play_again')}
                </button>
              ) : null))
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
                    <label style={{ fontSize: '0.78rem', opacity: 0.7, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t('room_code')}</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input readOnly value={roomId} className="pz-share-url" style={{ flex: 1, padding: '8px 12px', background: 'rgba(0, 0, 0, 0.4)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-bright)', fontSize: '0.9rem', fontFamily: 'monospace' }} />
                      <button className="pz-btn" onClick={() => copy(roomId, setCopiedCode)}>
                        <Copy size={14} />
                        {copiedCode ? t('btn_copied') : t('btn_copy')}
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.78rem', opacity: 0.7, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t('invite_link')}</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input readOnly value={url} className="pz-share-url" style={{ flex: 1, padding: '8px 12px', background: 'rgba(0, 0, 0, 0.4)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-bright)', fontSize: '0.9rem' }} onFocus={(e) => e.currentTarget.select()} />
                      <button className="pz-btn" onClick={() => copy(url, setCopiedLink)}>
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
          <div className="pz-spinner" />
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

function TableCard({ card }: { card: DisplayCard }) {
  return (
    <div className="pz-card" style={{ backgroundImage: `url(${cardArt(card.label, card.family)})` }}>
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
  onClick?: () => void;
}) {
  const frontLabel = label ?? code;
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
      onClick={onClick}
      title={frontLabel}
    >
      <div className={innerClass}>
        <div className="pz-hand-card pz-hand-face pz-hand-front" style={{ backgroundImage: `url(${frontImage})` }}>
          {frontLabel ? <span>{frontLabel}</span> : null}
        </div>
        <div className="pz-hand-card pz-hand-face pz-hand-back" style={{ backgroundImage: `url(${CARD_BACK})` }} />
      </div>
    </div>
  );
}
