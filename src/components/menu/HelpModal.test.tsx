import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';

import { HelpModal } from './HelpModal';

let root: ReturnType<typeof createRoot> | null = null;
let container: HTMLDivElement | null = null;

afterEach(() => {
  if (root) {
    act(() => root!.unmount());
  }
  root = null;
  container?.remove();
  container = null;
});

describe('HelpModal', () => {
  it('documents the automatic nine-card win', () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    act(() => {
      root!.render(<HelpModal onClose={() => {}} />);
    });

    expect(container).toHaveTextContent(
      'Filling all 9 slots without busting wins the set automatically',
    );
  });
});
