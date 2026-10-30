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
          ? "absolute bottom-2 left-0 right-0 z-40 w-full px-3 pb-1 pointer-events-none select-none flex flex-col items-center"
          : "fixed bottom-2 sm:bottom-3 left-0 right-0 z-40 max-w-md mx-auto px-4 pb-[max(env(safe-area-inset-bottom,0px),0.25rem)] pointer-events-none select-none flex flex-col items-center"
      }
    >
      {/* Compact iOS Floating Add Button */}
      <div className="w-full flex justify-end mb-1.5 sm:mb-2 pr-2 pointer-events-auto">
        <button
          id="floating-add-btn"
          role="button"
          aria-label="Añadir nueva suscripción"
          onClick={handleAddClick}
          className="relative group cursor-pointer select-none focus:outline-none"
          title="Añadir suscripción"
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute inset-0 rounded-full bg-emerald-500/30 blur-md -z-10 group-hover:bg-emerald-400/50 transition-all duration-300" />

          {/* Compact iOS Floating Button */}
          <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-emerald-500 via-emerald-400 to-teal-300 text-zinc-950 flex items-center justify-center shadow-lg shadow-black/40 border border-emerald-300/60 transition-all duration-150 group-hover:scale-105 active:scale-90">
            <Plus size={20} className="stroke-[2.8] text-zinc-950 transition-transform duration-150" />
          </div>
        </button>
      </div>

      {/* Slim Authentic iPhone Dock / Tab Bar */}
      <nav 
        role="tablist"
        aria-label="Navegación estilo iOS Dock"
        className="pointer-events-auto ios-dock rounded-full px-1.5 py-1 flex items-center justify-around relative gpu-accel transition-all duration-200 w-full max-w-[280px] sm:max-w-[290px] h-[50px] shadow-xl"
      >
        {/* Top specular glass shine */}
        <div className="pointer-events-none absolute inset-x-6 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/35 dark:via-white/20 to-transparent rounded-full" />

        {/* Dock Item 1: Suscripciones */}
        <button
          id="nav-tab-home"
          role="tab"
          aria-selected={activeTab === 'home'}
          aria-label="Suscripciones"
          onClick={() => handleTabClick('home')}
          className="group flex-1 h-[42px] rounded-full flex flex-col items-center justify-center relative cursor-pointer select-none active:scale-95 transition-transform duration-150"
        >
          {activeTab === 'home' && (
            <motion.div
              layoutId="activeDockPill"
              transition={{ type: 'spring', stiffness: 500, damping: 36 }}
              className="absolute inset-0 bg-emerald-500/15 dark:bg-emerald-500/20 rounded-full -z-10 shadow-xs border border-emerald-500/25"
            />
          )}
          <LayoutGrid 
            size={18} 
            className={`transition-colors duration-150 ${
              activeTab === 'home' 
                ? 'text-emerald-600 dark:text-emerald-400 stroke-[2.3]' 
                : 'text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 stroke-[1.8]'
            }`} 
          />
          <span className={`text-[10px] mt-0.5 tracking-tight leading-none transition-colors duration-150 ${
            activeTab === 'home'
              ? 'text-emerald-700 dark:text-emerald-300 font-bold'
              : 'text-zinc-500 dark:text-zinc-400 font-medium'
          }`}>
            Suscripciones
          </span>
        </button>

        {/* Dock Item 2: Analítica */}
        <button
          id="nav-tab-analytics"
          role="tab"
          aria-selected={activeTab === 'analytics'}
          aria-label="Analítica"
          onClick={() => handleTabClick('analytics')}
          className="group flex-1 h-[42px] rounded-full flex flex-col items-center justify-center relative cursor-pointer select-none active:scale-95 transition-transform duration-150"
        >
          {activeTab === 'analytics' && (
            <motion.div
              layoutId="activeDockPill"
              transition={{ type: 'spring', stiffness: 500, damping: 36 }}
              className="absolute inset-0 bg-emerald-500/15 dark:bg-emerald-500/20 rounded-full -z-10 shadow-xs border border-emerald-500/25"
            />
          )}
          <div className="relative flex items-center justify-center">
            <BarChart3 
              size={18} 
              className={`transition-colors duration-150 ${
                activeTab === 'analytics' 
                  ? 'text-emerald-600 dark:text-emerald-400 stroke-[2.3]' 
                  : 'text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 stroke-[1.8]'
              }`} 
            />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse border border-zinc-900" />
            )}
          </div>
          <span className={`text-[10px] mt-0.5 tracking-tight leading-none transition-colors duration-150 ${
            activeTab === 'analytics'
              ? 'text-emerald-700 dark:text-emerald-300 font-bold'
              : 'text-zinc-500 dark:text-zinc-400 font-medium'
          }`}>
            Analítica
          </span>
        </button>

        {/* Dock Item 3: Ajustes */}
        <button
          id="nav-tab-backup"
          role="tab"
          aria-selected={activeTab === 'backup'}
          aria-label="Ajustes"
          onClick={() => handleTabClick('backup')}
          className="group flex-1 h-[42px] rounded-full flex flex-col items-center justify-center relative cursor-pointer select-none active:scale-95 transition-transform duration-150"
        >
          {activeTab === 'backup' && (
            <motion.div
              layoutId="activeDockPill"
              transition={{ type: 'spring', stiffness: 500, damping: 36 }}
              className="absolute inset-0 bg-emerald-500/15 dark:bg-emerald-500/20 rounded-full -z-10 shadow-xs border border-emerald-500/25"
            />
          )}
          <Cloud 
            size={18} 
            className={`transition-colors duration-150 ${
              activeTab === 'backup' 
                ? 'text-emerald-600 dark:text-emerald-400 stroke-[2.3]' 
                : 'text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 stroke-[1.8]'
            }`} 
          />
          <span className={`text-[10px] mt-0.5 tracking-tight leading-none transition-colors duration-150 ${
            activeTab === 'backup'
              ? 'text-emerald-700 dark:text-emerald-300 font-bold'
              : 'text-zinc-500 dark:text-zinc-400 font-medium'
          }`}>
            Ajustes
          </span>
        </button>
      </nav>
    </div>
  );
};

