import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { loadCustomDeckCodes, saveCustomDeckCodes } from '../../deckBuilder/customDeck';
import { FULL_COLLECTION, SIDE_DECK_SIZE } from '../../engine';
import { useI18n } from '../../net/useI18n';
import { cardArt, familyForCode } from '../../ui/cardArt';
import { MenuButton } from './MenuButton';
import { MenuScreen } from './MenuScreen';

export function DeckBuilderScreen({ onLeave }: { onLeave: () => void }) {
  const { t } = useI18n();
  const [selected, setSelected] = useState<string[]>(() => loadCustomDeckCodes() ?? []);

  const addCard = (code: string) => {
    setSelected((cards) => (cards.length >= SIDE_DECK_SIZE ? cards : [...cards, code]));
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
                <button
                  key={i}
                  className="pz-builder-card selected"
                  onClick={() => removeCard(i)}
                  data-testid="selected-card"
                  aria-label={t('remove_card', { card: code })}
                  style={{ backgroundImage: `url(${cardArt(code, familyForCode(code))})` }}
                >
                  <span>{code}</span>
                </button>
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
              <button
                key={card.code}
                className="pz-builder-card"
                onClick={() => addCard(card.code)}
                disabled={selected.length >= SIDE_DECK_SIZE}
                aria-label={t('add_card', { card: card.code })}
                style={{ backgroundImage: `url(${cardArt(card.code, card.family)})` }}
              >
                <span>{card.code}</span>
              </button>
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
