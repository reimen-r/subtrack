import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'glass';
  interactive?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  interactive = false,
  className = '',
  ...props
}) => {
  const baseClasses = 'rounded-2xl transition-all duration-200 border';

  const variantClasses = {
    default:
      'bg-zinc-900/90 border-zinc-800/80 text-zinc-100 shadow-sm shadow-black/20',
    elevated:
      'bg-zinc-900 border-zinc-700/80 text-zinc-100 shadow-md shadow-black/30',
    glass:
      'bg-zinc-950/70 backdrop-blur-xl border-zinc-800/80 text-zinc-100 shadow-lg shadow-black/40',
  }[variant];

  const interactiveClasses = interactive
    ? 'cursor-pointer hover:border-zinc-700 hover:bg-zinc-900/95 active:scale-[0.99] select-none'
    : '';

  return (
    <div
      className={`${baseClasses} ${variantClasses} ${interactiveClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
