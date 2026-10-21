import React from 'react';

export interface InputFieldProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}

export const InputField = React.forwardRef<HTMLInputElement, InputFieldProps>(
  (
    {
      label,
      error,
      helperText,
      leadingIcon,
      trailingIcon,
      id,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-semibold text-zinc-300 select-none tracking-tight flex items-center justify-between"
          >
            <span>{label}</span>
          </label>
        )}
        <div className="relative flex items-center w-full">
          {leadingIcon && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-zinc-400">
              {leadingIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={`w-full h-11 min-h-[44px] bg-zinc-900 border ${
              error ? 'border-rose-500/80' : 'border-zinc-700/80 focus:border-emerald-500'
            } text-base sm:text-sm text-zinc-100 placeholder:text-zinc-500 rounded-xl px-3.5 ${
              leadingIcon ? 'pl-10' : ''
            } ${
              trailingIcon ? 'pr-10' : ''
            } transition-colors outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
            {...props}
          />
          {trailingIcon && (
            <div className="absolute right-3.5 flex items-center text-zinc-400">
              {trailingIcon}
            </div>
          )}
        </div>
        {error ? (
          <span className="text-xs text-rose-400 font-medium pl-1">{error}</span>
        ) : helperText ? (
          <span className="text-xs text-zinc-400 pl-1">{helperText}</span>
        ) : null}
      </div>
    );
  }
);

InputField.displayName = 'InputField';
