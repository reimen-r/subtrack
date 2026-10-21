import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses =
    'relative inline-flex items-center justify-center font-medium select-none transition-all duration-150 cursor-pointer active:scale-95 disabled:active:scale-100 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2';

  const sizeClasses = {
    sm: 'h-9 px-3 text-xs rounded-lg gap-1.5 min-w-[36px]',
    md: 'h-11 px-4 text-sm rounded-xl gap-2 min-h-[44px]', // 44px Apple HIG standard
    lg: 'h-12 px-6 text-base rounded-xl gap-2.5 min-h-[48px]',
  }[size];

  const variantClasses = {
    primary:
      'bg-emerald-500 text-zinc-950 font-semibold hover:bg-emerald-400 shadow-sm shadow-emerald-500/20 active:bg-emerald-600',
    secondary:
      'bg-zinc-800 text-zinc-100 hover:bg-zinc-700 active:bg-zinc-800 border border-zinc-700/60 dark:bg-zinc-800 dark:text-zinc-100',
    outline:
      'bg-transparent text-zinc-200 hover:bg-zinc-800/60 hover:text-white border border-zinc-700/80 active:bg-zinc-800',
    ghost:
      'bg-transparent text-zinc-300 hover:bg-zinc-800/60 hover:text-white active:bg-zinc-800',
    danger:
      'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 active:bg-rose-500/30 border border-rose-500/20',
  }[variant];

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${widthClass} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg
          className="animate-spin h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="3"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
      ) : (
        icon && <span className="inline-flex shrink-0">{icon}</span>
      )}
      <span>{children}</span>
    </button>
  );
};
