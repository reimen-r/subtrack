import React, { useState } from 'react';
import { Download, CheckCircle2, Smartphone, X, ExternalLink } from 'lucide-react';
import { usePWAInstall } from '../utils/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'compact' | 'card';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'compact',
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);

  // If already running inside standalone PWA mode
  if (isInstalled) {
    if (variant === 'card') {
      return (
        <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <div>
            <p className="font-bold">Aplicación Instalada</p>
            <p className="text-[11px] text-zinc-400">Estás ejecutando SubTrack como PWA en tu dispositivo.</p>
          </div>
        </div>
      );
    }
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (!success) {
        setShowInstructionsModal(true);
      }
    } else {
      // In preview iframes or before prompt fires, show guided instructions
      setShowInstructionsModal(true);
    }
  };

  if (variant === 'card') {
    return (
      <>
        <div className={`p-4 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-zinc-900 to-zinc-900 border border-indigo-500/30 shadow-lg ${className}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                <Smartphone size={20} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Instalar en Android / Móvil</span>
                  <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold uppercase tracking-wider">
                    PWA
                  </span>
                </h4>
                <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                  Instala SubTrack como app nativa en tu pantalla de inicio, sin ocupar espacio de la tienda.
                </p>
              </div>
            </div>
            <button
              id="btn-pwa-install-card"
              onClick={handleInstallClick}
              className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all cursor-pointer shrink-0"
            >
              <Download size={14} />
              <span>Instalar</span>
            </button>
          </div>
        </div>

        {/* Modal de Instrucciones de Instalación */}
        {showInstructionsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="w-full max-w-sm rounded-3xl bg-zinc-900 border border-zinc-800 p-5 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600/20 flex items-center justify-center text-indigo-400">
                    <Smartphone size={16} />
                  </div>
                  <h3 className="text-sm font-bold text-white">Instalar SubTrack en Android</h3>
                </div>
                <button
                  onClick={() => setShowInstructionsModal(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-xs text-zinc-300">
                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                    1
                  </span>
                  <p>
                    Abre la aplicación en <strong>Google Chrome</strong> en tu teléfono Android (usa el botón de abrir en nueva pestaña si estás en vista previa).
                  </p>
                </div>

                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                    2
                  </span>
                  <p>
                    Pulsa en el <strong>menú de tres puntos (⋮)</strong> en la esquina superior derecha del navegador.
                  </p>
                </div>

                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                    3
                  </span>
                  <p>
                    Selecciona <strong>"Instalar aplicación"</strong> o <strong>"Añadir a la pantalla de inicio"</strong>.
                  </p>
                </div>

                {isIOS && (
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px]">
                    <strong>En iPhone / iPad (Safari):</strong> Pulsa el botón <em>Compartir</em> (icono cuadrado con flecha) y selecciona <em>"Añadir a la pantalla de inicio"</em>.
                  </div>
                )}
              </div>

              <div className="mt-5 flex gap-2">
                <button
                  onClick={() => setShowInstructionsModal(false)}
                  className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Compact button for header
  return (
    <>
      <button
        id="btn-pwa-install-header"
        onClick={handleInstallClick}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-indigo-600/20 border border-indigo-500/40 hover:bg-indigo-600/30 text-indigo-300 hover:text-white text-xs font-semibold transition-all cursor-pointer shadow-sm active:scale-95 ${className}`}
        title="Instalar como app en Android / Móvil"
      >
        <Download size={13} className="text-indigo-400 animate-bounce" />
        <span className="hidden xs:inline">Instalar App</span>
      </button>

      {/* Modal de Instrucciones de Instalación */}
      {showInstructionsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-zinc-900 border border-zinc-800 p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-600/20 flex items-center justify-center text-indigo-400">
                  <Smartphone size={16} />
                </div>
                <h3 className="text-sm font-bold text-white">Instalar SubTrack PWA</h3>
              </div>
              <button
                onClick={() => setShowInstructionsModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs text-zinc-300">
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                  1
                </span>
                <p>
                  Abre la app en <strong>Google Chrome</strong> en tu móvil Android (en una pestaña directa).
                </p>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                  2
                </span>
                <p>
                  Toca el menú de opciones <strong>(tres puntos ⋮)</strong> arriba a la derecha.
                </p>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                  3
                </span>
                <p>
                  Toca en <strong>"Instalar aplicación"</strong> o <strong>"Añadir a la pantalla de inicio"</strong>.
                </p>
              </div>

              {isIOS && (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px]">
                  <strong>En iOS Safari:</strong> Toca el botón <em>Compartir</em> y selecciona <em>"Añadir a la pantalla de inicio"</em>.
                </div>
              )}
            </div>

            <div className="mt-5">
              <button
                onClick={() => setShowInstructionsModal(false)}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
