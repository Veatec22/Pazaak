/**
 * The characteristic KotOR UI click (extracted `gui_click`), played through the Web Audio
 * API on button presses. Primed on the first user gesture (autoplay policy); a no-op where
 * Web Audio is unavailable (e.g. jsdom in tests).
 */

const SRC = `${import.meta.env.BASE_URL}sounds/click.wav`;
const VOLUME = 0.35;
type AudioContextCtor = typeof AudioContext;

function audioContextCtor(): AudioContextCtor | undefined {
  if (typeof window === 'undefined') return undefined;
  return window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext;
}

let context: AudioContext | null = null;
let buffer: AudioBuffer | null = null;
let enabled = true;

export function primeUiSounds(): void {
  if (!enabled) return;
  const Ctor = audioContextCtor();
  if (!Ctor) {
    enabled = false;
    return;
  }
  if (!context) {
    try {
      context = new Ctor();
    } catch {
      enabled = false;
      return;
    }
    void (async () => {
      try {
        const res = await fetch(SRC);
        buffer = await context!.decodeAudioData(await res.arrayBuffer());
      } catch {
        // a missing cue just stays silent
      }
    })();
  }
  if (context.state === 'suspended') void context.resume();
}

export function playClick(): void {
  if (!enabled || !context || !buffer) return;
  const source = context.createBufferSource();
  source.buffer = buffer;
  const gain = context.createGain();
  gain.gain.value = VOLUME;
  source.connect(gain).connect(context.destination);
  source.start();
}

/**
 * Wire a global, delegated click cue: any press on a button / link / role=button plays the
 * KotOR click. Returns a cleanup fn. Opt out on an element with `data-no-click-sound`.
 */
export function installClickSound(): () => void {
  if (typeof window === 'undefined') return () => {};
  const prime = () => primeUiSounds();
  window.addEventListener('pointerdown', prime, { once: true });

  const onClick = (e: MouseEvent) => {
    const el = (e.target as HTMLElement | null)?.closest('button, a, [role="button"]');
    if (!el || el.hasAttribute('disabled') || el.closest('[data-no-click-sound]')) return;
    playClick();
  };
  window.addEventListener('click', onClick, true);

  return () => {
    window.removeEventListener('pointerdown', prime);
    window.removeEventListener('click', onClick, true);
  };
}
