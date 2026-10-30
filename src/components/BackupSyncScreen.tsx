import React, { useState, useEffect, useRef } from 'react';
import {
  Cloud,
  Download,
  Upload,
  ShieldCheck,
  FolderArchive,
  Share2,
  HardDrive,
  History,
  CheckCircle2,
  PlayCircle,
  Trash2,
} from 'lucide-react';
import { motion } from 'motion/react';
import { Subscription, NotificationSettings, LocalSnapshot } from '../types';
import { SubTrackLogo } from './SubTrackLogo';
import {
  generateBackupPackage,
  downloadBackupFile,
  shareBackupFile,
  validateAndParseBackup,
  parseQuickSyncString,
  getLocalSnapshots,
  saveLocalSnapshot,
  deleteLocalSnapshot,
  ValidationResult,
} from '../utils/backupService';
import { formatCurrency } from '../utils/subscriptionUtils';

interface BackupSyncScreenProps {
  subscriptions: Subscription[];
  notificationSettings: NotificationSettings;
  onRestoreSubscriptions: (restoredSubs: Subscription[], mode: 'replace' | 'merge') => void;
  onShowBanner: (title: string, message: string) => void;
  onOpenGooglePlay?: () => void;
  onOpenPrivacy?: () => void;
}

export const BackupSyncScreen: React.FC<BackupSyncScreenProps> = ({
  subscriptions,
  notificationSettings,
  onRestoreSubscriptions,
  onShowBanner,
  onOpenGooglePlay,
  onOpenPrivacy,
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [manualCodeInput, setManualCodeInput] = useState('');
  
  // Import File state
  const [selectedFileContent, setSelectedFileContent] = useState<ValidationResult | null>(null);
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('replace');
  const [isProcessing, setIsProcessing] = useState(false);
  const [snapshots, setSnapshots] = useState<LocalSnapshot[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSnapshots(getLocalSnapshots());
  }, []);

  // Delete local backup
  const handleDeleteSnapshot = () => {
    deleteLocalSnapshot();
    setSnapshots([]);
    onShowBanner('Copia eliminada', 'Se ha eliminado la copia de seguridad anterior.');
  };

  // Handle iCloud / Mobile Native Share Export
  const handleExportICloud = async () => {
    setIsProcessing(true);
    const pkg = generateBackupPackage(subscriptions, notificationSettings);
    // Saves new snapshot and automatically deletes the previous one
    saveLocalSnapshot(subscriptions, 'Copia en iCloud Drive');
    setSnapshots(getLocalSnapshots());

    try {
      const result = await shareBackupFile(pkg);
      if (result.shared) {
        onShowBanner(
          'Nueva copia guardada',
          result.method === 'share'
            ? 'Copia única guardada en iCloud. Se reemplazó la versión anterior.'
            : 'Archivo SubTrack_Backup.json descargado reemplazando la copia anterior.'
        );
      }
    } catch (e) {
      downloadBackupFile(pkg, 'json');
      onShowBanner('Copia guardada', 'Se ha descargado la nueva copia reemplazando la anterior.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Google Drive / Local Download Export
  const handleExportGoogleDrive = () => {
    setIsProcessing(true);
    const pkg = generateBackupPackage(subscriptions, notificationSettings);
    // Saves new snapshot and automatically deletes the previous one
    saveLocalSnapshot(subscriptions, 'Copia para Google Drive');
    setSnapshots(getLocalSnapshots());

    downloadBackupFile(pkg, 'json');
    setIsProcessing(false);
    onShowBanner(
      'Copia actualizada',
      'El archivo SubTrack_Backup.json se ha descargado. Se reemplazó la copia anterior.'
    );
  };

  // File Upload Handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const result = validateAndParseBackup(content);
      setSelectedFileContent(result);
    };
    reader.readAsText(file);
  };

  // Parse pasted manual code
  const handleParseManualCode = () => {
    if (!manualCodeInput.trim()) return;
    const result = parseQuickSyncString(manualCodeInput);
    setSelectedFileContent(result);
    if (!result.valid) {
      onShowBanner('Código no válido', result.error || 'Verifica el texto copiado.');
    }
  };

  // Execute restore
  const handleConfirmRestore = () => {
    if (!selectedFileContent?.valid || !selectedFileContent.pkg) return;

    // Save automatic backup before replacing
    if (subscriptions.length > 0) {
      saveLocalSnapshot(subscriptions, 'Snapshot antes de restaurar');
    }

    onRestoreSubscriptions(selectedFileContent.pkg.subscriptions, importMode);
    onShowBanner(
      'Restauración completada',
      `Se han cargado ${selectedFileContent.pkg.subscriptionsCount} suscripciones con éxito.`
    );
    setSelectedFileContent(null);
    setManualCodeInput('');
    setActiveTab('export');
  };

  // Restore snapshot from local history
  const handleRestoreSnapshot = (snap: LocalSnapshot) => {
    saveLocalSnapshot(subscriptions, 'Snapshot antes de revertir');
    onRestoreSubscriptions(snap.subscriptions, 'replace');
    onShowBanner('Punto restaurado', `Se han restaurado ${snap.subscriptionsCount} suscripciones.`);
    setSnapshots(getLocalSnapshots());
  };

  return (
    <div id="backup-sync-screen" className="flex-1 flex flex-col bg-slate-50 dark:bg-black text-zinc-900 dark:text-white min-h-full pb-24 sm:pb-22">
      
      {/* Header */}
      <div className="px-3.5 sm:px-5 pt-3.5 sm:pt-5 pb-2.5 sm:pb-3 space-y-3 sm:space-y-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
            <Cloud size={18} className="text-emerald-500" />
            <span>Copia Nube & Sincronización</span>
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Guarda tus suscripciones en iCloud o Google Drive para restaurarlas en cualquier teléfono.
          </p>
        </div>

        {/* Tab Navigation */}
        <div role="tablist" aria-label="Opciones de copia de seguridad" className="flex p-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl sm:rounded-2xl">
          <button
            id="tab-btn-export"
            role="tab"
            aria-selected={activeTab === 'export'}
            onClick={() => setActiveTab('export')}
            className={`flex-1 min-h-[44px] py-2 text-[11px] sm:text-xs font-bold rounded-lg sm:rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
              activeTab === 'export'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Download size={14} className={activeTab === 'export' ? 'text-emerald-500' : ''} />
            <span>Guardar Copia</span>
          </button>
          
          <button
            id="tab-btn-import"
            role="tab"
            aria-selected={activeTab === 'import'}
            onClick={() => setActiveTab('import')}
            className={`flex-1 min-h-[44px] py-2 text-[11px] sm:text-xs font-bold rounded-lg sm:rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
              activeTab === 'import'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Upload size={14} className={activeTab === 'import' ? 'text-indigo-500' : ''} />
            <span>Restaurar</span>
          </button>
        </div>
      </div>

      <div className="px-3.5 sm:px-5 space-y-3.5 sm:space-y-4 flex-1">
        
        {/* TAB 1: EXPORT / GUARDAR COPIA */}
        {activeTab === 'export' && (
          <div className="space-y-4">
            
            {/* Status Summary Banner */}
            <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">Estado de tus datos</h3>
                  <p className="text-[10px] text-zinc-400">
                    {subscriptions.length} suscripciones listas para exportar
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-400">
                Formato Universal JSON
              </span>
            </div>

            {/* Option 1: iCloud & Apple Devices */}
            <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700 transition-all space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                    <Cloud size={16} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">Guardar en iCloud Drive / iPhone</h3>
                    <span className="text-[11px] text-zinc-400">Para iPhone, iPad y Mac</span>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-[11px] font-bold border border-indigo-500/20">
                  Recomendado iOS
                </span>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed">
                Genera tu copia de seguridad y guárdala directamente en la carpeta <strong>iCloud Drive</strong> o la app <strong>Archivos</strong> de tu iPhone. Podrás recuperarla al instante cuando abras SubTrack en otro teléfono.
              </p>

              <button
                id="btn-export-icloud"
                onClick={handleExportICloud}
                disabled={subscriptions.length === 0 || isProcessing}
                className="w-full min-h-[44px] py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-600/20 cursor-pointer"
              >
                <Share2 size={15} />
                <span>Exportar a iCloud Drive / Archivos</span>
              </button>
            </div>

            {/* Option 2: Google Drive & Android */}
            <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700 transition-all space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <HardDrive size={16} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">Guardar en Google Drive / Android</h3>
                    <span className="text-[11px] text-zinc-400">Para Android, Google Drive y PC</span>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[11px] font-bold border border-emerald-500/20">
                  Google Drive
                </span>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed">
                Descarga el archivo <strong>SubTrack_Backup.json</strong> con todas tus suscripciones. Guárdalo en tu unidad de <strong>Google Drive</strong> para sincronizarlo o transferirlo a cualquier dispositivo.
              </p>

              <button
                id="btn-export-gdrive"
                onClick={handleExportGoogleDrive}
                disabled={subscriptions.length === 0 || isProcessing}
                className="w-full min-h-[44px] py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-emerald-400 border border-zinc-800 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <Download size={15} />
                <span>Descargar copia para Google Drive (.json)</span>
              </button>
            </div>

            {/* Step-by-step instructions */}
            <div className="p-4 rounded-2xl bg-black border border-zinc-850 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
                ¿Cómo usar la copia en tu otro teléfono?
              </span>
              <div className="space-y-1.5 text-[11px] text-zinc-400">
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-zinc-800 text-white font-bold flex items-center justify-center text-[9px] shrink-0 mt-0.5">1</span>
                  <span>Guarda la copia en <strong>iCloud Drive</strong> o <strong>Google Drive</strong>.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-zinc-800 text-white font-bold flex items-center justify-center text-[9px] shrink-0 mt-0.5">2</span>
                  <span>Abre SubTrack en tu nuevo teléfono y pulsa la pestaña <strong>Restaurar</strong>.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-zinc-800 text-white font-bold flex items-center justify-center text-[9px] shrink-0 mt-0.5">3</span>
                  <span>Selecciona el archivo desde tu Drive o iCloud y ¡listo!</span>
                </div>
              </div>
            </div>

            {/* Google Play Store Packaging & Privacy Center */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-emerald-950/20 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold border border-emerald-500/30">
                    <PlayCircle size={17} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">Google Play Store & Android</h3>
                    <p className="text-[10px] text-zinc-400">Guía de empaquetado TWA / .AAB y Privacidad</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[9px] font-bold border border-emerald-500/20">
                  Listo
                </span>
              </div>

              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Esta app cumple con los estándares de Google Play Console (Data Safety, PWA offline-first, AssetLinks y privacidad sin rastreadores).
              </p>

              <div className="grid grid-cols-2 gap-2 pt-1">
                {onOpenGooglePlay && (
                  <button
                    onClick={onOpenGooglePlay}
                    className="py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors border border-zinc-700"
                  >
                    <PlayCircle size={13} className="text-emerald-400" />
                    <span>Guía Play Store</span>
                  </button>
                )}
                {onOpenPrivacy && (
                  <button
                    onClick={onOpenPrivacy}
                    className="py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors border border-zinc-700"
                  >
                    <ShieldCheck size={13} className="text-indigo-400" />
                    <span>Privacidad</span>
                  </button>
                )}
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: IMPORT / RESTAURAR */}
        {activeTab === 'import' && (
          <div className="space-y-4">
            
            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              accept=".json,.subtrack,application/json"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* File Drop / Selector Box */}
            {!selectedFileContent?.valid ? (
              <div className="space-y-3">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="p-6 rounded-2xl bg-zinc-900/40 border-2 border-dashed border-zinc-750 hover:border-indigo-500/60 cursor-pointer flex flex-col items-center justify-center text-center space-y-3 transition-colors group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-zinc-800 group-hover:bg-indigo-600/20 group-hover:text-indigo-400 text-zinc-400 flex items-center justify-center transition-colors">
                    <FolderArchive size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">
                      Seleccionar copia desde iCloud o Google Drive
                    </h3>
                    <p className="text-[11px] text-zinc-400 mt-1 max-w-xs">
                      Toca aquí para buscar tu archivo <span className="text-indigo-400 font-semibold">.json</span> o <span className="text-indigo-400 font-semibold">.subtrack</span> en tus archivos
                    </p>
                  </div>
                  <span className="px-3 py-1.5 rounded-xl bg-zinc-800 text-white text-xs font-semibold group-hover:bg-indigo-600 transition-colors">
                    Explorar archivos
                  </span>
                </div>

                {/* Or paste transfer code */}
                <div className="p-4 rounded-2xl bg-zinc-900/30 border border-zinc-800 space-y-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
                    O pegar código de transferencia
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Pega aquí el código (SUBTRACK://...)"
                      value={manualCodeInput}
                      onChange={(e) => setManualCodeInput(e.target.value)}
                      className="flex-1 px-3 py-2 bg-black border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                    />
                    <button
                      onClick={handleParseManualCode}
                      disabled={!manualCodeInput.trim()}
                      className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs transition-colors disabled:opacity-40"
                    >
                      Cargar
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Preview of validated backup ready to restore */
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-5 rounded-2xl bg-zinc-900/60 border border-emerald-500/30 space-y-4 shadow-xl"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 size={18} />
                    <h3 className="font-bold text-white text-sm">Copia de seguridad válida</h3>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-medium">
                    {selectedFileContent.summary?.dateFormatted}
                  </span>
                </div>

                {/* Stats in backup */}
                <div className="grid grid-cols-2 gap-2 p-3 bg-black rounded-xl border border-zinc-800">
                  <div>
                    <span className="text-[10px] text-zinc-500 block">Suscripciones</span>
                    <span className="text-base font-bold text-white">
                      {selectedFileContent.summary?.count} servicios
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 block">Gasto mensual</span>
                    <span className="text-base font-bold text-emerald-400">
                      ${selectedFileContent.summary?.totalMonthlyUSD.toFixed(2)}/mes
                    </span>
                  </div>
                </div>

                {/* Preview tags of services */}
                <div>
                  <span className="text-[10px] text-zinc-500 font-bold uppercase block mb-1.5">
                    Servicios incluidos en la copia:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedFileContent.summary?.sampleNames.map((name) => (
                      <span key={name} className="px-2 py-0.5 bg-zinc-800 border border-zinc-750 text-zinc-300 text-[10px] rounded-lg font-medium">
                        {name}
                      </span>
                    ))}
                    {(selectedFileContent.summary?.count || 0) > 4 && (
                      <span className="px-2 py-0.5 bg-zinc-800/60 text-zinc-500 text-[10px] rounded-lg">
                        +{(selectedFileContent.summary?.count || 0) - 4} más
                      </span>
                    )}
                  </div>
                </div>

                {/* Mode Selector: Replace vs Merge */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] text-zinc-400 font-bold block">
                    Modo de restauración:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setImportMode('replace')}
                      className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all ${
                        importMode === 'replace'
                          ? 'bg-indigo-600/20 border-indigo-500 text-white'
                          : 'bg-black border-zinc-800 text-zinc-400'
                      }`}
                    >
                      <span className="block font-bold text-white">Reemplazar todo</span>
                      <span className="text-[9px] text-zinc-500 block mt-0.5">Sustituye el catálogo actual</span>
                    </button>

                    <button
                      onClick={() => setImportMode('merge')}
                      className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all ${
                        importMode === 'merge'
                          ? 'bg-indigo-600/20 border-indigo-500 text-white'
                          : 'bg-black border-zinc-800 text-zinc-400'
                      }`}
                    >
                      <span className="block font-bold text-white">Combinar</span>
                      <span className="text-[9px] text-zinc-500 block mt-0.5">Mantiene las actuales y añade</span>
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setSelectedFileContent(null)}
                    className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    id="btn-confirm-restore"
                    onClick={handleConfirmRestore}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition-all active:scale-[0.99] shadow-lg shadow-emerald-500/20"
                  >
                    Restaurar ahora
                  </button>
                </div>
              </motion.div>
            )}

            {/* Single Stored Backup Available for One-Tap Recovery */}
            {snapshots.length > 0 && (
              <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                    <History size={13} className="text-indigo-400" />
                    <span>Última copia de seguridad disponible</span>
                  </h3>
                  <span className="text-[10px] text-blue-400 font-semibold bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                    Copia única
                  </span>
                </div>

                <div className="p-3 bg-black border border-zinc-800/90 rounded-xl space-y-2.5">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-bold text-white block text-xs">{snapshots[0].reason}</span>
                      <span className="text-[11px] text-zinc-400 block mt-0.5">
                        {new Date(snapshots[0].timestamp).toLocaleDateString()} a las {new Date(snapshots[0].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-medium">
                        {snapshots[0].subscriptionsCount} suscripciones incluidas
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={handleDeleteSnapshot}
                        className="p-2 rounded-lg bg-zinc-900 hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
                        title="Eliminar esta copia de seguridad"
                        aria-label="Eliminar copia de seguridad"
                      >
                        <Trash2 size={13} />
                      </button>
                      <button
                        onClick={() => handleRestoreSnapshot(snapshots[0])}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-xs font-bold transition-all cursor-pointer active:scale-95"
                      >
                        Restaurar
                      </button>
                    </div>
                  </div>

                  <p className="text-[10px] text-zinc-500 pt-1.5 border-t border-zinc-900">
                    ℹ️ Esta es la única copia almacenada. Cada vez que generes una nueva copia de seguridad, la anterior se elimina y se reemplaza por la más reciente.
                  </p>
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
};
