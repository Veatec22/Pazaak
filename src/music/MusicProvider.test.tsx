import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MusicProvider } from './MusicProvider';

let root: ReturnType<typeof createRoot> | null = null;
let container: HTMLDivElement | null = null;
let originalAudioContext: typeof AudioContext | undefined;
let playSpy: ReturnType<typeof vi.spyOn>;

class TestAudioContext {
  static created = 0;

  destination = {};

  constructor() {
    TestAudioContext.created += 1;
  }

  createMediaElementSource() {
    return { connect: vi.fn() };
  }

  createAnalyser() {
    return { connect: vi.fn(), fftSize: 0, smoothingTimeConstant: 0 };
  }

  resume() {
    return Promise.resolve();
  }
}

beforeEach(() => {
  TestAudioContext.created = 0;
  originalAudioContext = window.AudioContext;
  window.AudioContext = TestAudioContext as unknown as typeof AudioContext;
  playSpy = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
});

afterEach(() => {
  if (root) {
    act(() => root!.unmount());
  }
  root = null;
  container?.remove();
  container = null;
  window.AudioContext = originalAudioContext!;
  playSpy.mockRestore();
});

describe('MusicProvider', () => {
  it('starts music through the media element without routing it through Web Audio', () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    act(() => {
      root!.render(
        <MusicProvider>
          <div>music ready</div>
        </MusicProvider>,
      );
    });

    act(() => {
      window.dispatchEvent(new Event('pointerdown'));
    });

    expect(playSpy).toHaveBeenCalled();
    expect(TestAudioContext.created).toBe(0);
  });
});
