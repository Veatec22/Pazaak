import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

import { PLAYLIST, type Track } from './playlist';

const BASE = import.meta.env.BASE_URL;
const LS_VOL = 'pz-music-volume';
const LS_MUTE = 'pz-music-muted';
const LS_LOOP = 'pz-music-loop';

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
  toggle: () => void;
  next: () => void;
  prev: () => void;
  seek: (t: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  cycleLoop: () => void;
}

const MusicContext = createContext<MusicState | null>(null);

export function useMusic(): MusicState {
  const ctx = useContext(MusicContext);
  if (!ctx) throw new Error('useMusic must be used within MusicProvider');
  return ctx;
}

export function MusicProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const startedRef = useRef(false);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(() => localStorage.getItem(LS_MUTE) === '1');
  const [volume, setVolumeState] = useState(() => {
    const v = parseFloat(localStorage.getItem(LS_VOL) ?? '');
    return Number.isFinite(v) ? v : 0.4;
  });
  const [loopMode, setLoopMode] = useState<LoopMode>(() => (localStorage.getItem(LS_LOOP) === 'one' ? 'one' : 'all'));

  const track = PLAYLIST[index];

  // Push volume/mute to the element and persist preferences.
  useEffect(() => {
    const a = audioRef.current;
    if (a) {
      a.volume = volume;
      a.muted = muted;
    }
    localStorage.setItem(LS_VOL, String(volume));
    localStorage.setItem(LS_MUTE, muted ? '1' : '0');
    localStorage.setItem(LS_LOOP, loopMode);
  }, [volume, muted, loopMode]);

  // When the track changes, resume playback if we were playing.
  useEffect(() => {
    if (playing) void audioRef.current?.play().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  // Autoplay policy: start on the first interaction anywhere on the page.
  useEffect(() => {
    const start = () => {
      if (startedRef.current) return;
      startedRef.current = true;
      setPlaying(true);
      void audioRef.current?.play().catch(() => {});
    };
    window.addEventListener('pointerdown', start, { once: true });
    window.addEventListener('keydown', start, { once: true });
    return () => {
      window.removeEventListener('pointerdown', start);
      window.removeEventListener('keydown', start);
    };
  }, []);

  const toggle = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      setPlaying(true);
      void a.play().catch(() => {});
    } else {
      a.pause();
      setPlaying(false);
    }
  }, []);

  const next = useCallback(() => setIndex((i) => (i + 1) % PLAYLIST.length), []);

  const prev = useCallback(() => {
    const a = audioRef.current;
    if (a && a.currentTime > 3) {
      a.currentTime = 0; // first press restarts the current track
      return;
    }
    setIndex((i) => (i - 1 + PLAYLIST.length) % PLAYLIST.length);
  }, []);

  const seek = useCallback((t: number) => {
    const a = audioRef.current;
    if (a) {
      a.currentTime = t;
      setCurrentTime(t);
    }
  }, []);

  const setVolume = useCallback((v: number) => {
    setVolumeState(v);
    if (v > 0) setMuted(false);
  }, []);

  const toggleMute = useCallback(() => setMuted((m) => !m), []);

  const cycleLoop = useCallback(() => setLoopMode((m) => (m === 'all' ? 'one' : 'all')), []);

  // onEnded is rebound every render, so it reads the current loopMode/index without staleness.
  const handleEnded = () => {
    if (loopMode === 'one') {
      const a = audioRef.current;
      if (a) {
        a.currentTime = 0;
        void a.play().catch(() => {});
      }
      return;
    }
    setIndex((i) => (i + 1) % PLAYLIST.length);
  };

  const value: MusicState = {
    track,
    index,
    playing,
    loopMode,
    muted,
    volume,
    currentTime,
    duration,
    toggle,
    next,
    prev,
    seek,
    setVolume,
    toggleMute,
    cycleLoop,
  };

  return (
    <MusicContext.Provider value={value}>
      <audio
        ref={audioRef}
        src={`${BASE}music/${track.file}`}
        preload="auto"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={handleEnded}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
      />
      {children}
    </MusicContext.Provider>
  );
}
