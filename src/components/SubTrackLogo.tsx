import React from 'react';

export type SubTrackLogoVariant = 'full' | 'icon' | 'badge' | 'image' | 'artwork';
export type SubTrackLogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

interface SubTrackLogoProps {
  variant?: SubTrackLogoVariant;
  size?: SubTrackLogoSize | number;
  className?: string;
  showText?: boolean;
  altText?: string;
  onClick?: () => void;
}

export const SubTrackLogo: React.FC<SubTrackLogoProps> = ({
  variant = 'full',
  size = 'md',
  className = '',
  showText = true,
  altText = 'SubTrack Logo',
  onClick,
}) => {
  // Dimension mapping
  const sizeMap: Record<SubTrackLogoSize, { icon: number; text: string; gap: string }> = {
    xs: { icon: 22, text: 'text-xs', gap: 'gap-1.5' },
    sm: { icon: 30, text: 'text-sm', gap: 'gap-2' },
    md: { icon: 38, text: 'text-base', gap: 'gap-2.5' },
    lg: { icon: 48, text: 'text-xl', gap: 'gap-3' },
    xl: { icon: 64, text: 'text-2xl', gap: 'gap-3.5' },
    '2xl': { icon: 96, text: 'text-3xl', gap: 'gap-4' },
  };

  const currentSize = typeof size === 'number'
    ? { icon: size, text: size > 40 ? 'text-xl' : 'text-sm', gap: 'gap-2' }
    : sizeMap[size];

  // If variant is 'artwork', render the complete original user uploaded square artwork
  if (variant === 'artwork') {
    return (
      <div 
        onClick={onClick}
        className={`inline-flex items-center justify-center ${onClick ? 'cursor-pointer tap-tactile' : ''} ${className}`}
        title={altText}
      >
        <div 
          className="relative rounded-2xl overflow-hidden shadow-lg shadow-blue-500/15 border border-blue-500/25 bg-black shrink-0 flex items-center justify-center p-1"
          style={{ width: currentSize.icon * 1.6, height: currentSize.icon * 1.6 }}
        >
          <img
            src="/subtrack-logo.png"
            alt={altText}
            referrerPolicy="no-referrer"
            className="w-full h-full object-contain"
          />
        </div>
      </div>
    );
  }

  // Icon artwork container using the authentic new SubTrack emblem
  const iconGraphic = (
    <div 
      className="relative rounded-2xl overflow-hidden shadow-md shadow-blue-500/15 border border-blue-500/25 bg-black shrink-0 flex items-center justify-center"
      style={{ width: currentSize.icon, height: currentSize.icon }}
    >
      <img
        src="/subtrack-icon.png?v=3"
        alt={altText}
        referrerPolicy="no-referrer"
        className="w-full h-full object-contain p-0.5"
      />
    </div>
  );

  // Styled wordmark typography
  const textGraphic = showText && (
    <span className={`font-black tracking-tight leading-none select-none ${currentSize.text}`}>
      <span className="text-blue-600 dark:text-blue-500">Sub</span>
      <span className="text-sky-500 dark:text-sky-400">Track</span>
      <span className="text-emerald-500">.</span>
    </span>
  );

  if (variant === 'icon') {
    return (
      <div 
        onClick={onClick} 
        className={`inline-flex items-center justify-center shrink-0 ${onClick ? 'cursor-pointer tap-tactile' : ''} ${className}`}
        title={altText}
      >
        {iconGraphic}
      </div>
    );
  }

  if (variant === 'badge') {
    return (
      <div
        onClick={onClick}
        className={`inline-flex items-center justify-center rounded-2xl bg-zinc-950 p-2 border border-blue-500/25 shadow-lg shadow-blue-500/10 ${onClick ? 'cursor-pointer tap-tactile' : ''} ${className}`}
        style={{ width: currentSize.icon + 16, height: currentSize.icon + 16 }}
      >
        {iconGraphic}
      </div>
    );
  }

  // Default 'full' and 'image' variants: Icon + Wordmark
  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center ${currentSize.gap} group ${onClick ? 'cursor-pointer tap-tactile' : ''} ${className}`}
    >
      {iconGraphic}
      {textGraphic}
    </div>
  );
};
