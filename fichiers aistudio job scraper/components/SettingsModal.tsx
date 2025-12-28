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
  const [aiProvider, setAiProvider] = useState<AIProvider>(settings.aiProvider || 'gemini');
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
      aiProvider: aiProvider,
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
        const response = await fetch(`${urlToCheck}/health-check`, {
            method: 'GET',
            headers: { 
                'ngrok-skip-browser-warning': 'true',
            },
        });
        
        const json = await response.json();

        if (json.status === 'online' || json.status === 'ok') {
            setConnectionStatus('success');
        } else {
            throw new Error(json.message || "Réponse invalide du serveur");
        }

    } catch (err: any) {
        console.error("Test connection failed:", err);
        setConnectionStatus('error');
        setConnectionError("Impossible de joindre le backend. Vérifiez l'URL et que le Space Hugging Face est 'Running'.");
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // GESTION UPLOAD CV - VERSION CORRIGÉE (un seul try-catch, logs debug)
  // ═══════════════════════════════════════════════════════════════════════════
  const handleCvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ─────────────────────────────────────────────────────────────────────────
    // VALIDATION TAILLE FICHIER (5Mo max)
    // ─────────────────────────────────────────────────────────────────────────
    if (file.size > 5 * 1024 * 1024) {
        setUploadError("Le fichier est trop volumineux (Max 5Mo).");
        return;
    }

    setIsUploadingCv(true);
    setUploadError(null);

    console.log("[SettingsModal] 📄 Début upload CV:", {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });

    try {
        // ─────────────────────────────────────────────────────────────────────
        // LECTURE FICHIER EN BASE64
        // ─────────────────────────────────────────────────────────────────────
        const reader = new FileReader();
        
        reader.onload = async () => {
            try {
                const base64String = reader.result as string;
                const base64Data = base64String.split(',')[1]; // Retire le préfixe "data:application/pdf;base64,"
                
                console.log("[SettingsModal] ✅ Fichier lu en base64:", {
                  base64Length: base64Data.length
                });

                // ─────────────────────────────────────────────────────────────
                // NETTOYAGE URL BACKEND
                // ─────────────────────────────────────────────────────────────
                const cleanBackendUrl = backendUrl.trim().replace(/\/$/, "");
                
                console.log("[SettingsModal] 🌐 URL backend:", cleanBackendUrl);

                // ─────────────────────────────────────────────────────────────
                // APPEL SERVICE IA (backend Python sur Hugging Face)
                // ─────────────────────────────────────────────────────────────
                const extractedCriteria = await aiExtractCriteriaFromCV(
                    base64Data, 
                    file.type, 
                    'gemini', // Provider (ignoré côté backend, toujours Gemini pour CV)
                    cleanBackendUrl
                );
                
                console.log("[SettingsModal] 🎉 Analyse réussie:", {
                  criteriaLength: extractedCriteria.length
                });

                // ─────────────────────────────────────────────────────────────
                // MISE À JOUR ÉTAT (critères + fichier sauvegardé)
                // ─────────────────────────────────────────────────────────────
                setCriteria(extractedCriteria);
                setCvFile({
                    name: file.name,
                    type: file.type,
                    data: base64String, // On garde le full base64 avec préfixe pour affichage
                    extractedCriteria: extractedCriteria
                });

            } catch (err: any) {
                console.error("[SettingsModal] ❌ Erreur analyse CV:", err);
                setUploadError(err.message || "Erreur lors de l'analyse via le backend.");
            } finally {
                setIsUploadingCv(false);
                // Réinitialise l'input pour permettre de re-uploader le même fichier
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };
        
        // ─────────────────────────────────────────────────────────────────────
        // GESTION ERREUR LECTURE FICHIER
        // ─────────────────────────────────────────────────────────────────────
        reader.onerror = () => {
            console.error("[SettingsModal] ❌ Erreur lecture fichier");
            setUploadError("Impossible de lire le fichier. Vérifiez qu'il n'est pas corrompu.");
            setIsUploadingCv(false);
        };

        // Démarre la lecture
        reader.readAsDataURL(file);
        
    } catch (error: any) {
        console.error("[SettingsModal] 💥 Erreur critique:", error);
        setIsUploadingCv(false);
        setUploadError("Erreur inattendue lors de la lecture du fichier.");
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
          setCriteria(''); // Optionnel : vide aussi les critères
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
            <div className="space-y-6">
              
              {/* Backend URL Section */}
              <section className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                <h3 className="text-sm font-bold text-indigo-700 mb-2 uppercase tracking-wide">URL du Backend</h3>
                <label className="block text-xs text-indigo-600 mb-2">
                  Votre Space Hugging Face (ex: https://votreuser-aijobscraper.hf.space)
                </label>
                <div className="flex gap-2">
                  <input
                    ref={backendUrlInputRef}
                    type="text"
                    value={backendUrl}
                    onChange={(e) => setBackendUrl(e.target.value)}
                    placeholder="https://patman4524-aijobscraper.hf.space"
                    className="flex-grow p-2.5 bg-white border border-indigo-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={handleTestConnection}
                    disabled={connectionStatus === 'testing'}
                    className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-50 flex items-center whitespace-nowrap"
                  >
                    {connectionStatus === 'testing' ? (
                      <>
                        <SpinnerIcon className="w-4 h-4 mr-2 animate-spin" />
                        Test...
                      </>
                    ) : connectionStatus === 'success' ? (
                      <>
                        <CheckCircleIcon className="w-4 h-4 mr-2" />
                        Connecté
                      </>
                    ) : connectionStatus === 'error' ? (
                      <>
                        <ExclamationCircleIcon className="w-4 h-4 mr-2" />
                        Erreur
                      </>
                    ) : (
                      'Tester'
                    )}
                  </button>
                </div>
                {connectionError && (
                  <p className="text-xs text-red-600 mt-2">{connectionError}</p>
                )}
                {connectionStatus === 'success' && (
                  <p className="text-xs text-green-600 mt-2 font-medium">✓ Backend en ligne et fonctionnel</p>
                )}
              </section>

              {/* Sources Section */}
              <section>
                <h3 className="text-sm font-bold text-indigo-600 mb-4 uppercase tracking-wide">Sources de Scraping</h3>
                <div className="grid grid-cols-2 gap-3">
                  {['indeed', 'linkedin', 'hellowork', 'jobijoba', 'googlejobs', 'francetravail'].map(source => (
                    <label key={source} className="flex items-center p-3 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition cursor-pointer">
                      <input
                        type="checkbox"
                        checked={activeSources.includes(source)}
                        onChange={(e) => toggleSource(source, e.target.checked)}
                        className="mr-3 w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                      />
                      <span className="text-sm font-medium text-slate-700 capitalize">{source}</span>
                    </label>
                  ))}
                </div>
              </section>

              {/* Custom URLs Section */}
              <section>
                <h3 className="text-sm font-bold text-indigo-600 mb-4 uppercase tracking-wide">URLs Personnalisées</h3>
                <div className="flex gap-2 mb-3">
                  <input
                    type="url"
                    value={customUrlInput}
                    onChange={(e) => setCustomUrlInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddCustomUrl()}
                    placeholder="https://example.com/jobs"
                    className="flex-grow p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={handleAddCustomUrl}
                    className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition whitespace-nowrap"
                  >
                    Ajouter
                  </button>
                </div>
                {allUserCustomUrls.length > 0 && (
                  <div className="space-y-2">
                    {allUserCustomUrls.map((url, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg">
                        <span className="text-sm text-slate-600 truncate mr-2">{url}</span>
                        <button
                          onClick={() => handleRemoveCustomUrl(url)}
                          className="text-red-500 hover:text-red-700 transition flex-shrink-0"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Data Management */}
              {onClearData && (
                <section className="border-t border-slate-100 pt-6">
                  <h3 className="text-sm font-bold text-red-600 mb-3 uppercase tracking-wide">Gestion des Données</h3>
                  <button
                    onClick={onClearData}
                    className="w-full py-3 bg-red-50 text-red-600 border border-red-200 rounded-lg font-semibold hover:bg-red-100 transition text-sm"
                  >
                    🗑️ Supprimer toutes les offres sauvegardées
                  </button>
                </section>
              )}
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="space-y-6">
          
              {/* Configuration du Modèle IA */}
              <section className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                <h3 className="text-sm font-bold text-indigo-700 mb-2 uppercase tracking-wide">Moteur d'Intelligence Artificielle</h3>
                <label className="block text-xs text-indigo-600 mb-2">
                  Le scoring des offres utilise Groq (Llama 3.3) via votre backend.
                </label>
                <select
                  value={aiProvider}
                  onChange={(e) => setAiProvider(e.target.value as AIProvider)}
                  className="w-full p-2.5 bg-white border border-indigo-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 text-slate-700 font-medium"
                >
                  <option value="gemini">Gemini 1.5 Flash (Standard)</option>
                  <option value="ollama">Groq (Llama 3.3 70B) - Ultra Rapide ⚡</option>
                </select>
              </section>

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
                      {isUploadingCv ? (
                        <div className="flex items-center">
                          <SpinnerIcon className="w-4 h-4 mr-2 animate-spin"/> 
                          <span>Analyse en cours...</span>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <UploadIcon className="w-4 h-4 mr-2"/>
                          <span>Importer CV (PDF/Image)</span>
                        </div>
                      )}
                    </button>
                    <p className="text-xs text-slate-400 mt-2">Max 5Mo. Analyse via Backend Hugging Face.</p>
                    {uploadError && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-xs text-red-600 font-medium">{uploadError}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
                    <div className="flex items-center overflow-hidden">
                      <div className="w-10 h-10 bg-red-100 text-red-600 rounded-lg flex items-center justify-center flex-shrink-0 mr-3">
                        <span className="font-bold text-xs">PDF</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{cvFile.name}</p>
                        <p className="text-xs text-slate-500">Prêt pour l'analyse</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={handleViewCv} 
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition text-sm font-medium"
                      >
                        Voir
                      </button>
                      <button 
                        onClick={handleDeleteCv} 
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </section>

              {/* Critères d'analyse Section */}
              <section className="border-t border-slate-100 pt-6">
                <h3 className="text-sm font-bold text-indigo-600 mb-2 uppercase tracking-wide">Critères d'analyse IA</h3>
                <p className="text-sm text-slate-500 mb-3">Texte extrait de votre CV (modifiable) :</p>
                <textarea
                  value={criteria}
                  onChange={(e) => setCriteria(e.target.value)}
                  rows={8}
                  placeholder="Le texte de votre CV apparaîtra ici après l'importation..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 font-mono"
                />
                <p className="text-xs text-slate-400 mt-2">
                  💡 Astuce : Modifiez ce texte pour affiner les critères de scoring des offres.
                </p>
              </section>
            </div>
          )}
        </div>

        {/* Footer avec boutons */}
        <div className="p-4 sm:p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition font-medium text-sm"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold text-sm shadow-sm"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
};
