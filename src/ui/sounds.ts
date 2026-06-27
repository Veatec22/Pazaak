import { useState, useEffect } from 'react';

export type PazaakSound =
  | 'drawmain'
  | 'playside'
  | 'startturn'
  | 'warnbust'
  | 'winset'
  | 'loseset'
  | 'winmatch'
  | 'losematch';

const BASE = import.meta.env.BASE_URL;

const SOURCES: Record<PazaakSound, string> = {
  drawmain: `${BASE}pazaak/sounds/mgs_drawmain.wav`,
  playside: `${BASE}pazaak/sounds/mgs_playside.wav`,
  startturn: `${BASE}pazaak/sounds/mgs_startturn.wav`,
  warnbust: `${BASE}pazaak/sounds/mgs_warnbust.wav`,
  winset: `${BASE}pazaak/sounds/mgs_winset.wav`,
  loseset: `${BASE}pazaak/sounds/mgs_loseset.wav`,
  winmatch: `${BASE}pazaak/sounds/mgs_winmatch.wav`,
  losematch: `${BASE}pazaak/sounds/mgs_losematch.wav`,
};

const VOLUME = 0.5;
type AudioContextCtor = typeof AudioContext;

function audioContextCtor(): AudioContextCtor | undefined {
  if (typeof window === 'undefined') return undefined;
  return window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext;
}

let context: AudioContext | null = null;
const buffers = new Map<PazaakSound, AudioBuffer>();
let enabled = true;

let sfxMuted = typeof window !== 'undefined' ? localStorage.getItem('pz-sfx-muted') === 'true' : false;
const sfxListeners = new Set<(muted: boolean) => void>();

export function isSfxMuted(): boolean {
  return sfxMuted;
}

export function setSfxMuted(muted: boolean): void {
  sfxMuted = muted;
  if (typeof window !== 'undefined') {
    localStorage.setItem('pz-sfx-muted', String(muted));
  }
  sfxListeners.forEach((l) => l(muted));
}

export function useSfxMute() {
  const [muted, setMutedState] = useState(sfxMuted);

  useEffect(() => {
    const handler = (m: boolean) => setMutedState(m);
    sfxListeners.add(handler);
    return () => {
      sfxListeners.delete(handler);
    };
  }, []);

  return {
    muted,
    toggle: () => setSfxMuted(!sfxMuted),
  };
}

export function primePazaakSounds(): void {
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
    void Promise.all(
      (Object.keys(SOURCES) as PazaakSound[]).map(async (name) => {
        try {
          const response = await fetch(SOURCES[name]);
          buffers.set(name, await context!.decodeAudioData(await response.arrayBuffer()));
        } catch {
          // ignore failed sound loads
        }
      }),
    );
  }
  if (context.state === 'suspended') void context.resume();
}

export function playPazaakSound(name: PazaakSound): void {
  if (sfxMuted || !enabled || !context) return;
  const buffer = buffers.get(name);
  if (!buffer) return;
  const source = context.createBufferSource();
  source.buffer = buffer;
  const gain = context.createGain();
  gain.gain.value = VOLUME;
  source.connect(gain).connect(context.destination);
  source.start();
}
