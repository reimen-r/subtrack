import React from 'react';
import { motion } from 'motion/react';
import { LayoutGrid, BarChart3, Plus, Cloud } from 'lucide-react';

export type TabType = 'home' | 'analytics' | 'backup';

interface BottomNavBarProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  onOpenAddModal: () => void;
  unreadNotificationsCount?: number;
  isPhoneFrame?: boolean;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onChangeTab,
  onOpenAddModal,
  unreadNotificationsCount = 0,
  isPhoneFrame = false,
}) => {
  const handleTabClick = (tab: TabType) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(8);
      } catch {
        // ignore
      }
    }
    onChangeTab(tab);
  };

  const handleAddClick = () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(14);
      } catch {
        // ignore
      }
    }
    onOpenAddModal();
  };

  return (
    <div
      className={
        isPhoneFrame
          ? "absolute bottom-3 left-0 right-0 z-40 w-full px-4 pb-2 pointer-events-none select-none flex flex-col items-center"
          : "fixed bottom-3 sm:bottom-4 left-0 right-0 z-40 max-w-lg mx-auto px-4 pb-[max(env(safe-area-inset-bottom,0px),0.5rem)] pointer-events-none select-none flex flex-col items-center"
      }
    >
      {/* Floating Action Button in Bottom Right Corner outside the Dock */}
      <div className="w-full flex justify-end mb-2.5 sm:mb-3 pr-1 pointer-events-auto">
        <button
          id="floating-add-btn"
          role="button"
          aria-label="Añadir nueva suscripción"
          onClick={handleAddClick}
          className="relative group cursor-pointer select-none focus:outline-none"
          title="Añadir suscripción"
        >
          {/* Ambient Glow */}
          <div className="absolute inset-0 rounded-2xl sm:rounded-[22px] bg-emerald-500/40 blur-lg -z-10 animate-pulse group-hover:bg-emerald-400/60 transition-all duration-300" />

          {/* iOS Floating Button Orb */}
          <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl sm:rounded-[22px] bg-gradient-to-tr from-emerald-500 via-emerald-400 to-teal-300 text-zinc-950 font-black flex items-center justify-center shadow-[0_12px_28px_rgba(0,0,0,0.45),0_0_22px_rgba(16,185,129,0.4)] border border-emerald-300/60 transition-all duration-200 group-hover:scale-105 active:scale-90 group-active:rotate-90">
            <Plus size={26} className="stroke-[3] text-zinc-950 transition-transform duration-200" />
          </div>
        </button>
      </div>

      {/* iOS Inspired Floating Dock */}
      <nav 
        role="tablist"
        aria-label="Navegación estilo iOS Dock"
        className="pointer-events-auto ios-dock rounded-[30px] sm:rounded-[34px] p-1.5 sm:p-2 flex items-center justify-around gap-2 relative gpu-accel transition-all duration-200 w-full max-w-[340px] shadow-2xl"
      >
        {/* Top specular glass shine */}
        <div className="pointer-events-none absolute inset-x-6 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 dark:via-white/25 to-transparent rounded-full" />
        
        {/* Bottom ambient glow */}
        <div className="pointer-events-none absolute -bottom-2 inset-x-8 h-4 bg-emerald-500/10 blur-xl rounded-full" />

        {/* Dock Item 1: Suscripciones */}
        <button
          id="nav-tab-home"
          role="tab"
          aria-selected={activeTab === 'home'}
          aria-label="Suscripciones"
          onClick={() => handleTabClick('home')}
          className="group flex-1 min-h-[52px] py-1 px-1 rounded-2xl flex flex-col items-center justify-center relative cursor-pointer select-none active:scale-90 transition-transform duration-150"
        >
          {activeTab === 'home' && (
            <motion.div
              layoutId="activeDockPill"
              transition={{ type: 'spring', stiffness: 500, damping: 36 }}
              className="absolute inset-0 bg-black/5 dark:bg-white/10 rounded-2xl -z-10 shadow-sm border border-black/5 dark:border-white/10"
            />
          )}
          <div className={`w-8 h-8 rounded-[12px] flex items-center justify-center transition-all duration-200 ${
            activeTab === 'home'
              ? 'bg-blue-500/20 text-blue-500 dark:text-blue-400 border border-blue-500/30 shadow-sm shadow-blue-500/20'
              : 'text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-800 dark:group-hover:text-zinc-200'
          }`}>
            <LayoutGrid size={18} className={activeTab === 'home' ? 'stroke-[2.4]' : 'stroke-2'} />
          </div>
          <span className={`text-[11px] mt-0.5 tracking-tight ${
            activeTab === 'home'
              ? 'text-zinc-950 dark:text-white font-bold'
              : 'text-zinc-600 dark:text-zinc-300 font-medium'
          }`}>
            Suscripciones
          </span>
          {activeTab === 'home' && (
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400 shadow-[0_0_6px_rgba(59,130,246,0.8)] mt-0.5" />
          )}
        </button>

        {/* Dock Item 2: Analíticas */}
        <button
          id="nav-tab-analytics"
          role="tab"
          aria-selected={activeTab === 'analytics'}
          aria-label="Analíticas"
          onClick={() => handleTabClick('analytics')}
          className="group flex-1 min-h-[52px] py-1 px-1 rounded-2xl flex flex-col items-center justify-center relative cursor-pointer select-none active:scale-90 transition-transform duration-150"
        >
          {activeTab === 'analytics' && (
            <motion.div
              layoutId="activeDockPill"
              transition={{ type: 'spring', stiffness: 500, damping: 36 }}
              className="absolute inset-0 bg-black/5 dark:bg-white/10 rounded-2xl -z-10 shadow-sm border border-black/5 dark:border-white/10"
            />
          )}
          <div className={`w-8 h-8 rounded-[12px] flex items-center justify-center relative transition-all duration-200 ${
            activeTab === 'analytics'
              ? 'bg-purple-500/20 text-purple-500 dark:text-purple-400 border border-purple-500/30 shadow-sm shadow-purple-500/20'
              : 'text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-800 dark:group-hover:text-zinc-200'
          }`}>
            <BarChart3 size={18} className={activeTab === 'analytics' ? 'stroke-[2.4]' : 'stroke-2'} />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse border border-zinc-900" />
            )}
          </div>
          <span className={`text-[11px] mt-0.5 tracking-tight ${
            activeTab === 'analytics'
              ? 'text-zinc-950 dark:text-white font-bold'
              : 'text-zinc-600 dark:text-zinc-300 font-medium'
          }`}>
            Analíticas
          </span>
          {activeTab === 'analytics' && (
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 dark:bg-purple-400 shadow-[0_0_6px_rgba(168,85,247,0.8)] mt-0.5" />
          )}
        </button>

        {/* Dock Item 3: Copia Nube */}
        <button
          id="nav-tab-backup"
          role="tab"
          aria-selected={activeTab === 'backup'}
          aria-label="Copia Nube"
          onClick={() => handleTabClick('backup')}
          className="group flex-1 min-h-[52px] py-1 px-1 rounded-2xl flex flex-col items-center justify-center relative cursor-pointer select-none active:scale-90 transition-transform duration-150"
        >
          {activeTab === 'backup' && (
            <motion.div
              layoutId="activeDockPill"
              transition={{ type: 'spring', stiffness: 500, damping: 36 }}
              className="absolute inset-0 bg-black/5 dark:bg-white/10 rounded-2xl -z-10 shadow-sm border border-black/5 dark:border-white/10"
            />
          )}
          <div className={`w-8 h-8 rounded-[12px] flex items-center justify-center transition-all duration-200 ${
            activeTab === 'backup'
              ? 'bg-sky-500/20 text-sky-500 dark:text-sky-400 border border-sky-500/30 shadow-sm shadow-sky-500/20'
              : 'text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-800 dark:group-hover:text-zinc-200'
          }`}>
            <Cloud size={18} className={activeTab === 'backup' ? 'stroke-[2.4]' : 'stroke-2'} />
          </div>
          <span className={`text-[11px] mt-0.5 tracking-tight ${
            activeTab === 'backup'
              ? 'text-zinc-950 dark:text-white font-bold'
              : 'text-zinc-600 dark:text-zinc-300 font-medium'
          }`}>
            Copia Nube
          </span>
          {activeTab === 'backup' && (
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 dark:bg-sky-400 shadow-[0_0_6px_rgba(14,165,233,0.8)] mt-0.5" />
          )}
        </button>
      </nav>
    </div>
  );
};

