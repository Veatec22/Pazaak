import './lobby.css';

export function Lobby({ onPlayFriend, onHotSeat }: { onPlayFriend: () => void; onHotSeat: () => void }) {
  return (
    <div className="pz-lobby">
      <h1>Pazaak</h1>
      <p className="pz-tag">The KotOR card game — play a friend in your browser. No account, no server.</p>
      <div className="pz-lobby-actions">
        <button className="pz-btn primary big" onClick={onPlayFriend}>
          Play a friend
          <small>Create a room and share the link</small>
        </button>
        <button className="pz-btn big" onClick={onHotSeat}>
          Pass &amp; play
          <small>Two players, one device</small>
        </button>
      </div>
    </div>
  );
}

export function ShareBar({ roomId }: { roomId: string }) {
  const url = `${location.origin}${location.pathname}#room=${roomId}`;

  const copy = () => void navigator.clipboard?.writeText(url).catch(() => {});
  const share = () => {
    if (navigator.share) void navigator.share({ title: 'Pazaak', text: 'Join my pazaak game', url }).catch(() => {});
    else copy();
  };
  const canShare = typeof navigator !== 'undefined' && !!navigator.share;

  return (
    <div className="pz-share">
      <span className="pz-share-label">Invite link</span>
      <input className="pz-share-url" readOnly value={url} onFocus={(e) => e.currentTarget.select()} />
      <button className="pz-btn" onClick={copy}>
        Copy
      </button>
      {canShare ? (
        <button className="pz-btn primary" onClick={share}>
          Share
        </button>
      ) : null}
    </div>
  );
}
