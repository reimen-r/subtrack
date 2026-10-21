import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Search, 
  Sparkles, 
  Calendar, 
  DollarSign, 
  Bell, 
  ExternalLink, 
  CreditCard, 
  Tag, 
  Check, 
  Info,
  Clock,
  Users,
  UserPlus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Coins,
  ShieldCheck
} from 'lucide-react';
import { Subscription, CurrencyCode, BillingFrequency, SubscriptionCategory, ReminderTiming, SplitPlanConfig, SplitMember } from '../types';
import { SERVICE_PRESETS, CATEGORY_CONFIG } from '../data/presets';
import { ServiceLogo } from './ServiceLogo';
import { formatCurrency, formatRelativeDueDate, getMonthlyEquivalent } from '../utils/subscriptionUtils';
import { detectCategoryFromText, DetectionResult } from '../utils/categoryDetection';

interface AddEditSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (subscriptionData: Omit<Subscription, 'id' | 'createdAt' | 'billingHistory'> & { id?: string }) => void;
  initialData?: Subscription | null;
}

export const AddEditSubscriptionModal: React.FC<AddEditSubscriptionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const getTodayIso = () => new Date().toISOString().split('T')[0];
  const getDefaultNextBilling = () => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().split('T')[0];
  };

  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [cost, setCost] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [frequency, setFrequency] = useState<BillingFrequency>('monthly');
  const [firstBillingDate, setFirstBillingDate] = useState(() => getTodayIso());
  const [nextBillingDate, setNextBillingDate] = useState(() => getDefaultNextBilling());
  const [category, setCategory] = useState<SubscriptionCategory>('Entertainment');
  const [autoDetectedCategory, setAutoDetectedCategory] = useState<DetectionResult | null>(null);
  const [hasUserManuallySelectedCategory, setHasUserManuallySelectedCategory] = useState(false);
  const [color, setColor] = useState('#6366F1');
  const [iconName, setIconName] = useState('CreditCard');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [cancelUrl, setCancelUrl] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Apple Pay (•••• 4921)');
  const [enableNotifications, setEnableNotifications] = useState(true);
  const [reminderTiming, setReminderTiming] = useState<ReminderTiming>('3_days_before');
  const [contractTerms, setContractTerms] = useState('Monthly recurring, cancel anytime');
  const [notes, setNotes] = useState('');

  // Shared Plan / Split Cost State
  const [isShared, setIsShared] = useState(false);
  const [totalMembers, setTotalMembers] = useState(4);
  const [splitType, setSplitType] = useState<'equal' | 'custom'>('equal');
  const [customUserShare, setCustomUserShare] = useState('');
  const [members, setMembers] = useState<SplitMember[]>([
    { id: 'm-1', name: 'Carlos', amount: 3.75, hasPaid: false, contact: '' },
    { id: 'm-2', name: 'Ana', amount: 3.75, hasPaid: true, contact: '' },
    { id: 'm-3', name: 'Lucas', amount: 3.75, hasPaid: false, contact: '' },
  ]);
  
  // Search & autocomplete query
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setDomain(initialData.domain || '');
      setCost(initialData.cost.toString());
      setCurrency(initialData.currency);
      setFrequency(initialData.frequency);
      setFirstBillingDate(initialData.firstBillingDate || '2025-01-01');
      setNextBillingDate(initialData.nextBillingDate);
      setCategory(initialData.category);
      setColor(initialData.color);
      setIconName(initialData.iconName || 'CreditCard');
      setWebsiteUrl(initialData.websiteUrl || '');
      setCancelUrl(initialData.cancelUrl || '');
      setPaymentMethod(initialData.paymentMethod || 'Apple Pay (•••• 4921)');
      setEnableNotifications(initialData.enableNotifications ?? true);
      setReminderTiming(initialData.reminderTiming || '3_days_before');
      setContractTerms(initialData.contractTerms || 'Monthly recurring, cancel anytime');
      setNotes(initialData.notes || '');
      setSearchQuery(initialData.name);
      setHasUserManuallySelectedCategory(true);
      setAutoDetectedCategory(null);

      if (initialData.splitPlan && initialData.splitPlan.isShared) {
        setIsShared(true);
        setTotalMembers(initialData.splitPlan.totalMembers || 2);
        setSplitType(initialData.splitPlan.splitType || 'equal');
        setCustomUserShare(initialData.splitPlan.userShare !== undefined ? initialData.splitPlan.userShare.toString() : '');
        setMembers(initialData.splitPlan.members || []);
      } else {
        setIsShared(false);
        setTotalMembers(4);
        setSplitType('equal');
        setCustomUserShare('');
        const perPerson = Number(((initialData.cost || 14.99) / 4).toFixed(2));
        setMembers([
          { id: 'm-1', name: 'Carlos', amount: perPerson, hasPaid: false },
          { id: 'm-2', name: 'Ana', amount: perPerson, hasPaid: true },
          { id: 'm-3', name: 'Lucas', amount: perPerson, hasPaid: false },
        ]);
      }
    } else {
      // Default new subscription template
      setName('');
      setDomain('');
      setCost('14.99');
      setCurrency('USD');
      setFrequency('monthly');
      setFirstBillingDate(getTodayIso());
      setNextBillingDate(getDefaultNextBilling());
      setCategory('Entertainment');
      setColor('#6366F1');
      setIconName('CreditCard');
      setWebsiteUrl('');
      setCancelUrl('');
      setPaymentMethod('Apple Pay (•••• 4921)');
      setEnableNotifications(true);
      setReminderTiming('3_days_before');
      setContractTerms('Monthly recurring, cancel anytime');
      setNotes('');
      setSearchQuery('');
      setHasUserManuallySelectedCategory(false);
      setAutoDetectedCategory(null);
      setIsShared(false);
      setTotalMembers(4);
      setSplitType('equal');
      setCustomUserShare('');
      setMembers([
        { id: 'm-1', name: 'Carlos', amount: 3.75, hasPaid: false },
        { id: 'm-2', name: 'Ana', amount: 3.75, hasPaid: true },
        { id: 'm-3', name: 'Lucas', amount: 3.75, hasPaid: false },
      ]);
    }
    setShowSuggestions(false);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const parsedCost = parseFloat(cost) || 0;

  // Recalculate members' equal shares when cost or total members count changes
  const updateEqualShares = (newTotalMembers: number, currentCost: number) => {
    const safeTotal = Math.max(2, newTotalMembers);
    const equalAmount = Number((currentCost / safeTotal).toFixed(2));
    
    setMembers((prevMembers) => {
      const neededFriends = safeTotal - 1;
      const updated = [...prevMembers];
      
      // If we need more members
      while (updated.length < neededFriends) {
        updated.push({
          id: `m-${Date.now()}-${updated.length + 1}`,
          name: `Amigo ${updated.length + 1}`,
          amount: equalAmount,
          hasPaid: false,
        });
      }
      
      // If we have more than needed, slice
      const trimmed = updated.slice(0, neededFriends);
      
      // Update amounts for equal split
      return trimmed.map((m) => ({
        ...m,
        amount: equalAmount,
      }));
    });
  };

  const handleTotalMembersChange = (count: number) => {
    const val = Math.max(2, count);
    setTotalMembers(val);
    if (splitType === 'equal') {
      updateEqualShares(val, parsedCost);
    }
  };

  const handleCostChange = (val: string) => {
    setCost(val);
    const num = parseFloat(val) || 0;
    if (splitType === 'equal' && isShared) {
      updateEqualShares(totalMembers, num);
    }
  };

  const handleAddMember = () => {
    const newTotal = totalMembers + 1;
    setTotalMembers(newTotal);
    const equalAmount = Number((parsedCost / newTotal).toFixed(2));

    const newMember: SplitMember = {
      id: `m-${Date.now()}-${members.length + 1}`,
      name: `Amigo ${members.length + 1}`,
      amount: splitType === 'equal' ? equalAmount : 0,
      hasPaid: false,
    };

    if (splitType === 'equal') {
      setMembers((prev) => [...prev.map((m) => ({ ...m, amount: equalAmount })), newMember]);
    } else {
      setMembers((prev) => [...prev, newMember]);
    }
  };

  const handleRemoveMember = (id: string) => {
    if (members.length <= 1) return;
    const newTotal = Math.max(2, totalMembers - 1);
    setTotalMembers(newTotal);
    const newMembers = members.filter((m) => m.id !== id);
    const equalAmount = Number((parsedCost / newTotal).toFixed(2));

    if (splitType === 'equal') {
      setMembers(newMembers.map((m) => ({ ...m, amount: equalAmount })));
    } else {
      setMembers(newMembers);
    }
  };

  const handleUpdateMemberName = (id: string, nameVal: string) => {
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, name: nameVal } : m)));
  };

  const handleUpdateMemberAmount = (id: string, amountVal: number) => {
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, amount: amountVal } : m)));
  };

  const handleToggleMemberPaid = (id: string) => {
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, hasPaid: !m.hasPaid } : m)));
  };

  // User real share calculation
  const calculatedUserShare = splitType === 'equal'
    ? Number((parsedCost / Math.max(1, totalMembers)).toFixed(2))
    : (parseFloat(customUserShare) || Math.max(0, parsedCost - members.reduce((s, m) => s + (m.amount || 0), 0)));

  const pendingOwedAmount = members.filter((m) => !m.hasPaid).reduce((sum, m) => sum + (m.amount || 0), 0);

  // Filter preset suggestions based on query
  const matchingPresets = searchQuery.trim().length > 0
    ? SERVICE_PRESETS.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : SERVICE_PRESETS.slice(0, 6);

  const handleSelectPreset = (preset: typeof SERVICE_PRESETS[0]) => {
    setName(preset.name);
    setDomain(preset.domain);
    setCategory(preset.category);
    setColor(preset.color);
    setCost(preset.defaultCost.toString());
    setFrequency(preset.defaultFrequency);
    setWebsiteUrl(preset.websiteUrl);
    setCancelUrl(preset.cancelUrl || '');
    setIconName(preset.iconName);
    setSearchQuery(preset.name);
    setShowSuggestions(false);
    setAutoDetectedCategory({ category: preset.category, matchedKeyword: preset.name });
    setHasUserManuallySelectedCategory(false);
    if (isShared && splitType === 'equal') {
      updateEqualShares(totalMembers, preset.defaultCost);
    }
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!hasUserManuallySelectedCategory) {
      const detected = detectCategoryFromText(val, domain);
      if (detected) {
        setCategory(detected.category);
        const catConfig = CATEGORY_CONFIG[detected.category];
        if (catConfig) {
          setColor(catConfig.color);
        }
        setAutoDetectedCategory(detected);
      } else {
        setAutoDetectedCategory(null);
      }
    }
  };

  const handleCustomDomainChange = (val: string) => {
    setDomain(val);
    let targetName = name;
    if (!name && val) {
      const clean = val.replace(/^(?:https?:\/\/)?(?:www\.)?/i, '').split('.')[0];
      targetName = clean.charAt(0).toUpperCase() + clean.slice(1);
      setName(targetName);
    }
    if (!hasUserManuallySelectedCategory) {
      const detected = detectCategoryFromText(targetName, val);
      if (detected) {
        setCategory(detected.category);
        const catConfig = CATEGORY_CONFIG[detected.category];
        if (catConfig) {
          setColor(catConfig.color);
        }
        setAutoDetectedCategory(detected);
      }
    }
  };

  const handleSearchQueryChange = (val: string) => {
    setSearchQuery(val);
    setShowSuggestions(true);
    if (!name && !hasUserManuallySelectedCategory) {
      const detected = detectCategoryFromText(val);
      if (detected) {
        setCategory(detected.category);
        const catConfig = CATEGORY_CONFIG[detected.category];
        if (catConfig) {
          setColor(catConfig.color);
        }
        setAutoDetectedCategory(detected);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const splitPlanData: SplitPlanConfig | undefined = isShared
      ? {
          isShared: true,
          totalMembers,
          splitType,
          userShare: calculatedUserShare,
          members: members.map((m) => ({
            ...m,
            amount: splitType === 'equal' ? Number((parsedCost / totalMembers).toFixed(2)) : (m.amount || 0),
          })),
        }
      : undefined;

    onSave({
      ...(initialData?.id ? { id: initialData.id } : {}),
      name: name.trim(),
      domain: domain.trim() || `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
      cost: parsedCost,
      currency,
      frequency,
      firstBillingDate,
      nextBillingDate,
      category,
      color,
      iconName,
      websiteUrl: websiteUrl || (domain ? `https://${domain}` : ''),
      cancelUrl,
      paymentMethod,
      enableNotifications,
      reminderTiming,
      contractTerms,
      notes,
      splitPlan: splitPlanData,
      status: initialData?.status || 'active',
    });
    onClose();
  };

  const monthlyEq = getMonthlyEquivalent(parsedCost, frequency);
  const dueInfo = formatRelativeDueDate(nextBillingDate);

  const COLOR_PALETTES = [
    '#6366F1', // Indigo
    '#10B981', // Emerald
    '#E50914', // Netflix Red
    '#1DB954', // Spotify Green
    '#0071E3', // Apple Blue
    '#F59E0B', // Amber
    '#EC4899', // Pink
    '#8B5CF6', // Purple
    '#06B6D4', // Cyan
    '#14B8A6', // Teal
  ];

  return (
    <AnimatePresence>
      <div 
        id="add-edit-modal-backdrop" 
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          id="add-edit-modal-content"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-edit-modal-title"
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.96 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Mobile Sheet Drag Indicator (Apple HIG Sheet Grabber) */}
          <div className="w-10 h-1.5 rounded-full bg-zinc-600/90 mx-auto mt-2.5 -mb-1 sm:hidden shrink-0" />

          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-zinc-800 bg-zinc-950 sticky top-0 z-20">
            <div className="flex items-center gap-2 sm:gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20 shrink-0">
                <Sparkles size={16} />
              </div>
              <div>
                <h2 id="add-edit-modal-title" className="text-sm sm:text-base font-bold text-white tracking-tight">
                  {initialData ? 'Editar Suscripción' : 'Añadir Suscripción'}
                </h2>
                <p className="text-[10px] sm:text-[11px] text-zinc-400">Controla gastos recurrentes y recordatorios</p>
              </div>
            </div>
            <button
              id="close-modal-btn"
              onClick={onClose}
              className="min-h-[44px] min-w-[44px] rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors flex items-center justify-center cursor-pointer active:scale-95"
              aria-label="Cerrar modal"
            >
              <X size={18} />
            </button>
          </div>

          {/* Form Scroll Area */}
          <form onSubmit={handleSubmit} className="overflow-y-auto px-4 sm:px-6 py-4 sm:py-5 space-y-4 sm:space-y-5 flex-1 text-sm">
            
            {/* Live Visual Card Preview */}
            <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold tracking-wider uppercase text-zinc-500">Live Preview</span>
                  {isShared && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center gap-1">
                      <Users size={10} />
                      <span>{totalMembers} personas • Tu parte: {formatCurrency(calculatedUserShare, currency)}</span>
                    </span>
                  )}
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${dueInfo.urgencyColor}`}>
                  {dueInfo.label}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ServiceLogo
                    name={name || 'Service Name'}
                    domain={domain}
                    color={color}
                    iconName={iconName}
                    size="md"
                  />
                  <div>
                    <h3 className="font-bold text-white text-sm">
                      {name || 'New Subscription'}
                    </h3>
                    <p className="text-xs text-zinc-400 flex items-center gap-1.5 mt-0.5">
                      <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                      {category} • {frequency.charAt(0).toUpperCase() + frequency.slice(1)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-base text-emerald-400">
                    {isShared ? formatCurrency(calculatedUserShare, currency) : formatCurrency(parsedCost, currency)}
                  </div>
                  <span className="text-[10px] text-zinc-500 block">
                    {isShared ? (
                      <span className="text-indigo-400 font-medium">tu cuota (total {formatCurrency(parsedCost, currency)})</span>
                    ) : (
                      frequency === 'monthly' ? '/ month' : `≈ ${formatCurrency(monthlyEq, currency)}/mo`
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Auto-Complete Search Field for Online Services & Logos */}
            <div className="relative">
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Quick Search / Brand Auto-complete</span>
                <span className="text-[10px] font-normal text-indigo-400">Auto-fills logos & details</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                  <Search size={15} />
                </div>
                <input
                  id="brand-autocomplete-input"
                  type="text"
                  placeholder="e.g. Netflix, Spotify, Gym, ChatGPT, Adobe, iCloud..."
                  value={searchQuery}
                  onChange={(e) => handleSearchQueryChange(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  className="w-full pl-9 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 text-xs transition-all"
                />
              </div>

              {/* Suggestions Dropdown */}
              {showSuggestions && matchingPresets.length > 0 && (
                <div 
                  id="preset-suggestions-dropdown" 
                  className="absolute z-30 w-full mt-1.5 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden max-h-56 overflow-y-auto"
                >
                  <div className="p-2 border-b border-zinc-800 text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex justify-between">
                    <span>Popular Services</span>
                    <span>Click to auto-populate</span>
                  </div>
                  {matchingPresets.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className="w-full px-3.5 py-2 flex items-center justify-between hover:bg-zinc-800 text-left transition-colors group"
                    >
                      <div className="flex items-center gap-2.5">
                        <ServiceLogo
                          name={preset.name}
                          domain={preset.domain}
                          color={preset.color}
                          size="sm"
                        />
                        <div>
                          <div className="font-semibold text-white group-hover:text-indigo-400 text-xs">
                            {preset.name}
                          </div>
                          <div className="text-[10px] text-zinc-500">{preset.category} • {preset.domain}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-emerald-400">
                          {formatCurrency(preset.defaultCost, 'USD')}
                        </span>
                        <span className="text-[9px] text-zinc-500 block">/{preset.defaultFrequency === 'monthly' ? 'mo' : 'yr'}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Service Name & Domain */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    Nombre del servicio *
                  </label>
                  {autoDetectedCategory && (
                    <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                      <Sparkles size={10} className="text-emerald-400 animate-pulse" />
                      <span>{autoDetectedCategory.category}</span>
                    </span>
                  )}
                </div>
                <input
                  id="service-name-input"
                  type="text"
                  required
                  placeholder="ej. Netflix, Spotify, ChatGPT, iCloud, AWS..."
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 text-sm font-medium transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Dominio / Proveedor de logo
                </label>
                <input
                  id="service-domain-input"
                  type="text"
                  placeholder="ej. netflix.com"
                  value={domain}
                  onChange={(e) => handleCustomDomainChange(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 text-sm font-medium transition-colors"
                />
              </div>
            </div>

            {/* Cost, Currency & Billing Frequency */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Coste *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500 font-bold">
                    <DollarSign size={15} />
                  </div>
                  <input
                    id="cost-input"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="0.00"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    className="w-full min-h-[44px] pl-8 pr-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white font-bold text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Moneda
                </label>
                <select
                  id="currency-select"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                  className="w-full min-h-[44px] px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-sm font-medium focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="CAD">CAD (CA$)</option>
                  <option value="AUD">AUD (AU$)</option>
                  <option value="JPY">JPY (¥)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Frecuencia de cobro
                </label>
                <select
                  id="frequency-select"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as BillingFrequency)}
                  className="w-full min-h-[44px] px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-sm font-medium focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="monthly">Mensual</option>
                  <option value="yearly">Anual</option>
                  <option value="weekly">Semanal</option>
                  <option value="quarterly">Trimestral (3 meses)</option>
                </select>
              </div>
            </div>

            {/* Date Pickers: Next Payment Date & First Billing Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Próxima fecha de cobro *</span>
                  <span className="text-[10px] text-emerald-400 font-bold">{dueInfo.label}</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                    <Calendar size={15} />
                  </div>
                  <input
                    id="next-payment-date-input"
                    type="date"
                    required
                    value={nextBillingDate}
                    onChange={(e) => setNextBillingDate(e.target.value)}
                    className="w-full min-h-[44px] pl-9 pr-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-sm font-medium focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Primer cobro (Opcional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                    <Clock size={15} />
                  </div>
                  <input
                    id="first-billing-date-input"
                    type="date"
                    value={firstBillingDate}
                    onChange={(e) => setFirstBillingDate(e.target.value)}
                    className="w-full min-h-[44px] pl-9 pr-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-sm font-medium focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Category Selector with Color-Coded Tags */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Tag size={13} className="text-indigo-400" />
                  <span>Category Tag</span>
                </label>
                {autoDetectedCategory ? (
                  <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded-full flex items-center gap-1 animate-in fade-in">
                    <Sparkles size={11} className="text-emerald-400 shrink-0 animate-pulse" />
                    <span>Auto-detectado: "{autoDetectedCategory.matchedKeyword}"</span>
                  </span>
                ) : (
                  <span className="text-[9.5px] text-zinc-500 hidden sm:inline">
                    Detección automática por palabra clave
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {Object.keys(CATEGORY_CONFIG).map((catKey) => {
                  const cat = CATEGORY_CONFIG[catKey];
                  const isSelected = category === catKey;
                  const isAutoDetectedThis = autoDetectedCategory?.category === catKey;
                  return (
                    <button
                      key={catKey}
                      type="button"
                      onClick={() => {
                        setCategory(catKey as SubscriptionCategory);
                        setColor(cat.color);
                        setHasUserManuallySelectedCategory(true);
                        setAutoDetectedCategory(null);
                      }}
                      className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border cursor-pointer active:scale-95 ${
                        isSelected
                          ? 'border-white/40 shadow-sm text-white scale-105 ring-1 ring-white/20'
                          : 'border-zinc-800 text-zinc-400 hover:text-zinc-200 bg-zinc-900/60'
                      }`}
                      style={{
                        backgroundColor: isSelected ? cat.bg : undefined,
                        borderColor: isSelected ? cat.color : undefined,
                      }}
                    >
                      <span 
                        className="w-1.5 h-1.5 rounded-full" 
                        style={{ backgroundColor: cat.color }} 
                      />
                      <span>{cat.label}</span>
                      {isAutoDetectedThis && (
                        <Sparkles size={10} className="text-emerald-400 ml-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 👥 Plan Compartido & División de Gastos (Family Plan / Split Cost) */}
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-indigo-500/20 space-y-3.5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                    <Users size={16} />
                  </div>
                  <div>
                    <span className="font-bold text-white text-xs block flex items-center gap-1.5">
                      <span>Plan Compartido / Dividir Gastos</span>
                      <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 text-[9px] font-bold">Family Plan</span>
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      Calcula tu parte real y registra quién te debe dinero
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  id="split-cost-toggle"
                  onClick={() => {
                    const nextShared = !isShared;
                    setIsShared(nextShared);
                    if (nextShared && splitType === 'equal') {
                      updateEqualShares(totalMembers, parsedCost);
                    }
                  }}
                  className={`w-11 h-6 flex items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out ${
                    isShared ? 'bg-indigo-600' : 'bg-zinc-800'
                  }`}
                >
                  <motion.div
                    layout
                    className="bg-white w-5 h-5 rounded-full shadow-md"
                    animate={{ x: isShared ? 20 : 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>

              {isShared && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-4 pt-3 border-t border-zinc-800/80"
                >
                  {/* Number of People Quick Selector */}
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                      <span>¿Entre cuántas personas se divide? (Tú + amigos)</span>
                      <span className="text-indigo-400 font-bold text-xs">{totalMembers} personas</span>
                    </label>

                    <div className="grid grid-cols-4 gap-1.5 mb-2">
                      {[
                        { count: 2, label: 'Dúo (2)' },
                        { count: 3, label: '3 personas' },
                        { count: 4, label: 'Familiar (4)' },
                        { count: 6, label: '6 personas' },
                      ].map((preset) => (
                        <button
                          key={preset.count}
                          type="button"
                          onClick={() => handleTotalMembersChange(preset.count)}
                          className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border text-center transition-all ${
                            totalMembers === preset.count
                              ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                              : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-800 hover:text-white'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-zinc-500">Ajuste manual:</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleTotalMembersChange(totalMembers - 1)}
                          disabled={totalMembers <= 2}
                          className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 flex items-center justify-center font-bold hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed text-xs"
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-xs font-bold text-white">{totalMembers}</span>
                        <button
                          type="button"
                          onClick={() => handleTotalMembersChange(totalMembers + 1)}
                          className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 flex items-center justify-center font-bold hover:bg-zinc-800 text-xs"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Split Calculation Summary Card */}
                  <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/30 grid grid-cols-2 sm:grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-black/40 border border-zinc-800/80">
                      <span className="text-[9px] text-zinc-400 uppercase font-bold block">Tu Parte Real</span>
                      <span className="text-sm font-extrabold text-emerald-400 block mt-0.5">
                        {formatCurrency(calculatedUserShare, currency)}
                      </span>
                      <span className="text-[9px] text-emerald-500/80">¡Ahorras {formatCurrency(Math.max(0, parsedCost - calculatedUserShare), currency)}!</span>
                    </div>

                    <div className="p-2 rounded-lg bg-black/40 border border-zinc-800/80">
                      <span className="text-[9px] text-zinc-400 uppercase font-bold block">Coste Total Plan</span>
                      <span className="text-sm font-extrabold text-white block mt-0.5">
                        {formatCurrency(parsedCost, currency)}
                      </span>
                      <span className="text-[9px] text-zinc-500">/{frequency}</span>
                    </div>

                    <div className="p-2 rounded-lg bg-black/40 border border-zinc-800/80 col-span-2 sm:col-span-1">
                      <span className="text-[9px] text-zinc-400 uppercase font-bold block">Te Deben Aún</span>
                      <span className={`text-sm font-extrabold block mt-0.5 ${pendingOwedAmount > 0 ? 'text-amber-400' : 'text-zinc-400'}`}>
                        {formatCurrency(pendingOwedAmount, currency)}
                      </span>
                      <span className="text-[9px] text-zinc-500">
                        {pendingOwedAmount > 0 ? `${members.filter(m => !m.hasPaid).length} pendientes` : 'Al día'}
                      </span>
                    </div>
                  </div>

                  {/* Split Mode Selector (Equal vs Custom) */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      Modo de Reparto
                    </span>
                    <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl p-0.5 text-[10px]">
                      <button
                        type="button"
                        onClick={() => {
                          setSplitType('equal');
                          updateEqualShares(totalMembers, parsedCost);
                        }}
                        className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                          splitType === 'equal' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        Partes Iguales
                      </button>
                      <button
                        type="button"
                        onClick={() => setSplitType('custom')}
                        className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                          splitType === 'custom' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        Personalizado
                      </button>
                    </div>
                  </div>

                  {/* Members & Debt List */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-bold text-zinc-400 uppercase">
                      <span>Participantes ({members.length} amigos + Tú)</span>
                      <span className="text-zinc-500">Estado de pago este ciclo</span>
                    </div>

                    {/* Current User Slot (Owner) */}
                    <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
                          Tú
                        </div>
                        <div>
                          <span className="text-xs font-bold text-white block">Tú (Titular de la cuenta)</span>
                          <span className="text-[9px] text-zinc-500">Pagas al proveedor</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {splitType === 'custom' ? (
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Tu parte"
                            value={customUserShare}
                            onChange={(e) => setCustomUserShare(e.target.value)}
                            className="w-20 px-2 py-1 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-bold text-emerald-400 text-right"
                          />
                        ) : (
                          <span className="text-xs font-bold text-emerald-400">
                            {formatCurrency(calculatedUserShare, currency)}
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                          Titular
                        </span>
                      </div>
                    </div>

                    {/* Other Members List */}
                    {members.map((member, index) => (
                      <div
                        key={member.id}
                        className="p-2.5 rounded-xl bg-zinc-900/50 border border-zinc-800 flex items-center justify-between gap-2 transition-all hover:border-zinc-700"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-[10px] shrink-0">
                            {member.name ? member.name.charAt(0).toUpperCase() : `${index + 1}`}
                          </div>
                          <input
                            type="text"
                            placeholder={`Nombre amigo ${index + 1}`}
                            value={member.name}
                            onChange={(e) => handleUpdateMemberName(member.id, e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800/80 rounded-lg px-2 py-1 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 font-medium"
                          />
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {splitType === 'custom' ? (
                            <input
                              type="number"
                              step="0.01"
                              value={member.amount}
                              onChange={(e) => handleUpdateMemberAmount(member.id, parseFloat(e.target.value) || 0)}
                              className="w-16 px-1.5 py-1 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-bold text-white text-right"
                            />
                          ) : (
                            <span className="text-xs font-bold text-zinc-300 w-14 text-right">
                              {formatCurrency(member.amount, currency)}
                            </span>
                          )}

                          {/* Debt Toggle Button */}
                          <button
                            type="button"
                            onClick={() => handleToggleMemberPaid(member.id)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all border ${
                              member.hasPaid
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                            }`}
                            title={member.hasPaid ? 'Marcado como pagado' : 'Pendiente de pago / Te debe'}
                          >
                            {member.hasPaid ? (
                              <>
                                <CheckCircle2 size={11} />
                                <span>Pagado</span>
                              </>
                            ) : (
                              <>
                                <AlertCircle size={11} />
                                <span>Me debe</span>
                              </>
                            )}
                          </button>

                          {/* Remove button */}
                          {members.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveMember(member.id)}
                              className="p-1 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                              title="Eliminar miembro"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={handleAddMember}
                      className="w-full py-2 rounded-xl bg-zinc-900 border border-dashed border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5 mt-2"
                    >
                      <UserPlus size={13} />
                      <span>Añadir otro amigo / participante</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Brand Color Theme Palette */}
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                Accent Theme Color
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {COLOR_PALETTES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform ${
                      color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-950 scale-110' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: c }}
                  >
                    {color === c && <Check size={12} className="text-white drop-shadow" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Notification Reminders Toggle & Settings */}
            <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                    <Bell size={14} />
                  </div>
                  <div>
                    <span className="font-bold text-white text-xs block">Enable Renewal Notifications</span>
                    <span className="text-[10px] text-zinc-500">Get push alerts before funds are charged</span>
                  </div>
                </div>
                <button
                  type="button"
                  id="notifications-toggle"
                  onClick={() => setEnableNotifications(!enableNotifications)}
                  className={`w-11 h-6 flex items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out ${
                    enableNotifications ? 'bg-emerald-500' : 'bg-zinc-800'
                  }`}
                >
                  <motion.div
                    layout
                    className="bg-black w-5 h-5 rounded-full shadow-md"
                    animate={{ x: enableNotifications ? 20 : 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>

              {enableNotifications && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="pt-3 border-t border-zinc-800 space-y-2"
                >
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    Remind me:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'on_day', label: 'On payment day' },
                      { value: '1_day_before', label: '1 day before' },
                      { value: '3_days_before', label: '3 days before' },
                      { value: '1_week_before', label: '1 week before' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setReminderTiming(option.value as ReminderTiming)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border text-left flex items-center justify-between transition-all ${
                          reminderTiming === option.value
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-bold'
                            : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-850'
                        }`}
                      >
                        <span>{option.label}</span>
                        {reminderTiming === option.value && <Check size={12} className="text-emerald-400" />}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Additional Details Fields */}
            <div className="space-y-3 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <CreditCard size={12} className="text-zinc-500" />
                    <span>Payment Method</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Apple Pay (•••• 4921)"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <ExternalLink size={12} className="text-zinc-500" />
                    <span>Direct Cancel / Portal URL</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://service.com/account/cancel"
                    value={cancelUrl}
                    onChange={(e) => setCancelUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Info size={12} className="text-zinc-500" />
                  <span>Contract Terms / Notes</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 12-month commitment, cancel before 20th"
                  value={contractTerms}
                  onChange={(e) => setContractTerms(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Sticky Action Buttons (iOS 44px touch targets with bottom safe-area) */}
            <div className="sticky bottom-0 bg-zinc-950/95 backdrop-blur-md pt-3 pb-[max(env(safe-area-inset-bottom,0px),0.95rem)] px-4 sm:px-6 -mx-4 sm:-mx-6 -mb-4 sm:-mb-5 border-t border-zinc-800 flex items-center gap-2 sm:gap-2.5 z-20">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 min-h-[44px] py-2.5 px-3 sm:px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-semibold text-xs border border-zinc-800 transition-colors cursor-pointer active:scale-95"
              >
                Cancelar
              </button>
              <button
                id="save-subscription-btn"
                type="submit"
                className="flex-1 min-h-[44px] py-2.5 px-3 sm:px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check size={16} />
                <span>{initialData ? 'Guardar Cambios' : 'Añadir Suscripción'}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
