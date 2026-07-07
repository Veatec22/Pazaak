import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';

import { WaitingRoom } from './WaitingRoom';
import type { MatchController } from '../../ui/controller';

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

describe('WaitingRoom', () => {
  it('shows a QR code for the full invite link', () => {
    window.history.replaceState(null, '', '/play');
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    act(() => {
      root!.render(<WaitingRoom roomId="abc123" onLeave={() => {}} />);
    });

    const expectedUrl = `${location.origin}/play#room=abc123`;
    const qr = container.querySelector('[data-testid="invite-qr"]');

    expect(container).toHaveTextContent('Scan QR code to join');
    expect(container).not.toHaveTextContent('Room Code');
    expect(qr).toHaveAttribute('data-value', expectedUrl);
    expect(qr?.querySelector('svg')).toBeInTheDocument();
    expect(qr?.querySelector('image[href$="/brand/icon-192.png"]')).toBeInTheDocument();
  });

  it('lets the host choose a mode but blocks start until the guest is ready', () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    const lobby: NonNullable<MatchController['onlineLobby']> = {
      isHost: true,
      connected: true,
      mode: 'mix',
      guestName: 'Mission',
      guestReady: false,
      ready: false,
      kicked: false,
      canStart: false,
      setMode: () => {},
      toggleReady: () => {},
      kick: () => {},
      start: () => {},
    };

    act(() => {
      root!.render(<WaitingRoom roomId="abc123" onLeave={() => {}} lobby={lobby} />);
    });

    expect(container).toHaveTextContent('Mixed');
    expect(container).toHaveTextContent('Mission');
    expect(container).toHaveTextContent('Guest is not ready');
    expect(container).toHaveTextContent('Kick');
    expect(container.querySelector('button[class*="primary"]')).toBeInTheDocument();
    expect(container.querySelector('button:disabled')).toHaveTextContent('Start Match');
  });
});
