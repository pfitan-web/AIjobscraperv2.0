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
  // Ajout de l'état pour le choix du provider (Gemini ou Groq/Ollama)
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
      aiProvider: aiProvider, // Utilise la sélection de l'utilisateur
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
        // Préparation directe du fichier pour le backend Python
        const formData = new FormData();
        formData.append('file', file); // On envoie le fichier brut, c'est plus simple

        const cleanBackendUrl = backendUrl.trim().replace(/\/$/, "");
        
        const response = await fetch(`${cleanBackendUrl}/api/analyze-cv`, {
            method: 'POST',
            body: formData,
            // Pas de headers Content-Type, le navigateur le met tout seul pour FormData
        });

        if (!response.ok) {
            throw new Error(`Erreur serveur (${response.status}). Vérifiez les logs Hugging Face.`);
        }

        const data = await response.json();
        
        if (data.status === "success") {
            setCriteria(data.analysis); // On remplit le champ texte
            setCvFile({
                name: file.name,
                type: file.type,
                data: "", // On ne stocke plus le base64 lourd ici pour tester
                extractedCriteria: data.analysis
            });
        } else {
            throw new Error(data.message || "L'analyse a échoué.");
        }

    } catch (err: any) {
        console.error("Détail de l'erreur:", err);
        setUploadError(err.message || "Erreur lors de l'envoi au backend.");
    } finally {
        setIsUploadingCv(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

    try {
        const reader = new FileReader();
        reader.readAsDataURL(file); 
        reader.onload = async () => {
            const base64String = reader.result as string;
            const base64Data = base64String.split(',')[1];
            
            try {
                // Analyse IA via Backend (Gemini recommandé pour PDF)
                // Note : On force 'gemini' ici pour l'extraction de CV car c'est le seul qui lit les PDF
                // Groq servira pour le scoring des offres.
                const extractedCriteria = await aiExtractCriteriaFromCV(base64Data, file.type, 'gemini', backendUrl);
                
                setCriteria(extractedCriteria); // Remplace ou ajoute selon votre préférence
                
                // Sauvegarde du fichier
                setCvFile({
                    name: file.name,
                    type: file.type,
                    data: base64String, 
                    extractedCriteria: extractedCriteria
                });

            } catch (err: any) {
                setUploadError(err.message || "Erreur lors de l'analyse du CV via le backend.");
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
                        Connexion Backend (Hugging Face / Local)
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
                                placeholder="ex: https://votre-space.hf.space"
                                className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm text-slate-600"
                            />
                            <button 
                                onClick={handleTestConnection}
                                disabled={connectionStatus === 'testing'}
                                className="px-4 py-2.5 bg-slate
