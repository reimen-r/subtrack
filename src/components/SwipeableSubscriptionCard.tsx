import React, { useState } from 'react';
import { motion, useMotionValue, useTransform, PanInfo, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  ChevronRight,
  MoreVertical, 
  Users, 
  AlertCircle, 
  ExternalLink, 
  Check, 
  Pencil, 
  Calendar, 
  Sparkles,
  CreditCard,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import { Subscription } from '../types';
import { ServiceLogo } from './ServiceLogo';
import { 
  formatCurrency, 
  formatRelativeDueDate, 
  formatShortMonthDay, 
  formatDateDisplay,
  getUserRealShareCost,
  getSubscriptionOwedAmount,
  getBillingCycleProgress,
  getMonthlyEquivalent,
  getYearlyEquivalent
} from '../utils/subscriptionUtils';

interface SwipeableSubscriptionCardProps {
  sub: Subscription;
  onSelectSubscription: (sub: Subscription) => void;
  onQuickMarkPaid?: (sub: Subscription) => void;
  onEdit?: (sub: Subscription) => void;
  onOpenQuickActions?: (sub: Subscription) => void;
}

export const SwipeableSubscriptionCard: React.FC<SwipeableSubscriptionCardProps> = ({
  sub,
  onSelectSubscription,
  onQuickMarkPaid,
  onEdit,
  onOpenQuickActions,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Motion values for swipe tracking
  const x = useMotionValue(0);

  // Background action indicators opacity based on drag distance
  const leftActionOpacity = useTransform(x, [-100, -50, -10], [1, 0.8, 0]);
  const leftActionScale = useTransform(x, [-100, -60, -10], [1.1, 1, 0.8]);

  const rightActionOpacity = useTransform(x, [10, 50, 100], [0, 0.8, 1]);
  const rightActionScale = useTransform(x, [10, 60, 100], [0.8, 1, 1.1]);

  const dueInfo = formatRelativeDueDate(sub.nextBillingDate);
  const isSharedSub = Boolean(sub.splitPlan?.isShared);
  const userShare = getUserRealShareCost(sub);
  const subOwed = getSubscriptionOwedAmount(sub);
  const cycleProgress = getBillingCycleProgress(sub);

  const monthlyCost = getMonthlyEquivalent(sub.cost, sub.frequency);
  const yearlyCost = getYearlyEquivalent(sub.cost, sub.frequency);
  const dailyCost = monthlyCost / 30;

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    const threshold = 65;

    if (info.offset.x < -threshold) {
      // Swiped Left: Quick Mark Paid
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try { navigator.vibrate(20); } catch { /* ignore */ }
      }
      onQuickMarkPaid?.(sub);
    } else if (info.offset.x > threshold) {
      // Swiped Right: Edit Subscription
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try { navigator.vibrate(20); } catch { /* ignore */ }
      }
      if (onEdit) {
        onEdit(sub);
      } else {
        onSelectSubscription(sub);
      }
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl select-none group">
      {/* Background Swipe Actions Layer */}
      <div 
        aria-hidden="true" 
        className="absolute inset-0 flex items-center justify-between rounded-2xl sm:rounded-3xl overflow-hidden pointer-events-none"
      >
        {/* Right action revealed when swiping RIGHT: EDIT */}
        <motion.div 
          style={{ opacity: rightActionOpacity, scale: rightActionScale }}
          className="h-full w-36 bg-gradient-to-r from-indigo-600 to-indigo-500 flex items-center gap-2 pl-4 text-white font-bold text-xs shadow-inner"
        >
          <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
            <Pencil size={15} />
          </div>
          <span>Editar</span>
        </motion.div>

        {/* Left action revealed when swiping LEFT: MARK PAID */}
        <motion.div 
          style={{ opacity: leftActionOpacity, scale: leftActionScale }}
          className="h-full w-36 bg-gradient-to-l from-emerald-600 to-emerald-500 flex items-center justify-end gap-2 pr-4 text-white font-bold text-xs shadow-inner ml-auto"
        >
          <span>Pagado</span>
          <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
            <Check size={16} strokeWidth={2.5} />
          </div>
        </motion.div>
      </div>

      {/* Foreground Draggable Card Surface */}
      <motion.div
        id={`sub-card-${sub.id}`}
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.4}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        style={{ x }}
        className="relative z-10 p-3.5 sm:p-4 bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800/80 rounded-2xl sm:rounded-3xl shadow-xs hover:shadow-md dark:shadow-black/30 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex flex-col gap-2.5 cursor-grab active:cursor-grabbing"
      >
        {/* Top Main Row */}
        <div 
          role="button"
          tabIndex={0}
          aria-label={`Ver detalles de ${sub.name}, costo ${formatCurrency(sub.cost, sub.currency)} ${sub.frequency}, vence ${dueInfo.label}`}
          onClick={() => {
            if (!isDragging) {
              onSelectSubscription(sub);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSelectSubscription(sub);
            }
          }}
          className="flex items-center justify-between gap-2.5 w-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-xl"
        >
          {/* Left: Logo & Service Info */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="relative shrink-0">
              <ServiceLogo
                name={sub.name}
                domain={sub.domain}
                logoUrl={sub.logoUrl}
                color={sub.color}
                iconName={sub.iconName}
                size="sm"
              />
              {/* Category Color Accent Dot */}
              <span 
                className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-zinc-900 shadow-xs"
                style={{ backgroundColor: sub.color || '#10b981' }}
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-sm font-bold text-zinc-900 dark:text-white truncate max-w-[130px] xs:max-w-[170px] sm:max-w-[240px] group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {sub.name}
                </p>
                {isSharedSub && (
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold shrink-0 border border-emerald-500/20">
                    <Users size={10} /> {sub.splitPlan?.totalMembers || (sub.splitPlan?.members?.length || 0) + 1}
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 flex-wrap tabular-nums">
                {isSharedSub ? (
                  <>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold whitespace-nowrap">
                      Tu parte: {formatCurrency(userShare, sub.currency)}
                    </span>
                    <span className="text-zinc-400 dark:text-zinc-600 text-[11px]">·</span>
                    <span className="whitespace-nowrap text-zinc-400 dark:text-zinc-500 text-[11px]">
                      Total: {formatCurrency(sub.cost, sub.currency)}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="whitespace-nowrap font-semibold text-zinc-800 dark:text-zinc-200">
                      {formatCurrency(sub.cost, sub.currency)}
                    </span>
                    <span className="text-zinc-400 dark:text-zinc-600 text-[11px]">·</span>
                    <span className="whitespace-nowrap text-zinc-500 dark:text-zinc-400 text-[11px]">
                      {sub.frequency}
                    </span>
                  </>
                )}

                {isSharedSub && subOwed > 0 && (
                  <>
                    <span className="text-zinc-400 dark:text-zinc-600 text-[11px]">·</span>
                    <span className="text-amber-600 dark:text-amber-400 font-semibold inline-flex items-center gap-0.5 whitespace-nowrap text-[11px]">
                      <AlertCircle size={10} /> Te deben {formatCurrency(subOwed, sub.currency)}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right: Due Status Tag, Inline Expand & Actions */}
          <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
            {/* Due Badge */}
            <span className={`px-2.5 py-1 rounded-full text-[10.5px] font-bold whitespace-nowrap tabular-nums ${
              cycleProgress.isOverdue
                ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                : cycleProgress.isDueToday
                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30'
                : cycleProgress.daysUntil <= 3
                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/60'
            }`}>
              {dueInfo.label}
            </span>

            {/* Quick Mark Paid Button (44px hit target) */}
            <button
              type="button"
              id={`quick-pay-btn-${sub.id}`}
              title="Marcar como renovado / pagado hoy"
              onClick={(e) => {
                e.stopPropagation();
                onQuickMarkPaid?.(sub);
              }}
              className="min-h-[44px] min-w-[44px] rounded-xl text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-500/10 transition-all flex items-center justify-center cursor-pointer active:scale-90"
              aria-label={`Marcar ${sub.name} como pagado`}
            >
              <CheckCircle2 size={17} />
            </button>

            {/* Quick Menu / More Button */}
            <button
              type="button"
              id={`quick-menu-btn-${sub.id}`}
              title="Acciones rápidas"
              onClick={(e) => {
                e.stopPropagation();
                onOpenQuickActions?.(sub);
              }}
              className="min-h-[44px] min-w-[44px] rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all flex items-center justify-center cursor-pointer active:scale-90"
              aria-label="Más acciones"
            >
              <MoreVertical size={16} />
            </button>

            {/* Inline Expand Chevron Toggle */}
            <button
              type="button"
              id={`expand-sub-btn-${sub.id}`}
              title={isExpanded ? "Ocultar desglose" : "Ver desglose rápido"}
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="min-h-[44px] min-w-[44px] rounded-xl text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-500/10 transition-all flex items-center justify-center cursor-pointer active:scale-90"
              aria-expanded={isExpanded}
              aria-label="Expandir detalles de suscripción"
            >
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>

        {/* Minimalist Progress Line */}
        <div className="w-full h-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${cycleProgress.percent}%`,
              backgroundColor: cycleProgress.isOverdue
                ? '#f43f5e'
                : cycleProgress.isDueToday
                ? '#f59e0b'
                : cycleProgress.daysUntil <= 3
                ? '#10b981'
                : (sub.color || '#10b981'),
            }}
          />
        </div>

        {/* Expandable Accordion Drawer */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="overflow-hidden pt-2 border-t border-zinc-100 dark:border-white/5 space-y-3"
            >
              {/* Cost Equivalence Grid */}
              <div className="grid grid-cols-3 gap-2 bg-zinc-50 dark:bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-200/60 dark:border-white/5 text-center">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-zinc-400 font-medium block">Diario aprox.</span>
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 tabular-nums">
                    {formatCurrency(dailyCost, sub.currency)}
                  </span>
                </div>
                <div className="space-y-0.5 border-x border-zinc-200/60 dark:border-white/5">
                  <span className="text-[10px] text-zinc-400 font-medium block">Mensual</span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {formatCurrency(monthlyCost, sub.currency)}
                  </span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-zinc-400 font-medium block">Anualizado</span>
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 tabular-nums">
                    {formatCurrency(yearlyCost, sub.currency)}
                  </span>
                </div>
              </div>

              {/* Cycle & Next Due Details */}
              <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 px-1">
                <div className="flex items-center gap-1.5">
                  <Clock size={13} className="text-zinc-400" />
                  <span>Próximo cobro:</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    {formatDateDisplay(sub.nextBillingDate)}
                  </span>
                </div>
                <div className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-300">
                  {cycleProgress.statusText}
                </div>
              </div>

              {/* Inline Action Bar */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-2 flex-1">
                  {/* Edit Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onEdit) onEdit(sub);
                      else onSelectSubscription(sub);
                    }}
                    className="min-h-[44px] px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800/80 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                  >
                    <Pencil size={13} />
                    <span>Editar</span>
                  </button>

                  {/* Mark as Paid Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onQuickMarkPaid?.(sub);
                    }}
                    className="min-h-[44px] px-3.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                  >
                    <CheckCircle2 size={14} />
                    <span>Pagar hoy</span>
                  </button>
                </div>

                {/* Inspect Full Screen */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectSubscription(sub);
                  }}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-1 shadow-sm shadow-indigo-600/20 transition-all cursor-pointer shrink-0 active:scale-95"
                >
                  <span>Detalles</span>
                  <ChevronRight size={13} />
                </button>
              </div>

              {/* Hint on gesture usage */}
              <div className="text-[10px] text-zinc-400 dark:text-zinc-500 text-center pt-0.5">
                💡 Consejo: También puedes deslizar esta tarjeta hacia la izquierda para pagar o a la derecha para editar
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
