import { CurrencyCode, Subscription, BillingFrequency } from '../types';

export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CAD: 'CA$',
  AUD: 'AU$',
};

export function formatCurrency(amount: number, currency: CurrencyCode = 'USD'): string {
  const symbol = CURRENCY_SYMBOLS[currency] || '$';
  if (currency === 'JPY') {
    return `${symbol}${Math.round(amount).toLocaleString()}`;
  }
  return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function getMonthlyEquivalent(cost: number, frequency: BillingFrequency): number {
  switch (frequency) {
    case 'monthly':
      return cost;
    case 'yearly':
      return cost / 12;
    case 'weekly':
      return (cost * 52) / 12;
    case 'quarterly':
      return cost / 3;
    default:
      return cost;
  }
}

export function getYearlyEquivalent(cost: number, frequency: BillingFrequency): number {
  switch (frequency) {
    case 'monthly':
      return cost * 12;
    case 'yearly':
      return cost;
    case 'weekly':
      return cost * 52;
    case 'quarterly':
      return cost * 4;
    default:
      return cost * 12;
  }
}

export function getDaysUntil(targetDateStr: string, referenceDate?: Date): number {
  const now = referenceDate ? new Date(referenceDate) : new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(targetDateStr + 'T00:00:00');
  target.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export interface BillingCycleProgress {
  percent: number; // 0 to 100 representing cycle progress toward billing date
  daysUntil: number; // Positive = days left, 0 = due today, Negative = overdue
  daysElapsed: number;
  totalCycleDays: number;
  isOverdue: boolean;
  isDueToday: boolean;
  isUrgent: boolean;
  statusText: string;
}

/**
 * Calculates how close the next billing date is relative to the current date
 * within the subscription's billing frequency cycle (e.g. monthly, weekly, yearly).
 */
export function getBillingCycleProgress(sub: Subscription, referenceDate?: Date): BillingCycleProgress {
  const now = referenceDate ? new Date(referenceDate) : new Date();
  now.setHours(0, 0, 0, 0);

  if (!sub.nextBillingDate) {
    return {
      percent: 50,
      daysUntil: 15,
      daysElapsed: 15,
      totalCycleDays: 30,
      isOverdue: false,
      isDueToday: false,
      isUrgent: false,
      statusText: 'Próxima renovación',
    };
  }

  const nextDate = new Date(sub.nextBillingDate + 'T00:00:00');
  nextDate.setHours(0, 0, 0, 0);

  // Compute the previous billing date that started this cycle based on frequency
  const prevDate = new Date(nextDate);
  switch (sub.frequency) {
    case 'weekly':
      prevDate.setDate(prevDate.getDate() - 7);
      break;
    case 'quarterly':
      prevDate.setMonth(prevDate.getMonth() - 3);
      break;
    case 'yearly':
      prevDate.setFullYear(prevDate.getFullYear() - 1);
      break;
    case 'monthly':
    default:
      prevDate.setMonth(prevDate.getMonth() - 1);
      break;
  }

  const totalCycleMs = Math.max(1, nextDate.getTime() - prevDate.getTime());
  const totalCycleDays = Math.max(1, Math.round(totalCycleMs / (1000 * 60 * 60 * 24)));

  const remainingMs = nextDate.getTime() - now.getTime();
  const daysUntil = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));

  const elapsedMs = now.getTime() - prevDate.getTime();
  const daysElapsed = Math.round(elapsedMs / (1000 * 60 * 60 * 24));

  const isOverdue = daysUntil < 0;
  const isDueToday = daysUntil === 0;
  const isUrgent = daysUntil <= 3;

  let percent: number;
  if (isOverdue || isDueToday) {
    percent = 100;
  } else if (now < prevDate) {
    percent = 5;
  } else {
    const raw = (elapsedMs / totalCycleMs) * 100;
    percent = Math.min(100, Math.max(5, Math.round(raw)));
  }

  let statusText = '';
  if (isOverdue) {
    statusText = `Vencido hace ${Math.abs(daysUntil)}d`;
  } else if (isDueToday) {
    statusText = 'Renovación hoy';
  } else if (daysUntil === 1) {
    statusText = 'Renueva mañana';
  } else if (daysUntil <= 7) {
    statusText = `Renueva en ${daysUntil} días`;
  } else {
    statusText = `Faltan ${daysUntil} días`;
  }

  return {
    percent,
    daysUntil,
    daysElapsed: Math.max(0, daysElapsed),
    totalCycleDays,
    isOverdue,
    isDueToday,
    isUrgent,
    statusText,
  };
}

export function formatRelativeDueDate(targetDateStr: string): { label: string; days: number; isUrgent: boolean; urgencyColor: string } {
  const days = getDaysUntil(targetDateStr);

  if (days < 0) {
    return {
      label: `${Math.abs(days)}d overdue`,
      days,
      isUrgent: true,
      urgencyColor: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    };
  }
  if (days === 0) {
    return {
      label: 'Due Today',
      days,
      isUrgent: true,
      urgencyColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    };
  }
  if (days === 1) {
    return {
      label: 'Tomorrow',
      days,
      isUrgent: true,
      urgencyColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    };
  }
  if (days <= 7) {
    return {
      label: `In ${days} days`,
      days,
      isUrgent: days <= 3,
      urgencyColor: days <= 3 
        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
        : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    };
  }
  if (days <= 30) {
    const weeks = Math.round(days / 7);
    return {
      label: weeks === 1 ? 'In 1 week' : `In ${weeks} weeks`,
      days,
      isUrgent: false,
      urgencyColor: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    };
  }

  const months = Math.round(days / 30);
  return {
    label: months === 1 ? 'In 1 month' : `In ${months} months`,
    days,
    isUrgent: false,
    urgencyColor: 'bg-slate-700/50 text-slate-300 border-slate-600/40',
  };
}

export function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatShortMonthDay(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function calculateTotalSpentToDate(sub: Subscription): number {
  if (sub.billingHistory && sub.billingHistory.length > 0) {
    return sub.billingHistory
      .filter((h) => h.status === 'paid')
      .reduce((sum, item) => sum + item.amount, 0);
  }

  // Fallback: estimate from first billing date
  const start = new Date(sub.firstBillingDate || sub.createdAt || '2025-01-01');
  const now = new Date();
  const diffMonths = Math.max(1, (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth()));
  
  if (sub.frequency === 'monthly') {
    return sub.cost * diffMonths;
  } else if (sub.frequency === 'yearly') {
    const years = Math.max(1, Math.ceil(diffMonths / 12));
    return sub.cost * years;
  }
  return sub.cost * diffMonths;
}

export function getBrandLogoUrl(domain?: string, customLogoUrl?: string): string {
  if (customLogoUrl && customLogoUrl.trim().length > 0) {
    return customLogoUrl;
  }
  if (!domain) return '';
  // Clean domain
  const clean = domain.replace(/^(?:https?:\/\/)?(?:www\.)?/i, '').split('/')[0];
  return `https://www.google.com/s2/favicons?domain=${clean}&sz=128`;
}

export function formatLocalIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function calculateNextRenewal(currentDateStr: string, frequency: BillingFrequency): string {
  const d = new Date(currentDateStr + 'T00:00:00');
  if (Number.isNaN(d.getTime())) {
    return formatLocalIsoDate(new Date());
  }
  const originalDay = d.getDate();

  if (frequency === 'monthly') {
    d.setDate(1);
    d.setMonth(d.getMonth() + 1);
    const maxDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(originalDay, maxDay));
  } else if (frequency === 'yearly') {
    d.setDate(1);
    d.setFullYear(d.getFullYear() + 1);
    const maxDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(originalDay, maxDay));
  } else if (frequency === 'weekly') {
    d.setDate(d.getDate() + 7);
  } else if (frequency === 'quarterly') {
    d.setDate(1);
    d.setMonth(d.getMonth() + 3);
    const maxDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(originalDay, maxDay));
  }
  return formatLocalIsoDate(d);
}

/**
 * Returns the actual share cost for the user (taking into account Family Plan / Split Cost)
 */
export function getUserRealShareCost(sub: Subscription): number {
  if (!sub.splitPlan || !sub.splitPlan.isShared) {
    return sub.cost;
  }
  if (typeof sub.splitPlan.userShare === 'number' && sub.splitPlan.userShare >= 0) {
    return sub.splitPlan.userShare;
  }
  const totalPeople = Math.max(1, sub.splitPlan.totalMembers || (sub.splitPlan.members?.length ? sub.splitPlan.members.length + 1 : 1));
  return Number((sub.cost / totalPeople).toFixed(2));
}

/**
 * Returns the user's monthly equivalent based on their real share
 */
export function getUserMonthlyEquivalent(sub: Subscription): number {
  const realCost = getUserRealShareCost(sub);
  return getMonthlyEquivalent(realCost, sub.frequency);
}

/**
 * Returns the user's yearly equivalent based on their real share
 */
export function getUserYearlyEquivalent(sub: Subscription): number {
  const realCost = getUserRealShareCost(sub);
  return getYearlyEquivalent(realCost, sub.frequency);
}

/**
 * Calculates how much money other members currently owe the user for a single subscription
 */
export function getSubscriptionOwedAmount(sub: Subscription): number {
  if (!sub.splitPlan || !sub.splitPlan.isShared || !sub.splitPlan.members) {
    return 0;
  }
  return sub.splitPlan.members
    .filter((m) => !m.hasPaid)
    .reduce((sum, m) => sum + (m.amount || 0), 0);
}

/**
 * Calculates global pending debt from all friends across all subscriptions
 */
export function calculateTotalOwedSummary(subscriptions: Subscription[]) {
  let totalPending = 0;
  let totalCollected = 0;
  let pendingCount = 0;
  const pendingMembers: Array<{
    memberId: string;
    memberName: string;
    amount: number;
    currency: CurrencyCode;
    subscriptionId: string;
    subscriptionName: string;
    dueDate: string;
  }> = [];

  subscriptions.forEach((sub) => {
    if (sub.status === 'active' && sub.splitPlan && sub.splitPlan.isShared && sub.splitPlan.members) {
      sub.splitPlan.members.forEach((m) => {
        if (!m.hasPaid) {
          totalPending += m.amount || 0;
          pendingCount += 1;
          pendingMembers.push({
            memberId: m.id,
            memberName: m.name || 'Amigo',
            amount: m.amount || 0,
            currency: sub.currency,
            subscriptionId: sub.id,
            subscriptionName: sub.name,
            dueDate: sub.nextBillingDate,
          });
        } else {
          totalCollected += m.amount || 0;
        }
      });
    }
  });

  return {
    totalPending,
    totalCollected,
    pendingCount,
    pendingMembers,
  };
}

/**
 * Generates a friendly reminder message text for WhatsApp, SMS or copy-paste
 */
export function generatePaymentReminderMessage(
  subName: string,
  memberName: string,
  amount: number,
  currency: CurrencyCode = 'USD',
  paymentMethod?: string
): string {
  const formatted = formatCurrency(amount, currency);
  return `¡Hola ${memberName}! 👋 Te recuerdo tu parte de la suscripción compartida de ${subName} (${formatted}). ${
    paymentMethod ? `Puedes transferirme por ${paymentMethod}.` : 'Puedes enviármelo cuando te venga bien.'
  } ¡Gracias! 😊`;
}

/**
 * Calculates price hike statistics, cumulative percentage increase, and price history timeline
 */
export function getPriceHikeStats(sub: Subscription) {
  let records = sub.priceHistory && sub.priceHistory.length > 0 ? [...sub.priceHistory] : [];

  // If no explicit priceHistory, attempt to infer from distinct billingHistory amounts
  if (records.length === 0 && sub.billingHistory && sub.billingHistory.length > 1) {
    const sortedBilling = [...sub.billingHistory].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let lastSeenAmount = sortedBilling[0].amount;
    sortedBilling.forEach((b, idx) => {
      if (idx > 0 && Math.abs(b.amount - lastSeenAmount) > 0.05) {
        records.push({
          id: `inferred-${b.id}`,
          date: b.date,
          previousCost: lastSeenAmount,
          newCost: b.amount,
          currency: b.currency,
          reason: 'Cambio registrado en facturación',
        });
        lastSeenAmount = b.amount;
      }
    });
  }

  // Sort chronological
  records.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const initialCost = records.length > 0 ? records[0].previousCost || records[0].newCost : sub.cost;
  const currentCost = sub.cost;
  const totalIncrease = currentCost - initialCost;
  const percentageChange = initialCost > 0 ? ((currentCost - initialCost) / initialCost) * 100 : 0;
  const hasHike = totalIncrease > 0.01;
  const hasDecrease = totalIncrease < -0.01;

  const lastRecord = records.length > 0 ? records[records.length - 1] : null;

  return {
    initialCost,
    currentCost,
    totalIncrease,
    percentageChange: Number(percentageChange.toFixed(1)),
    hasHike,
    hasDecrease,
    historyCount: records.length,
    records,
    lastChangeDate: lastRecord ? lastRecord.date : null,
    lastChangeReason: lastRecord ? lastRecord.reason : null,
  };
}

