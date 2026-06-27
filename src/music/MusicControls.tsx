import { Music, Pause, Play, Repeat, Repeat1, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { useState } from 'react';

import { useMusic } from './MusicProvider';
import { Tooltip } from '../components/menu/Tooltip';
import './music.css';

function fmt(t: number): string {
  if (!Number.isFinite(t) || t < 0) return '0:00';
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function MusicControls() {
  const m = useMusic();
  const [open, setOpen] = useState(false);

  const loopTitle = m.loopMode === 'one' ? 'Loop: this track' : 'Loop: playlist';

  return (
    <div className="pz-music-container">
      {open ? <div className="pz-dropdown-backdrop" onClick={() => setOpen(false)} /> : null}
      <Tooltip content="Cantina music">
        <button
          className={`pz-topbar-btn ${open ? 'active' : ''}`}
          onClick={() => setOpen((o) => !o)}
          aria-label="Cantina music"
        >
          <Music size={20} strokeWidth={3} />
          {m.playing && !m.muted ? <span className="pz-music-dot" aria-hidden /> : null}
        </button>
      </Tooltip>

      {open ? (
        <div className="pz-music-dropdown">
          <div className="pz-music-meta">
            <span className="pz-music-title">{m.track.title}</span>
            <span className="pz-music-game">{m.track.game}</span>
          </div>

          <div className="pz-music-progress">
            <span className="pz-music-time">{fmt(m.currentTime)}</span>
            <input
              type="range"
              min={0}
              max={m.duration || 0}
              step={0.1}
              value={Math.min(m.currentTime, m.duration || 0)}
              onChange={(e) => m.seek(parseFloat(e.target.value))}
              aria-label="Seek"
            />
            <span className="pz-music-time">{fmt(m.duration)}</span>
          </div>

          <div className="pz-music-ctrls">
            <button onClick={m.prev} aria-label="Previous track" title="Previous">
              <SkipBack size={16} />
            </button>
            <button onClick={m.toggle} className="primary" aria-label={m.playing ? 'Pause' : 'Play'}>
              {m.playing ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <button onClick={m.next} aria-label="Next track" title="Next">
              <SkipForward size={16} />
            </button>
            <button onClick={m.cycleLoop} className="on" aria-label={loopTitle} title={loopTitle}>
              {m.loopMode === 'one' ? <Repeat1 size={16} /> : <Repeat size={16} />}
            </button>
          </div>

          <div className="pz-music-vol">
            <button onClick={m.toggleMute} aria-label={m.muted ? 'Unmute' : 'Mute'} title={m.muted ? 'Unmute' : 'Mute'}>
              {m.muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={m.muted ? 0 : m.volume}
              onChange={(e) => m.setVolume(parseFloat(e.target.value))}
              aria-label="Volume"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
