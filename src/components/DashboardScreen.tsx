import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Plus, 
  Filter, 
  Calendar, 
  ArrowUpDown, 
  TrendingUp, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  ChevronRight, 
  Layers, 
  CreditCard,
  Zap,
  SlidersHorizontal,
  ChevronDown,
  Cloud,
  Download,
  Users,
  AlertCircle,
  CalendarPlus,
  MoreVertical,
  ExternalLink,
  X,
  ArrowUpRight,
  TrendingDown,
  Check
} from 'lucide-react';
import { Subscription, SubscriptionCategory, CurrencyCode, PriceChangeRecord } from '../types';
import { ServiceLogo } from './ServiceLogo';
import { SubTrackLogo } from './SubTrackLogo';
import { CATEGORY_CONFIG } from '../data/presets';
import { 
  formatCurrency, 
  formatRelativeDueDate, 
  getMonthlyEquivalent, 
  getYearlyEquivalent,
  formatShortMonthDay,
  formatDateDisplay,
  getUserRealShareCost,
  getUserMonthlyEquivalent,
  getUserYearlyEquivalent,
  getSubscriptionOwedAmount,
  calculateTotalOwedSummary,
  getBillingCycleProgress,
  getPriceHikeStats
} from '../utils/subscriptionUtils';
import { generateICS, downloadICS, getGoogleCalendarUrl } from '../utils/calendarExport';
import confetti from 'canvas-confetti';
import { SwipeableSubscriptionCard } from './SwipeableSubscriptionCard';

interface DashboardScreenProps {
  subscriptions: Subscription[];
  onSelectSubscription: (sub: Subscription) => void;
  onOpenAddModal: () => void;
  onQuickMarkPaid?: (sub: Subscription) => void;
  onUpdateSubscription?: (sub: Subscription) => void;
  onNavigateToBackup?: () => void;
  onEditSubscription?: (sub: Subscription) => void;
}

type SortOption = 'next_due' | 'highest_cost' | 'lowest_cost' | 'name' | 'shared_only';

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  subscriptions,
  onSelectSubscription,
  onOpenAddModal,
  onQuickMarkPaid,
  onUpdateSubscription,
  onNavigateToBackup,
  onEditSubscription,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortOption, setSortOption] = useState<SortOption>('next_due');
  const [spendViewMode, setSpendViewMode] = useState<'monthly' | 'yearly'>('monthly');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showNetShare, setShowNetShare] = useState(true);

  // Quick Action & Calendar Modals
  const [quickActionSub, setQuickActionSub] = useState<Subscription | null>(null);
  const [showBulkCalendarModal, setShowBulkCalendarModal] = useState(false);
  const [bulkCalendarExported, setBulkCalendarExported] = useState(false);
  const [showQuickPriceModal, setShowQuickPriceModal] = useState(false);
  const [quickNewPrice, setQuickNewPrice] = useState('');
  const [quickNewPriceReason, setQuickNewPriceReason] = useState('Subida oficial de tarifa');

  // Close modals on Escape key press
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (quickActionSub) setQuickActionSub(null);
        else if (showBulkCalendarModal) setShowBulkCalendarModal(false);
        else if (showQuickPriceModal) setShowQuickPriceModal(false);
        else if (showSortDropdown) setShowSortDropdown(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [quickActionSub, showBulkCalendarModal, showQuickPriceModal, showSortDropdown]);

  // Financial Metrics Calculation
  const totalMonthlySpend = useMemo(() => {
    return subscriptions
      .filter((s) => s.status === 'active')
      .reduce((sum, s) => sum + (showNetShare ? getUserMonthlyEquivalent(s) : getMonthlyEquivalent(s.cost, s.frequency)), 0);
  }, [subscriptions, showNetShare]);

  const totalYearlySpend = useMemo(() => {
    return subscriptions
      .filter((s) => s.status === 'active')
      .reduce((sum, s) => sum + (showNetShare ? getUserYearlyEquivalent(s) : getYearlyEquivalent(s.cost, s.frequency)), 0);
  }, [subscriptions, showNetShare]);

  // Aggregate debt metrics across all shared subscriptions
  const owedSummary = useMemo(() => {
    return calculateTotalOwedSummary(subscriptions);
  }, [subscriptions]);

  const hasSharedSubs = useMemo(() => {
    return subscriptions.some((s) => s.splitPlan?.isShared);
  }, [subscriptions]);

  // Upcoming payments in chronological order for Current Month / Horizon
  const upcomingSubscriptions = useMemo(() => {
    return [...subscriptions]
      .filter((s) => s.status === 'active')
      .sort((a, b) => new Date(a.nextBillingDate).getTime() - new Date(b.nextBillingDate).getTime());
  }, [subscriptions]);

  // Filtered & Sorted list for the main list
  const filteredSubscriptions = useMemo(() => {
    return subscriptions
      .filter((sub) => {
        const matchesSearch =
          sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          sub.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (sub.domain && sub.domain.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (sub.splitPlan?.members?.some((m) => m.name.toLowerCase().includes(searchQuery.toLowerCase())));

        const matchesCategory =
          selectedCategory === 'All' || 
          (selectedCategory === 'Shared' ? Boolean(sub.splitPlan?.isShared) : sub.category === selectedCategory);

        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        if (sortOption === 'next_due') {
          return new Date(a.nextBillingDate).getTime() - new Date(b.nextBillingDate).getTime();
        }
        if (sortOption === 'highest_cost') {
          return (
            (showNetShare ? getUserMonthlyEquivalent(b) : getMonthlyEquivalent(b.cost, b.frequency)) -
            (showNetShare ? getUserMonthlyEquivalent(a) : getMonthlyEquivalent(a.cost, a.frequency))
          );
        }
        if (sortOption === 'lowest_cost') {
          return (
            (showNetShare ? getUserMonthlyEquivalent(a) : getMonthlyEquivalent(a.cost, a.frequency)) -
            (showNetShare ? getUserMonthlyEquivalent(b) : getMonthlyEquivalent(b.cost, b.frequency))
          );
        }
        if (sortOption === 'shared_only') {
          const aShared = a.splitPlan?.isShared ? 1 : 0;
          const bShared = b.splitPlan?.isShared ? 1 : 0;
          return bShared - aShared;
        }
        if (sortOption === 'name') {
          return a.name.localeCompare(b.name);
        }
        return 0;
      });
  }, [subscriptions, searchQuery, selectedCategory, sortOption, showNetShare]);

  // Grouped by Category for sectioned view if desired
  const categoriesPresent = useMemo(() => {
    const set = new Set<string>();
    subscriptions.forEach((s) => set.add(s.category));
    const list = ['All'];
    if (hasSharedSubs) list.push('Shared');
    return [...list, ...Array.from(set)];
  }, [subscriptions, hasSharedSubs]);

  // Dynamic counts per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      All: subscriptions.length,
      Shared: subscriptions.filter((s) => s.splitPlan?.isShared).length,
    };
    subscriptions.forEach((s) => {
      counts[s.category] = (counts[s.category] || 0) + 1;
    });
    return counts;
  }, [subscriptions]);

  return (
    <div id="dashboard-screen" className="flex-1 flex flex-col bg-slate-50 dark:bg-black text-zinc-900 dark:text-white min-h-full pb-36 sm:pb-32">
      
      {/* Top Header & Spend Breakdown */}
      <div className="px-3.5 sm:px-5 pt-3.5 sm:pt-5 pb-3 sm:pb-4 space-y-3.5 sm:space-y-4">
        
        {/* App Title & Spend Summary */}
        <div className="flex items-start justify-between flex-wrap gap-2.5 sm:gap-4 p-4 rounded-2xl bg-white/95 dark:bg-zinc-900/90 border border-zinc-200/90 dark:border-zinc-800/80 shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                {spendViewMode === 'monthly' ? 'Gasto mensual estimado' : 'Compromiso anual proyectado'}
              </h2>
              {hasSharedSubs && (
                <button
                  onClick={() => setShowNetShare(!showNetShare)}
                  className="px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 transition-colors tap-tactile cursor-pointer"
                  title="Cambiar entre tu cuota real y coste total proveedor"
                >
                  {showNetShare ? 'Tu cuota real' : 'Coste total'}
                </button>
              )}
            </div>

            <div className="flex items-baseline gap-2.5">
              <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white tabular-nums">
                {spendViewMode === 'monthly'
                  ? formatCurrency(totalMonthlySpend, 'USD')
                  : formatCurrency(totalYearlySpend, 'USD')}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {subscriptions.filter((s) => s.status === 'active').length} activas
              </span>
            </div>
          </div>

          {/* Monthly / Yearly Toggle Segmented Control (Apple HIG) */}
          <div className="flex p-1 bg-zinc-100 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800/80 rounded-xl shrink-0 gap-1">
            <button
              onClick={() => setSpendViewMode('monthly')}
              className={`min-h-[40px] px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all tap-tactile cursor-pointer ${
                spendViewMode === 'monthly'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              Mensual
            </button>
            <button
              onClick={() => setSpendViewMode('yearly')}
              className={`min-h-[40px] px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all tap-tactile cursor-pointer ${
                spendViewMode === 'yearly'
                  ? 'bg-emerald-500 text-zinc-950 font-bold shadow-sm shadow-emerald-500/20'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              Anual
            </button>
          </div>
        </div>

        {/* 👥 Shared Plans Pending Debt Banner (if friends owe money) */}
        {owedSummary.totalPending > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-zinc-900 to-indigo-900/30 border border-amber-500/30 flex items-center justify-between gap-2.5 sm:gap-3 shadow-sm"
          >
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                <Users size={16} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-bold text-white truncate tabular-nums">
                    Te deben {formatCurrency(owedSummary.totalPending, 'USD')}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[11px] font-bold shrink-0">
                    {owedSummary.pendingCount} {owedSummary.pendingCount === 1 ? 'amigo' : 'amigos'}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 truncate">
                  En planes familiares compartidos
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedCategory('Shared')}
              className="min-h-[38px] px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-bold border border-amber-500/30 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Ver Planes
            </button>
          </motion.div>
        )}

        {/* Featured Next Payment Card */}
        {upcomingSubscriptions.length > 0 && (
          <div 
            onClick={() => onSelectSubscription(upcomingSubscriptions[0])}
            className="bg-gradient-to-br from-emerald-50 via-white to-emerald-100/40 dark:from-zinc-900 dark:via-zinc-900 dark:to-emerald-950/40 border border-emerald-500/25 dark:border-emerald-500/30 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-md shadow-emerald-500/5 dark:shadow-black/40 cursor-pointer tap-tactile transition-all relative overflow-hidden group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Próxima renovación
                </h3>
                {upcomingSubscriptions[0].splitPlan?.isShared && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                    <Users size={11} /> Plan familiar
                  </span>
                )}
              </div>
              <span className="bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0">
                {formatRelativeDueDate(upcomingSubscriptions[0].nextBillingDate).label}
              </span>
            </div>

            <div className="flex justify-between items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-bold text-lg sm:text-xl text-zinc-900 dark:text-white leading-tight truncate">
                  {upcomingSubscriptions[0].name}
                </p>
                <p className="text-zinc-500 dark:text-zinc-400 text-xs sm:text-sm mt-1 truncate tabular-nums">
                  {formatShortMonthDay(upcomingSubscriptions[0].nextBillingDate)} • {
                    upcomingSubscriptions[0].splitPlan?.isShared
                      ? `Tu parte: ${formatCurrency(getUserRealShareCost(upcomingSubscriptions[0]), upcomingSubscriptions[0].currency)}`
                      : `${formatCurrency(upcomingSubscriptions[0].cost, upcomingSubscriptions[0].currency)} (${upcomingSubscriptions[0].frequency})`
                  }
                </p>
              </div>

              <div className="h-11 w-11 sm:h-12 sm:w-12 bg-white dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
                <ServiceLogo
                  name={upcomingSubscriptions[0].name}
                  domain={upcomingSubscriptions[0].domain}
                  logoUrl={upcomingSubscriptions[0].logoUrl}
                  color={upcomingSubscriptions[0].color}
                  iconName={upcomingSubscriptions[0].iconName}
                  size="sm"
                />
              </div>
            </div>

            {/* Hero Billing Proximity Progress Bar */}
            {(() => {
              const heroProgress = getBillingCycleProgress(upcomingSubscriptions[0]);
              return (
                <div className="mt-3 pt-3 border-t border-emerald-500/15 dark:border-zinc-800/80">
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400 mb-1.5">
                    <span className="flex items-center gap-1.5 font-medium">
                      <span className={`w-1.5 h-1.5 rounded-full ${heroProgress.isOverdue ? 'bg-rose-500 animate-pulse' : heroProgress.isDueToday ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                      {heroProgress.statusText}
                    </span>
                    <span className="font-bold tabular-nums text-zinc-700 dark:text-zinc-300">{heroProgress.percent}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-950/80 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-800/60">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${heroProgress.percent}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className={`h-full rounded-full ${heroProgress.isOverdue ? 'bg-rose-500' : heroProgress.isDueToday ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    />
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Upcoming Renewals Horizontal Stream */}
        {upcomingSubscriptions.length > 1 && (
          <div className="space-y-2 pt-0.5">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Próximos vencimientos
              </h3>
              <span className="text-[11px] text-zinc-500 font-medium">Desliza para explorar</span>
            </div>

            <div className="flex gap-2 sm:gap-2.5 overflow-x-auto pb-1.5 no-scrollbar -mx-3.5 px-3.5 sm:-mx-5 sm:px-5 snap-x snap-mandatory">
              {upcomingSubscriptions.slice(1, 6).map((sub) => {
                const dueInfo = formatRelativeDueDate(sub.nextBillingDate);
                const isUrgent = dueInfo.label === 'Today' || dueInfo.label === 'Tomorrow' || dueInfo.label === 'Hoy' || dueInfo.label.includes('días') || dueInfo.label.includes('days');
                return (
                  <div
                    key={sub.id}
                    onClick={() => onSelectSubscription(sub)}
                    className="snap-start shrink-0 w-[140px] xs:w-[155px] sm:w-44 p-3 rounded-2xl bg-white dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 tap-tactile transition-all cursor-pointer shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <ServiceLogo
                        name={sub.name}
                        domain={sub.domain}
                        logoUrl={sub.logoUrl}
                        color={sub.color}
                        iconName={sub.iconName}
                        size="sm"
                      />
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap ${
                        isUrgent 
                          ? 'bg-rose-500/15 text-rose-500 dark:text-rose-400 border border-rose-500/30' 
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/60'
                      }`}>
                        {dueInfo.label}
                      </span>
                    </div>

                    <div className="font-semibold text-zinc-900 dark:text-white text-xs truncate">
                      {sub.name}
                    </div>

                    <div className="flex items-baseline justify-between mt-1 text-[11px] tabular-nums">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(sub.cost, sub.currency)}
                      </span>
                      <span className="text-zinc-500 text-[11px]">
                        {formatShortMonthDay(sub.nextBillingDate)}
                      </span>
                    </div>

                    {/* Subtle Progress Bar */}
                    {(() => {
                      const subProgress = getBillingCycleProgress(sub);
                      return (
                        <div className="w-full mt-2 pt-1.5 border-t border-zinc-100 dark:border-zinc-800/50">
                          <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 mb-1 font-medium">
                            <span className="truncate">{subProgress.statusText}</span>
                            <span className="shrink-0 ml-1 font-semibold text-zinc-700 dark:text-zinc-300 tabular-nums">{subProgress.percent}%</span>
                          </div>
                          <div className="w-full h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-300"
                              style={{
                                width: `${subProgress.percent}%`,
                                backgroundColor: subProgress.isOverdue
                                  ? '#f43f5e'
                                  : subProgress.isDueToday
                                  ? '#f59e0b'
                                  : subProgress.daysUntil <= 3
                                  ? '#10b981'
                                  : (sub.color || '#10b981'),
                              }}
                            />
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Search & Sort Controls (iOS 18 Liquid Glass style) */}
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                <Search size={15} />
              </div>
              <input
                id="search-subscriptions-input"
                type="text"
                placeholder="Buscar suscripciones por nombre, categoría, notas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 sm:pl-10 pr-16 py-2.5 bg-white/90 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200/90 dark:border-white/10 rounded-2xl text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-xs transition-all shadow-xs"
              />
              {searchQuery && (
                <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 tabular-nums hidden xs:inline">
                    {filteredSubscriptions.length}
                  </span>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="w-6 h-6 rounded-full bg-zinc-200/80 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white flex items-center justify-center text-xs transition-colors cursor-pointer"
                    aria-label="Limpiar búsqueda"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* Bulk Calendar Export Button (44pt touch target) */}
            <button
              id="bulk-calendar-export-btn"
              onClick={() => setShowBulkCalendarModal(true)}
              className="min-h-[44px] min-w-[44px] rounded-2xl bg-white/90 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200/90 dark:border-white/10 text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center justify-center text-xs font-semibold transition-colors shadow-xs active:scale-95 cursor-pointer"
              title="Sincronizar suscripciones con Calendario (.ics)"
              aria-label="Exportar a Calendario"
            >
              <CalendarPlus size={16} />
            </button>

            {/* Sort Toggle Button (44pt touch target) */}
            <div className="relative">
              <button
                id="sort-toggle-btn"
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="min-h-[44px] min-w-[44px] rounded-2xl bg-white/90 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200/90 dark:border-white/10 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white flex items-center justify-center text-xs font-semibold shadow-xs active:scale-95 cursor-pointer"
                aria-label="Ordenar suscripciones"
              >
                <ArrowUpDown size={15} />
              </button>

              {showSortDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl border border-zinc-200 dark:border-white/10 rounded-2xl shadow-xl z-40 p-1.5 space-y-1">
                  <div className="px-2.5 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Ordenar por</div>
                  {[
                    { key: 'next_due', label: 'Próxima renovación' },
                    { key: 'highest_cost', label: 'Mayor coste' },
                    { key: 'lowest_cost', label: 'Menor coste' },
                    { key: 'shared_only', label: 'Planes compartidos' },
                    { key: 'name', label: 'Nombre (A-Z)' },
                  ].map((s) => (
                    <button
                      key={s.key}
                      onClick={() => {
                        setSortOption(s.key as SortOption);
                        setShowSortDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                        sortOption === s.key ? 'bg-indigo-600 text-white font-bold' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Category Filter Chips with dynamic counts & 44pt touch compliance */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar -mx-3.5 px-3.5 sm:-mx-5 sm:px-5 overscroll-contain">
            {categoriesPresent.map((cat) => {
              const isSelected = selectedCategory === cat;
              const count = categoryCounts[cat] || 0;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`min-h-[44px] px-3.5 py-1.5 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all border flex items-center gap-1.5 shrink-0 active:scale-95 cursor-pointer backdrop-blur-xl ${
                    isSelected
                      ? 'bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/35 dark:border-emerald-500/40 shadow-xs'
                      : 'bg-white/80 dark:bg-zinc-900/75 text-zinc-600 dark:text-zinc-400 border-zinc-200/90 dark:border-white/10 hover:text-zinc-900 dark:hover:text-zinc-200 hover:border-zinc-300 dark:hover:border-white/20 shadow-xs'
                  }`}
                >
                  {cat === 'Shared' ? <Users size={13} className="text-indigo-500 dark:text-indigo-400" /> : null}
                  <span>{cat === 'Shared' ? 'Compartidas' : cat === 'All' ? 'Todas' : cat}</span>
                  <span className={`text-[10px] tabular-nums ${isSelected ? 'text-emerald-700 dark:text-emerald-300 font-bold' : 'text-zinc-400 dark:text-zinc-500 font-normal'}`}>
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Subscriptions List */}
      <div className="px-3.5 sm:px-5 space-y-2.5 sm:space-y-3 flex-1">
        {subscriptions.length > 0 ? (
          <>
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300 px-1">
              <span>Suscripciones activas ({filteredSubscriptions.length})</span>
              <button 
                type="button"
                className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:text-emerald-500 tap-tactile cursor-pointer" 
                onClick={() => setSelectedCategory('All')}
              >
                {selectedCategory !== 'All' ? 'Ver todas' : 'Todos los ciclos'}
              </button>
            </div>

            <div className="space-y-2 sm:space-y-2.5">
              {filteredSubscriptions.map((sub) => (
                <SwipeableSubscriptionCard
                  key={sub.id}
                  sub={sub}
                  onSelectSubscription={onSelectSubscription}
                  onQuickMarkPaid={onQuickMarkPaid}
                  onEdit={onEditSubscription || onSelectSubscription}
                  onOpenQuickActions={(target) => setQuickActionSub(target)}
                />
              ))}

              {filteredSubscriptions.length === 0 && (
                <div className="text-center py-12 px-4 rounded-3xl bg-white/60 dark:bg-zinc-900/40 border border-zinc-200/90 dark:border-white/10 space-y-3.5 backdrop-blur-xl">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto shadow-inner">
                    <Search size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-zinc-900 dark:text-white text-sm">No se encontraron resultados</h3>
                    <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">
                      {searchQuery 
                        ? `No hay suscripciones que coincidan con "${searchQuery}" en la categoría seleccionada.`
                        : `No hay suscripciones activas en la categoría "${selectedCategory}".`}
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2 pt-1">
                    {(searchQuery || selectedCategory !== 'All') && (
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedCategory('All');
                        }}
                        className="px-4 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-semibold text-xs transition-colors cursor-pointer"
                      >
                        Limpiar filtros
                      </button>
                    )}
                    <button
                      onClick={onOpenAddModal}
                      className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/20"
                    >
                      <Plus size={14} />
                      <span>Nueva suscripción</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Dedicated Zero State when starting from scratch */
          <div className="py-8 px-5 rounded-3xl bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 text-center space-y-5 shadow-sm">
            <div className="flex justify-center">
              <SubTrackLogo variant="image" size="xl" showText={false} />
            </div>

            <div className="space-y-1.5 max-w-xs mx-auto">
              <h3 className="font-bold text-zinc-900 dark:text-white text-base">
                Todo listo en SubTrack
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Añade tus servicios y suscripciones recurrentes para controlar tus gastos y recibir recordatorios antes de cada renovación.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
              <button
                id="btn-add-first-sub"
                onClick={onOpenAddModal}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition-all active:scale-[0.98] inline-flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                <Plus size={16} />
                <span>Añadir primera suscripción</span>
              </button>

              {onNavigateToBackup && (
                <button
                  id="btn-restore-from-backup"
                  onClick={onNavigateToBackup}
                  className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white font-bold text-xs transition-all active:scale-[0.98] inline-flex items-center justify-center gap-2"
                >
                  <Cloud size={15} className="text-indigo-400" />
                  <span>Restaurar desde iCloud / Drive</span>
                </button>
              )}
            </div>

            {/* Popular quick add recommendations */}
            <div className="pt-3 border-t border-zinc-800/80 text-left">
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-3 text-center">
                Sugerencias populares rápidas
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { name: 'Netflix', domain: 'netflix.com', cat: 'Entertainment', color: '#E50914' },
                  { name: 'Spotify', domain: 'spotify.com', cat: 'Music & Audio', color: '#1DB954' },
                  { name: 'ChatGPT Plus', domain: 'openai.com', cat: 'Productivity', color: '#10A37F' },
                  { name: 'Apple iCloud', domain: 'apple.com', cat: 'Cloud', color: '#0071E3' },
                ].map((sug) => (
                  <button
                    key={sug.name}
                    onClick={onOpenAddModal}
                    className="p-2.5 rounded-xl bg-black border border-zinc-800 hover:border-zinc-700 flex items-center gap-2 text-left transition-colors"
                  >
                    <ServiceLogo name={sug.name} domain={sug.domain} color={sug.color} size="sm" />
                    <div className="min-w-0">
                      <span className="font-bold text-xs text-white block truncate">{sug.name}</span>
                      <span className="text-[9px] text-zinc-500 block truncate">{sug.cat}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* System Status Banner */}
        <div className="pt-2 pb-1">
          <div className="p-3 sm:p-3.5 border border-zinc-800 rounded-xl sm:rounded-2xl bg-zinc-900/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] sm:text-xs font-bold text-zinc-300">Control de renovaciones activo</span>
            </div>
            <button
              onClick={() => setShowBulkCalendarModal(true)}
              className="text-[9.5px] sm:text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
            >
              <CalendarPlus size={11} />
              <span>Sincronizar Calendario</span>
            </button>
          </div>
        </div>

        {/* Modal: Quick Actions Menu */}
        <AnimatePresence>
          {quickActionSub && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm">
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-labelledby="quick-actions-menu-title"
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}
                className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl border-t sm:border border-zinc-200/90 dark:border-white/10 p-4 sm:p-5 rounded-t-[28px] sm:rounded-3xl max-w-md w-full shadow-2xl space-y-3.5 max-h-[90vh] overflow-y-auto pb-[max(env(safe-area-inset-bottom,0px),1.25rem)] text-zinc-900 dark:text-white"
              >
                {/* Mobile Drag Indicator (Apple HIG Sheet Grabber) */}
                <div className="w-10 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700 mx-auto -mt-1 mb-2 sm:hidden shrink-0" />

                {/* Header */}
                <div className="flex items-center justify-between border-b border-zinc-200/80 dark:border-zinc-800 pb-3">
                  <div className="flex items-center gap-3">
                    <ServiceLogo
                      name={quickActionSub.name}
                      domain={quickActionSub.domain}
                      logoUrl={quickActionSub.logoUrl}
                      color={quickActionSub.color}
                      iconName={quickActionSub.iconName}
                      size="sm"
                    />
                    <div>
                      <h3 id="quick-actions-menu-title" className="font-bold text-zinc-900 dark:text-white text-sm truncate">{quickActionSub.name}</h3>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                        {formatCurrency(quickActionSub.cost, quickActionSub.currency)} ({quickActionSub.frequency}) • Próximo: {formatDateDisplay(quickActionSub.nextBillingDate)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setQuickActionSub(null)}
                    className="min-h-[44px] min-w-[44px] rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center cursor-pointer active:scale-95"
                    aria-label="Cerrar menú rápido"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Actions Grid / List */}
                <div className="space-y-1.5 text-xs">
                  {/* Action 1: Mark as Paid */}
                  <button
                    id="quick-action-mark-paid"
                    onClick={() => {
                      const target = quickActionSub;
                      setQuickActionSub(null);
                      onQuickMarkPaid?.(target);
                    }}
                    className="w-full p-3 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-semibold flex items-center justify-between border border-emerald-500/25 transition-all text-left group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                        <CheckCircle2 size={16} />
                      </div>
                      <div>
                        <span className="block font-bold">Marcar como pagado hoy</span>
                        <span className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80 font-normal">
                          Avanza la fecha al próximo ciclo y registra en historial
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-emerald-600 dark:text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  {/* Action 2: Add to Google Calendar */}
                  <a
                    href={getGoogleCalendarUrl(quickActionSub)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setQuickActionSub(null)}
                    className="w-full p-3 rounded-2xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800/80 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-semibold flex items-center justify-between border border-zinc-200 dark:border-zinc-700/50 transition-all text-left group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-xl bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <Calendar size={15} />
                      </div>
                      <div>
                        <span className="block font-bold">Añadir a Google Calendar</span>
                        <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-normal">
                          Crear evento con alerta previa en 1 clic
                        </span>
                      </div>
                    </div>
                    <ArrowUpRight size={14} className="text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors" />
                  </a>

                  {/* Action 3: Download .ics for Apple Calendar / Mobile */}
                  <button
                    onClick={() => {
                      const ics = generateICS(quickActionSub);
                      const safeName = quickActionSub.name.toLowerCase().replace(/[^a-z0-9]/gi, '_');
                      downloadICS(ics, `suscripcion_${safeName}.ics`);
                      setQuickActionSub(null);
                    }}
                    className="w-full p-3 rounded-2xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800/80 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-semibold flex items-center justify-between border border-zinc-200 dark:border-zinc-700/50 transition-all text-left group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-xl bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                        <Download size={15} />
                      </div>
                      <div>
                        <span className="block font-bold">Descargar archivo .ics</span>
                        <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-normal">
                          Compatible con iPhone, Mac, Android y Outlook
                        </span>
                      </div>
                    </div>
                    <Download size={14} className="text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors" />
                  </button>

                  {/* Action 4: Price Hike Tracker */}
                  {(() => {
                    const stats = getPriceHikeStats(quickActionSub);
                    return (
                      <button
                        onClick={() => {
                          setQuickNewPrice(quickActionSub.cost.toString());
                          setQuickNewPriceReason('Subida oficial de tarifa');
                          setShowQuickPriceModal(true);
                        }}
                        className="w-full p-3 rounded-2xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800/80 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-semibold flex items-center justify-between border border-zinc-200 dark:border-zinc-700/50 transition-all text-left group cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                            <TrendingUp size={15} />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="block font-bold">Historial de Subidas de Precio</span>
                              {stats.hasHike && (
                                <span className="px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-300 text-[9px] font-bold">
                                  +{stats.percentageChange}%
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-normal">
                              {stats.hasHike
                                ? `Inició en ${formatCurrency(stats.initialCost, quickActionSub.currency)} → Subió ${stats.percentageChange}%`
                                : 'Registrar si el servicio ha aumentado su tarifa'}
                            </span>
                          </div>
                        </div>
                        <Plus size={14} className="text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform" />
                      </button>
                    );
                  })()}

                  {/* Action 5: Cancel / Manage URL if available */}
                  {(quickActionSub.cancelUrl || quickActionSub.websiteUrl) && (
                    <a
                      href={quickActionSub.cancelUrl || quickActionSub.websiteUrl || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full p-3 rounded-2xl bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800/50 dark:hover:bg-zinc-700/60 text-zinc-700 dark:text-zinc-300 font-medium flex items-center justify-between border border-zinc-200 dark:border-zinc-800 transition-all text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-xl bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 flex items-center justify-center">
                          <ExternalLink size={14} />
                        </div>
                        <span className="text-xs">Ir a cancelar o gestionar cuenta</span>
                      </div>
                      <ExternalLink size={13} className="text-zinc-400 dark:text-zinc-500" />
                    </a>
                  )}

                  {/* Action 6: View Full Details */}
                  <button
                    onClick={() => {
                      const target = quickActionSub;
                      setQuickActionSub(null);
                      onSelectSubscription(target);
                    }}
                    className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all mt-2 cursor-pointer active:scale-98"
                  >
                    <span>Ver Detalles Completos</span>
                    <ChevronRight size={15} />
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Modal: Bulk Calendar Export */}
        <AnimatePresence>
          {showBulkCalendarModal && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md">
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-labelledby="bulk-calendar-modal-title"
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}
                className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl border-t sm:border border-zinc-200/90 dark:border-white/10 p-4 sm:p-5 rounded-t-[28px] sm:rounded-3xl max-w-md w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto pb-[max(env(safe-area-inset-bottom,0px),1.25rem)] text-zinc-900 dark:text-white"
              >
                {/* Mobile Drag Indicator (Apple HIG Sheet Grabber) */}
                <div className="w-10 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700 mx-auto -mt-1 mb-2 sm:hidden shrink-0" />

                <div className="flex items-center justify-between border-b border-zinc-200/80 dark:border-zinc-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                      <CalendarPlus size={18} />
                    </div>
                    <div>
                      <h3 id="bulk-calendar-modal-title" className="font-bold text-zinc-900 dark:text-white text-sm">Exportar a Calendario</h3>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Sincronización masiva de renovaciones</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowBulkCalendarModal(false)}
                    className="min-h-[44px] min-w-[44px] rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center cursor-pointer active:scale-95"
                    aria-label="Cerrar exportación a calendario"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3.5 rounded-2xl bg-zinc-100 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase font-bold block">Suscripciones activas</span>
                      <span className="text-lg font-extrabold text-zinc-900 dark:text-white tabular-nums">
                        {subscriptions.filter((s) => s.status === 'active').length} servicios
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-zinc-500 uppercase font-bold block">Gasto mensual</span>
                      <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {formatCurrency(totalMonthlySpend, 'USD')}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    Descarga un archivo universal <strong>.ics</strong> que creará eventos recurrentes con recordatorio 24h antes para cada suscripción activa en tu agenda.
                  </p>

                  <button
                    id="download-all-ics-btn"
                    onClick={() => {
                      const activeSubs = subscriptions.filter((s) => s.status === 'active');
                      const ics = generateICS(activeSubs);
                      downloadICS(ics, 'mis_suscripciones_subtrack.ics');
                      setBulkCalendarExported(true);
                      confetti({
                        particleCount: 50,
                        spread: 70,
                        origin: { y: 0.65 },
                        colors: ['#6366F1', '#10B981', '#38BDF8'],
                      });
                      setTimeout(() => setBulkCalendarExported(false), 4000);
                    }}
                    className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition-all text-xs cursor-pointer"
                  >
                    <Download size={15} />
                    <span>
                      {bulkCalendarExported ? '¡Archivo .ics Descargado!' : 'Descargar Archivo .ics Completo'}
                    </span>
                  </button>

                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200/80 dark:border-zinc-800 space-y-2 text-[10px] text-zinc-500 dark:text-zinc-400">
                    <span className="font-bold text-zinc-800 dark:text-zinc-300 block uppercase tracking-wider text-[9px]">
                      Cómo importarlo en segundos:
                    </span>
                    <ul className="space-y-1.5 list-disc pl-3 text-zinc-600 dark:text-zinc-400">
                      <li><strong>iPhone / iPad / Mac:</strong> Abre el archivo descargado y pulsa "Añadir a Calendario".</li>
                      <li><strong>Google Calendar:</strong> Ve a Configuración (⚙️) → <em>Importar y exportar</em> → Selecciona este archivo.</li>
                      <li><strong>Android / Outlook:</strong> Abre el archivo y selecciona tu aplicación de calendario habitual.</li>
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowBulkCalendarModal(false)}
                    className="w-full py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Cerrar
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Modal: Quick Price Hike Registration from Dashboard */}
        <AnimatePresence>
          {showQuickPriceModal && quickActionSub && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md">
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-labelledby="quick-price-modal-title"
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}
                className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl border-t sm:border border-zinc-200/90 dark:border-white/10 p-4 sm:p-5 rounded-t-[28px] sm:rounded-3xl max-w-sm w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto pb-[max(env(safe-area-inset-bottom,0px),1.25rem)] text-zinc-900 dark:text-white"
              >
                {/* Mobile Drag Indicator (Apple HIG Sheet Grabber) */}
                <div className="w-10 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700 mx-auto -mt-1 mb-2 sm:hidden shrink-0" />

                <div className="flex items-center justify-between border-b border-zinc-200/80 dark:border-zinc-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                      <TrendingUp size={15} />
                    </div>
                    <h3 id="quick-price-modal-title" className="font-bold text-zinc-900 dark:text-white text-xs uppercase tracking-wider">
                      Registrar Subida de Precio
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowQuickPriceModal(false)}
                    className="min-h-[44px] min-w-[44px] rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center cursor-pointer active:scale-95"
                    aria-label="Cerrar modal de precio"
                  >
                    <X size={18} />
                  </button>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const parsed = parseFloat(quickNewPrice);
                    if (isNaN(parsed) || parsed <= 0) return;

                    const previousCost = quickActionSub.cost;
                    const newRecord: PriceChangeRecord = {
                      id: `pc-${Date.now()}`,
                      date: new Date().toISOString().split('T')[0],
                      previousCost: previousCost,
                      newCost: parsed,
                      currency: quickActionSub.currency,
                      reason: quickNewPriceReason.trim() || 'Ajuste de precio',
                    };

                    const updatedSub: Subscription = {
                      ...quickActionSub,
                      cost: parsed,
                      priceHistory: [newRecord, ...(quickActionSub.priceHistory || [])],
                    };

                    onUpdateSubscription?.(updatedSub);
                    setShowQuickPriceModal(false);
                    setQuickActionSub(null);
                    confetti({
                      particleCount: 40,
                      spread: 60,
                      origin: { y: 0.7 },
                      colors: ['#F59E0B', '#EF4444', '#10B981'],
                    });
                  }}
                  className="space-y-3 text-xs"
                >
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">
                      Servicio: {quickActionSub.name}
                    </label>
                    <div className="px-3 py-2 bg-zinc-100 dark:bg-black/60 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-700 dark:text-zinc-400 font-semibold text-xs tabular-nums">
                      Tarifa actual: {formatCurrency(quickActionSub.cost, quickActionSub.currency)}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">
                      Nueva Tarifa ({quickActionSub.currency})
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={quickNewPrice}
                      onChange={(e) => setQuickNewPrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-white text-xs focus:outline-none focus:border-amber-500 font-bold tabular-nums"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">
                      Motivo / Razón
                    </label>
                    <input
                      type="text"
                      value={quickNewPriceReason}
                      onChange={(e) => setQuickNewPriceReason(e.target.value)}
                      placeholder="ej. Aumento de tarifa oficial, Fin de oferta..."
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-white text-xs focus:outline-none focus:border-amber-500 mb-1.5"
                    />
                    <div className="flex flex-wrap gap-1">
                      {['Subida general', 'Fin de promoción', 'Ajuste de plan', 'Impuestos'].map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setQuickNewPriceReason(tag)}
                          className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 text-[9px] cursor-pointer"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowQuickPriceModal(false)}
                      className="flex-1 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold text-xs transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      id="save-quick-price-btn"
                      type="submit"
                      className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-lg shadow-amber-500/20 cursor-pointer"
                    >
                      Guardar Subida
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
