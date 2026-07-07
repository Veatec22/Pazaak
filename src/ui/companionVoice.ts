import type { Companion, CompanionVoiceCategory } from '../companions/companions';
import { isSfxMuted } from './sounds';

const VOLUME = 0.8;
type AudioContextCtor = typeof AudioContext;

function audioContextCtor(): AudioContextCtor | undefined {
  if (typeof window === 'undefined') return undefined;
  return window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext;
}

let context: AudioContext | null = null;
let enabled = true;
const buffers = new Map<string, AudioBuffer>();
const pending = new Map<string, Promise<AudioBuffer | null>>();

function ensureContext(): AudioContext | null {
  if (!enabled) return null;
  const Ctor = audioContextCtor();
  if (!Ctor) {
    enabled = false;
    return null;
  }
  if (!context) {
    try {
      context = new Ctor();
    } catch {
      enabled = false;
      return null;
    }
  }
  if (context.state === 'suspended') void context.resume();
  return context;
}

function loadBuffer(url: string): Promise<AudioBuffer | null> {
  const cached = buffers.get(url);
  if (cached) return Promise.resolve(cached);
  const inFlight = pending.get(url);
  if (inFlight) return inFlight;

  const promise = (async () => {
    const ctx = ensureContext();
    if (!ctx) return null;
    try {
      const response = await fetch(url);
      const buffer = await ctx.decodeAudioData(await response.arrayBuffer());
      buffers.set(url, buffer);
      return buffer;
    } catch {
      return null;
    } finally {
      pending.delete(url);
    }
  })();
  pending.set(url, promise);
  return promise;
}

export function primeCompanionVoice(companion: Companion): void {
  if (!ensureContext()) return;
  const urls = Object.values(companion.voice).flat();
  urls.forEach((url) => void loadBuffer(url));
}

export function playCompanionLine(companion: Companion, category: CompanionVoiceCategory, index?: number): void {
  if (isSfxMuted()) return;
  const lines = companion.voice[category];
  if (!lines || lines.length === 0) return;
  const url = index != null ? lines[Math.min(index, lines.length - 1)] : lines[Math.floor(Math.random() * lines.length)];

  void (async () => {
    const buffer = await loadBuffer(url);
    const ctx = context;
    if (!buffer || !ctx) return;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.value = VOLUME;
    source.connect(gain).connect(ctx.destination);
    source.start();
  })();
}
