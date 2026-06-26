/**
 * KotOR II UI click sound (extracted from Sounds.bif → gui_click).
 * Played through the Web Audio API so rapid clicks can overlap without the
 * latency of cloning <audio> elements. Fully no-ops where Web Audio is
 * unavailable (e.g. jsdom in tests).
 */

export type UiSound = 'click';

const SOURCES: Record<UiSound, string> = {
  click: '/sounds/click.wav',
};

const VOLUME = 0.35;

type AudioContextCtor = typeof AudioContext;

function audioContextCtor(): AudioContextCtor | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }
  return window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext;
}

let context: AudioContext | null = null;
const buffers = new Map<UiSound, AudioBuffer>();
let enabled = true;

/** Create/resume the context on a user gesture and decode the sounds once. */
export function primeUiSounds(): void {
  if (!enabled) {
    return;
  }
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
    void Promise.all(
      (Object.keys(SOURCES) as UiSound[]).map(async (name) => {
        try {
          const response = await fetch(SOURCES[name]);
          const data = await response.arrayBuffer();
          buffers.set(name, await context!.decodeAudioData(data));
        } catch {
          // A missing sound is non-fatal; that cue just stays silent.
        }
      }),
    );
  }
  if (context.state === 'suspended') {
    void context.resume();
  }
}

export function playUiSound(name: UiSound): void {
  if (!enabled || !context) {
    return;
  }
  const buffer = buffers.get(name);
  if (!buffer) {
    return;
  }
  const source = context.createBufferSource();
  source.buffer = buffer;
  const gain = context.createGain();
  gain.gain.value = VOLUME;
  source.connect(gain).connect(context.destination);
  source.start();
}

export function setUiSoundsEnabled(value: boolean): void {
  enabled = value;
}
