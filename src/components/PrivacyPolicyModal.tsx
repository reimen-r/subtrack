import React from 'react';
import { ShieldCheck, Lock, Database, EyeOff, FileText, X, CheckCircle2, ArrowRight } from 'lucide-react';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ isOpen, onClose }) => {
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div 
        id="privacy-policy-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="privacy-modal-title"
        className="w-full max-w-lg bg-zinc-950 border border-zinc-800 sm:rounded-3xl rounded-t-3xl max-h-[90vh] flex flex-col shadow-2xl shadow-black overflow-hidden"
      >
        {/* iOS Sheet Drag Indicator */}
        <div className="w-10 h-1 rounded-full bg-zinc-700/80 mx-auto mt-2.5 -mb-1 sm:hidden shrink-0" />

        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60 sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h2 id="privacy-modal-title" className="text-sm sm:text-base font-bold text-white">Política de Privacidad</h2>
              <p className="text-[10px] sm:text-xs text-zinc-400">Declaración de Seguridad y Datos (Google Play Ready)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer active:scale-95"
            aria-label="Cerrar modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs text-zinc-300 leading-relaxed">
          {/* Quick Summary Pill Banner */}
          <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex items-start gap-3 text-emerald-200">
            <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-snug">
              <span className="font-bold text-emerald-300">Privacidad Local-First: </span>
              Tus suscripciones y gastos se almacenan únicamente en la memoria de tu dispositivo. No vendemos ni compartimos tus datos financieros con ninguna entidad.
            </div>
          </div>

          {/* Section 1 */}
          <div className="space-y-1.5 bg-zinc-900/40 p-3.5 rounded-2xl border border-zinc-850">
            <div className="flex items-center gap-2 text-white font-bold text-xs">
              <Database size={14} className="text-indigo-400" />
              <span>1. Almacenamiento y Recopilación de Datos</span>
            </div>
            <p className="text-zinc-400 text-[11px]">
              SubTrack opera bajo el principio de soberanía de datos del usuario. Toda la información introducida (nombres de servicios, montos, periodicidad de facturación, notas y categorías) se guarda localmente en el almacenamiento persistente seguro de tu navegador o WebView.
            </p>
          </div>

          {/* Section 2 */}
          <div className="space-y-1.5 bg-zinc-900/40 p-3.5 rounded-2xl border border-zinc-850">
            <div className="flex items-center gap-2 text-white font-bold text-xs">
              <Lock size={14} className="text-emerald-400" />
              <span>2. Datos de Pago y Tarjetas de Crédito</span>
            </div>
            <p className="text-zinc-400 text-[11px]">
              SubTrack <span className="text-white font-semibold">NO</span> recopila, solicita ni almacena números completos de tarjetas de crédito, códigos CVV ni contraseñas bancarias. Cualquier mención a métodos de pago (ej. &ldquo;Apple Pay •••• 4921&rdquo;) es únicamente una etiqueta informativa creada por el usuario para su propia referencia.
            </p>
          </div>

          {/* Section 3 */}
          <div className="space-y-1.5 bg-zinc-900/40 p-3.5 rounded-2xl border border-zinc-850">
            <div className="flex items-center gap-2 text-white font-bold text-xs">
              <EyeOff size={14} className="text-amber-400" />
              <span>3. Cero Rastreo de Publicidad de Terceros</span>
            </div>
            <p className="text-zinc-400 text-[11px]">
              No integramos kits de desarrollo de software (SDKs) de publicidad, ni perfiles de rastreo entre aplicaciones, ni revendemos tus datos para monetización publicitaria.
            </p>
          </div>

          {/* Section 4 */}
          <div className="space-y-1.5 bg-zinc-900/40 p-3.5 rounded-2xl border border-zinc-850">
            <div className="flex items-center gap-2 text-white font-bold text-xs">
              <FileText size={14} className="text-sky-400" />
              <span>4. Copias de Seguridad y Control Total</span>
            </div>
            <p className="text-zinc-400 text-[11px]">
              Puedes exportar en cualquier momento todos tus registros a archivos universales JSON o CSV, así como eliminar todos los datos de forma permanente e instantánea con la opción &ldquo;Dejar en blanco&rdquo;.
            </p>
          </div>

          {/* Section 5: Cumplimiento Google Play */}
          <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 text-[10.5px] text-zinc-400">
            <p className="text-white font-bold mb-1">Declaración de Seguridad de Datos (Google Play Console):</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Datos compartidos con terceros: <span className="text-emerald-400 font-semibold">Ninguno</span>.</li>
              <li>Finalidad de recopilación: <span className="text-zinc-200">Funcionalidad interna de la app</span>.</li>
              <li>Prácticas de seguridad: Los datos se conservan localmente bajo el sandbox de Android.</li>
              <li>Opción de eliminación: Disponible directamente en la sección de Ajustes / Limpieza de la app.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/80 flex items-center justify-between">
          <span className="text-[10px] text-zinc-500">Última actualización: Septiembre 2026</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white text-black font-bold text-xs hover:bg-zinc-200 transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
