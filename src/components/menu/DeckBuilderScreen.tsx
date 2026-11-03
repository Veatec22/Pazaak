import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { useLayoutEffect, useRef, useState } from 'react';

import { loadCustomDeckCodes, saveCustomDeckCodes } from '../../deckBuilder/customDeck';
import { FULL_COLLECTION, SIDE_DECK_SIZE } from '../../engine';
import { useI18n } from '../../net/useI18n';
import { cardArt, familyForCode } from '../../ui/cardArt';
import { tiltHandlers } from '../../ui/pointerTilt';
import { MenuButton } from './MenuButton';
import { MenuScreen } from './MenuScreen';

const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)';

const prefersReducedMotion = () => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function DeckBuilderScreen({ onLeave }: { onLeave: () => void }) {
  const { t } = useI18n();
  const [selected, setSelected] = useState<string[]>(() => loadCustomDeckCodes() ?? []);
  // Where each added card was clicked, keyed by the deck slot it lands in. A slot only
  // mounts a card through an add, which overwrites its entry, so entries never go stale.
  const arrivals = useRef(new Map<number, DOMRect>());

  const addCard = (code: string, from: DOMRect) => {
    setSelected((cards) => {
      if (cards.length >= SIDE_DECK_SIZE) return cards;
      arrivals.current.set(cards.length, from);
      return [...cards, code];
    });
  };

  const removeCard = (index: number) => {
    setSelected((cards) => cards.filter((_, i) => i !== index));
  };

  const clear = () => setSelected([]);

  const save = () => {
    saveCustomDeckCodes(selected);
    onLeave();
  };

  const canSave = selected.length === SIDE_DECK_SIZE;

  return (
    <MenuScreen variant="pz-deck-builder" onBack={onLeave} backLabel={t('btn_back')}>
      <div className="pz-builder-shell">
        <div className="pz-builder-heading">
          <h2>{t('deck_builder')}</h2>
          <p className="pz-tag">{t('deck_builder_desc')}</p>
        </div>

        <section className="pz-builder-column pz-builder-selected-column">
          <h3>{t('chosen_cards')} {selected.length}/{SIDE_DECK_SIZE}</h3>
          <div className="pz-builder-selected-grid">
            {Array.from({ length: SIDE_DECK_SIZE }, (_, i) => {
              const code = selected[i];
              return code ? (
                <SelectedCard
                  key={i}
                  code={code}
                  arrivalFrom={() => arrivals.current.get(i)}
                  onRemove={() => removeCard(i)}
                  label={t('remove_card', { card: code })}
                />
              ) : (
                <div key={i} className="pz-builder-empty-slot" />
              );
            })}
          </div>
        </section>

        <section className="pz-builder-column pz-builder-available-column">
          <h3>{t('available_cards')}</h3>
          <div className="pz-builder-card-grid">
            {FULL_COLLECTION.map((card) => (
              <AvailableCard
                key={card.code}
                code={card.code}
                family={card.family}
                disabled={selected.length >= SIDE_DECK_SIZE}
                label={t('add_card', { card: card.code })}
                onAdd={(from) => addCard(card.code, from)}
              />
            ))}
          </div>
        </section>

        <div className="pz-lobby-actions pz-builder-actions">
          <MenuButton icon={Save} title={t('btn_save_deck')} primary disabled={!canSave} onClick={save} data-testid="save-custom-deck" />
          <MenuButton icon={Trash2} title={t('btn_clear_deck')} disabled={selected.length === 0} onClick={clear} />
          <MenuButton icon={ArrowLeft} title={t('btn_back')} onClick={onLeave} />
        </div>
      </div>
    </MenuScreen>
  );
}

/** A card in the collection; it tilts under the pointer and is added on click. */
function AvailableCard({
  code,
  family,
  disabled,
  label,
  onAdd,
}: {
  code: string;
  family: string;
  disabled: boolean;
  label: string;
  onAdd: (from: DOMRect) => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const { onPointerMove, onPointerLeave } = tiltHandlers(ref, { maxDeg: 12, scale: 1.1, perspective: 360 });

  return (
    <button
      ref={ref}
      className="pz-builder-card pz-tilt"
      onClick={(e) => onAdd(e.currentTarget.getBoundingClientRect())}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      disabled={disabled}
      aria-label={label}
      style={{ backgroundImage: `url(${cardArt(code, family)})` }}
    >
      <span>{code}</span>
    </button>
  );
}

/**
 * A card in the side deck. When it has just been added it arrives by flight: a copy
 * travels from the collection over the page (the deck column clips its overflow), then
 * hands over to the real card in its slot.
 */
function SelectedCard({
  code,
  arrivalFrom,
  onRemove,
  label,
}: {
  code: string;
  arrivalFrom: () => DOMRect | undefined;
  onRemove: () => void;
  label: string;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const art = cardArt(code, familyForCode(code));

  useLayoutEffect(() => {
    const el = ref.current;
    const from = arrivalFrom();
    if (!el || !from || prefersReducedMotion() || typeof el.animate !== 'function') return;
    const to = el.getBoundingClientRect();

    const ghost = document.createElement('div');
    ghost.className = 'pz-builder-card pz-builder-ghost';
    ghost.style.cssText = `left:${to.left}px;top:${to.top}px;width:${to.width}px;height:${to.height}px;background-image:url("${art}")`;
    ghost.innerHTML = `<span>${code}</span>`;
    document.body.appendChild(ghost);
    el.classList.add('arriving');

    const dx = from.left + from.width / 2 - (to.left + to.width / 2);
    const dy = from.top + from.height / 2 - (to.top + to.height / 2);
    const s = from.width / to.width;
    const flight = ghost.animate(
      [
        { transform: `translate(${dx}px, ${dy}px) scale(${s})` },
        { transform: `translate(${dx * 0.4}px, ${dy * 0.4 - 36}px) rotate(-7deg) scale(${(s + 1) / 2 + 0.08})`, offset: 0.5 },
        { transform: 'none' },
      ],
      { duration: 480, easing: EASE_OUT },
    );
    const land = () => {
      ghost.remove();
      el.classList.remove('arriving');
      el.animate([{ transform: 'scale(1.1)' }, { transform: 'scale(1)' }], { duration: 200, easing: EASE_OUT });
    };
    flight.onfinish = land;
    return () => {
      flight.onfinish = null;
      flight.cancel();
      ghost.remove();
      el.classList.remove('arriving');
    };
    // Mount-only: the flight describes how this card arrived in its slot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <button
      ref={ref}
      className="pz-builder-card selected"
      onClick={onRemove}
      data-testid="selected-card"
      aria-label={label}
      style={{ backgroundImage: `url(${art})` }}
    >
      <span>{code}</span>
    </button>
  );
}
