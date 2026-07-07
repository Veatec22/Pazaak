import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { WaitingRoom } from './WaitingRoom';
import type { MatchController } from '../../ui/controller';

let root: ReturnType<typeof createRoot> | null = null;
let container: HTMLDivElement | null = null;

const hostLobby = (overrides: Partial<NonNullable<MatchController['onlineLobby']>> = {}) => ({
  isHost: true,
  connected: true,
  mode: 'mix' as const,
  guestName: 'Mission',
  guestReady: false,
  ready: false,
  kicked: false,
  canStart: false,
  setMode: () => {},
  toggleReady: () => {},
  kick: () => {},
  start: () => {},
  ...overrides,
});

const guestLobby = (overrides: Partial<NonNullable<MatchController['onlineLobby']>> = {}) => ({
  isHost: false,
  connected: true,
  mode: 'flip' as const,
  guestName: null,
  guestReady: false,
  ready: false,
  kicked: false,
  canStart: false,
  setMode: () => {},
  toggleReady: () => {},
  start: () => {},
  ...overrides,
});

function renderWaitingRoom(lobby?: NonNullable<MatchController['onlineLobby']>) {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);

  act(() => {
    root!.render(<WaitingRoom roomId="abc123" onLeave={() => {}} lobby={lobby} />);
  });

  return container;
}

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
    const view = renderWaitingRoom();

    const expectedUrl = `${location.origin}/play#room=abc123`;
    const qr = view.querySelector('[data-testid="invite-qr"]');

    expect(view).toHaveTextContent('Scan QR code to join');
    expect(view).not.toHaveTextContent('Room Code');
    expect(qr).toHaveAttribute('data-value', expectedUrl);
    expect(qr?.querySelector('svg')).toBeInTheDocument();
    expect(qr?.querySelector('image[href$="/brand/icon-192.png"]')).toBeInTheDocument();
  });

  it('lets the host choose a mode but blocks start until the guest is ready', () => {
    const view = renderWaitingRoom(hostLobby({ mode: 'builder' }));

    expect(view).toHaveTextContent('Builder');
    expect(view.querySelector('button[aria-pressed="true"]')).toHaveTextContent('Builder');
    expect(view).toHaveTextContent('Mission');
    expect(view).toHaveTextContent('Guest is not ready');
    expect(view).toHaveTextContent('Kick');
    expect(view.querySelector('button[class*="primary"]')).toBeInTheDocument();
    expect(view.querySelector('button:disabled')).toHaveTextContent('Start Match');
  });

  it('lets the guest mark themselves ready', () => {
    const toggleReady = vi.fn();

    const view = renderWaitingRoom(guestLobby({ toggleReady }));

    expect(view).toHaveTextContent('Opponent connected.');
    expect(view).toHaveTextContent('Choose your mode and mark ready');
    expect(view.querySelector('button[aria-pressed="true"]')).toHaveTextContent('Flip');

    const readyButton = Array.from(view.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Ready'),
    );
    expect(readyButton).toBeInTheDocument();

    act(() => {
      readyButton!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(toggleReady).toHaveBeenCalledTimes(1);
  });

  it('shows kicked state without ready or mode controls', () => {
    const view = renderWaitingRoom(guestLobby({ kicked: true }));

    expect(view).toHaveTextContent('Removed from match');
    expect(view).toHaveTextContent('The host removed you from this match.');
    expect(view).not.toHaveTextContent('Match Mode');
    expect(view).not.toHaveTextContent('Ready');
  });
});
