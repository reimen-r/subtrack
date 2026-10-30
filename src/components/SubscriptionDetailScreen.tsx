import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft,
  ArrowLeft, 
  ExternalLink, 
  Edit3, 
  Trash2, 
  Calendar, 
  Clock, 
  CreditCard, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Bell, 
  Receipt,
  FileText,
  DollarSign,
  TrendingUp,
  TrendingDown,
  X,
  Share2,
  Users,
  UserPlus,
  MessageCircle,
  Copy,
  Check,
  Coins,
  Split,
  CalendarPlus,
  Download,
  ArrowUpRight,
  Tag
} from 'lucide-react';
import { Subscription, BillingHistoryRecord, SplitMember, SplitPlanConfig, PriceChangeRecord } from '../types';
import { ServiceLogo } from './ServiceLogo';
import { CATEGORY_CONFIG } from '../data/presets';
import { 
  formatCurrency, 
  formatDateDisplay, 
  formatRelativeDueDate, 
  getMonthlyEquivalent, 
  getYearlyEquivalent,
  calculateTotalSpentToDate,
  calculateNextRenewal,
  getUserRealShareCost,
  getUserMonthlyEquivalent,
  getUserYearlyEquivalent,
  getSubscriptionOwedAmount,
  generatePaymentReminderMessage,
  getPriceHikeStats
} from '../utils/subscriptionUtils';
import { generateICS, downloadICS, getGoogleCalendarUrl } from '../utils/calendarExport';
import confetti from 'canvas-confetti';

interface SubscriptionDetailScreenProps {
  subscription: Subscription;
  onBack: () => void;
  onEdit: (sub: Subscription) => void;
  onDelete: (id: string) => void;
  onUpdate: (sub: Subscription) => void;
}

export const SubscriptionDetailScreen: React.FC<SubscriptionDetailScreenProps> = ({
  subscription,
  onBack,
  onEdit,
  onDelete,
  onUpdate,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [newPaymentAmount, setNewPaymentAmount] = useState(subscription.cost.toString());
  const [newPaymentDate, setNewPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [copiedLink, setCopiedLink] = useState(false);

  // Price Hike Tracker modal states
  const [showAddPriceChangeModal, setShowAddPriceChangeModal] = useState(false);
  const [newPriceValue, setNewPriceValue] = useState(subscription.cost.toString());
  const [newPriceDate, setNewPriceDate] = useState(new Date().toISOString().split('T')[0]);
  const [newPriceReason, setNewPriceReason] = useState('Subida oficial de tarifa');
  const [calendarExported, setCalendarExported] = useState(false);

  // Reminder message modal state
  const [reminderMember, setReminderMember] = useState<{ member: SplitMember; message: string } | null>(null);
  const [reminderCopied, setReminderCopied] = useState(false);

  // Close modals on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showDeleteConfirm) setShowDeleteConfirm(false);
        else if (showAddPaymentModal) setShowAddPaymentModal(false);
        else if (showAddPriceChangeModal) setShowAddPriceChangeModal(false);
        else if (reminderMember) setReminderMember(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showDeleteConfirm, showAddPaymentModal, showAddPriceChangeModal, reminderMember]);

  const isShared = Boolean(subscription.splitPlan?.isShared);
  const userRealShare = getUserRealShareCost(subscription);
  const owedAmount = getSubscriptionOwedAmount(subscription);
  const members = subscription.splitPlan?.members || [];
  const totalMembersCount = subscription.splitPlan?.totalMembers || (members.length + 1);
  const collectedAmount = members.filter((m) => m.hasPaid).reduce((s, m) => s + (m.amount || 0), 0);

  const dueInfo = formatRelativeDueDate(subscription.nextBillingDate);
  const totalSpent = calculateTotalSpentToDate(subscription);
  const monthlyEq = getMonthlyEquivalent(subscription.cost, subscription.frequency);
  const yearlyEq = getYearlyEquivalent(subscription.cost, subscription.frequency);
  const userMonthlyEq = getUserMonthlyEquivalent(subscription);
  const userYearlyEq = getUserYearlyEquivalent(subscription);
  const catConfig = CATEGORY_CONFIG[subscription.category] || CATEGORY_CONFIG['Other'];

  const handleMarkAsPaid = () => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#10B981', '#6366F1', '#34D399', '#A78BFA'],
    });

    const newRecord: BillingHistoryRecord = {
      id: `bh-${Date.now()}`,
      date: subscription.nextBillingDate,
      amount: subscription.cost,
      currency: subscription.currency,
      status: 'paid',
      invoiceNumber: `INV-${Math.floor(100000 + Math.random() * 900000)}`,
      note: 'Marked as paid manually',
    };

    const nextDate = calculateNextRenewal(subscription.nextBillingDate, subscription.frequency);

    const updatedSub: Subscription = {
      ...subscription,
      nextBillingDate: nextDate,
      billingHistory: [newRecord, ...(subscription.billingHistory || [])],
    };

    onUpdate(updatedSub);
  };

  const handleToggleMemberPaid = (memberId: string) => {
    if (!subscription.splitPlan || !subscription.splitPlan.members) return;

    const target = subscription.splitPlan.members.find((m) => m.id === memberId);
    const willBePaid = target ? !target.hasPaid : false;

    if (willBePaid) {
      confetti({
        particleCount: 35,
        spread: 50,
        origin: { y: 0.7 },
        colors: ['#10B981', '#34D399', '#6366F1'],
      });
    }

    const updatedMembers = subscription.splitPlan.members.map((m) => {
      if (m.id === memberId) {
        return {
          ...m,
          hasPaid: willBePaid,
          paidDate: willBePaid ? new Date().toISOString().split('T')[0] : undefined,
        };
      }
      return m;
    });

    const updatedSub: Subscription = {
      ...subscription,
      splitPlan: {
        ...subscription.splitPlan,
        members: updatedMembers,
      },
    };

    onUpdate(updatedSub);
  };

  const handleOpenReminder = (member: SplitMember) => {
    const msg = generatePaymentReminderMessage(
      subscription.name,
      member.name || 'Amigo',
      member.amount || 0,
      subscription.currency,
      subscription.paymentMethod
    );
    setReminderMember({ member, message: msg });
    setReminderCopied(false);
  };

  const handleCopyReminderMessage = () => {
    if (!reminderMember) return;
    navigator.clipboard.writeText(reminderMember.message);
    setReminderCopied(true);
    setTimeout(() => setReminderCopied(false), 2500);
  };

  const handleAddManualPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(newPaymentAmount) || subscription.cost;
    const newRecord: BillingHistoryRecord = {
      id: `bh-${Date.now()}`,
      date: newPaymentDate,
      amount,
      currency: subscription.currency,
      status: 'paid',
      invoiceNumber: `REC-${Math.floor(100000 + Math.random() * 900000)}`,
    };

    const updatedSub: Subscription = {
      ...subscription,
      billingHistory: [newRecord, ...(subscription.billingHistory || [])],
    };

    onUpdate(updatedSub);
    setShowAddPaymentModal(false);
  };

  const handleCopyLink = () => {
    if (subscription.websiteUrl || subscription.cancelUrl) {
      navigator.clipboard?.writeText(subscription.cancelUrl || subscription.websiteUrl || '');
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const reminderLabelMap = {
    on_day: 'On payment day',
    '1_day_before': '1 day before',
    '3_days_before': '3 days before',
    '1_week_before': '1 week before',
  };

  return (
    <motion.div
      id="subscription-detail-screen"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex-1 flex flex-col bg-slate-50 dark:bg-black text-zinc-900 dark:text-white min-h-full pb-36 sm:pb-32"
    >
      {/* Top Mobile App Bar (iOS Liquid Glass header with safe area padding) */}
      <div className="sticky top-0 z-30 ios-glass-header border-b border-zinc-200/90 dark:border-zinc-800/80 px-3.5 sm:px-4 pt-[max(env(safe-area-inset-top,0px),0.5rem)] pb-2.5 sm:pb-3 flex items-center justify-between">
        <button
          id="back-to-dashboard-btn"
          onClick={onBack}
          className="min-h-[44px] px-2 -ml-1 rounded-xl text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 hover:bg-emerald-500/10 active:scale-95 transition-all flex items-center gap-0.5 text-xs font-semibold cursor-pointer"
          aria-label="Volver al panel de suscripciones"
        >
          <ChevronLeft size={20} className="-ml-1" />
          <span>Volver</span>
        </button>

        <div className="flex items-center gap-1 sm:gap-1.5">
          <button
            id="share-sub-btn"
            onClick={handleCopyLink}
            className="w-11 h-11 min-h-[44px] min-w-[44px] rounded-xl text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/60 active:scale-95 transition-colors relative flex items-center justify-center cursor-pointer"
            title="Copiar enlace"
            aria-label="Copiar enlace"
          >
            <Share2 size={16} />
            {copiedLink && (
              <span className="absolute -bottom-7 right-0 text-[10px] bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded shadow text-emerald-400 font-semibold whitespace-nowrap z-50">
                ¡Copiado!
              </span>
            )}
          </button>
          <button
            id="edit-sub-btn"
            onClick={() => onEdit(subscription)}
            className="w-11 h-11 min-h-[44px] min-w-[44px] rounded-xl text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/60 active:scale-95 transition-colors flex items-center justify-center cursor-pointer"
            title="Editar suscripción"
            aria-label="Editar suscripción"
          >
            <Edit3 size={16} />
          </button>
          <button
            id="delete-sub-btn"
            onClick={() => setShowDeleteConfirm(true)}
            className="w-11 h-11 min-h-[44px] min-w-[44px] rounded-xl text-rose-500 hover:text-rose-400 hover:bg-rose-500/15 active:scale-95 transition-colors flex items-center justify-center cursor-pointer"
            title="Eliminar suscripción"
            aria-label="Eliminar suscripción"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="p-3.5 sm:p-5 space-y-3.5 sm:space-y-5 max-w-2xl mx-auto w-full">
        
        {/* Main Service Hero Card */}
        <div className="relative rounded-2xl sm:rounded-3xl p-4 sm:p-5 bg-gradient-to-br from-zinc-900 via-zinc-900 to-emerald-950/40 border border-emerald-500/30 shadow-lg shadow-black/40 overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-start justify-between gap-2.5 sm:gap-3">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="h-11 w-11 sm:h-12 sm:w-12 bg-zinc-800/80 border border-zinc-700/80 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
                  <ServiceLogo
                    name={subscription.name}
                    domain={subscription.domain}
                    logoUrl={subscription.logoUrl}
                    color={subscription.color}
                    iconName={subscription.iconName}
                    size="md"
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h1 className="text-lg sm:text-xl font-bold text-white leading-tight truncate">
                      {subscription.name}
                    </h1>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5 truncate">
                    {subscription.category} • {subscription.frequency}
                  </p>
                </div>
              </div>

              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-sm shrink-0">
                {dueInfo.label}
              </span>
            </div>

            {/* Price & Action */}
            <div className="mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-zinc-800/80 flex items-end justify-between flex-wrap gap-2.5 sm:gap-3">
              <div>
                <span className="text-xs font-medium text-zinc-400 block">
                  {isShared ? 'Tu cuota mensual' : 'Coste recurrente'}
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-2xl sm:text-3xl font-extrabold text-white tabular-nums">
                    {formatCurrency(isShared ? userRealShare : subscription.cost, subscription.currency)}
                  </span>
                  <span className="text-xs text-zinc-400 font-medium">
                    /{subscription.frequency === 'monthly' ? 'mes' : subscription.frequency}
                  </span>
                </div>
                {isShared && (
                  <span className="text-xs text-emerald-400 block mt-0.5 font-medium tabular-nums">
                    Total: {formatCurrency(subscription.cost, subscription.currency)} (ahorras {formatCurrency(subscription.cost - userRealShare, subscription.currency)})
                  </span>
                )}
              </div>

              <button
                id="mark-paid-now-btn"
                onClick={handleMarkAsPaid}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-black font-bold text-xs shadow-lg shadow-emerald-500/25 flex items-center gap-2 transition-all shrink-0 cursor-pointer tap-tactile"
              >
                <CheckCircle2 size={16} />
                <span>Marcar pagado</span>
              </button>
            </div>
          </div>
        </div>

        {/* 👥 Plan Familiar & División de Gastos (Split Cost Widget) */}
        {isShared ? (
          <div className="rounded-3xl p-5 bg-zinc-900/60 border border-indigo-500/30 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                  <Users size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-xs flex items-center gap-1.5">
                    <span>Plan Compartido ({totalMembersCount} personas)</span>
                    <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[11px] font-bold">
                      Family Split
                    </span>
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Control de pagos individuales y dinero pendiente de cobrar
                  </p>
                </div>
              </div>

              <button
                onClick={() => onEdit(subscription)}
                className="min-h-[36px] px-3 py-1 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-indigo-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Edit3 size={13} />
                <span>Ajustar</span>
              </button>
            </div>

            {/* Split Financial Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <div className="p-3.5 rounded-2xl bg-black/50 border border-zinc-800">
                <span className="text-[11px] text-zinc-400 uppercase font-bold block">Tu Parte Real</span>
                <span className="text-base font-extrabold text-emerald-400 mt-0.5 block tabular-nums">
                  {formatCurrency(userRealShare, subscription.currency)}
                </span>
                <span className="text-[11px] text-zinc-400">/{subscription.frequency === 'monthly' ? 'mes' : subscription.frequency}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/50 border border-zinc-800">
                <span className="text-[11px] text-zinc-400 uppercase font-bold block">Ya Recaudado</span>
                <span className="text-base font-extrabold text-white mt-0.5 block tabular-nums">
                  {formatCurrency(collectedAmount, subscription.currency)}
                </span>
                <span className="text-[11px] text-zinc-400">{members.filter((m) => m.hasPaid).length} de {members.length} amigos</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/50 border border-zinc-800 col-span-2 sm:col-span-1">
                <span className="text-[11px] text-zinc-400 uppercase font-bold block">Te Deben Aún</span>
                <span className={`text-base font-extrabold mt-0.5 block tabular-nums ${owedAmount > 0 ? 'text-amber-400' : 'text-zinc-400'}`}>
                  {formatCurrency(owedAmount, subscription.currency)}
                </span>
                <span className="text-[11px] text-zinc-400">
                  {owedAmount > 0 ? `${members.filter((m) => !m.hasPaid).length} pendientes` : '¡Todos al día! 🎉'}
                </span>
              </div>
            </div>

            {/* Friends & Debt List */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-[11px] font-bold uppercase text-zinc-400 px-1">
                <span>Estado de pago de los miembros</span>
                <span className="text-zinc-500">Toca para cambiar estado</span>
              </div>

              {/* Owner card */}
              <div className="p-3 rounded-2xl bg-black/40 border border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                    Tú
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Tú (Titular)</span>
                    <span className="text-[10px] text-zinc-500">Pagas el total al proveedor</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-emerald-400 block">
                    {formatCurrency(userRealShare, subscription.currency)}
                  </span>
                  <span className="text-[9px] text-emerald-500 font-semibold">Tu cuota neta</span>
                </div>
              </div>

              {/* Members */}
              {members.map((member, idx) => (
                <div
                  key={member.id}
                  className="p-3 rounded-2xl bg-black/40 border border-zinc-800 flex items-center justify-between gap-2 hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                      {member.name ? member.name.charAt(0).toUpperCase() : `${idx + 1}`}
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-white block truncate">
                        {member.name || `Amigo ${idx + 1}`}
                      </span>
                      <span className="text-[10px] text-zinc-400">
                        Cuota: <strong className="text-zinc-200">{formatCurrency(member.amount, subscription.currency)}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Send reminder button if unpaid */}
                    {!member.hasPaid && (
                      <button
                        onClick={() => handleOpenReminder(member)}
                        className="p-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 transition-all flex items-center gap-1 text-[10px] font-bold"
                        title="Enviar recordatorio de cobro"
                      >
                        <MessageCircle size={13} />
                        <span className="hidden sm:inline">Cobrar</span>
                      </button>
                    )}

                    {/* Toggle Paid Button */}
                    <button
                      onClick={() => handleToggleMemberPaid(member.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
                        member.hasPaid
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                          : 'bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/25'
                      }`}
                    >
                      {member.hasPaid ? (
                        <>
                          <CheckCircle2 size={13} />
                          <span>Pagado</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle size={13} />
                          <span>Me debe</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Suggestion card to activate Family Plan */
          <div className="rounded-3xl p-4 bg-zinc-900/40 border border-zinc-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20 shrink-0">
                <Users size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">¿Compartes esta cuenta con amigos?</h4>
                <p className="text-[10px] text-zinc-400">
                  Activa el Plan Familiar para dividir el gasto y controlar quién te debe dinero.
                </p>
              </div>
            </div>
            <button
              onClick={() => onEdit(subscription)}
              className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shrink-0 transition-colors flex items-center gap-1"
            >
              <Split size={13} />
              <span>Dividir</span>
            </button>
          </div>
        )}

        {/* Total Spent To Date Metric Card */}
        <div className="bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1">
            Total Spent To Date
          </p>
          <div className="flex items-baseline justify-between">
            <h4 className="text-2xl font-bold text-white">
              {formatCurrency(totalSpent, subscription.currency)}
            </h4>
            <span className="text-[10px] text-zinc-400 font-medium">
              ≈ {formatCurrency(isShared ? userMonthlyEq : monthlyEq, subscription.currency)}/mo normalized
            </span>
          </div>
        </div>

        {/* 2 Metric Summary Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3.5 rounded-2xl bg-zinc-900/50 border border-zinc-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
              {isShared ? 'Tu Cuota Mensual' : 'Monthly Equivalent'}
            </span>
            <span className="text-lg font-bold text-indigo-400 mt-1 block">
              {formatCurrency(isShared ? userMonthlyEq : monthlyEq, subscription.currency)}
            </span>
            <span className="text-[10px] text-zinc-500">{isShared ? 'gasto real neto' : 'per month rate'}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-900/50 border border-zinc-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
              {isShared ? 'Tu Gasto Anual Real' : 'Projected Yearly'}
            </span>
            <span className="text-lg font-bold text-emerald-400 mt-1 block">
              {formatCurrency(isShared ? userYearlyEq : yearlyEq, subscription.currency)}
            </span>
            <span className="text-[10px] text-zinc-500">12-month run rate</span>
          </div>
        </div>

        {/* Contract Terms & Management Section */}
        <div className="rounded-2xl p-4 bg-zinc-900/50 border border-zinc-800 space-y-3.5">
          <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck size={15} className="text-indigo-400" />
            <span>Subscription & Billing Details</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <span className="text-zinc-500 text-[10px] uppercase font-bold">Next Payment Date</span>
              <p className="font-semibold text-zinc-200">
                {formatDateDisplay(subscription.nextBillingDate)}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-zinc-500 text-[10px] uppercase font-bold">First Billing Date</span>
              <p className="font-semibold text-zinc-200">
                {formatDateDisplay(subscription.firstBillingDate || subscription.createdAt)}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-zinc-500 text-[10px] uppercase font-bold">Payment Method</span>
              <p className="font-semibold text-zinc-200">
                {subscription.paymentMethod || 'Apple Pay (•••• 4921)'}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-zinc-500 text-[10px] uppercase font-bold">Renewal Alert</span>
              <p className="font-semibold text-emerald-400">
                {subscription.enableNotifications
                  ? `Enabled (${reminderLabelMap[subscription.reminderTiming] || '3 days before'})`
                  : 'Disabled'}
              </p>
            </div>
          </div>

          {/* Contract Terms Box */}
          {subscription.contractTerms && (
            <div className="p-3 rounded-xl bg-black border border-zinc-800 text-xs text-zinc-300 flex items-start gap-2.5">
              <FileText size={15} className="text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-zinc-300 block text-xs">Cancellation Policy & Terms</span>
                <p className="text-zinc-500 text-[11px] mt-0.5">{subscription.contractTerms}</p>
              </div>
            </div>
          )}

          {/* Direct Cancel / Manage Subscription Button */}
          <div className="pt-1">
            <a
              id="direct-cancel-manage-link"
              href={subscription.cancelUrl || subscription.websiteUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
            >
              <span>Manage or Cancel on {subscription.name}</span>
              <ExternalLink size={14} />
            </a>
            <p className="text-[10px] text-center text-zinc-500 mt-1.5">
              Direct official account portal link to adjust tiers or stop recurring billing.
            </p>
          </div>
        </div>

        {/* 📅 Exportar al Calendario Nativo (Google Calendar / Apple Calendar .ics) */}
        <div className="rounded-2xl p-4 bg-zinc-900/50 border border-zinc-800 space-y-3" id="calendar-export-section">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                <CalendarPlus size={15} />
              </div>
              <div>
                <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                  Sincronizar con tu Calendario
                </h2>
                <p className="text-[10px] text-zinc-500">
                  Añade este cobro recurrente a tu agenda personal con alerta automática
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Google Calendar Web Intent */}
            <a
              href={getGoogleCalendarUrl(subscription)}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 active:scale-[0.98] text-white flex items-center justify-between transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  <Calendar size={13} />
                </div>
                <div>
                  <span className="text-xs font-bold block group-hover:text-indigo-300 transition-colors">
                    Google Calendar
                  </span>
                  <span className="text-[9.5px] text-zinc-400">
                    Añadir evento con 1 clic
                  </span>
                </div>
              </div>
              <ArrowUpRight size={14} className="text-zinc-500 group-hover:text-white transition-colors" />
            </a>

            {/* Apple / Outlook / Mobile .ics Download */}
            <button
              onClick={() => {
                const ics = generateICS(subscription);
                const safeName = subscription.name.toLowerCase().replace(/[^a-z0-9]/gi, '_');
                downloadICS(ics, `suscripcion_${safeName}.ics`);
                setCalendarExported(true);
                setTimeout(() => setCalendarExported(false), 3000);
              }}
              className="p-3 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 active:scale-[0.98] text-white flex items-center justify-between transition-all text-left group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Download size={13} />
                </div>
                <div>
                  <span className="text-xs font-bold block group-hover:text-emerald-300 transition-colors">
                    {calendarExported ? '¡Archivo Descargado!' : 'Apple / Móvil (.ics)'}
                  </span>
                  <span className="text-[9.5px] text-zinc-400">
                    Descargar e importar a tu agenda
                  </span>
                </div>
              </div>
              <CheckCircle2 size={14} className={calendarExported ? 'text-emerald-400' : 'text-zinc-600'} />
            </button>
          </div>
        </div>

        {/* 📈 Historial de Incrementos de Precio (Price Hike Tracker) */}
        {(() => {
          const hikeStats = getPriceHikeStats(subscription);
          return (
            <div className="rounded-2xl p-4 bg-zinc-900/50 border border-zinc-800 space-y-3.5" id="price-hike-tracker-section">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center border border-amber-500/20">
                    <TrendingUp size={15} />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <span>Historial de Precios & Subidas</span>
                      {hikeStats.hasHike && (
                        <span className="px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-300 text-[9px] font-bold border border-rose-500/30">
                          +{hikeStats.percentageChange}%
                        </span>
                      )}
                    </h2>
                    <p className="text-[10px] text-zinc-500">
                      Rastreador de variaciones en la tarifa desde su contratación
                    </p>
                  </div>
                </div>

                <button
                  id="add-price-change-btn"
                  onClick={() => {
                    setNewPriceValue(subscription.cost.toString());
                    setNewPriceDate(new Date().toISOString().split('T')[0]);
                    setNewPriceReason('Subida oficial de tarifa');
                    setShowAddPriceChangeModal(true);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-300 text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <Plus size={13} />
                  <span>Registrar Cambio</span>
                </button>
              </div>

              {/* Price Stats Overview */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="p-2.5 rounded-xl bg-black border border-zinc-800">
                  <span className="text-[9px] text-zinc-500 uppercase font-bold block">Tarifa Inicial</span>
                  <span className="text-xs sm:text-sm font-bold text-zinc-200 mt-0.5 block">
                    {formatCurrency(hikeStats.initialCost, subscription.currency)}
                  </span>
                  <span className="text-[8.5px] text-zinc-500">al contratar</span>
                </div>

                <div className="p-2.5 rounded-xl bg-black border border-zinc-800">
                  <span className="text-[9px] text-zinc-500 uppercase font-bold block">Tarifa Actual</span>
                  <span className="text-xs sm:text-sm font-bold text-white mt-0.5 block">
                    {formatCurrency(hikeStats.currentCost, subscription.currency)}
                  </span>
                  <span className="text-[8.5px] text-zinc-500">actual</span>
                </div>

                <div className="p-2.5 rounded-xl bg-black border border-zinc-800">
                  <span className="text-[9px] text-zinc-500 uppercase font-bold block">Variación Total</span>
                  <span className={`text-xs sm:text-sm font-bold mt-0.5 block ${hikeStats.hasHike ? 'text-rose-400' : hikeStats.hasDecrease ? 'text-emerald-400' : 'text-zinc-400'}`}>
                    {hikeStats.hasHike ? `+${hikeStats.percentageChange}%` : hikeStats.hasDecrease ? `${hikeStats.percentageChange}%` : '0%'}
                  </span>
                  <span className="text-[8.5px] text-zinc-500">
                    {hikeStats.hasHike ? `+${formatCurrency(hikeStats.totalIncrease, subscription.currency)}/ciclo` : 'sin cambios'}
                  </span>
                </div>
              </div>

              {/* Timeline of registered price changes */}
              <div className="space-y-2 pt-1">
                <span className="text-[9.5px] text-zinc-500 font-bold uppercase tracking-wider block">
                  Línea de tiempo de tarifas ({hikeStats.records.length})
                </span>
                {hikeStats.records.length > 0 ? (
                  hikeStats.records.map((rec) => {
                    const diff = rec.newCost - rec.previousCost;
                    const isIncrease = diff > 0.001;
                    return (
                      <div
                        key={rec.id}
                        className="p-2.5 rounded-xl bg-black/70 border border-zinc-800/80 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] ${isIncrease ? 'bg-rose-500/15 text-rose-400' : 'bg-emerald-500/15 text-emerald-400'}`}>
                            {isIncrease ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                          </div>
                          <div>
                            <span className="text-zinc-200 font-semibold block text-[11px]">
                              {formatCurrency(rec.previousCost, rec.currency)} → {formatCurrency(rec.newCost, rec.currency)}
                            </span>
                            <span className="text-[9.5px] text-zinc-500">
                              {rec.reason || 'Ajuste de precio'}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-[10px] font-bold ${isIncrease ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {isIncrease ? `+${formatCurrency(diff, rec.currency)}` : formatCurrency(diff, rec.currency)}
                          </span>
                          <span className="text-[8.5px] text-zinc-500 block">
                            {formatDateDisplay(rec.date)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-2.5 text-zinc-500 text-[11px] bg-black/30 rounded-xl border border-dashed border-zinc-800">
                    Sin incrementos registrados todavía. Pulsa en "Registrar Cambio" si el servicio ha subido su precio.
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* Full Billing History Section */}
        <div className="rounded-2xl p-4 bg-zinc-900/50 border border-zinc-800 space-y-3.5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <Receipt size={15} className="text-emerald-400" />
              <span>Billing History ({subscription.billingHistory?.length || 0})</span>
            </h2>

            <button
              id="add-past-payment-btn"
              onClick={() => setShowAddPaymentModal(true)}
              className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-indigo-400 text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <Plus size={13} />
              <span>Add Record</span>
            </button>
          </div>

          <div className="space-y-2">
            {subscription.billingHistory && subscription.billingHistory.length > 0 ? (
              subscription.billingHistory.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-black border border-zinc-800 flex items-center justify-between text-xs hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                      <CheckCircle2 size={13} />
                    </div>
                    <div>
                      <span className="font-semibold text-zinc-200 block text-xs">
                        {formatDateDisplay(item.date)}
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        {item.invoiceNumber || 'Paid Invoice'} • {item.note || 'Automatic Renewal'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-white text-xs">
                      {formatCurrency(item.amount, item.currency)}
                    </span>
                    <span className="text-[9px] text-emerald-400 block uppercase font-bold">
                      {item.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-5 text-zinc-500 text-xs">
                No past billing records logged yet.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Payment Reminder Modal */}
      <AnimatePresence>
        {reminderMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="reminder-modal-title"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-900 border border-zinc-800 p-5 rounded-3xl max-w-sm w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                    <MessageCircle size={15} />
                  </div>
                  <h3 id="reminder-modal-title" className="font-bold text-white text-xs uppercase tracking-wider">
                    Recordatorio para {reminderMember.member.name}
                  </h3>
                </div>
                <button 
                  onClick={() => setReminderMember(null)}
                  className="min-h-[44px] min-w-[44px] rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors flex items-center justify-center cursor-pointer active:scale-95"
                  aria-label="Cerrar recordatorio"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  Mensaje listo para copiar o enviar
                </label>
                <div className="p-3.5 rounded-2xl bg-black border border-zinc-800 text-xs text-zinc-200 leading-relaxed font-mono">
                  {reminderMember.message}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCopyReminderMessage}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  {reminderCopied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  <span>{reminderCopied ? '¡Copiado!' : 'Copiar Texto'}</span>
                </button>

                <a
                  href={`https://wa.me/?text=${encodeURIComponent(reminderMember.message)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5 transition-all"
                >
                  <MessageCircle size={14} />
                  <span>WhatsApp</span>
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-dialog-title"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-900 border border-zinc-800 p-5 rounded-3xl max-w-sm w-full shadow-2xl space-y-4"
            >
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/20">
                <AlertCircle size={20} />
              </div>
              <div className="text-center">
                <h3 id="delete-dialog-title" className="text-sm font-bold text-white">Delete Subscription?</h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Are you sure you want to remove <span className="text-white font-semibold">{subscription.name}</span>? This will delete all associated payment logs.
                </p>
              </div>
              <div className="flex gap-2.5 pt-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 min-h-[44px] py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs transition-colors flex items-center justify-center cursor-pointer active:scale-95"
                >
                  Cancel
                </button>
                <button
                  id="confirm-delete-btn"
                  onClick={() => {
                    onDelete(subscription.id);
                    onBack();
                  }}
                  className="flex-1 min-h-[44px] py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition-colors flex items-center justify-center cursor-pointer active:scale-95"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Manual Past Payment Modal */}
      <AnimatePresence>
        {showAddPaymentModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="add-payment-modal-title"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="bg-zinc-900 border border-zinc-800 p-4 sm:p-5 rounded-t-[28px] sm:rounded-3xl max-w-sm w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto pb-[max(env(safe-area-inset-bottom,0px),1.25rem)]"
            >
              {/* Mobile Drag Indicator (Apple HIG Sheet Grabber) */}
              <div className="w-10 h-1.5 rounded-full bg-zinc-600/90 mx-auto -mt-1 mb-2 sm:hidden shrink-0" />

              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h3 id="add-payment-modal-title" className="font-bold text-white text-xs uppercase tracking-wider">Añadir Registro de Pago</h3>
                <button 
                  onClick={() => setShowAddPaymentModal(false)}
                  className="min-h-[44px] min-w-[44px] rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors flex items-center justify-center cursor-pointer active:scale-95"
                  aria-label="Cerrar registro de pago"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddManualPayment} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-zinc-400 uppercase text-[10px] mb-1">
                    Amount Paid ({subscription.currency})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newPaymentAmount}
                    onChange={(e) => setNewPaymentAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-xl text-white font-bold text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-400 uppercase text-[10px] mb-1">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newPaymentDate}
                    onChange={(e) => setNewPaymentDate(e.target.value)}
                    className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddPaymentModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 font-semibold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    id="save-payment-record-btn"
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs shadow-lg shadow-emerald-500/20"
                  >
                    Save Record
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Modal: Registrar Cambio de Precio (Price Hike) */}
        {showAddPriceChangeModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="price-change-modal-title"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="bg-zinc-900 border border-zinc-800 p-4 sm:p-5 rounded-t-[28px] sm:rounded-3xl max-w-sm w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto pb-[max(env(safe-area-inset-bottom,0px),1.25rem)]"
            >
              {/* Mobile Drag Indicator (Apple HIG Sheet Grabber) */}
              <div className="w-10 h-1.5 rounded-full bg-zinc-600/90 mx-auto -mt-1 mb-2 sm:hidden shrink-0" />

              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <TrendingUp size={15} />
                  </div>
                  <h3 id="price-change-modal-title" className="font-bold text-white text-xs uppercase tracking-wider">
                    Registrar Cambio de Precio
                  </h3>
                </div>
                <button
                  onClick={() => setShowAddPriceChangeModal(false)}
                  className="min-h-[44px] min-w-[44px] rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors flex items-center justify-center cursor-pointer active:scale-95"
                  aria-label="Cerrar cambio de precio"
                >
                  <X size={18} />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const parsed = parseFloat(newPriceValue);
                  if (isNaN(parsed) || parsed <= 0) return;

                  const previousCost = subscription.cost;
                  const newRecord: PriceChangeRecord = {
                    id: `pc-${Date.now()}`,
                    date: newPriceDate,
                    previousCost: previousCost,
                    newCost: parsed,
                    currency: subscription.currency,
                    reason: newPriceReason.trim() || 'Ajuste de precio',
                  };

                  const updatedSub: Subscription = {
                    ...subscription,
                    cost: parsed,
                    priceHistory: [newRecord, ...(subscription.priceHistory || [])],
                  };

                  onUpdate(updatedSub);
                  setShowAddPriceChangeModal(false);
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
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                    Precio Anterior
                  </label>
                  <div className="px-3 py-2 bg-black/60 border border-zinc-800 rounded-xl text-zinc-400 font-semibold text-xs">
                    {formatCurrency(subscription.cost, subscription.currency)}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                    Nueva Tarifa ({subscription.currency})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newPriceValue}
                    onChange={(e) => setNewPriceValue(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500 font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                    Fecha del Cambio
                  </label>
                  <input
                    type="date"
                    required
                    value={newPriceDate}
                    onChange={(e) => setNewPriceDate(e.target.value)}
                    className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                    Motivo / Razón
                  </label>
                  <input
                    type="text"
                    value={newPriceReason}
                    onChange={(e) => setNewPriceReason(e.target.value)}
                    placeholder="ej. Aumento de tarifa oficial, Fin de oferta..."
                    className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500 mb-1.5"
                  />
                  {/* Quick reason suggestions */}
                  <div className="flex flex-wrap gap-1">
                    {['Subida general', 'Fin de promoción', 'Ajuste de plan', 'Impuestos'].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setNewPriceReason(tag)}
                        className="px-2 py-0.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-[9px]"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddPriceChangeModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 font-semibold text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    id="save-price-change-btn"
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-lg shadow-amber-500/20"
                  >
                    Guardar Subida
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
