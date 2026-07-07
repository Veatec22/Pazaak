import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MusicProvider } from '../../music/MusicProvider';
import { QuickMatchSetup } from './QuickMatchSetup';

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

describe('QuickMatchSetup', () => {
  it('offers the saved deck builder pool', () => {
    const onPick = vi.fn();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    act(() => {
      root!.render(
        <MusicProvider>
          <QuickMatchSetup onPick={onPick} onLeave={() => {}} />
        </MusicProvider>,
      );
    });

    const builder = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Builder'),
    );

    expect(builder).toBeInTheDocument();

    act(() => builder!.click());

    expect(onPick).toHaveBeenCalledWith('builder');
  });
});
