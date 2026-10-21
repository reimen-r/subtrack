import React, { useState, useEffect, useRef } from 'react';
import { 
  Wifi, 
  Battery, 
  Sun, 
  Moon, 
  Smartphone, 
  Monitor, 
  ShieldCheck, 
} from 'lucide-react';
import { 
  Subscription, 
  NotificationSettings, 
  NotificationItem,
  ThemeMode,
  BillingHistoryRecord,
} from './types';
import { 
  INITIAL_SUBSCRIPTIONS, 
  INITIAL_NOTIFICATIONS 
} from './data/presets';
import { calculateNextRenewal } from './utils/subscriptionUtils';
import { DashboardScreen } from './components/DashboardScreen';
import { SubscriptionDetailScreen } from './components/SubscriptionDetailScreen';
import { AnalyticsNotificationScreen } from './components/AnalyticsNotificationScreen';
import { BackupSyncScreen } from './components/BackupSyncScreen';
import { AddEditSubscriptionModal } from './components/AddEditSubscriptionModal';
import { BottomNavBar, TabType } from './components/BottomNavBar';
import { InAppNotificationBanner } from './components/InAppNotificationBanner';
import { OfflineIndicator } from './components/OfflineIndicator';
import { GooglePlayCenterModal } from './components/GooglePlayCenterModal';
import { PrivacyPolicyModal } from './components/PrivacyPolicyModal';
import { SubTrackLogo } from './components/SubTrackLogo';
import { 
  playNotificationSound, 
  triggerHapticVibration, 
  sendSystemNotification,
  findUpcomingRenewals,
  getNotificationPermissionStatus,
  requestSystemNotificationPermission
} from './utils/notificationService';
import confetti from 'canvas-confetti';

const STORAGE_KEY_SUBS = 'subtrack_subscriptions_v2_clean';
const STORAGE_KEY_SETTINGS = 'subtrack_settings_v2';
const STORAGE_KEY_NOTIFIED_CYCLES = 'subtrack_notified_cycles';
const STORAGE_KEY_NOTIFS = 'subtrack_notifs_v2_clean';
const STORAGE_KEY_THEME = 'subtrack_theme_preference';

export default function App() {
  // Theme state with localStorage persistence
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_THEME);
    if (saved === 'dark' || saved === 'light') {
      return saved;
    }
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    return 'dark';
  });

  // Apply dark or light class to root HTML element
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    localStorage.setItem(STORAGE_KEY_THEME, theme);

    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme === 'dark' ? '#09090b' : '#f8fafc');
    }
  }, [theme]);

  // Load initial state starting blank from zero
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_SUBS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse subscriptions from storage', e);
      }
    }
    return [];
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse settings from storage', e);
      }
    }
    return {
      pushEnabled: true,
      emailDigest: true,
      advanceDays: 3,
      reminderTime: '09:00',
      soundEnabled: true,
      vibrateEnabled: true,
      upcomingRenewalsAlert: true,
      monthlySummaryAlert: true,
    };
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_NOTIFS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse notifications from storage', e);
      }
    }
    return [];
  });

  // Navigation State
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  
  // Modal States
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [isGooglePlayModalOpen, setIsGooglePlayModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);

  // Deep-link query parameters listener (e.g. ?view=googleplay or ?view=privacy)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('view') === 'privacy') {
        setIsPrivacyModalOpen(true);
      } else if (params.get('view') === 'googleplay') {
        setIsGooglePlayModalOpen(true);
      } else if (params.get('action') === 'new') {
        setIsAddEditModalOpen(true);
      } else if (params.get('tab') === 'analytics') {
        setActiveTab('analytics');
      } else if (params.get('tab') === 'sync' || params.get('tab') === 'backup') {
        setActiveTab('backup');
      }
    }
  }, []);

  // Active push banner state
  const [activeBanner, setActiveBanner] = useState<{ title: string; message: string } | null>(null);

  // View presentation mode (Mobile Frame vs Fluid Responsive)
  const [isPhoneFrame, setIsPhoneFrame] = useState(false);

  // Persist changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SUBS, JSON.stringify(subscriptions));
  }, [subscriptions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(notificationSettings));
  }, [notificationSettings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(notifications));
  }, [notifications]);

  // Automated background check for upcoming subscription renewals
  useEffect(() => {
    if (!notificationSettings.pushEnabled && !notificationSettings.upcomingRenewalsAlert) return;
    
    const upcoming = findUpcomingRenewals(subscriptions, notificationSettings.advanceDays);
    if (upcoming.length === 0) return;

    let notifiedSet = new Set<string>();
    try {
      const notifiedRaw = localStorage.getItem(STORAGE_KEY_NOTIFIED_CYCLES);
      if (notifiedRaw) notifiedSet = new Set(JSON.parse(notifiedRaw));
    } catch {
      // ignore
    }

    let hasNew = false;
    const newNotifs: NotificationItem[] = [];

    for (const { sub, daysRemaining } of upcoming) {
      const cycleKey = `${sub.id}_${sub.nextBillingDate}`;
      if (!notifiedSet.has(cycleKey)) {
        notifiedSet.add(cycleKey);
        hasNew = true;
        const daysText = daysRemaining === 0 ? 'hoy' : daysRemaining === 1 ? 'mañana' : `en ${daysRemaining} días`;
        newNotifs.push({
          id: `notif-${Date.now()}-${sub.id}`,
          title: `Vencimiento próximo: ${sub.name}`,
          message: `Tu suscripción de $${sub.cost.toFixed(2)} renovará ${daysText} (${sub.nextBillingDate}).`,
          subscriptionId: sub.id,
          date: new Date().toISOString(),
          read: false,
          type: 'upcoming',
        });
      }
    }

    if (hasNew && newNotifs.length > 0) {
      localStorage.setItem(STORAGE_KEY_NOTIFIED_CYCLES, JSON.stringify(Array.from(notifiedSet)));
      setNotifications((prev) => [...newNotifs, ...prev]);
    }
  }, [subscriptions, notificationSettings.advanceDays, notificationSettings.pushEnabled, notificationSettings.upcomingRenewalsAlert]);

  // Handler: Add or Update Subscription
  const handleSaveSubscription = (
    subData: Omit<Subscription, 'id' | 'createdAt' | 'billingHistory'> & { id?: string }
  ) => {
    if (subData.id) {
      // Editing existing
      const updatedList = subscriptions.map((s) =>
        s.id === subData.id
          ? {
              ...s,
              ...subData,
            }
          : s
      );
      setSubscriptions(updatedList);
      if (selectedSubscription?.id === subData.id) {
        setSelectedSubscription({
          ...selectedSubscription,
          ...subData,
        });
      }
      triggerInAppBanner('Subscription Updated', `Saved changes for ${subData.name}.`);
    } else {
      // Creating new
      const newSub: Subscription = {
        ...subData,
        id: `sub-${Date.now()}`,
        createdAt: new Date().toISOString(),
        billingHistory: [
          {
            id: `bh-${Date.now()}`,
            date: subData.nextBillingDate,
            amount: subData.cost,
            currency: subData.currency,
            status: 'paid',
            invoiceNumber: `INV-${Math.floor(100000 + Math.random() * 900000)}`,
            note: 'Initial billing setup',
          },
        ],
      };

      setSubscriptions([newSub, ...subscriptions]);
      
      confetti({
        particleCount: 70,
        spread: 70,
        origin: { y: 0.7 },
        colors: ['#10B981', '#6366F1', '#34D399', '#A78BFA'],
      });

      triggerInAppBanner(
        'Subscription Added!',
        `${newSub.name} added with next renewal on ${newSub.nextBillingDate}.`
      );

      // Add to notifications
      const newNotif: NotificationItem = {
        id: `notif-${Date.now()}`,
        title: `Added: ${newSub.name}`,
        message: `${newSub.name} ($${newSub.cost.toFixed(2)}) is now actively tracked.`,
        subscriptionId: newSub.id,
        date: new Date().toISOString(),
        read: false,
        type: 'upcoming',
      };
      setNotifications([newNotif, ...notifications]);
    }
  };

  // Handler: Delete Subscription
  const handleDeleteSubscription = (id: string) => {
    const target = subscriptions.find((s) => s.id === id);
    setSubscriptions(subscriptions.filter((s) => s.id !== id));
    if (selectedSubscription?.id === id) {
      setSelectedSubscription(null);
    }
    triggerInAppBanner('Subscription Deleted', `${target?.name || 'Item'} has been removed.`);
  };

  // Handler: Update subscription directly (e.g. from Details screen)
  const handleUpdateSubscription = (updated: Subscription) => {
    setSubscriptions(subscriptions.map((s) => (s.id === updated.id ? updated : s)));
    setSelectedSubscription(updated);
  };

  // Handler: Quick mark paid from Dashboard with actual state update and next renewal calculation
  const handleQuickMarkPaid = (sub: Subscription) => {
    const nextDate = calculateNextRenewal(sub.nextBillingDate, sub.frequency);
    const newRecord: BillingHistoryRecord = {
      id: `bh-${Date.now()}`,
      date: sub.nextBillingDate,
      amount: sub.cost,
      currency: sub.currency,
      status: 'paid',
      invoiceNumber: `INV-${Math.floor(100000 + Math.random() * 900000)}`,
      note: 'Renovación rápida desde el Dashboard',
    };
    const updatedSub: Subscription = {
      ...sub,
      nextBillingDate: nextDate,
      billingHistory: [newRecord, ...(sub.billingHistory || [])],
    };
    handleUpdateSubscription(updatedSub);
    confetti({
      particleCount: 45,
      spread: 60,
      origin: { y: 0.75 },
      colors: ['#10B981', '#6366F1', '#34D399'],
    });
    triggerInAppBanner('¡Pago Registrado!', `${sub.name} renovado hasta ${nextDate}.`);
  };

  // Trigger temporary In-App notification banner & native sound/haptics/system push
  const triggerInAppBanner = (title: string, message: string) => {
    setActiveBanner({ title, message });

    if (notificationSettings.soundEnabled) {
      playNotificationSound();
    }

    if (notificationSettings.vibrateEnabled) {
      triggerHapticVibration();
    }

    if (notificationSettings.pushEnabled) {
      sendSystemNotification(title, { body: message });
    }

    setTimeout(() => {
      setActiveBanner(null);
    }, 4500);
  };

  // Full-featured test notification trigger with detailed channel status report
  const handleTriggerTestNotification = async (
    title: string, 
    message: string, 
    options?: { sound?: boolean; vibrate?: boolean; push?: boolean; addToInbox?: boolean; subscriptionId?: string }
  ) => {
    const soundToPlay = options?.sound ?? notificationSettings.soundEnabled;
    const vibrateToTrigger = options?.vibrate ?? notificationSettings.vibrateEnabled;
    const pushToSend = options?.push ?? notificationSettings.pushEnabled;

    setActiveBanner({ title, message });

    let soundResult = false;
    if (soundToPlay) {
      soundResult = playNotificationSound();
    }

    let vibrateResult = false;
    if (vibrateToTrigger) {
      vibrateResult = triggerHapticVibration();
    }

    let pushResult: { sent: boolean; channel: 'serviceworker' | 'notification-api' | 'none'; error?: string } = {
      sent: false,
      channel: 'none',
    };

    if (pushToSend) {
      // If permission is default, ask for it
      if (getNotificationPermissionStatus() === 'default') {
        const req = await requestSystemNotificationPermission();
        if (req === 'granted') {
          pushResult = await sendSystemNotification(title, { body: message });
        } else {
          pushResult = { sent: false, channel: 'none', error: 'Permiso no otorgado en el navegador' };
        }
      } else {
        pushResult = await sendSystemNotification(title, { body: message });
      }
    }

    if (options?.addToInbox !== false) {
      const testNotif: NotificationItem = {
        id: `notif-${Date.now()}`,
        title,
        message,
        subscriptionId: options?.subscriptionId || 'test',
        date: new Date().toISOString(),
        read: false,
        type: 'upcoming',
      };
      setNotifications((prev) => [testNotif, ...prev]);
    }

    setTimeout(() => {
      setActiveBanner(null);
    }, 4500);

    return {
      sent: pushResult.sent,
      channel: pushResult.channel,
      soundPlayed: soundResult,
      vibrateTriggered: vibrateResult,
      error: pushResult.error,
    };
  };

  // Toggle single notification read status
  const handleToggleNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
    );
  };

  // Delete single notification from inbox
  const handleDeleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Mark all notifications as read
  const handleMarkAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // Manual trigger to scan upcoming renewals immediately
  const handleScanUpcomingRenewalsNow = () => {
    const upcoming = findUpcomingRenewals(subscriptions, notificationSettings.advanceDays);
    if (upcoming.length === 0) {
      return { found: 0, newAlerts: 0, items: [] };
    }

    let notifiedSet = new Set<string>();
    try {
      const notifiedRaw = localStorage.getItem(STORAGE_KEY_NOTIFIED_CYCLES);
      if (notifiedRaw) notifiedSet = new Set(JSON.parse(notifiedRaw));
    } catch {
      // ignore
    }

    const newNotifs: NotificationItem[] = [];
    for (const { sub, daysRemaining } of upcoming) {
      const cycleKey = `${sub.id}_${sub.nextBillingDate}`;
      const daysText = daysRemaining === 0 ? 'hoy' : daysRemaining === 1 ? 'mañana' : `en ${daysRemaining} días`;
      
      const newNotif: NotificationItem = {
        id: `notif-${Date.now()}-${sub.id}`,
        title: `Vencimiento próximo: ${sub.name}`,
        message: `Tu suscripción de $${sub.cost.toFixed(2)} renovará ${daysText} (${sub.nextBillingDate}).`,
        subscriptionId: sub.id,
        date: new Date().toISOString(),
        read: false,
        type: 'upcoming',
      };
      notifiedSet.add(cycleKey);
      newNotifs.push(newNotif);
    }

    localStorage.setItem(STORAGE_KEY_NOTIFIED_CYCLES, JSON.stringify(Array.from(notifiedSet)));
    if (newNotifs.length > 0) {
      setNotifications((prev) => [...newNotifs, ...prev]);
      const first = newNotifs[0];
      triggerInAppBanner(first.title, first.message);
    }

    return {
      found: upcoming.length,
      newAlerts: newNotifs.length,
      items: upcoming.map((u) => ({ subName: u.sub.name, daysRemaining: u.daysRemaining })),
    };
  };

  // Handle restoring subscriptions from iCloud, Google Drive, or transfer code
  const handleRestoreSubscriptions = (restoredSubs: Subscription[], mode: 'replace' | 'merge') => {
    let finalSubs: Subscription[] = [];
    if (mode === 'replace') {
      finalSubs = restoredSubs;
    } else {
      // Merge mode: keep existing, append new non-duplicates by name or ID
      const existingNames = new Set(subscriptions.map((s) => s.name.toLowerCase().trim()));
      const newItems = restoredSubs.filter((s) => !existingNames.has(s.name.toLowerCase().trim()));
      finalSubs = [...subscriptions, ...newItems];
    }

    setSubscriptions(finalSubs);
    localStorage.setItem(STORAGE_KEY_SUBS, JSON.stringify(finalSubs));

    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#10B981', '#6366F1', '#38BDF8', '#F59E0B'],
    });

    triggerInAppBanner(
      '¡Copia restaurada!',
      `${finalSubs.length} suscripciones están ahora sincronizadas y listas.`
    );
  };

  // Clear all data to start from zero
  const handleClearAllData = () => {
    setSubscriptions([]);
    setNotifications([]);
    localStorage.removeItem(STORAGE_KEY_SUBS);
    localStorage.removeItem(STORAGE_KEY_NOTIFS);
    setSelectedSubscription(null);
    triggerInAppBanner('Comenzar de cero', 'Se han borrado todas las suscripciones. Listo para empezar.');
  };

  // Load sample demo data
  const handleLoadSampleData = () => {
    setSubscriptions(INITIAL_SUBSCRIPTIONS);
    setNotifications(INITIAL_NOTIFICATIONS);
    localStorage.setItem(STORAGE_KEY_SUBS, JSON.stringify(INITIAL_SUBSCRIPTIONS));
    localStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(INITIAL_NOTIFICATIONS));
    setSelectedSubscription(null);
    triggerInAppBanner('Datos de ejemplo', 'Se han cargado las suscripciones de demostración.');
  };

  // Dedicated container ref for reliable top-scrolling in all frame modes
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  // Reset scroll smoothly whenever user switches tabs or views subscription details
  useEffect(() => {
    scrollToTop();
  }, [activeTab, selectedSubscription]);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-zinc-950 text-zinc-900 dark:text-white flex flex-col items-center justify-start antialiased selection:bg-emerald-500/30 selection:text-emerald-500">
      
      {/* Offline Connectivity Indicator */}
      <OfflineIndicator />

      {/* Push Notification Banner */}
      <InAppNotificationBanner
        notification={activeBanner}
        onDismiss={() => setActiveBanner(null)}
      />

      {/* Top Utility Bar (iOS Translucent Glass Header with Safe Area support) */}
      <header className="w-full max-w-2xl px-3 sm:px-4 pt-[max(env(safe-area-inset-top,0px),0.65rem)] pb-2.5 flex items-center justify-between border-b border-zinc-200/80 dark:border-zinc-800/60 text-xs text-zinc-500 dark:text-zinc-400 select-none sticky top-0 z-30 ios-glass-header">
        <div className="flex items-center gap-2">
          <SubTrackLogo
            variant="image"
            size="md"
            onClick={() => {
              setActiveTab('home');
              setSelectedSubscription(null);
            }}
          />
          <span className="text-zinc-300 dark:text-zinc-700 hidden sm:inline">|</span>
          <span className="text-zinc-500 text-xs hidden md:inline">Gestor de suscripciones</span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Phone Frame Toggle (visible on desktop/tablets to simulate mobile device) */}
          <button
            onClick={() => setIsPhoneFrame(!isPhoneFrame)}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white text-xs font-semibold transition-all cursor-pointer shadow-sm active:scale-95"
            title={isPhoneFrame ? 'Cambiar a vista fluida' : 'Simular marco de iPhone'}
          >
            {isPhoneFrame ? (
              <>
                <Monitor size={13} className="text-indigo-400" />
                <span>Vista Fluida</span>
              </>
            ) : (
              <>
                <Smartphone size={13} className="text-indigo-400" />
                <span>Simular Móvil</span>
              </>
            )}
          </button>

          {/* Theme Selector Toggle */}
          <button
            id="btn-toggle-theme"
            onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white text-xs font-semibold transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
            title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            aria-label="Alternar tema oscuro y claro"
          >
            {theme === 'dark' ? (
              <>
                <Sun size={13} className="text-amber-400" />
                <span className="hidden sm:inline">Claro</span>
              </>
            ) : (
              <>
                <Moon size={13} className="text-indigo-500" />
                <span className="hidden sm:inline">Oscuro</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Container / Mobile Frame Wrapper */}
      <main
        className={`w-full transition-all duration-300 flex-1 flex flex-col no-scrollbar ${
          isPhoneFrame
            ? 'max-w-[420px] my-3 sm:my-4 rounded-[42px] border-[5px] border-zinc-800/90 shadow-2xl shadow-black/80 h-[820px] max-h-[88vh] relative bg-white dark:bg-black overflow-hidden'
            : 'max-w-xl w-full mx-auto relative bg-white dark:bg-black min-h-[calc(100dvh-55px)] border-x-0 sm:border-x border-zinc-200/90 dark:border-zinc-900/60'
        }`}
      >
        {/* Simulated iOS Status Bar on Phone Frame */}
        {isPhoneFrame && (
          <div className="h-10 px-6 flex items-center justify-between text-xs text-zinc-400 font-semibold bg-zinc-950 select-none pt-2 z-30 relative shrink-0">
            <span className="text-xs font-bold text-white">9:41</span>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-5 bg-zinc-800 rounded-b-2xl" />
            <div className="flex items-center gap-1.5 text-zinc-400">
              <Wifi size={13} />
              <Battery size={15} className="text-emerald-400" />
            </div>
          </div>
        )}

        {/* View Routing - Unified responsive scrolling with instant 0ms switching */}
        <div
          ref={scrollContainerRef}
          className={`flex-1 flex flex-col relative bg-white dark:bg-black no-scrollbar ${
            isPhoneFrame ? 'overflow-y-auto overscroll-contain' : ''
          }`}
        >
          {selectedSubscription ? (
            <SubscriptionDetailScreen
              key={`detail-${selectedSubscription.id}`}
              subscription={selectedSubscription}
              onBack={() => {
                setSelectedSubscription(null);
                scrollToTop();
              }}
              onEdit={(sub) => {
                setEditingSubscription(sub);
                setIsAddEditModalOpen(true);
              }}
              onDelete={handleDeleteSubscription}
              onUpdate={handleUpdateSubscription}
            />
          ) : activeTab === 'home' ? (
            <div key="tab-home" className="flex-1 flex flex-col animate-in fade-in duration-100">
              <DashboardScreen
                subscriptions={subscriptions}
                onSelectSubscription={(sub) => {
                  setSelectedSubscription(sub);
                  scrollToTop();
                }}
                onOpenAddModal={() => {
                  setEditingSubscription(null);
                  setIsAddEditModalOpen(true);
                }}
                onEditSubscription={(sub) => {
                  setEditingSubscription(sub);
                  setIsAddEditModalOpen(true);
                }}
                onNavigateToBackup={() => {
                  setActiveTab('backup');
                  scrollToTop();
                }}
                onQuickMarkPaid={handleQuickMarkPaid}
                onUpdateSubscription={handleUpdateSubscription}
              />
            </div>
          ) : activeTab === 'analytics' ? (
            <div key="tab-analytics" className="flex-1 flex flex-col animate-in fade-in duration-100">
              <AnalyticsNotificationScreen
                subscriptions={subscriptions}
                notifications={notifications}
                notificationSettings={notificationSettings}
                theme={theme}
                onUpdateTheme={setTheme}
                onUpdateSettings={setNotificationSettings}
                onSelectSubscription={(sub) => {
                  setSelectedSubscription(sub);
                  scrollToTop();
                }}
                onTriggerTestNotification={handleTriggerTestNotification}
                onClearNotifications={() => setNotifications([])}
                onToggleNotificationRead={handleToggleNotificationRead}
                onDeleteNotification={handleDeleteNotification}
                onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
                onScanRenewalsNow={handleScanUpcomingRenewalsNow}
              />
            </div>
          ) : (
            <div key="tab-backup" className="flex-1 flex flex-col animate-in fade-in duration-100">
              <BackupSyncScreen
                subscriptions={subscriptions}
                notificationSettings={notificationSettings}
                onRestoreSubscriptions={handleRestoreSubscriptions}
                onShowBanner={triggerInAppBanner}
                onOpenGooglePlay={() => setIsGooglePlayModalOpen(true)}
                onOpenPrivacy={() => setIsPrivacyModalOpen(true)}
              />
            </div>
          )}
        </div>

        {/* Bottom Tab Bar (shown when not inspecting details) */}
        {!selectedSubscription && (
          <BottomNavBar
            activeTab={activeTab}
            onChangeTab={(tab) => {
              setActiveTab(tab);
              scrollToTop();
            }}
            onOpenAddModal={() => {
              setEditingSubscription(null);
              setIsAddEditModalOpen(true);
            }}
            unreadNotificationsCount={notifications.filter((n) => !n.read).length}
            isPhoneFrame={isPhoneFrame}
          />
        )}
      </main>

      {/* Add / Edit Subscription Modal */}
      <AddEditSubscriptionModal
        isOpen={isAddEditModalOpen}
        onClose={() => {
          setIsAddEditModalOpen(false);
          setEditingSubscription(null);
        }}
        onSave={handleSaveSubscription}
        initialData={editingSubscription}
      />

      {/* Google Play Store Launchpad & Packaging Modal */}
      <GooglePlayCenterModal
        isOpen={isGooglePlayModalOpen}
        onClose={() => setIsGooglePlayModalOpen(false)}
        onOpenPrivacy={() => {
          setIsGooglePlayModalOpen(false);
          setIsPrivacyModalOpen(true);
        }}
      />

      {/* Privacy Policy / Google Play Data Safety Modal */}
      <PrivacyPolicyModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
      />
    </div>
  );
}
