import React, { useState } from 'react';
import { 
  Smartphone, 
  CheckCircle2, 
  ExternalLink, 
  Copy, 
  Check, 
  Sparkles, 
  FileText, 
  Code2, 
  Terminal, 
  ShieldCheck, 
  X, 
  PlayCircle,
  HelpCircle,
  Layers
} from 'lucide-react';

interface GooglePlayCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPrivacy: () => void;
}

export const GooglePlayCenterModal: React.FC<GooglePlayCenterModalProps> = ({
  isOpen,
  onClose,
  onOpenPrivacy,
}) => {
  const [activeTab, setActiveTab] = useState<'checklist' | 'pwabuilder' | 'metadata' | 'bubblewrap'>('checklist');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

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

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const appTitle = "SubTrack - Control de Suscripciones";
  const shortDescription = "Gestiona tus suscripciones, controla gastos mensuales y recibe alertas de cobro.";
  const fullDescription = `SubTrack es tu gestor inteligente y privado para tener el control total de todos tus gastos recurrentes, suscripciones digitales y servicios compartidos.

🔥 CARACTERÍSTICAS PRINCIPALES:
• Panel Financiero: Visualiza de un vistazo tu gasto mensual y anual acumulado.
• Alertas de Cobro: Recibe notificaciones antes de cada renovación para evitar cobros sorpresa.
• Planes Familiares y Compartidos: Registra quién ha pagado y quién te debe dinero en suscripciones compartidas (Netflix, Spotify, etc.).
• Exportación y Calendarios: Integra los cobros en Google Calendar o descarga un archivo .ics con un solo toque.
• 100% Privado y Offline: Todos tus datos se almacenan en tu dispositivo con soporte sin conexión. No requerimos cuentas obligatorias ni vendemos tus datos.
• Copias de Seguridad: Exporta tus suscripciones en formato JSON o CSV cuando quieras.

Ideal para controlar Netflix, Spotify, ChatGPT, gimnasio, membresías de software, servicios en la nube y cualquier recibo recurrente.`;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div 
        id="google-play-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="google-play-modal-title"
        className="w-full max-w-xl bg-zinc-950 border border-zinc-800 sm:rounded-3xl rounded-t-3xl max-h-[92vh] flex flex-col shadow-2xl shadow-black overflow-hidden"
      >
        {/* iOS Sheet Drag Indicator */}
        <div className="w-10 h-1 rounded-full bg-zinc-700/80 mx-auto mt-2.5 -mb-1 sm:hidden shrink-0" />

        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60 sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-black flex items-center justify-center font-bold">
              <PlayCircle size={18} />
            </div>
            <div>
              <h2 id="google-play-modal-title" className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5">
                Publicar en Google Play Store
                <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  TWA Ready
                </span>
              </h2>
              <p className="text-[10px] sm:text-xs text-zinc-400">Guía y requisitos para llevar SubTrack a Android</p>
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

        {/* Tab Selector */}
        <div role="tablist" aria-label="Secciones Google Play" className="flex items-center p-2 border-b border-zinc-850 bg-zinc-900/40 gap-1 overflow-x-auto no-scrollbar">
          <button
            role="tab"
            aria-selected={activeTab === 'checklist'}
            onClick={() => setActiveTab('checklist')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 min-h-[40px] cursor-pointer ${
              activeTab === 'checklist'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <CheckCircle2 size={13} className="text-emerald-400" />
            <span>Auditoría Play Store</span>
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'pwabuilder'}
            onClick={() => setActiveTab('pwabuilder')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 min-h-[40px] cursor-pointer ${
              activeTab === 'pwabuilder'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Sparkles size={13} />
            <span>Empaquetar (.AAB)</span>
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'metadata'}
            onClick={() => setActiveTab('metadata')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 min-h-[40px] cursor-pointer ${
              activeTab === 'metadata'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <FileText size={13} />
            <span>Ficha de la Tienda</span>
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'bubblewrap'}
            onClick={() => setActiveTab('bubblewrap')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 min-h-[40px] cursor-pointer ${
              activeTab === 'bubblewrap'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Terminal size={13} />
            <span>CLI Oficial</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs text-zinc-300 leading-relaxed flex-1">
          {activeTab === 'checklist' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 text-indigo-200 text-[11px] leading-snug flex items-start gap-2.5">
                <Smartphone size={18} className="text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  Google Play permite subir Progressive Web Apps mediante la tecnología <span className="text-white font-bold">Trusted Web Activity (TWA)</span>. Tu app se comporta, se instala y se califica exactamente como cualquier app nativa en la Play Store.
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider text-zinc-400 px-1">
                  Requisitos Técnicos Cumplidos:
                </h3>

                <div className="p-3 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-white text-xs">Web App Manifest Completo</p>
                      <p className="text-[10.5px] text-zinc-400">Configurado con display: standalone, orientación vertical, temas y categorías de finanzas.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-white text-xs">Iconos de Alta Definición y Maskable</p>
                      <p className="text-[10.5px] text-zinc-400">Iconos 192x192, 512x512 y SVG vectorial con margen de seguridad adaptativo para Android.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-white text-xs">Soporte Offline (Service Worker)</p>
                      <p className="text-[10.5px] text-zinc-400">Requisito estricto de Google: la app carga al 100% sin conexión a internet y almacena datos en caché.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-white text-xs">Digital Asset Links (.well-known/assetlinks.json)</p>
                      <p className="text-[10.5px] text-zinc-400">Archivo creado para ocultar la barra del navegador y habilitar pantalla completa nativa.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-white text-xs">Política de Privacidad y Seguridad de Datos</p>
                      <p className="text-[10.5px] text-zinc-400">Incluida en la app y alineada con la sección de Data Safety de Google Play Console.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* What is needed from the user */}
              <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
                <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                  <HelpCircle size={14} className="text-amber-400" />
                  ¿Qué necesitas por tu parte para publicar?
                </h4>
                <ol className="list-decimal pl-4 space-y-1.5 text-[11px] text-zinc-400">
                  <li>Una cuenta de <strong className="text-zinc-200">Google Play Console</strong> (costo único de $25 USD a Google).</li>
                  <li>Dominio con HTTPS propio donde esté alojada la app.</li>
                  <li>Generar el paquete <strong className="text-indigo-300">.AAB</strong> usando PWABuilder (pestaña siguiente).</li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === 'pwabuilder' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-indigo-600/15 border border-indigo-500/30 space-y-2">
                <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs">
                  <Sparkles size={15} />
                  <span>Método 1: PWABuilder (Recomendado, Sin Código)</span>
                </div>
                <p className="text-[11px] text-zinc-300">
                  Herramienta oficial respaldada por Microsoft y el equipo de Google Chrome para convertir cualquier PWA en un paquete de Google Play en 2 minutos.
                </p>
              </div>

              <div className="space-y-2.5">
                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-850 space-y-1">
                  <p className="font-bold text-white text-xs">Paso 1: Abre PWABuilder</p>
                  <p className="text-[11px] text-zinc-400">Ingresa la URL pública de tu aplicación desplegada en el campo de prueba.</p>
                  <a
                    href="https://www.pwabuilder.com"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-indigo-400 font-bold text-xs mt-1 hover:underline"
                  >
                    <span>Ir a pwabuilder.com</span>
                    <ExternalLink size={12} />
                  </a>
                </div>

                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-850 space-y-1">
                  <p className="font-bold text-white text-xs">Paso 2: Haz clic en &ldquo;Package For Stores&rdquo;</p>
                  <p className="text-[11px] text-zinc-400">Selecciona el botón de <strong className="text-white">Google Play (Android)</strong>.</p>
                </div>

                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-850 space-y-1">
                  <p className="font-bold text-white text-xs">Paso 3: Descarga tu archivo .AAB</p>
                  <p className="text-[11px] text-zinc-400">
                    PWABuilder te entregará un archivo ZIP que contiene el paquete <code className="text-emerald-400 bg-zinc-950 px-1 py-0.5 rounded">app-release.aab</code> firmado y listo para arrastrar a la consola de Google Play.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'metadata' && (
            <div className="space-y-3">
              <p className="text-[11px] text-zinc-400">
                Textos redactados y optimizados para rellenar la ficha de tu aplicación en Google Play Console:
              </p>

              {/* Title */}
              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-850 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">Nombre de la App (máx 30 caracteres)</span>
                  <button
                    onClick={() => handleCopy(appTitle, 'title')}
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-bold"
                  >
                    {copiedKey === 'title' ? <Check size={13} /> : <Copy size={13} />}
                    <span>{copiedKey === 'title' ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>
                <div className="p-2 rounded-lg bg-zinc-950 text-white font-semibold text-xs border border-zinc-800">
                  {appTitle}
                </div>
              </div>

              {/* Short Desc */}
              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-850 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">Descripción Corta (máx 80 caracteres)</span>
                  <button
                    onClick={() => handleCopy(shortDescription, 'shortDesc')}
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-bold"
                  >
                    {copiedKey === 'shortDesc' ? <Check size={13} /> : <Copy size={13} />}
                    <span>{copiedKey === 'shortDesc' ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>
                <div className="p-2 rounded-lg bg-zinc-950 text-white text-xs border border-zinc-800">
                  {shortDescription}
                </div>
              </div>

              {/* Full Desc */}
              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-850 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">Descripción Completa (ASO Optimizado)</span>
                  <button
                    onClick={() => handleCopy(fullDescription, 'fullDesc')}
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-bold"
                  >
                    {copiedKey === 'fullDesc' ? <Check size={13} /> : <Copy size={13} />}
                    <span>{copiedKey === 'fullDesc' ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>
                <pre className="p-2.5 rounded-lg bg-zinc-950 text-zinc-300 text-[10.5px] font-sans whitespace-pre-wrap border border-zinc-800 max-h-44 overflow-y-auto">
                  {fullDescription}
                </pre>
              </div>

              {/* Category */}
              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-850 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase">Categoría Sugerida</p>
                  <p className="text-white font-semibold text-xs">Finanzas / Productividad</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase">Clasificación</p>
                  <p className="text-emerald-400 font-semibold text-xs">PEGI 3 (Para todos los públicos)</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'bubblewrap' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1.5">
                <div className="flex items-center gap-2 text-white font-bold text-xs">
                  <Terminal size={15} className="text-emerald-400" />
                  <span>Método 2: Google Bubblewrap CLI (Oficial)</span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Si prefieres compilar directamente desde tu terminal o en tu entorno de desarrollo con Node.js:
                </p>
              </div>

              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                <p className="text-[10.5px] text-zinc-400 font-bold">1. Instala Bubblewrap globalmente:</p>
                <div className="flex items-center justify-between bg-zinc-900 p-2 rounded-lg font-mono text-[11px] text-emerald-300">
                  <span>npm install -g @bubblewrap/cli</span>
                  <button onClick={() => handleCopy('npm install -g @bubblewrap/cli', 'cmd1')} className="text-zinc-400 hover:text-white">
                    {copiedKey === 'cmd1' ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                </div>

                <p className="text-[10.5px] text-zinc-400 font-bold mt-2">2. Inicializa con tu URL:</p>
                <div className="flex items-center justify-between bg-zinc-900 p-2 rounded-lg font-mono text-[11px] text-emerald-300">
                  <span>bubblewrap init --manifest=https://tu-dominio.com/manifest.json</span>
                  <button onClick={() => handleCopy('bubblewrap init --manifest=https://tu-dominio.com/manifest.json', 'cmd2')} className="text-zinc-400 hover:text-white">
                    {copiedKey === 'cmd2' ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                </div>

                <p className="text-[10.5px] text-zinc-400 font-bold mt-2">3. Compila el App Bundle (.aab):</p>
                <div className="flex items-center justify-between bg-zinc-900 p-2 rounded-lg font-mono text-[11px] text-emerald-300">
                  <span>bubblewrap build</span>
                  <button onClick={() => handleCopy('bubblewrap build', 'cmd3')} className="text-zinc-400 hover:text-white">
                    {copiedKey === 'cmd3' ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/80 flex items-center justify-between">
          <button
            onClick={onOpenPrivacy}
            className="text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>Ver Política de Privacidad</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white text-black font-bold text-xs hover:bg-zinc-200 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
