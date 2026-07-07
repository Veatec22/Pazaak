import type { ComponentType } from 'react';
import { ArrowLeft, ArrowLeftRight, Copy, Landmark, Play, Share2, UserX } from 'lucide-react';
import { ReactQRCode } from '@lglab/react-qr-code';

import type { CardPool } from '../../engine';
import { useI18n } from '../../net/useI18n';
import { inviteUrlForRoom } from '../../navigation';
import type { MatchController } from '../../ui/controller';
import { useCopyToClipboard } from '../../ui/clipboard';

const QR_ICON = `${import.meta.env.BASE_URL}brand/icon-192.png`;
const QR_SIZE = 144;
const QR_ICON_SIZE = 30;
const ONLINE_POOLS: CardPool[] = ['classic', 'flip', 'mix'];
const ONLINE_POOL_ICONS = {
  classic: Landmark,
  flip: ArrowLeftRight,
  mix: MixedPoolIcon,
} satisfies Record<CardPool, ComponentType<{ size?: number }>>;

type OnlineLobby = NonNullable<MatchController['onlineLobby']>;

export function WaitingRoom({
  roomId,
  onLeave,
  lobby,
}: {
  roomId: string;
  onLeave: () => void;
  lobby?: OnlineLobby;
}) {
  const { t } = useI18n();
  const url = inviteUrlForRoom(roomId);
  const [copiedLink, copy] = useCopyToClipboard();

  const share = () => {
    if (navigator.share) void navigator.share({ title: 'Pazaak', text: t('share_message'), url }).catch(() => {});
    else copy(url);
  };

  const canShare = typeof navigator !== 'undefined' && !!navigator.share;
  const isHost = lobby?.isHost ?? true;
  const hasOpponent = lobby?.connected ?? false;
  const guestName = lobby?.guestName?.trim() || t('opponent');

  return (
    <div className="pz-modal-overlay" onClick={onLeave}>
      <div className={`pz-modal-card pz-waiting-modal-card ${isHost ? 'host' : 'guest'}`} onClick={(e) => e.stopPropagation()}>
        <div className="pz-modal-header pz-waiting-modal-header">
          <h3>{lobby?.kicked ? t('online_lobby_kicked_title') : isHost ? t('room_created') : t('online_lobby_title')}</h3>
        </div>

        <div className="pz-modal-body pz-waiting-modal-body">
          <div className="pz-waiting-status">
            <span className="pz-pulse-dot pz-waiting-status-dot" />
            <span>
              {lobby?.kicked
                ? t('online_lobby_kicked')
                : isHost && !hasOpponent
                  ? t('waiting_opponent')
                  : t('online_lobby_connected')}
            </span>
          </div>

          {isHost ? (
            <div className="pz-invite-qr-panel">
              <div className="pz-invite-qr" data-testid="invite-qr" data-value={url}>
                <ReactQRCode
                  value={url}
                  size={QR_SIZE}
                  level="H"
                  marginSize={4}
                  background="#f7fffb"
                  dataModulesSettings={{ color: '#07130f', style: 'rounded' }}
                  finderPatternOuterSettings={{ color: '#07130f', style: 'rounded' }}
                  finderPatternInnerSettings={{ color: '#1ab28c', style: 'rounded' }}
                  imageSettings={{
                    src: QR_ICON,
                    width: QR_ICON_SIZE,
                    height: QR_ICON_SIZE,
                    excavate: true,
                  }}
                  svgProps={{ role: 'img', 'aria-label': t('invite_qr_label') }}
                />
              </div>
              <div className="pz-invite-qr-caption">{t('scan_qr_to_join')}</div>
            </div>
          ) : null}

          {isHost ? (
            <div className="pz-waiting-link-panel">
            <div className="pz-waiting-link-field">
              <label>{t('invite_link')}</label>
              <div className="pz-waiting-link-row">
                <input readOnly value={url} className="pz-share-url" onFocus={(e) => e.currentTarget.select()} />
                <button className="pz-btn" onClick={() => copy(url)}>
                  <Copy size={14} />
                  {copiedLink ? t('btn_copied') : t('btn_copy')}
                </button>
              </div>
            </div>
            </div>
          ) : null}

          {lobby && !lobby.kicked ? (
            <div className="pz-online-lobby-panel">
              {lobby.isHost && hasOpponent ? (
                <div className="pz-online-guest-row">
                  <span>
                    {t('online_lobby_guest')}: <strong>{guestName}</strong>
                  </span>
                  {lobby.kick ? (
                    <button className="pz-btn danger compact" type="button" onClick={lobby.kick}>
                      <UserX size={14} style={{ marginRight: '6px' }} />
                      {t('btn_kick')}
                    </button>
                  ) : null}
                </div>
              ) : null}
              <div className="pz-online-lobby-label">{t('online_lobby_mode')}</div>
              <div className="pz-online-mode-grid">
                {ONLINE_POOLS.map((pool) => (
                  <OnlineModeButton
                    key={pool}
                    active={lobby.mode === pool}
                    disabled={!lobby.isHost}
                    icon={ONLINE_POOL_ICONS[pool]}
                    label={t(`pool_${pool}`)}
                    onClick={() => lobby.setMode(pool)}
                  />
                ))}
              </div>
              <div className="pz-online-lobby-status">
                {lobby.isHost
                  ? t(lobby.guestReady ? 'online_lobby_guest_ready' : 'online_lobby_guest_not_ready')
                  : t(lobby.ready ? 'online_lobby_you_ready' : 'online_lobby_you_not_ready')}
              </div>
            </div>
          ) : null}

          <div className="pz-waiting-actions">
            {isHost && canShare ? (
              <button className="pz-btn primary" onClick={share}>
                <Share2 size={16} />
                {t('btn_share_link')}
              </button>
            ) : null}
            {lobby?.isHost ? (
              <button className="pz-btn primary" disabled={!lobby.canStart} onClick={lobby.start}>
                <Play size={16} />
                {t('btn_start_match')}
              </button>
            ) : null}
            {lobby && !lobby.isHost && !lobby.kicked ? (
              <button className={`pz-btn ${lobby.ready ? '' : 'primary'}`} onClick={lobby.toggleReady} disabled={lobby.kicked}>
                {lobby.ready ? t('btn_not_ready') : t('btn_ready')}
              </button>
            ) : null}
            <button className="pz-btn" onClick={onLeave}>
              <ArrowLeft size={16} />
              {t('btn_back')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function OnlineModeButton({
  active,
  disabled,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  disabled: boolean;
  icon: ComponentType<{ size?: number }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`pz-online-mode ${active ? 'active' : ''}`}
      disabled={disabled}
      onClick={onClick}
      type="button"
      aria-pressed={active}
    >
      <Icon size={15} />
      {label}
    </button>
  );
}

function MixedPoolIcon({ size = 20 }: { size?: number }) {
  const iconSize = Math.max(10, Math.round(size * 0.72));
  return (
    <span className="pz-combo-icon" aria-hidden>
      <ArrowLeftRight size={iconSize} />
      <Landmark size={iconSize} />
    </span>
  );
}
