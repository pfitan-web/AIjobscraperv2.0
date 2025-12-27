
import React, { useState, useRef, useEffect } from 'react';
import { Settings, AIProvider } from '../types';
import { CloseIcon } from './icons/CloseIcon';
import { UploadIcon } from './icons/UploadIcon';
import { extractCriteriaFromCV as aiExtractCriteriaFromCV } from '../services/aiService';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { ExclamationCircleIcon } from './icons/ExclamationCircleIcon';
import { TrashIcon } from './icons/TrashIcon';

interface SettingsModalProps {
  settings: Settings;
  onSave: (newSettings: Settings) => void;
  onClose: () => void;
  onClearData?: () => void;
}

type ConnectionStatus = 'idle' | 'testing' | 'success' | 'error';

export const SettingsModal: React.FC<SettingsModalProps> = ({ settings, onSave, onClose, onClearData }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'ai'>('general');

  // General Settings
  const [activeSources, setActiveSources] = useState<string[]>(settings.sources);
  const [allUserCustomUrls, setAllUserCustomUrls] = useState<string[]>(settings.allCustomUrls);
  const [chromeProfilePath, setChromeProfilePath] = useState<string>(settings.chromeProfilePath || '');
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [backendUrl, setBackendUrl] = useState<string>(settings.backendUrl || '');
  
  // Backend Connection Test State
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('idle');
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // AI & CV Settings
  const [criteria, setCriteria] = useState<string>(settings.criteria);
  const [cvFile, setCvFile] = useState(settings.cvFile);
  
  // CV Upload State
  const [isUploadingCv, setIsUploadingCv] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backendUrlInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleOpenSettings = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && customEvent.detail.tab) {
        setActiveTab(customEvent.detail.tab);
        if (customEvent.detail.focusField === 'backend-url' && backendUrlInputRef.current) {
          setTimeout(() => backendUrlInputRef.current?.focus(), 100);
        }
      }
    };

    window.addEventListener('open-settings-modal', handleOpenSettings);
    return () => {
      window.removeEventListener('open-settings-modal', handleOpenSettings);
    };
  }, []);

  const handleSave = () => {
    // Nettoyer l'URL (retirer slash final)
    const cleanUrl = backendUrl.trim().replace(/\/$/, "");
    onSave({ 
      ...settings, 
      sources: activeSources,
      allCustomUrls: allUserCustomUrls,
      schedule: settings.schedule,
      criteria: criteria,
      cvFile: cvFile,
      chromeProfilePath: chromeProfilePath,
      aiProvider: 'gemini',
      backendUrl: cleanUrl,
    });
    onClose();
  };

  const handleAddCustomUrl = () => {
    if (customUrlInput.trim() === '') return;
    const newUrl = customUrlInput.trim();
    if (!allUserCustomUrls.includes(newUrl)) {
      setAllUserCustomUrls(prev => [...prev, newUrl]);
      setActiveSources(prev => [...prev, newUrl]);
    }
    setCustomUrlInput('');
  };

  const handleRemoveCustomUrl = (urlToRemove: string) => {
      setAllUserCustomUrls(prev => prev.filter(u => u !== urlToRemove));
      setActiveSources(prev => prev.filter(s => s !== urlToRemove));
  };

  const toggleSource = (source: string, checked: boolean) => {
    setActiveSources(prev => checked ? [...prev, source] : prev.filter(s => s !== source));
  };
  
  const handleTestConnection = async () => {
    setConnectionStatus('testing');
    setConnectionError(null);
    let urlToCheck = backendUrl.trim().replace(/\/$/, "");
    
    // Auto-fix protocol if missing
    if (!urlToCheck.startsWith('http')) {
        urlToCheck = 'http://' + urlToCheck;
    }

    try {
        // On utilise un timestamp pour éviter le cache
        const response = await fetch(`${urlToCheck}/?t=${Date.now()}`, {
            method: 'GET',
            headers: { 
                'ngrok-skip-browser-warning': 'true',
            },
        });
        
        const text = await response.text();

        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status} ${response.statusText}`);
        }
        
        // 1. Essayer de parser en JSON (format attendu)
        try {
            const json = JSON.parse(text);
            // Validation assouplie : on accepte 'status: ok', 'success: true', ou tout message contenant 'backend'
            if (
                json.status === 'ok' || 
                json.success === true || 
                (json.message && json.message.toLowerCase().includes('backend'))
            ) {
                setConnectionStatus('success');
                return;
            }
        } catch (e) {
            // Ignorer l'erreur de parsing JSON
        }

        // 2. Vérification Texte brute (fallback)
        if (text.toLowerCase().includes('backend')) {
            setConnectionStatus('success');
            return;
        }

        // 3. Détection de la page d'interstice Ngrok
        if (text.toLowerCase().includes('ngrok') && text.toLowerCase().includes('html')) {
            throw new Error('Ngrok bloque la requête (Page HTML reçue). Le header "ngrok-skip-browser-warning" semble ignoré.');
        }

        // 4. Si rien ne correspond
        const snippet = text.length > 60 ? text.substring(0, 60) + '...' : text;
        throw new Error(`Réponse inattendue: "${snippet}"`);

    } catch (err: any) {
        console.error("Test connection failed:", err);
        let errorMsg = err.message || "Erreur inconnue.";
        
        // Diagnostic amélioré
        if (errorMsg === 'Failed to fetch' || errorMsg.includes('NetworkError')) {
             if (window.location.protocol === 'https:' && urlToCheck.startsWith('http:')) {
                 errorMsg += " (Blocage Mixte: Le site est en HTTPS mais le backend est en HTTP. Utilisez l'URL Ngrok en HTTPS).";
             } else {
                 errorMsg += " (Vérifiez l'URL, que le serveur tourne, et que CORS est autorisé).";
             }
        }

        setConnectionStatus('error');
        setConnectionError(errorMsg);
    }
  };


  const handleCvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
        setUploadError("Le fichier est trop volumineux (Max 5Mo).");
        return;
    }

    setIsUploadingCv(true);
    setUploadError(null);

    try {
        const reader = new FileReader();
        reader.readAsDataURL(file); 
        reader.onload = async () => {
            const base64String = reader.result as string;
            const base64Data = base64String.split(',')[1];
            
            try {
                // Analyse IA
                const extractedCriteria = await aiExtractCriteriaFromCV(base64Data, file.type, 'gemini', backendUrl);
                setCriteria(prev => `${extractedCriteria}\n\n--- Critères Précédents ---\n${prev}`);
                
                // Sauvegarde du fichier
                setCvFile({
                    name: file.name,
                    type: file.type,
                    data: base64String, // On garde tout le DataURL pour l'affichage
                    extractedCriteria: extractedCriteria
                });

            } catch (err: any) {
                if (err.message && err.message.includes('QUOTA_EXCEEDED')) {
                    setUploadError("Quota IA dépassé.");
                } else {
                    setUploadError(err.message || "Une erreur est survenue.");
                }
            } finally {
                setIsUploadingCv(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };
    } catch (error) {
        setIsUploadingCv(false);
        setUploadError("Erreur inattendue.");
    }
  };

  const handleViewCv = () => {
      if (cvFile) {
          const win = window.open();
          if (win) {
              win.document.write(`<iframe src="${cvFile.data}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
          }
      }
  };

  const handleDeleteCv = () => {
      if (window.confirm("Supprimer le CV enregistré ?")) {
          setCvFile(undefined);
      }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-3xl h-[95vh] sm:h-auto sm:max-h-[90vh] flex flex-col overflow-hidden animate-fadeIn safe-pb">
        
        <div className="p-4 sm:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 flex-shrink-0">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Paramètres</h2>
          <button onClick={onClose} className="p-2 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition">
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>
        
        <div className="flex border-b border-slate-100 px-4 sm:px-6 bg-white flex-shrink-0 overflow-x-auto">
          <button 
            className={`py-3 px-4 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === 'general' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            onClick={() => setActiveTab('general')}
          >
            Général & Connexion
          </button>
          <button 
            className={`py-3 px-4 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === 'ai' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            onClick={() => setActiveTab('ai')}
          >
            CV & Intelligence Artificielle
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-grow space-y-6 sm:space-y-8 bg-white">
          
          {activeTab === 'general' && (
            <>
                {/* Configuration Backend */}
                <section>
                    <h3 className="text-sm font-bold text-indigo-600 mb-4 uppercase tracking-wide flex items-center">
                        <span className="w-2 h-2 bg-indigo-600 rounded-full mr-2"></span>
                        Connexion Backend
                    </h3>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <label htmlFor="backend-url" className="block text-sm font-medium text-slate-700 mb-1">URL du Backend</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                id="backend-url"
                                ref={backendUrlInputRef}
                                value={backendUrl}
                                onChange={(e) => {
                                    setBackendUrl(e.target.value);
                                    setConnectionStatus('idle'); 
                                }}
                                placeholder="ex: http://localhost:3001 ou votre URL Ngrok"
                                className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm text-slate-600"
                            />
                            <button 
                                onClick={handleTestConnection}
                                disabled={connectionStatus === 'testing'}
                                className="px-4 py-2.5 bg-slate-600 text-white text-sm font-semibold rounded-lg hover:bg-slate-700 transition shadow-sm disabled:opacity-50 whitespace-nowrap"
                            >
                                {connectionStatus === 'testing' ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : 'Tester'}
                            </button>
                        </div>
                         <p className="text-xs text-slate-400 mt-1.5">
                            L'adresse de votre serveur Node.js local ou distant (Ngrok). Requis pour le scraping.
                        </p>
                        {connectionStatus === 'success' && (
                            <div className="mt-2 p-2 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-md border border-emerald-200 flex items-center gap-2">
                                <CheckCircleIcon className="w-4 h-4" />
                                Connexion au backend réussie !
                            </div>
                        )}
                        {connectionStatus === 'error' && (
                             <div className="mt-2 p-2 bg-red-50 text-red-700 text-xs font-medium rounded-md border border-red-200 flex items-start gap-2">
                                <ExclamationCircleIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <span><strong>Échec :</strong> {connectionError}</span>
                            </div>
                        )}
                    </div>
                </section>

                {/* Sources */}
                <section className="border-t border-slate-100 pt-6">
                    <h3 className="text-sm font-bold text-indigo-600 mb-4 uppercase tracking-wide flex items-center">
                        <span className="w-2 h-2 bg-indigo-600 rounded-full mr-2"></span>
                        Sources de données
                    </h3>
                    
                    <div className="mb-4 flex gap-2">
                        <input
                            type="text"
                            value={customUrlInput}
                            onChange={(e) => setCustomUrlInput(e.target.value)}
                            placeholder="Ajouter une URL personnalisée (ex: https://example.com/jobs)..."
                            className="flex-grow p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                        />
                        <button
                            onClick={handleAddCustomUrl}
                            className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition shadow-sm"
                        >
                            Ajouter
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                        {allUserCustomUrls.length === 0 && (
                            <div className="p-3 text-sm text-slate-500 border border-slate-200 rounded-lg text-center">
                                Aucune URL personnalisée ajoutée.
                            </div>
                        )}
                        {allUserCustomUrls.map(source => {
                            const isChecked = activeSources.includes(source);
                            return (
                                <div key={source} className={`flex items-center justify-between p-3 rounded-lg border transition-all ${isChecked ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200'}`}>
                                    <label className="flex items-center flex-grow cursor-pointer overflow-hidden mr-2">
                                        <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={(e) => toggleSource(source, e.target.checked)}
                                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 flex-shrink-0"
                                        />
                                        <span className="ml-3 text-xs font-medium truncate" title={source}>
                                            {source}
                                        </span>
                                    </label>
                                    <button 
                                        onClick={() => handleRemoveCustomUrl(source)}
                                        title="Supprimer"
                                        className="p-1 rounded-full text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                                    >
                                        <CloseIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </section>

                <section className="border-t border-slate-100 pt-6">
                     <h3 className="text-sm font-bold text-indigo-600 mb-4 uppercase tracking-wide flex items-center">
                        <span className="w-2 h-2 bg-indigo-600 rounded-full mr-2"></span>
                        Avancé
                    </h3>

                    <label className="block text-sm font-medium text-slate-700 mb-2">Chemin du Profil Chrome</label>
                    <input
                        type="text"
                        value={chromeProfilePath}
                        onChange={(e) => setChromeProfilePath(e.target.value)}
                        placeholder="Chemin vers 'User Data' (ex: C:\Users\VotreNom\AppData\Local\Google\Chrome\User Data)..."
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm text-slate-600 shadow-sm"
                    />
                </section>
            </>
          )}

          {activeTab === 'ai' && (
            <div className="space-y-6">
                {/* CV Section */}
                <section>
                    <h3 className="text-sm font-bold text-indigo-600 mb-4 uppercase tracking-wide">Mon CV</h3>
                    
                    {!cvFile ? (
                        <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-100 transition-colors">
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept=".pdf,.png,.jpg,.jpeg"
                                onChange={handleCvUpload}
                            />
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploadingCv}
                                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition shadow-sm disabled:opacity-50"
                            >
                                {isUploadingCv ? <SpinnerIcon className="w-4 h-4 mr-2 animate-spin"/> : <UploadIcon className="w-4 h-4 mr-2"/>}
                                Importer CV (PDF/Image)
                            </button>
                            <p className="text-xs text-slate-400 mt-2">Max 5Mo. Sera analysé pour les critères et utilisé pour les lettres de motivation.</p>
                             {uploadError && <p className="text-xs text-red-500 mt-2 font-medium">{uploadError}</p>}
                        </div>
                    ) : (
                        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
                            <div className="flex items-center overflow-hidden">
                                <div className="w-10 h-10 bg-red-100 text-red-600 rounded-lg flex items-center justify-center flex-shrink-0 mr-3">
                                    <span className="font-bold text-xs">PDF</span>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-slate-800 truncate">{cvFile.name}</p>
                                    <p className="text-xs text-slate-500">Enregistré</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2 flex-shrink-0">
                                <button 
                                    onClick={handleViewCv}
                                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg text-xs font-medium transition"
                                >
                                    👁️ Voir
                                </button>
                                <button 
                                    onClick={handleDeleteCv}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                                    title="Supprimer"
                                >
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </section>

                <section className="border-t border-slate-100 pt-6">
                    <h3 className="text-sm font-bold text-indigo-600 mb-2 uppercase tracking-wide">Critères d'analyse IA</h3>
                    <p className="text-sm text-slate-500 mb-3">Généré automatiquement depuis votre CV ou modifiable manuellement.</p>
                    <textarea
                        value={criteria}
                        onChange={(e) => setCriteria(e.target.value)}
                        rows={8}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                    />
                </section>
            </div>
          )}
        </div>
        
        <div className="p-4 sm:p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50 flex-shrink-0 safe-pb">
            {onClearData && (
                 <button 
                    onClick={onClearData}
                    className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition mr-auto"
                >
                    Réinitialiser les données
                </button>
            )}
            <button 
                onClick={onClose}
                className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition"
            >
                Annuler
            </button>
            <button 
                onClick={handleSave}
                className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 shadow-lg hover:shadow-indigo-500/30 transition-all transform hover:-translate-y-0.5"
            >
                Enregistrer
            </button>
        </div>

      </div>
    </div>
  );
};
