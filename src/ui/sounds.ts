/**
 * KotOR II pazaak sound cues (extracted from Sounds.bif → mgs_* minigame sounds), played
 * through the Web Audio API. No-ops where Web Audio is unavailable (e.g. jsdom in tests).
 * Ported from the HK-47 web app.
 */

export type PazaakSound =
  | 'drawmain'
  | 'playside'
  | 'startturn'
  | 'warnbust'
  | 'winset'
  | 'loseset'
  | 'winmatch'
  | 'losematch';

const SOURCES: Record<PazaakSound, string> = {
  drawmain: '/pazaak/sounds/mgs_drawmain.wav',
  playside: '/pazaak/sounds/mgs_playside.wav',
  startturn: '/pazaak/sounds/mgs_startturn.wav',
  warnbust: '/pazaak/sounds/mgs_warnbust.wav',
  winset: '/pazaak/sounds/mgs_winset.wav',
  loseset: '/pazaak/sounds/mgs_loseset.wav',
  winmatch: '/pazaak/sounds/mgs_winmatch.wav',
  losematch: '/pazaak/sounds/mgs_losematch.wav',
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
          // a missing cue just stays silent
        }
      }),
    );
  }
  if (context.state === 'suspended') void context.resume();
}

export function playPazaakSound(name: PazaakSound): void {
  if (!enabled || !context) return;
  const buffer = buffers.get(name);
  if (!buffer) return;
  const source = context.createBufferSource();
  source.buffer = buffer;
  const gain = context.createGain();
  gain.gain.value = VOLUME;
  source.connect(gain).connect(context.destination);
  source.start();
}
