import type { ComponentType } from 'react';

export interface MenuButtonProps {
  icon: ComponentType<{ size?: number }>;
  title: string;
  desc?: string;
  primary?: boolean;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

/** The big stacked menu button (icon + title + sub-label) used across every menu screen. */
export function MenuButton({ icon: Icon, title, desc, primary, active, disabled, onClick }: MenuButtonProps) {
  const className = ['pz-btn', 'big', primary && 'primary', active && 'active', disabled && 'disabled']
    .filter(Boolean)
    .join(' ');
  return (
    <button className={className} onClick={onClick} disabled={disabled} title={disabled ? desc : undefined}>
      <span className="pz-btn-title">
        <Icon size={20} />
        {title}
      </span>
      {desc ? <small>{desc}</small> : null}
    </button>
  );
}
