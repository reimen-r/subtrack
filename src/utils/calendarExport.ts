import { Subscription, BillingFrequency } from '../types';
import { formatCurrency, formatLocalIsoDate } from './subscriptionUtils';

/**
 * Maps subscription billing frequency to iCalendar RRULE FREQ string
 */
function getRRULE(frequency: BillingFrequency): string {
  switch (frequency) {
    case 'weekly':
      return 'RRULE:FREQ=WEEKLY;INTERVAL=1';
    case 'monthly':
      return 'RRULE:FREQ=MONTHLY;INTERVAL=1';
    case 'quarterly':
      return 'RRULE:FREQ=MONTHLY;INTERVAL=3';
    case 'yearly':
      return 'RRULE:FREQ=YEARLY;INTERVAL=1';
    default:
      return 'RRULE:FREQ=MONTHLY;INTERVAL=1';
  }
}

/**
 * Formats a YYYY-MM-DD string into iCal compact date format (YYYYMMDD)
 */
function formatICalDate(dateStr: string): string {
  if (!dateStr) {
    return formatLocalIsoDate(new Date()).replace(/-/g, '');
  }
  return dateStr.replace(/-/g, '');
}

/**
 * Escapes characters for iCalendar text values (commas, semicolons, backslashes, newlines)
 */
function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Generates an RFC 5545 compliant .ics calendar content string for one or multiple subscriptions.
 */
export function generateICS(items: Subscription | Subscription[]): string {
  const subs = Array.isArray(items) ? items : [items];
  const nowStamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const events = subs
    .filter((s) => s.status !== 'cancelled')
    .map((sub) => {
      const dtStart = formatICalDate(sub.nextBillingDate);
      const rrule = getRRULE(sub.frequency);
      const costFormatted = formatCurrency(sub.cost, sub.currency);
      const summary = escapeICalText(`Cobro Suscripción: ${sub.name} (${costFormatted})`);
      
      let description = `Renovación periódica de ${sub.name}.\nCoste: ${costFormatted} (${sub.frequency}).\nCategoría: ${sub.category}`;
      if (sub.splitPlan?.isShared) {
        description += `\nPlan compartido con ${sub.splitPlan.totalMembers || (sub.splitPlan.members?.length || 0) + 1} miembros.`;
      }
      if (sub.cancelUrl) {
        description += `\nGestionar/Cancelar en: ${sub.cancelUrl}`;
      } else if (sub.websiteUrl) {
        description += `\nSitio web: ${sub.websiteUrl}`;
      }
      if (sub.notes) {
        description += `\nNotas: ${sub.notes}`;
      }

      const escapedDesc = escapeICalText(description);
      const uid = `subtrack-${sub.id}-${dtStart}@subtrack.app`;

      return [
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${nowStamp}`,
        `DTSTART;VALUE=DATE:${dtStart}`,
        rrule,
        `SUMMARY:${summary}`,
        `DESCRIPTION:${escapedDesc}`,
        'STATUS:CONFIRMED',
        'TRANSP:TRANSPARENT',
        // 1 day before reminder alarm
        'BEGIN:VALARM',
        'TRIGGER:-P1D',
        'ACTION:DISPLAY',
        `DESCRIPTION:Recordatorio de cobro de ${sub.name}`,
        'END:VALARM',
        'END:VEVENT',
      ].join('\r\n');
    });

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SubTrack//Subscription Tracker//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Mis Suscripciones - SubTrack',
    'X-WR-TIMEZONE:UTC',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');
}

/**
 * Initiates download of the generated .ics file for calendar apps (Apple Calendar, Google Calendar, Outlook, Mobile)
 */
export function downloadICS(content: string, filename = 'suscripciones.ics'): void {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates direct Google Calendar Web Intent URL for adding a single subscription renewal reminder
 */
export function getGoogleCalendarUrl(sub: Subscription): string {
  const dateCompact = formatICalDate(sub.nextBillingDate);
  // Next day for full-day event range
  const startDate = new Date(sub.nextBillingDate + 'T00:00:00');
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 1);
  const endCompact = formatLocalIsoDate(endDate).replace(/-/g, '');

  const costFormatted = formatCurrency(sub.cost, sub.currency);
  const title = `Renovación: ${sub.name} (${costFormatted})`;

  let details = `Cobro de suscripción recurrente ${sub.name}.\nImporte: ${costFormatted} (${sub.frequency}).\nCategoría: ${sub.category}`;
  if (sub.cancelUrl) {
    details += `\nEnlace de cancelación: ${sub.cancelUrl}`;
  }

  let rrule = 'RRULE:FREQ=MONTHLY';
  if (sub.frequency === 'yearly') rrule = 'RRULE:FREQ=YEARLY';
  if (sub.frequency === 'weekly') rrule = 'RRULE:FREQ=WEEKLY';
  if (sub.frequency === 'quarterly') rrule = 'RRULE:FREQ=MONTHLY;INTERVAL=3';

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${dateCompact}/${endCompact}`,
    details: details,
    recur: rrule,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
