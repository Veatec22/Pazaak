import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

import { PLAYLIST } from './playlist';
import { MusicContext, type MusicState, type LoopMode } from './musicContext';

const BASE = import.meta.env.BASE_URL;
const LS_VOL = 'pz-music-volume';
const LS_MUTE = 'pz-music-muted';
const LS_LOOP = 'pz-music-loop';

export function MusicProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const startedRef = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  const ensureAnalyser = useCallback(() => {
    if (!analyserRef.current && audioRef.current) {
      try {
        const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new Ctx();
        const src = ctx.createMediaElementSource(audioRef.current);
        const an = ctx.createAnalyser();
        an.fftSize = 256;
        an.smoothingTimeConstant = 0.8;
        src.connect(an);
        an.connect(ctx.destination);
        audioCtxRef.current = ctx;
        analyserRef.current = an;
        setAnalyser(an);
      } catch {
        void 0;
      }
    }
    void audioCtxRef.current?.resume();
  }, []);
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

  useEffect(() => {
    if (playing) void audioRef.current?.play().catch(() => {});
  }, [index, playing]);

  useEffect(() => {
    const start = () => {
      if (startedRef.current) return;
      startedRef.current = true;
      ensureAnalyser();
      setPlaying(true);
      void audioRef.current?.play().catch(() => {});
    };
    window.addEventListener('pointerdown', start, { once: true });
    window.addEventListener('keydown', start, { once: true });
    return () => {
      window.removeEventListener('pointerdown', start);
      window.removeEventListener('keydown', start);
    };
  }, [ensureAnalyser]);

  const toggle = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      ensureAnalyser();
      setPlaying(true);
      void a.play().catch(() => {});
    } else {
      a.pause();
      setPlaying(false);
    }
  }, [ensureAnalyser]);

  const next = useCallback(() => setIndex((i) => (i + 1) % PLAYLIST.length), []);

  const prev = useCallback(() => {
    const a = audioRef.current;
    if (a && a.currentTime > 3) {
      a.currentTime = 0;
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
    analyser,
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
