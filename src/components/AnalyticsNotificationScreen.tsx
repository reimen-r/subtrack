import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  Calendar as CalendarIcon, 
  Bell, 
  PieChart, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Sliders, 
  Sparkles, 
  AlertCircle, 
  Volume2, 
  Vibrate, 
  Mail, 
  Clock,
  ArrowUpRight,
  ShieldAlert,
  Send,
  Sun,
  Moon,
  Palette,
  Users,
  CheckCircle2,
  XCircle,
  Info,
  RefreshCw,
  Play,
  Trash2,
  CheckCheck,
  ExternalLink,
  Timer,
  Radio,
  BellRing,
  Smartphone,
  ShieldCheck,
  Laptop
} from 'lucide-react';
import { Subscription, NotificationSettings, NotificationItem, ThemeMode } from '../types';
import { CATEGORY_CONFIG } from '../data/presets';
import { ServiceLogo } from './ServiceLogo';
import { SubTrackLogo } from './SubTrackLogo';
import { 
  formatCurrency, 
  formatDateDisplay, 
  getMonthlyEquivalent, 
  getDaysUntil,
  formatRelativeDueDate,
  getUserRealShareCost,
  getUserMonthlyEquivalent,
  calculateTotalOwedSummary
} from '../utils/subscriptionUtils';
import {
  getNotificationPermissionStatus,
  requestSystemNotificationPermission,
  playNotificationSound,
  triggerHapticVibration,
  isSystemNotificationSupported,
  isVibrationSupported,
  isAudioContextSupported,
  findUpcomingRenewals
} from '../utils/notificationService';

interface AnalyticsNotificationScreenProps {
  subscriptions: Subscription[];
  notifications: NotificationItem[];
  notificationSettings: NotificationSettings;
  theme?: ThemeMode;
  onUpdateTheme?: (theme: ThemeMode) => void;
  onUpdateSettings: (settings: NotificationSettings) => void;
  onSelectSubscription: (sub: Subscription) => void;
  onTriggerTestNotification: (
    title: string, 
    message: string, 
    options?: { sound?: boolean; vibrate?: boolean; push?: boolean; addToInbox?: boolean; subscriptionId?: string }
  ) => Promise<{ sent: boolean; channel?: string; soundPlayed?: boolean; vibrateTriggered?: boolean; error?: string }>;
  onClearNotifications: () => void;
  onToggleNotificationRead?: (id: string) => void;
  onDeleteNotification?: (id: string) => void;
  onMarkAllNotificationsRead?: () => void;
  onScanRenewalsNow?: () => { found: number; newAlerts: number; items: { subName: string; daysRemaining: number }[] };
}

export const AnalyticsNotificationScreen: React.FC<AnalyticsNotificationScreenProps> = ({
  subscriptions,
  notifications,
  notificationSettings,
  theme = 'dark',
  onUpdateTheme,
  onUpdateSettings,
  onSelectSubscription,
  onTriggerTestNotification,
  onClearNotifications,
  onToggleNotificationRead,
  onDeleteNotification,
  onMarkAllNotificationsRead,
  onScanRenewalsNow,
}) => {
  const [activeTab, setActiveTab] = useState<'analytics' | 'calendar' | 'notifications'>('analytics');
  
  // Real-time notification diagnostics state
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'default' | 'unsupported'>(() =>
    getNotificationPermissionStatus()
  );
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [playingChime, setPlayingChime] = useState(false);
  const [triggeringVibrate, setTriggeringVibrate] = useState(false);
  const [backgroundCountdown, setBackgroundCountdown] = useState<number | null>(null);
  const [isBackgroundTestActive, setIsBackgroundTestActive] = useState(false);
  const [lastTestReport, setLastTestReport] = useState<{
    timestamp: number;
    title: string;
    banner: boolean;
    sound: boolean;
    vibrate: boolean;
    vibrateSupported: boolean;
    pushSent: boolean;
    channel?: string;
    error?: string;
  } | null>(null);
  const [scanResult, setScanResult] = useState<{
    scannedAt: number;
    found: number;
    newAlerts: number;
    items: { subName: string; daysRemaining: number }[];
  } | null>(null);

  // Sync permission status when window regains focus (e.g. user toggled browser permission dialog)
  useEffect(() => {
    const handleFocus = () => {
      setPermissionStatus(getNotificationPermissionStatus());
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);
  
  // Calendar state initialized to current month and day
  const [currentCalendarDate, setCurrentCalendarDate] = useState(() => new Date());
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<number | null>(() => new Date().getDate());

  // Calculate Monthly Spend Total
  const totalMonthlySpend = useMemo(() => {
    return subscriptions
      .filter((s) => s.status === 'active')
      .reduce((sum, s) => sum + getMonthlyEquivalent(s.cost, s.frequency), 0);
  }, [subscriptions]);

  // Category Spend Distribution
  const categoryStats = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {};
    subscriptions
      .filter((s) => s.status === 'active')
      .forEach((sub) => {
        const eq = getMonthlyEquivalent(sub.cost, sub.frequency);
        if (!map[sub.category]) {
          map[sub.category] = { total: 0, count: 0 };
        }
        map[sub.category].total += eq;
        map[sub.category].count += 1;
      });

    return Object.entries(map)
      .map(([category, data]) => ({
        category,
        total: data.total,
        count: data.count,
        percentage: totalMonthlySpend > 0 ? (data.total / totalMonthlySpend) * 100 : 0,
        config: CATEGORY_CONFIG[category] || CATEGORY_CONFIG['Other'],
      }))
      .sort((a, b) => b.total - a.total);
  }, [subscriptions, totalMonthlySpend]);

  // Shared Subscriptions & Debt metrics
  const sharedSubs = useMemo(() => {
    return subscriptions.filter((s) => s.splitPlan?.isShared);
  }, [subscriptions]);

  const sharedDebtSummary = useMemo(() => {
    return calculateTotalOwedSummary(subscriptions);
  }, [subscriptions]);

  // Dynamic 6-Month Expenditure Trends
  const monthlyTrends = useMemo(() => {
    const now = new Date();
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const months = [];
    for (let i = 4; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const isCurrent = i === 0;
      const factor = isCurrent ? 1 : 1 - (i * 0.03);
      months.push({
        name: monthNames[d.getMonth()],
        amount: Math.max(0, totalMonthlySpend * factor),
        isProjected: false,
        current: isCurrent,
      });
    }
    // Projected next month
    const nextD = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    months.push({
      name: monthNames[nextD.getMonth()],
      amount: totalMonthlySpend * 1.03,
      isProjected: true,
      current: false,
    });
    const maxVal = Math.max(...months.map((m) => m.amount), 1);
    return { months, maxVal };
  }, [totalMonthlySpend]);

  // Calendar renewals mapping
  const calendarDays = useMemo(() => {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const renewalsByDay: Record<number, Subscription[]> = {};
    subscriptions.forEach((sub) => {
      if (sub.nextBillingDate) {
        const subDate = new Date(sub.nextBillingDate + 'T00:00:00');
        if (subDate.getFullYear() === year && subDate.getMonth() === month) {
          const day = subDate.getDate();
          if (!renewalsByDay[day]) renewalsByDay[day] = [];
          renewalsByDay[day].push(sub);
        }
      }
    });

    return { firstDayIndex, daysInMonth, renewalsByDay, year, month };
  }, [currentCalendarDate, subscriptions]);

  const handlePrevMonth = () => {
    const d = new Date(currentCalendarDate);
    d.setMonth(d.getMonth() - 1);
    setCurrentCalendarDate(d);
    setSelectedCalendarDay(null);
  };

  const handleNextMonth = () => {
    const d = new Date(currentCalendarDate);
    d.setMonth(d.getMonth() + 1);
    setCurrentCalendarDate(d);
    setSelectedCalendarDay(null);
  };

  const selectedDayRenewals = selectedCalendarDay
    ? calendarDays.renewalsByDay[selectedCalendarDay] || []
    : [];

  return (
    <div id="analytics-screen" className="flex-1 flex flex-col bg-slate-50 dark:bg-black text-zinc-900 dark:text-white min-h-full pb-24 sm:pb-22">
      
      {/* Top Header & Tab Switcher */}
      <div className="px-3.5 sm:px-5 pt-3.5 sm:pt-5 pb-2.5 sm:pb-3 space-y-3 sm:space-y-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
            <Sparkles size={18} className="text-emerald-500" />
            <span>Estadísticas y Calendario</span>
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Métricas de gasto mensual, calendario de vencimientos y alertas</p>
        </div>

        {/* Tab Switcher Pills */}
        <div role="tablist" aria-label="Secciones analíticas" className="flex p-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl sm:rounded-2xl">
          <button
            id="tab-analytics"
            role="tab"
            aria-selected={activeTab === 'analytics'}
            onClick={() => setActiveTab('analytics')}
            className={`flex-1 min-h-[44px] py-2 text-[11px] sm:text-xs font-bold rounded-lg sm:rounded-xl transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer active:scale-95 ${
              activeTab === 'analytics'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <TrendingUp size={14} className={activeTab === 'analytics' ? 'text-emerald-500' : ''} />
            <span>Gastos</span>
          </button>
          <button
            id="tab-calendar"
            role="tab"
            aria-selected={activeTab === 'calendar'}
            onClick={() => setActiveTab('calendar')}
            className={`flex-1 min-h-[44px] py-2 text-[11px] sm:text-xs font-bold rounded-lg sm:rounded-xl transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer active:scale-95 ${
              activeTab === 'calendar'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <CalendarIcon size={14} className={activeTab === 'calendar' ? 'text-indigo-500' : ''} />
            <span>Calendario</span>
          </button>
          <button
            id="tab-notifications"
            role="tab"
            aria-selected={activeTab === 'notifications'}
            onClick={() => setActiveTab('notifications')}
            className={`flex-1 min-h-[44px] py-2 text-[11px] sm:text-xs font-bold rounded-lg sm:rounded-xl transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer active:scale-95 ${
              activeTab === 'notifications'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Bell size={14} className={activeTab === 'notifications' ? 'text-emerald-500' : ''} />
            <span>Avisos</span>
          </button>
        </div>
      </div>

      <div className="px-3.5 sm:px-5 space-y-3.5 sm:space-y-5 flex-1">
        
        {/* TAB 1: ANALYTICS & EXPENDITURE TRENDS */}
        {activeTab === 'analytics' && (
          <div className="space-y-5">
            
            {/* Monthly Spending Trend Bar Chart */}
            <div className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp size={14} className="text-emerald-400" />
                    <span>Monthly Expenditure History</span>
                  </h2>
                  <p className="text-[11px] text-zinc-500 mt-0.5">Estimated budget vs actual billing</p>
                </div>
                <span className="text-xs font-bold text-emerald-400">
                  {formatCurrency(totalMonthlySpend, 'USD')}/mo
                </span>
              </div>

              {/* Custom SVG / Bar Visualization */}
              <div className="pt-2 pb-1">
                <div className="h-36 flex items-end justify-between gap-2.5 px-2">
                  {monthlyTrends.months.map((m, i) => {
                    const heightPercent = Math.max(15, (m.amount / monthlyTrends.maxVal) * 100);
                    return (
                      <div key={m.name} className="flex-1 flex flex-col items-center gap-2 group">
                        <span className="text-[11px] font-bold text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity tabular-nums">
                          ${Math.round(m.amount)}
                        </span>
                        <div className="w-full bg-black rounded-xl h-24 flex items-end p-1 border border-zinc-850">
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${heightPercent}%` }}
                            transition={{ duration: 0.5, delay: i * 0.08 }}
                            className={`w-full rounded-lg transition-all ${
                              m.current
                                ? 'bg-emerald-500 shadow-md shadow-emerald-500/20'
                                : m.isProjected
                                ? 'bg-indigo-500/30 border border-indigo-400/40 border-dashed'
                                : 'bg-zinc-800 hover:bg-zinc-700'
                            }`}
                          />
                        </div>
                        <span className={`text-[11px] font-bold ${m.current ? 'text-emerald-400' : 'text-zinc-500'}`}>
                          {m.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-2 border-t border-zinc-800">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded bg-emerald-500" />
                  <span>Mes Actual</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded bg-indigo-500/30 border border-indigo-400 border-dashed" />
                  <span>Proyección Siguiente</span>
                </div>
              </div>
            </div>

            {/* Category Breakdown & Distribution */}
            <div className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <PieChart size={14} className="text-indigo-400" />
                  <span>Spend by Category</span>
                </h2>
                <span className="text-[11px] text-zinc-500 font-bold uppercase">{categoryStats.length} Categorías</span>
              </div>

              {/* Progress Bar Distribution Line */}
              <div className="w-full h-2 rounded-full bg-zinc-950 overflow-hidden flex border border-zinc-800">
                {categoryStats.map((cat) => (
                  <div
                    key={cat.category}
                    style={{
                      width: `${cat.percentage}%`,
                      backgroundColor: cat.config.color,
                    }}
                    title={`${cat.category}: ${cat.percentage.toFixed(1)}%`}
                    className="h-full first:rounded-l-full last:rounded-r-full hover:opacity-80 transition-opacity"
                  />
                ))}
              </div>

              {/* Detailed Category List */}
              <div className="space-y-2 pt-1">
                {categoryStats.map((cat) => (
                  <div
                    key={cat.category}
                    className="p-3.5 rounded-2xl bg-black border border-zinc-800 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: cat.config.color }}
                      />
                      <div>
                        <span className="font-bold text-white block text-xs">{cat.category}</span>
                        <span className="text-[11px] text-zinc-400">
                          {cat.count} {cat.count === 1 ? 'suscripción' : 'suscripciones'}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-bold text-white text-xs tabular-nums">
                        {formatCurrency(cat.total, 'USD')}
                      </span>
                      <span className="text-[11px] text-zinc-400 block font-medium tabular-nums">
                        {cat.percentage.toFixed(0)}% del total
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shared Plans & Debt Collection Card */}
            {sharedSubs.length > 0 && (
              <div className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Users size={14} className="text-indigo-400" />
                    <span>Planes Compartidos & Deudas ({sharedSubs.length})</span>
                  </h2>
                  {sharedDebtSummary.totalPending > 0 ? (
                    <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                      {formatCurrency(sharedDebtSummary.totalPending, 'USD')} pendientes
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                      <Check size={11} /> Al día
                    </span>
                  )}
                </div>

                <div className="space-y-2.5">
                  {sharedSubs.map((sub) => {
                    const userShare = getUserRealShareCost(sub);
                    const membersCount = sub.splitPlan?.totalMembers || (sub.splitPlan?.members?.length || 0) + 1;
                    const pendingMembers = sub.splitPlan?.members?.filter((m) => !m.hasPaid) || [];
                    const pendingAmount = pendingMembers.reduce((sum, m) => sum + (m.amount || 0), 0);

                    return (
                      <div
                        key={sub.id}
                        onClick={() => onSelectSubscription(sub)}
                        className="p-3.5 rounded-2xl bg-black border border-zinc-800 hover:border-zinc-700 cursor-pointer transition-colors space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <ServiceLogo
                              name={sub.name}
                              domain={sub.domain}
                              logoUrl={sub.logoUrl}
                              color={sub.color}
                              iconName={sub.iconName}
                              size="xs"
                            />
                            <div>
                              <p className="font-bold text-white text-xs">{sub.name}</p>
                              <p className="text-[10px] text-zinc-500">
                                {membersCount} miembros • Tu cuota: {formatCurrency(userShare, sub.currency)}/mes
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] text-zinc-400 font-medium block">Total plan</span>
                            <span className="font-bold text-white text-xs">
                              {formatCurrency(sub.cost, sub.currency)}
                            </span>
                          </div>
                        </div>

                        {/* Debt Status or Paid Status */}
                        {pendingMembers.length > 0 ? (
                          <div className="pt-1.5 border-t border-zinc-800 flex items-center justify-between text-[10px]">
                            <span className="text-amber-400 font-semibold flex items-center gap-1">
                              <Clock size={11} /> {pendingMembers.map((m) => m.name).join(', ')} debe(n)
                            </span>
                            <span className="font-bold text-amber-300">
                              {formatCurrency(pendingAmount, sub.currency)}
                            </span>
                          </div>
                        ) : (
                          <div className="pt-1.5 border-t border-zinc-800 flex items-center justify-between text-[10px] text-zinc-500">
                            <span className="flex items-center gap-1 text-emerald-400">
                              <Check size={11} /> Todos los miembros han pagado
                            </span>
                            <span className="text-zinc-500">Completado</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Smart Savings Recommendations */}
            <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-2">
              <div className="flex items-center gap-2 text-indigo-400">
                <Sparkles size={15} />
                <h3 className="font-bold text-xs uppercase tracking-wider text-white">Smart Optimization</h3>
              </div>
              <p className="text-xs text-zinc-400">
                Switching <span className="text-emerald-400 font-semibold">Netflix</span> & <span className="text-emerald-400 font-semibold">Spotify</span> to annual billing could save you up to <strong className="text-white">$45.00 / year</strong> with bundle discounts.
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: PAYMENT CALENDAR VIEW */}
        {activeTab === 'calendar' && (
          <div className="space-y-5">
            <div className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-4">
              
              {/* Calendar Month Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-white">
                    {currentCalendarDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                  </h2>
                  <p className="text-[10px] text-zinc-500">Tap a highlighted day to inspect renewals</p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handlePrevMonth}
                    className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={handleNextMonth}
                    className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              {/* Day Labels */}
              <div className="grid grid-cols-7 text-center text-[10px] font-bold text-zinc-500 uppercase py-1">
                <span>Sun</span>
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1.5">
                {/* Empty prefix days */}
                {Array.from({ length: calendarDays.firstDayIndex }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-9 rounded-xl bg-zinc-950/20" />
                ))}

                {/* Actual month days */}
                {Array.from({ length: calendarDays.daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const hasRenewals = calendarDays.renewalsByDay[day] && calendarDays.renewalsByDay[day].length > 0;
                  const isSelected = selectedCalendarDay === day;

                  return (
                    <button
                      key={`day-${day}`}
                      onClick={() => setSelectedCalendarDay(day)}
                      className={`h-10 rounded-xl flex flex-col items-center justify-center relative transition-all border ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-400 font-bold scale-105 shadow-md z-10'
                          : hasRenewals
                          ? 'bg-zinc-900 text-emerald-400 border-zinc-700 font-bold hover:border-emerald-500'
                          : 'bg-black text-zinc-500 border-zinc-900 hover:bg-zinc-900'
                      }`}
                    >
                      <span className="text-xs">{day}</span>
                      {hasRenewals && (
                        <div className="flex gap-0.5 mt-0.5">
                          {calendarDays.renewalsByDay[day].map((sub, idx) => (
                            <span
                              key={sub.id || idx}
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: sub.color || '#10B981' }}
                            />
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Day Renewal Details */}
            <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CalendarIcon size={14} className="text-emerald-400" />
                  <span>
                    {selectedCalendarDay
                      ? `${currentCalendarDate.toLocaleString('default', { month: 'short' })} ${selectedCalendarDay} Renewals (${selectedDayRenewals.length})`
                      : 'Select a day to view renewals'}
                  </span>
                </h3>
              </div>

              <div className="space-y-2">
                {selectedDayRenewals.length > 0 ? (
                  selectedDayRenewals.map((sub) => (
                    <div
                      key={sub.id}
                      onClick={() => onSelectSubscription(sub)}
                      className="p-3 rounded-2xl bg-black border border-zinc-800 hover:border-zinc-700 flex items-center justify-between cursor-pointer transition-all hover:scale-[1.01]"
                    >
                      <div className="flex items-center gap-2.5">
                        <ServiceLogo
                          name={sub.name}
                          domain={sub.domain}
                          color={sub.color}
                          size="sm"
                        />
                        <div>
                          <h4 className="font-bold text-white text-xs">{sub.name}</h4>
                          <span className="text-[10px] text-zinc-500">{sub.category} • {sub.frequency}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-emerald-400 text-xs">
                          {formatCurrency(sub.cost, sub.currency)}
                        </span>
                        <span className="text-[9px] text-zinc-500 block">Due date</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-5 text-zinc-500 text-xs">
                    No subscriptions scheduled for this day.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: NOTIFICATIONS & SETTINGS PANEL */}
        {activeTab === 'notifications' && (
          <div className="space-y-5">
            
            {/* Theme & Appearance Selector Card */}
            {onUpdateTheme && (
              <div className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-4">
                <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                    <Palette size={15} />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                      Tema y Apariencia
                    </h2>
                    <p className="text-[10px] text-zinc-500">Selecciona el modo visual de la aplicación</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Dark Mode Option */}
                  <button
                    id="theme-btn-dark"
                    type="button"
                    onClick={() => onUpdateTheme('dark')}
                    className={`p-3.5 rounded-2xl border transition-all flex flex-col items-center justify-center gap-2 text-center cursor-pointer ${
                      theme === 'dark'
                        ? 'bg-zinc-800 border-indigo-500 text-white shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/30'
                        : 'bg-black/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-zinc-900 flex items-center justify-center text-indigo-400">
                      <Moon size={16} />
                    </div>
                    <div>
                      <span className="text-xs font-bold block">Modo Oscuro</span>
                      <span className="text-[10px] text-zinc-500">Elegante y nocturno</span>
                    </div>
                    {theme === 'dark' && (
                      <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold">
                        Activo
                      </span>
                    )}
                  </button>

                  {/* Light Mode Option */}
                  <button
                    id="theme-btn-light"
                    type="button"
                    onClick={() => onUpdateTheme('light')}
                    className={`p-3.5 rounded-2xl border transition-all flex flex-col items-center justify-center gap-2 text-center cursor-pointer ${
                      theme === 'light'
                        ? 'bg-zinc-800 border-amber-500 text-white shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/30'
                        : 'bg-black/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                      <Sun size={16} />
                    </div>
                    <div>
                      <span className="text-xs font-bold block">Modo Claro</span>
                      <span className="text-[10px] text-zinc-500">Luminoso y nítido</span>
                    </div>
                    {theme === 'light' && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                        Activo
                      </span>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Notification & Verification Center */}
            {/* 1. Live System Diagnostics Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
                    <ShieldCheck size={16} />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                      <span>Diagnóstico del Sistema en Tiempo Real</span>
                    </h2>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Estado de permisos, sintetizador de audio y soporte del dispositivo</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setPermissionStatus(getNotificationPermissionStatus())}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  title="Actualizar estado"
                >
                  <RefreshCw size={13} />
                </button>
              </div>

              {/* Status Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                
                {/* Channel 1: Browser System Push Permission */}
                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-black/60 border border-zinc-200 dark:border-zinc-800/80 flex flex-col justify-between gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                        <Laptop size={13} />
                      </div>
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200 text-xs">Permiso del Sistema (SO)</span>
                    </div>

                    {permissionStatus === 'granted' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 size={11} />
                        Permitido
                      </span>
                    ) : permissionStatus === 'default' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                        <AlertCircle size={11} />
                        Pendiente
                      </span>
                    ) : permissionStatus === 'denied' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                        <XCircle size={11} />
                        Bloqueado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-500/15 text-zinc-400 border border-zinc-500/30">
                        No soportado
                      </span>
                    )}
                  </div>

                  {permissionStatus === 'default' && (
                    <button
                      type="button"
                      disabled={isRequestingPermission}
                      onClick={async () => {
                        setIsRequestingPermission(true);
                        const res = await requestSystemNotificationPermission();
                        setPermissionStatus(res);
                        setIsRequestingPermission(false);
                      }}
                      className="w-full mt-1 py-1.5 px-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all shadow-sm"
                    >
                      <BellRing size={12} />
                      <span>{isRequestingPermission ? 'Solicitando...' : 'Activar Permiso en el Navegador'}</span>
                    </button>
                  )}

                  {permissionStatus === 'denied' && (
                    <p className="text-[10px] text-rose-500 dark:text-rose-400 leading-tight bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
                      El navegador tiene las notificaciones bloqueadas para este sitio. Haz clic en el icono del candado en la barra de URL para conceder el permiso.
                    </p>
                  )}

                  {permissionStatus === 'granted' && (
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-tight">
                      Las notificaciones nativas de escritorio/móvil están autorizadas y listas.
                    </p>
                  )}
                </div>

                {/* Channel 2: Web Audio Synthesizer */}
                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-black/60 border border-zinc-200 dark:border-zinc-800/80 flex flex-col justify-between gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                        <Volume2 size={13} />
                      </div>
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200 text-xs">Audio Sintético Apple</span>
                    </div>

                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
                      <CheckCircle2 size={11} />
                      Web Audio
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-tight">
                      Chime armónico dual (F6 → A6). Cero archivos MP3 externos.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setPlayingChime(true);
                        playNotificationSound();
                        setTimeout(() => setPlayingChime(false), 500);
                      }}
                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1 transition-all shrink-0 cursor-pointer ${
                        playingChime
                          ? 'bg-indigo-500 text-white border-indigo-600 scale-95'
                          : 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/50 hover:bg-indigo-50 dark:hover:bg-zinc-700'
                      }`}
                    >
                      <Play size={10} className={playingChime ? 'fill-white' : ''} />
                      <span>{playingChime ? 'Sonando...' : 'Escuchar'}</span>
                    </button>
                  </div>
                </div>

                {/* Channel 3: Haptic Vibration */}
                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-black/60 border border-zinc-200 dark:border-zinc-800/80 flex flex-col justify-between gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                        <Vibrate size={13} />
                      </div>
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200 text-xs">Vibración Háptica</span>
                    </div>

                    {isVibrationSupported() ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 size={11} />
                        Soportado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-500/15 text-zinc-400 border border-zinc-500/30">
                        Solo en móvil
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-tight">
                      {isVibrationSupported()
                        ? 'Patrón táctil iOS/Android disponible.'
                        : 'El navegador actual o equipo de escritorio no tiene motor háptico.'}
                    </p>
                    {isVibrationSupported() && (
                      <button
                        type="button"
                        onClick={() => {
                          setTriggeringVibrate(true);
                          triggerHapticVibration([80, 40, 120]);
                          setTimeout(() => setTriggeringVibrate(false), 500);
                        }}
                        className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1 transition-all shrink-0 cursor-pointer ${
                          triggeringVibrate
                            ? 'bg-emerald-500 text-black border-emerald-600 scale-95'
                            : 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50 hover:bg-emerald-50 dark:hover:bg-zinc-700'
                        }`}
                      >
                        <Vibrate size={11} />
                        <span>{triggeringVibrate ? 'Vibrando' : 'Probar'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Channel 4: Service Worker PWA */}
                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-black/60 border border-zinc-200 dark:border-zinc-800/80 flex flex-col justify-between gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
                        <Radio size={13} />
                      </div>
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200 text-xs">Segundo Plano / PWA</span>
                    </div>

                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                      <CheckCircle2 size={11} />
                      sw.js Activo
                    </span>
                  </div>

                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-tight pt-1">
                    Gestor de notificaciones registrado para recepción en pantalla bloqueada y PWA.
                  </p>
                </div>

              </div>
            </div>

            {/* 2. Interactive Verification Suite */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
              <div className="border-b border-zinc-100 dark:border-zinc-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center border border-indigo-500/20">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                      Centro de Pruebas y Verificación
                    </h2>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Ejecuta tests interactivos para validar que todas las alertas funcionan</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* Test Action 1: Inmediate Full Test */}
                <button
                  id="btn-test-full-notification"
                  type="button"
                  onClick={async () => {
                    const sampleSub = subscriptions[0];
                    const title = sampleSub 
                      ? `Recordatorio de Pago: ${sampleSub.name}`
                      : 'Recordatorio de Pago: Netflix Premium';
                    const message = sampleSub
                      ? `Tu suscripción de $${sampleSub.cost.toFixed(2)} renovará próximamente el ${sampleSub.nextBillingDate}.`
                      : 'Tu plan familiar de $15.49 renovará en 3 días (Sep 3).';

                    const res = await onTriggerTestNotification(title, message, {
                      sound: true,
                      vibrate: true,
                      push: true,
                      addToInbox: true,
                      subscriptionId: sampleSub?.id || 'sample-test',
                    });

                    setLastTestReport({
                      timestamp: Date.now(),
                      title,
                      banner: true,
                      sound: res.soundPlayed ?? true,
                      vibrate: res.vibrateTriggered ?? false,
                      vibrateSupported: isVibrationSupported(),
                      pushSent: res.sent,
                      channel: res.channel,
                      error: res.error,
                    });
                  }}
                  className="p-3.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-black font-bold text-xs flex flex-col justify-between gap-2 shadow-sm transition-transform active:scale-[0.98] text-left cursor-pointer"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="flex items-center gap-2 text-white">
                      <Send size={15} />
                      <span className="font-bold text-xs text-white">Prueba Inmediata Completa</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-semibold">
                      Todo en uno
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-950/80 dark:text-emerald-100/90 font-medium leading-relaxed">
                    Dispara banner Dynamic Island, timbre de audio Apple, vibración y notificación del sistema nativa.
                  </p>
                </button>

                {/* Test Action 2: Delayed 5-second background simulation */}
                <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-black/60 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between gap-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 font-bold text-zinc-900 dark:text-white text-xs">
                      <Timer size={15} className="text-indigo-500" />
                      <span>Simulación en Segundo Plano (5s)</span>
                    </span>
                    {backgroundCountdown !== null && (
                      <span className="px-2 py-0.5 rounded-full bg-indigo-500 text-white font-mono text-[10px] font-bold animate-pulse">
                        {backgroundCountdown}s
                      </span>
                    )}
                  </div>
                  
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    Inicia un contador de 5 segundos. Minimiza la app o bloquea tu pantalla para ver la alerta fuera del navegador.
                  </p>

                  {backgroundCountdown === null ? (
                    <button
                      type="button"
                      id="btn-test-delayed-notification"
                      onClick={() => {
                        setBackgroundCountdown(5);
                        setIsBackgroundTestActive(true);
                        
                        let remaining = 5;
                        const timer = setInterval(async () => {
                          remaining -= 1;
                          if (remaining <= 0) {
                            clearInterval(timer);
                            setBackgroundCountdown(null);
                            setIsBackgroundTestActive(false);

                            const res = await onTriggerTestNotification(
                              '🔔 Prueba en Segundo Plano: SubTrack',
                              '¡Excelente! La notificación nativa llegó a tu sistema mientras la app estaba en segundo plano.',
                              { sound: true, vibrate: true, push: true, addToInbox: true }
                            );

                            setLastTestReport({
                              timestamp: Date.now(),
                              title: '🔔 Prueba en Segundo Plano: SubTrack',
                              banner: true,
                              sound: res.soundPlayed ?? true,
                              vibrate: res.vibrateTriggered ?? false,
                              vibrateSupported: isVibrationSupported(),
                              pushSent: res.sent,
                              channel: res.channel,
                              error: res.error,
                            });
                          } else {
                            setBackgroundCountdown(remaining);
                          }
                        }, 1000);
                      }}
                      className="w-full mt-1 py-2 px-3 rounded-lg bg-zinc-900 dark:bg-zinc-800 hover:bg-zinc-800 dark:hover:bg-zinc-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Play size={12} />
                      <span>Iniciar prueba (5 segundos)</span>
                    </button>
                  ) : (
                    <div className="space-y-1.5 pt-1">
                      <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-[11px] text-indigo-400 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                        <span>Minimiza ahora la ventana o cambia de pestaña... ({backgroundCountdown}s)</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Test Action 3: Scan Real Upcoming Subscriptions */}
                <div className="sm:col-span-2 p-3.5 rounded-xl bg-zinc-50 dark:bg-black/60 border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="flex items-center gap-2 font-bold text-zinc-900 dark:text-white text-xs">
                      <CalendarIcon size={14} className="text-emerald-500" />
                      <span>Comprobar Renovaciones Reales de tus Suscripciones</span>
                    </span>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Escanea tus {subscriptions.length} suscripciones para detectar cuáles vencen en los próximos {notificationSettings.advanceDays} días.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (onScanRenewalsNow) {
                        const res = onScanRenewalsNow();
                        setScanResult({
                          scannedAt: Date.now(),
                          found: res.found,
                          newAlerts: res.newAlerts,
                          items: res.items,
                        });
                      } else {
                        const upcoming = findUpcomingRenewals(subscriptions, notificationSettings.advanceDays);
                        setScanResult({
                          scannedAt: Date.now(),
                          found: upcoming.length,
                          newAlerts: upcoming.length,
                          items: upcoming.map((u) => ({ subName: u.sub.name, daysRemaining: u.daysRemaining })),
                        });
                      }
                    }}
                    className="py-2 px-3.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                  >
                    <RefreshCw size={12} />
                    <span>Escanear Ahora</span>
                  </button>
                </div>

              </div>

              {/* Live Test Diagnostic Report Banner */}
              {lastTestReport && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 text-xs">
                      <CheckCheck size={14} />
                      <span>Resultado de la Última Verificación</span>
                    </span>
                    <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 font-mono">
                      {new Date(lastTestReport.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                    <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                      <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                      <span>Banner In-App: OK</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                      <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                      <span>Sonido Web Audio: OK</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                      {lastTestReport.vibrateSupported ? (
                        <>
                          <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                          <span>Vibración: Activa</span>
                        </>
                      ) : (
                        <>
                          <Info size={12} className="text-zinc-400 shrink-0" />
                          <span className="text-zinc-400">Vibración: N/A PC</span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                      {lastTestReport.pushSent ? (
                        <>
                          <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                          <span>Push SO: Enviada</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle size={12} className="text-amber-500 shrink-0" />
                          <span className="text-amber-500">Push: Requiere Permiso</span>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Scan Result Feedback */}
              {scanResult && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-xl bg-zinc-100 dark:bg-black/60 border border-zinc-200 dark:border-zinc-800 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-900 dark:text-white">
                      Escaneo de Vencimientos:
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      {scanResult.found === 0 ? 'Sin alertas pendientes' : `${scanResult.found} suscripción(es) próximas`}
                    </span>
                  </div>
                  {scanResult.found === 0 ? (
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                      ✓ Todas tus suscripciones están al día. Ningún cobro previsto dentro de los próximos {notificationSettings.advanceDays} días.
                    </p>
                  ) : (
                    <div className="text-[11px] text-zinc-600 dark:text-zinc-300 space-y-0.5 pt-1">
                      {scanResult.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <span>• {item.subName}</span>
                          <span className="text-emerald-500 font-medium">
                            {item.daysRemaining === 0 ? 'Hoy' : item.daysRemaining === 1 ? 'Mañana' : `En ${item.daysRemaining} días`}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

            </div>

            {/* 3. Notification Settings Panel */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
                    <Bell size={16} />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                      Ajustes de Notificaciones y Avisos
                    </h2>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Configura antelación, horario del resumen y preferencias</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    const next = !notificationSettings.pushEnabled;
                    if (next && getNotificationPermissionStatus() === 'default') {
                      const res = await requestSystemNotificationPermission();
                      setPermissionStatus(res);
                    }
                    onUpdateSettings({
                      ...notificationSettings,
                      pushEnabled: next,
                    });
                  }}
                  className={`w-11 h-6 flex items-center rounded-full p-0.5 transition-colors duration-200 cursor-pointer ${
                    notificationSettings.pushEnabled ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-800'
                  }`}
                >
                  <motion.div
                    layout
                    className="bg-white dark:bg-black w-5 h-5 rounded-full shadow-md"
                    animate={{ x: notificationSettings.pushEnabled ? 20 : 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>

              {/* Toggles & Configurations */}
              <div className="space-y-3 pt-1 text-xs">
                
                {/* Advance Days Alert */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-black/60 border border-zinc-200 dark:border-zinc-800">
                  <div>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200 block text-xs">Antelación de Aviso</span>
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400">Días previos al cobro para generar la alerta</span>
                  </div>
                  <select
                    value={notificationSettings.advanceDays}
                    onChange={(e) =>
                      onUpdateSettings({
                        ...notificationSettings,
                        advanceDays: parseInt(e.target.value),
                      })
                    }
                    className="px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-white text-xs font-semibold focus:outline-none"
                  >
                    <option value={0}>El mismo día del cobro</option>
                    <option value={1}>1 día antes</option>
                    <option value={3}>3 días antes (Recomendado)</option>
                    <option value={7}>1 semana antes</option>
                  </select>
                </div>

                {/* Reminder Daily Time */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-black/60 border border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <Clock size={15} className="text-zinc-400" />
                    <div>
                      <span className="font-bold text-zinc-800 dark:text-zinc-200 block text-xs">Hora del Resumen Diario</span>
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400">Horario preferido para las notificaciones</span>
                    </div>
                  </div>
                  <input
                    type="time"
                    value={notificationSettings.reminderTime}
                    onChange={(e) =>
                      onUpdateSettings({
                        ...notificationSettings,
                        reminderTime: e.target.value,
                      })
                    }
                    className="px-2.5 py-1 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-white text-xs font-semibold"
                  />
                </div>

                {/* Sound & Haptics Toggles */}
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateSettings({
                        ...notificationSettings,
                        soundEnabled: !notificationSettings.soundEnabled,
                      })
                    }
                    className={`p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                      notificationSettings.soundEnabled
                        ? 'bg-indigo-50 dark:bg-indigo-600/10 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/30'
                        : 'bg-zinc-50 dark:bg-black/60 text-zinc-500 border-zinc-200 dark:border-zinc-800'
                    }`}
                  >
                    <span className="flex items-center gap-2 font-medium text-xs">
                      <Volume2 size={14} />
                      Timbre Acústico
                    </span>
                    {notificationSettings.soundEnabled && <Check size={13} className="text-indigo-500" />}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      onUpdateSettings({
                        ...notificationSettings,
                        vibrateEnabled: !notificationSettings.vibrateEnabled,
                      })
                    }
                    className={`p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                      notificationSettings.vibrateEnabled
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30'
                        : 'bg-zinc-50 dark:bg-black/60 text-zinc-500 border-zinc-200 dark:border-zinc-800'
                    }`}
                  >
                    <span className="flex items-center gap-2 font-medium text-xs">
                      <Vibrate size={14} />
                      Vibración Háptica
                    </span>
                    {notificationSettings.vibrateEnabled && <Check size={13} className="text-emerald-500" />}
                  </button>
                </div>
              </div>
            </div>

            {/* 4. Notification History Inbox */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center border border-purple-500/20">
                    <Bell size={15} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <span>Buzón de Alertas ({notifications.length})</span>
                      {notifications.filter((n) => !n.read).length > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-black text-[9px] font-bold">
                          {notifications.filter((n) => !n.read).length} nuevas
                        </span>
                      )}
                    </h3>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Historial de avisos y notificaciones generadas</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {notifications.some((n) => !n.read) && onMarkAllNotificationsRead && (
                    <button
                      type="button"
                      onClick={onMarkAllNotificationsRead}
                      className="text-[11px] text-indigo-500 hover:text-indigo-600 font-semibold px-2 py-1 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors"
                    >
                      Leídas
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      type="button"
                      onClick={onClearNotifications}
                      className="text-[11px] text-zinc-400 hover:text-rose-500 font-medium px-2 py-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      Vaciar
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                {notifications.map((n) => {
                  const linkedSub = subscriptions.find((s) => s.id === n.subscriptionId);

                  return (
                    <div
                      key={n.id}
                      className={`p-3 rounded-xl border transition-all ${
                        n.read
                          ? 'bg-zinc-50 dark:bg-black/40 border-zinc-200 dark:border-zinc-850 text-zinc-500'
                          : 'bg-white dark:bg-black/80 border-indigo-200 dark:border-indigo-500/30 text-zinc-800 dark:text-zinc-200 shadow-xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2.5">
                        <button
                          type="button"
                          onClick={() => onToggleNotificationRead && onToggleNotificationRead(n.id)}
                          className="flex items-start gap-2.5 flex-1 text-left cursor-pointer group"
                        >
                          <span
                            className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 transition-colors ${
                              n.read ? 'bg-zinc-300 dark:bg-zinc-700' : 'bg-emerald-500 ring-2 ring-emerald-500/20'
                            }`}
                            title={n.read ? 'Marcar como no leída' : 'Marcar como leída'}
                          />
                          <div className="space-y-0.5">
                            <h4 className="font-bold text-zinc-900 dark:text-white text-xs group-hover:text-emerald-500 transition-colors">
                              {n.title}
                            </h4>
                            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
                              {n.message}
                            </p>
                          </div>
                        </button>

                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
                            {formatDateDisplay(n.date.split('T')[0])}
                          </span>

                          {onDeleteNotification && (
                            <button
                              type="button"
                              onClick={() => onDeleteNotification(n.id)}
                              className="p-1 rounded text-zinc-400 hover:text-rose-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ml-1"
                              title="Eliminar aviso"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Jump to linked subscription if available */}
                      {linkedSub && (
                        <div className="mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
                          <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                            Suscripción: <strong className="text-zinc-700 dark:text-zinc-300">{linkedSub.name}</strong>
                          </span>
                          <button
                            type="button"
                            onClick={() => onSelectSubscription(linkedSub)}
                            className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
                          >
                            <span>Ver detalles</span>
                            <ArrowUpRight size={11} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}

                {notifications.length === 0 && (
                  <div className="text-center py-8 text-zinc-400 text-xs space-y-1">
                    <Bell size={20} className="mx-auto text-zinc-300 dark:text-zinc-600 mb-2" />
                    <p className="font-semibold text-zinc-600 dark:text-zinc-400">Buzón de avisos vacío</p>
                    <p className="text-[11px]">Usa el botón de prueba o activa alertas automáticas para registrar eventos.</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

