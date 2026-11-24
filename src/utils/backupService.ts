import { Subscription, NotificationSettings, BackupPackage, LocalSnapshot } from '../types';
import { getMonthlyEquivalent } from './subscriptionUtils';

const SNAPSHOTS_KEY = 'subtrack_snapshots_v1';
const MAX_SNAPSHOTS = 1;

/**
 * Creates a structured BackupPackage ready for export
 */
export function generateBackupPackage(
  subscriptions: Subscription[],
  notificationSettings?: NotificationSettings
): BackupPackage {
  const totalMonthlyUSD = subscriptions.reduce((sum, sub) => {
    if (sub.status !== 'active') return sum;
    return sum + getMonthlyEquivalent(sub.cost, sub.frequency);
  }, 0);

  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown';
  let deviceName = 'Web Browser';
  if (/iPhone|iPad|iPod/i.test(ua)) deviceName = 'iPhone / iOS';
  else if (/Android/i.test(ua)) deviceName = 'Android Phone';
  else if (/Macintosh/i.test(ua)) deviceName = 'Mac';
  else if (/Windows/i.test(ua)) deviceName = 'Windows PC';

  return {
    version: '1.0',
    app: 'SubTrack',
    exportedAt: new Date().toISOString(),
    deviceInfo: deviceName,
    subscriptionsCount: subscriptions.length,
    totalMonthlySpendUSD: Number(totalMonthlyUSD.toFixed(2)),
    subscriptions: JSON.parse(JSON.stringify(subscriptions)), // deep copy
    notificationSettings: notificationSettings ? JSON.parse(JSON.stringify(notificationSettings)) : undefined,
  };
}

/**
 * Generates the standard backup filename.
 * Uses a clean standard name (SubTrack_Backup.json) so downloading or saving it
 * replaces the previous backup file instead of accumulating duplicates.
 */
export function getBackupFileName(extension: 'json' | 'subtrack' = 'json', timestamped: boolean = false): string {
  if (timestamped) {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    return `SubTrack_Backup_${dateStr}_${timeStr}.${extension}`;
  }
  return `SubTrack_Backup.${extension}`;
}

/**
 * Downloads a backup file to device (iCloud Drive / Google Drive / Downloads)
 */
export function downloadBackupFile(pkg: BackupPackage, extension: 'json' | 'subtrack' = 'json'): void {
  const jsonStr = JSON.stringify(pkg, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const filename = getBackupFileName(extension);

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Triggers native mobile Share sheet (iOS "Guardar en Archivos / iCloud Drive" or Android "Guardar en Drive")
 */
export async function shareBackupFile(pkg: BackupPackage): Promise<{ shared: boolean; method: 'share' | 'download' }> {
  const jsonStr = JSON.stringify(pkg, null, 2);
  const filename = getBackupFileName('json');
  const blob = new Blob([jsonStr], { type: 'application/json' });

  // Try Web Share API with File object (Supported on Safari iOS & Android Chrome)
  if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare) {
    try {
      const file = new File([blob], filename, { type: 'application/json' });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'SubTrack Backup',
          text: `Copia de seguridad de SubTrack (${pkg.subscriptionsCount} suscripciones)`,
          files: [file],
        });
        return { shared: true, method: 'share' };
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // User cancelled the share dialog
        return { shared: false, method: 'share' };
      }
      console.warn('Share file failed, falling back to download:', err);
    }
  }

  // Fallback to standard download
  downloadBackupFile(pkg, 'json');
  return { shared: true, method: 'download' };
}

/**
 * Validates and parses raw backup JSON text or file content
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
  pkg?: BackupPackage;
  summary?: {
    count: number;
    totalMonthlyUSD: number;
    sampleNames: string[];
    dateFormatted: string;
    deviceInfo?: string;
  };
}

export function validateAndParseBackup(jsonString: string): ValidationResult {
  try {
    const raw = JSON.parse(jsonString);

    // Validate structure:
    let subs: any[] = [];
    if (Array.isArray(raw)) {
      subs = raw;
    } else if (raw && Array.isArray(raw.subscriptions)) {
      subs = raw.subscriptions;
    } else {
      return {
        valid: false,
        error: 'El archivo no contiene un formato de suscripciones válido.',
      };
    }

    // Validate items in subs array
    const sanitizedSubs: Subscription[] = [];
    for (let i = 0; i < subs.length; i++) {
      const item = subs[i];
      if (!item.name || typeof item.cost !== 'number' || isNaN(item.cost)) {
        continue; // skip invalid or corrupted item
      }

      sanitizedSubs.push({
        id: item.id || `sub-${Date.now()}-${i}`,
        name: String(item.name).trim(),
        description: item.description ? String(item.description) : undefined,
        cost: Math.max(0, Number(item.cost)),
        currency: item.currency || 'USD',
        frequency: item.frequency || 'monthly',
        firstBillingDate: item.firstBillingDate || new Date().toISOString().split('T')[0],
        nextBillingDate: item.nextBillingDate || new Date().toISOString().split('T')[0],
        category: item.category || 'Other',
        color: item.color || '#10B981',
        iconName: item.iconName || 'CreditCard',
        domain: item.domain || undefined,
        logoUrl: item.logoUrl || undefined,
        websiteUrl: item.websiteUrl || undefined,
        cancelUrl: item.cancelUrl || undefined,
        paymentMethod: item.paymentMethod || undefined,
        enableNotifications: item.enableNotifications !== false,
        reminderTiming: item.reminderTiming || '3_days_before',
        contractTerms: item.contractTerms || undefined,
        status: item.status || 'active',
        billingHistory: Array.isArray(item.billingHistory) ? item.billingHistory : [],
        priceHistory: Array.isArray(item.priceHistory) ? item.priceHistory : undefined,
        splitPlan: item.splitPlan && typeof item.splitPlan === 'object' ? item.splitPlan : undefined,
        createdAt: item.createdAt || new Date().toISOString(),
        notes: item.notes || undefined,
      });
    }

    if (sanitizedSubs.length === 0 && subs.length > 0) {
      return {
        valid: false,
        error: 'No se pudieron extraer suscripciones válidas del archivo.',
      };
    }

    const totalMonthlyUSD = sanitizedSubs.reduce((sum, sub) => {
      if (sub.status !== 'active') return sum;
      return sum + getMonthlyEquivalent(sub.cost, sub.frequency);
    }, 0);

    const exportedDate = raw.exportedAt ? new Date(raw.exportedAt) : new Date();
    const dateFormatted = exportedDate.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const parsedPackage: BackupPackage = {
      version: raw.version || '1.0',
      app: 'SubTrack',
      exportedAt: raw.exportedAt || new Date().toISOString(),
      deviceInfo: raw.deviceInfo || 'Archivo externo',
      subscriptionsCount: sanitizedSubs.length,
      totalMonthlySpendUSD: Number(totalMonthlyUSD.toFixed(2)),
      subscriptions: sanitizedSubs,
      notificationSettings: raw.notificationSettings,
    };

    return {
      valid: true,
      pkg: parsedPackage,
      summary: {
        count: sanitizedSubs.length,
        totalMonthlyUSD: Number(totalMonthlyUSD.toFixed(2)),
        sampleNames: sanitizedSubs.slice(0, 4).map((s) => s.name),
        dateFormatted,
        deviceInfo: raw.deviceInfo,
      },
    };
  } catch (err: any) {
    return {
      valid: false,
      error: `Error al leer el archivo JSON: ${err.message || 'Formato inválido'}`,
    };
  }
}

/**
 * Compresses backup package into a short text string (for QR code or instant clipboard sync)
 */
export function generateQuickSyncString(pkg: BackupPackage): string {
  // Minimal representation to keep payload size lightweight
  const minimalSubs = pkg.subscriptions.map((s) => ({
    i: s.id,
    n: s.name,
    c: s.cost,
    cu: s.currency,
    f: s.frequency,
    nb: s.nextBillingDate,
    ca: s.category,
    co: s.color,
    d: s.domain,
    s: s.status,
  }));

  const payload = {
    v: 1,
    t: Date.now(),
    s: minimalSubs,
  };

  const str = JSON.stringify(payload);
  if (typeof btoa !== 'undefined') {
    return 'SUBTRACK://' + btoa(encodeURIComponent(str));
  }
  return 'SUBTRACK://' + encodeURIComponent(str);
}

/**
 * Decodes a quick sync string back into subscriptions
 */
export function parseQuickSyncString(syncCode: string): ValidationResult {
  try {
    let cleanCode = syncCode.trim();
    if (cleanCode.startsWith('SUBTRACK://')) {
      cleanCode = cleanCode.substring('SUBTRACK://'.length);
    }

    let jsonStr = '';
    try {
      jsonStr = decodeURIComponent(atob(cleanCode));
    } catch {
      jsonStr = decodeURIComponent(cleanCode);
    }

    const payload = JSON.parse(jsonStr);
    if (!payload || !Array.isArray(payload.s)) {
      return { valid: false, error: 'Código de sincronización no válido.' };
    }

    const subs: Subscription[] = payload.s.map((m: any, idx: number) => ({
      id: m.i || `sync-${Date.now()}-${idx}`,
      name: m.n || 'Suscripción',
      cost: Number(m.c) || 0,
      currency: m.cu || 'USD',
      frequency: m.f || 'monthly',
      firstBillingDate: m.nb || new Date().toISOString().split('T')[0],
      nextBillingDate: m.nb || new Date().toISOString().split('T')[0],
      category: m.ca || 'Other',
      color: m.co || '#10B981',
      domain: m.d,
      enableNotifications: true,
      reminderTiming: '3_days_before',
      status: m.s || 'active',
      billingHistory: [],
      createdAt: new Date().toISOString(),
    }));

    return validateAndParseBackup(JSON.stringify({ subscriptions: subs }));
  } catch (err: any) {
    return { valid: false, error: 'No se pudo descifrar el código de transferencia.' };
  }
}

/**
 * Local Snapshots storage management:
 * When creating a new backup, previous backups are removed so ONLY the newest
 * backup remains stored.
 */
export function saveLocalSnapshot(subscriptions: Subscription[], reason: string): LocalSnapshot[] {
  try {
    const newSnapshot: LocalSnapshot = {
      id: `snap-${Date.now()}`,
      timestamp: new Date().toISOString(),
      subscriptionsCount: subscriptions.length,
      subscriptions: JSON.parse(JSON.stringify(subscriptions)),
      reason,
    };

    // Eliminate previous backup: only the newest backup is kept
    const updated = [newSnapshot];
    localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to save local snapshot', e);
    return [];
  }
}

export function getLocalSnapshots(): LocalSnapshot[] {
  try {
    const raw = localStorage.getItem(SNAPSHOTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getLatestSnapshot(): LocalSnapshot | null {
  const snaps = getLocalSnapshots();
  return snaps.length > 0 ? snaps[0] : null;
}

export function deleteLocalSnapshot(): void {
  localStorage.removeItem(SNAPSHOTS_KEY);
}

export function clearLocalSnapshots(): void {
  localStorage.removeItem(SNAPSHOTS_KEY);
}
