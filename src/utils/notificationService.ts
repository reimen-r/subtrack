import { Subscription, NotificationItem } from '../types';

/**
 * Service for managing native system push notifications, Web Audio chimes,
 * haptic vibrations, and renewal alerts in SubTrack.
 */

export function isSystemNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function isVibrationSupported(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
}

export function isAudioContextSupported(): boolean {
  return typeof window !== 'undefined' && (
    'AudioContext' in window || 'webkitAudioContext' in window
  );
}

export function getNotificationPermissionStatus(): 'granted' | 'denied' | 'default' | 'unsupported' {
  if (!isSystemNotificationSupported()) {
    return 'unsupported';
  }
  return Notification.permission;
}

export async function requestSystemNotificationPermission(): Promise<'granted' | 'denied' | 'default' | 'unsupported'> {
  if (!isSystemNotificationSupported()) {
    return 'unsupported';
  }
  try {
    const result = await Notification.requestPermission();
    return result;
  } catch {
    return Notification.permission;
  }
}

/**
 * Plays an Apple-style dual-tone notification chime using Web Audio API synthesis
 * (Zero MP3/external asset dependencies, instant local playback).
 */
export function playNotificationSound(): boolean {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return false;
    
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // Pleasant Apple-inspired chime (F6 1396.91Hz -> A6 1760Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1396.91, now);
    osc1.frequency.exponentialRampToValueAtTime(1760, now + 0.12);

    gain1.gain.setValueAtTime(0.001, now);
    gain1.gain.linearRampToValueAtTime(0.22, now + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.48);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.5);
    return true;
  } catch (e) {
    console.warn('Audio chime playback restricted or unsupported:', e);
    return false;
  }
}

/**
 * Triggers tactile vibration if supported on the device.
 * Returns true if vibration API was called.
 */
export function triggerHapticVibration(pattern: number[] = [70, 40, 110]): boolean {
  if (isVibrationSupported()) {
    try {
      return navigator.vibrate(pattern);
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Dispatches a native browser/device notification.
 */
export async function sendSystemNotification(
  title: string, 
  options?: NotificationOptions
): Promise<{ sent: boolean; channel: 'serviceworker' | 'notification-api' | 'none'; error?: string }> {
  if (!isSystemNotificationSupported()) {
    return { sent: false, channel: 'none', error: 'El navegador no soporta Notification API' };
  }

  if (Notification.permission !== 'granted') {
    return { 
      sent: false, 
      channel: 'none', 
      error: `Permiso actual: "${Notification.permission}". Debe solicitarse y aceptarse primero.` 
    };
  }

  const defaultOptions: NotificationOptions = {
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    ...options,
  };

  // Try Service Worker registration first (standard for PWAs, Android Chrome, and Safari iOS 16.4+)
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        await reg.showNotification(title, defaultOptions);
        return { sent: true, channel: 'serviceworker' };
      }
    } catch {
      // Fallback below
    }
  }

  // Fallback to desktop/standard Notification constructor
  try {
    new Notification(title, defaultOptions);
    return { sent: true, channel: 'notification-api' };
  } catch (err) {
    return { 
      sent: false, 
      channel: 'none', 
      error: err instanceof Error ? err.message : 'Error al instanciar Notification' 
    };
  }
}

export interface UpcomingRenewalAlert {
  sub: Subscription;
  daysRemaining: number;
}

/**
 * Detects active subscriptions with renewal dates coming up within `advanceDays`.
 */
export function findUpcomingRenewals(
  subscriptions: Subscription[],
  advanceDays: number = 3
): UpcomingRenewalAlert[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const alerts: UpcomingRenewalAlert[] = [];

  for (const sub of subscriptions) {
    if (sub.status === 'cancelled' || sub.status === 'paused') continue;
    if (sub.enableNotifications === false) continue;
    if (!sub.nextBillingDate) continue;

    const parts = sub.nextBillingDate.split('-').map(Number);
    if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) continue;

    const billDate = new Date(parts[0], parts[1] - 1, parts[2]);
    billDate.setHours(0, 0, 0, 0);

    const diffMs = billDate.getTime() - today.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays >= 0 && diffDays <= advanceDays) {
      alerts.push({ sub, daysRemaining: diffDays });
    }
  }

  return alerts;
}

