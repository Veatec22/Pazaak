import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CUSTOM_DECK_STORAGE_KEY } from '../../deckBuilder/customDeck';
import { MusicProvider } from '../../music/MusicProvider';
import { DeckBuilderScreen } from './DeckBuilderScreen';

let root: ReturnType<typeof createRoot> | null = null;
let container: HTMLDivElement | null = null;

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('pz-lang', 'en');
});

afterEach(() => {
  if (root) {
    act(() => root!.unmount());
  }
  root = null;
  container?.remove();
  container = null;
});

describe('DeckBuilderScreen', () => {
  it('saves ten duplicate cards as a valid custom side deck', () => {
    const onLeave = vi.fn();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    act(() => {
      root!.render(
        <MusicProvider>
          <DeckBuilderScreen onLeave={onLeave} />
        </MusicProvider>,
      );
    });

    const save = container.querySelector<HTMLButtonElement>('[data-testid="save-custom-deck"]');
    const addFlipSix = container.querySelector<HTMLButtonElement>('[aria-label="Add ±6"]');

    expect(save).toBeDisabled();
    expect(addFlipSix).toBeInTheDocument();

    for (let i = 0; i < 10; i++) {
      act(() => addFlipSix!.click());
    }

    expect(container.querySelectorAll('[data-testid="selected-card"]')).toHaveLength(10);
    expect(save).not.toBeDisabled();

    act(() => save!.click());

    expect(JSON.parse(localStorage.getItem(CUSTOM_DECK_STORAGE_KEY) ?? '[]')).toEqual(
      Array.from({ length: 10 }, () => '±6'),
    );
    expect(onLeave).toHaveBeenCalledOnce();
  });
});
