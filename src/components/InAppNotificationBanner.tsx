import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X } from 'lucide-react';

interface InAppNotificationBannerProps {
  notification: { title: string; message: string } | null;
  onDismiss: () => void;
}

export const InAppNotificationBanner: React.FC<InAppNotificationBannerProps> = ({
  notification,
  onDismiss,
}) => {
  return (
    <AnimatePresence>
      {notification && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.88 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -35, scale: 0.9 }}
          transition={{ type: 'spring', damping: 26, stiffness: 420 }}
          className="fixed top-2.5 sm:top-3.5 left-0 right-0 z-50 flex justify-center px-3 pointer-events-none select-none"
        >
          <div 
            onClick={onDismiss}
            role="alert"
            aria-live="assertive"
            className="pointer-events-auto p-2.5 sm:p-3 px-4 sm:px-5 rounded-full bg-black/95 text-white border border-white/20 shadow-[0_20px_45px_rgba(0,0,0,0.85),0_0_15px_rgba(16,185,129,0.2)] flex items-center gap-3 backdrop-blur-2xl ring-1 ring-white/10 cursor-pointer active:scale-95 transition-transform max-w-sm w-auto"
          >
            {/* Live Activity Pulsing Beacon */}
            <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/40 relative">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping absolute" />
              <Bell size={13} className="stroke-[2.5] relative z-10" />
            </div>

            <div className="min-w-0 pr-1 text-left">
              <div className="flex items-center gap-1.5 leading-tight">
                <span className="text-xs font-bold text-white tracking-tight truncate">
                  {notification.title}
                </span>
                <span className="text-[9px] font-bold text-emerald-400 px-1.5 py-0.2 rounded-full bg-emerald-500/15 border border-emerald-500/30 shrink-0">
                  En vivo
                </span>
              </div>
              <p className="text-[11px] text-zinc-300 dark:text-zinc-400 truncate mt-0.5 leading-tight max-w-[210px] sm:max-w-[260px]">
                {notification.message}
              </p>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDismiss();
              }}
              className="w-6 h-6 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors flex items-center justify-center shrink-0 -mr-1"
              aria-label="Cerrar notificación"
            >
              <X size={13} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};


