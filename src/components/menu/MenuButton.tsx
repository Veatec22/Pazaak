import type { ComponentType } from 'react';

export interface MenuButtonProps {
  icon: ComponentType<{ size?: number }>;
  title: string;
  desc?: string;
  primary?: boolean;
  active?: boolean;
  disabled?: boolean;
  'data-testid'?: string;
  onClick?: () => void;
}

export function MenuButton({ icon: Icon, title, desc, primary, active, disabled, onClick, 'data-testid': testId }: MenuButtonProps) {
  const className = ['pz-btn', 'big', primary && 'primary', active && 'active', disabled && 'disabled']
    .filter(Boolean)
    .join(' ');
  return (
    <button className={className} onClick={onClick} disabled={disabled} title={disabled ? desc : undefined} data-testid={testId}>
      <span className="pz-btn-title">
        <Icon size={20} />
        {title}
      </span>
      {desc ? <small>{desc}</small> : null}
    </button>
  );
}
