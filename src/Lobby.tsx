import { useState } from 'react';
import { useLobby, useNickname, getRandomNickname } from './net/useLobby';
import './lobby.css';

// -----------------------------------------------------------------------------
// MAIN MENU
// -----------------------------------------------------------------------------

export function MainMenu({
  onGoMultiplayer,
  onHotSeat,
}: {
  onGoMultiplayer: () => void;
  onHotSeat: () => void;
}) {
  return (
    <div className="pz-lobby pz-main-menu">
      <div className="pz-logo-container">
        <h1>Pazaak</h1>
        <div className="pz-logo-subtitle">Republic Cantina Edition</div>
      </div>
      <p className="pz-tag">
        The classic card game from KotOR. Duel another player or play local hotseat.
      </p>

      <div className="pz-lobby-actions">
        <button className="pz-btn primary big" onClick={onGoMultiplayer}>
          Multiplayer
          <small>Host or browse online matches (P2P)</small>
        </button>

        <button className="pz-btn big" onClick={onHotSeat}>
          Pass &amp; Play
          <small>Two players, one device</small>
        </button>

        <button className="pz-btn big disabled" disabled title="Single Player against AI - Coming Soon!">
          Single Player
          <small>Duel the computer (Offline) — Comming soon</small>
        </button>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// MULTIPLAYER MENU
// -----------------------------------------------------------------------------

export function MultiplayerMenu({
  onPlayFriend,
  onLeave,
}: {
  onPlayFriend: () => void;
  onLeave: () => void;
}) {
  const [nickname, setNickname] = useNickname();
  const [activeTab, setActiveTab] = useState<'none' | 'join' | 'search'>('none');
  const [joinCode, setJoinCode] = useState('');
  
  // Only connect to the lobby room when the search list is open
  const { activeGames, connecting } = useLobby(activeTab === 'search');

  const handleRandomizeName = () => {
    setNickname(getRandomNickname());
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let code = joinCode.trim();
    const urlMatch = /[#&]room=([^&]+)/.exec(code);
    if (urlMatch) {
      code = decodeURIComponent(urlMatch[1]);
    }
    if (code) {
      location.hash = `room=${code}`;
    }
  };

  return (
    <div className="pz-lobby pz-multi-menu">
      <button className="pz-leave" onClick={onLeave}>
        ← Back
      </button>

      <h2>Multiplayer</h2>

      {/* Nickname Panel */}
      <div className="pz-nickname-panel">
        <label htmlFor="nickname">Your Nickname</label>
        <div className="pz-nickname-input-group">
          <input
            id="nickname"
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={20}
            placeholder="Type nickname..."
          />
          <button
            className="pz-btn icon-btn"
            onClick={handleRandomizeName}
            title="Randomize Name"
            aria-label="Randomize Name"
          >
            🎲
          </button>
        </div>
      </div>

      <div className="pz-lobby-actions">
        <button className="pz-btn primary big" onClick={onPlayFriend}>
          Create Match
          <small>Host a new game and wait for players</small>
        </button>

        <button
          className={`pz-btn big ${activeTab === 'join' ? 'active' : ''}`}
          onClick={() => setActiveTab(activeTab === 'join' ? 'none' : 'join')}
        >
          Join via Code
          <small>Enter a Room Code or Invite Link</small>
        </button>

        {activeTab === 'join' && (
          <form className="pz-join-form" onSubmit={handleJoinSubmit}>
            <input
              type="text"
              placeholder="Paste link or room code..."
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              autoFocus
            />
            <button className="pz-btn primary" type="submit" disabled={!joinCode.trim()}>
              Connect
            </button>
          </form>
        )}

        <button
          className={`pz-btn big ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => setActiveTab(activeTab === 'search' ? 'none' : 'search')}
        >
          Browse Matches
          <small>Scan for active hosts waiting in the lobby</small>
        </button>

        {activeTab === 'search' && (
          <div className="pz-server-list">
            <h3>Active Servers</h3>
            {connecting ? (
              <div className="pz-lobby-status">
                <span className="pz-spinner"></span> Scanning holonet...
              </div>
            ) : activeGames.length === 0 ? (
              <div className="pz-lobby-empty">
                No active games found. Tell a friend to click "Create Match" or host one yourself!
              </div>
            ) : (
              <div className="pz-server-grid">
                {activeGames.map((game) => (
                  <div className="pz-server-card" key={game.peerId}>
                    <div className="pz-server-info">
                      <span className="pz-server-host">{game.hostName}</span>
                      <span className="pz-server-code">Code: {game.roomId}</span>
                    </div>
                    <button
                      className="pz-btn primary sm"
                      onClick={() => {
                        location.hash = `room=${game.roomId}`;
                      }}
                    >
                      Join
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// WAITING ROOM SCREEN
// -----------------------------------------------------------------------------

export function WaitingRoom({ roomId, onLeave }: { roomId: string; onLeave: () => void }) {
  const url = `${location.origin}${location.pathname}#room=${roomId}`;
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const copyLink = () => {
    void navigator.clipboard?.writeText(url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  const copyCode = () => {
    void navigator.clipboard?.writeText(roomId).then(() => {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    });
  };

  const share = () => {
    if (navigator.share) {
      void navigator.share({ title: 'Pazaak', text: 'Join my pazaak game', url }).catch(() => {});
    } else {
      copyLink();
    }
  };

  const canShare = typeof navigator !== 'undefined' && !!navigator.share;

  return (
    <div className="pz-lobby pz-waiting-room">
      <button className="pz-leave" onClick={onLeave}>
        ← Cancel
      </button>

      <div className="pz-waiting-card">
        <div className="pz-waiting-header">
          <h2>Game Room Created</h2>
          <div className="pz-pulse-status">
            <span className="pz-pulse-dot"></span> Waiting for opponent...
          </div>
        </div>

        <div className="pz-waiting-fields">
          <div className="pz-waiting-field">
            <label>Room Code</label>
            <div className="pz-input-row">
              <input readOnly value={roomId} className="pz-share-url" />
              <button className="pz-btn" onClick={copyCode}>
                {copiedCode ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="pz-waiting-field">
            <label>Invite Link</label>
            <div className="pz-input-row">
              <input readOnly value={url} className="pz-share-url" onFocus={(e) => e.currentTarget.select()} />
              <button className="pz-btn" onClick={copyLink}>
                {copiedLink ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </div>

        <div className="pz-waiting-actions">
          {canShare && (
            <button className="pz-btn primary" onClick={share}>
              Share Link
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// SHARE BAR (TOP HEADER IN ACTIVE ONLINE GAME)
// -----------------------------------------------------------------------------

export function ShareBar({ roomId }: { roomId: string }) {
  const url = `${location.origin}${location.pathname}#room=${roomId}`;
  const [copied, setCopied] = useState(false);

  const copy = () => {
    void navigator.clipboard?.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const share = () => {
    if (navigator.share) {
      void navigator.share({ title: 'Pazaak', text: 'Join my pazaak game', url }).catch(() => {});
    } else {
      copy();
    }
  };

  const canShare = typeof navigator !== 'undefined' && !!navigator.share;

  return (
    <div className="pz-share">
      <span className="pz-share-label">Match Room: <strong>{roomId}</strong></span>
      <input className="pz-share-url" readOnly value={url} onFocus={(e) => e.currentTarget.select()} />
      <button className="pz-btn" onClick={copy}>
        {copied ? 'Copied!' : 'Copy Link'}
      </button>
      {canShare ? (
        <button className="pz-btn primary" onClick={share}>
          Share
        </button>
      ) : null}
    </div>
  );
}
