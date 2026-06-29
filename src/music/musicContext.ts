import { createContext, useContext } from 'react';

import { type Track } from './playlist';

export type LoopMode = 'all' | 'one';

export interface MusicState {
  track: Track;
  index: number;
  playing: boolean;
  loopMode: LoopMode;
  muted: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  analyser: AnalyserNode | null;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  seek: (t: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  cycleLoop: () => void;
}

export const MusicContext = createContext<MusicState | null>(null);

export function useMusic(): MusicState {
  const ctx = useContext(MusicContext);
  if (!ctx) throw new Error('useMusic must be used within MusicProvider');
  return ctx;
}
