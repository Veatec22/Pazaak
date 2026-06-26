





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
