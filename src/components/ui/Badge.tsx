import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'emerald' | 'amber' | 'rose' | 'zinc' | 'blue';
  size?: 'sm' | 'md';
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'zinc',
  size = 'md',
  dot = false,
  className = '',
  ...props
}) => {
  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 font-medium tracking-tight',
    md: 'text-xs px-2.5 py-1 font-semibold tracking-tight',
  }[size];

  const variantClasses = {
    emerald: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    amber: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    rose: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
    zinc: 'bg-zinc-800 text-zinc-300 border border-zinc-700/60',
    blue: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
  }[variant];

  const dotClasses = {
    emerald: 'bg-emerald-400',
    amber: 'bg-amber-400',
    rose: 'bg-rose-400',
    zinc: 'bg-zinc-400',
    blue: 'bg-blue-400',
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full select-none ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotClasses}`} />}
      {children}
    </span>
  );
};
