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
          initial={{ opacity: 0, y: -40, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -30, scale: 0.94 }}
          transition={{ type: 'spring', damping: 28, stiffness: 400 }}
          className="fixed top-3.5 left-3 right-3 sm:left-4 sm:right-4 z-50 max-w-md mx-auto pointer-events-auto"
        >
          <div 
            onClick={onDismiss}
            className="p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-zinc-950/90 dark:bg-black/90 backdrop-blur-2xl border border-white/15 dark:border-zinc-800 shadow-2xl shadow-black/80 flex items-start justify-between gap-3 text-white ring-1 ring-white/10 cursor-pointer active:scale-[0.99] transition-transform select-none"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-black flex items-center justify-center shrink-0 font-bold shadow-md shadow-emerald-500/20">
                <Bell size={16} className="stroke-[2.5]" />
              </div>
              <div className="text-xs">
                <div className="flex items-center gap-1.5 font-bold text-white tracking-tight">
                  <span>{notification.title}</span>
                  <span className="text-[9px] text-emerald-400 font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30">
                    Ahora
                  </span>
                </div>
                <p className="text-zinc-300 dark:text-zinc-400 mt-0.5 leading-relaxed text-[11px]">
                  {notification.message}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDismiss();
              }}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors shrink-0"
              aria-label="Cerrar notificación"
            >
              <X size={15} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

