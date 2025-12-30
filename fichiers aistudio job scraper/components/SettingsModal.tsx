import React, { useState, useRef, useEffect } from 'react';
import { Settings, AIProvider } from '../types';
import { CloseIcon } from './icons/CloseIcon';
import { UploadIcon } from './icons/UploadIcon';
// Utilisation de la fonction d'extraction vers ton backend
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

  // États synchronisés avec ton interface originale
  const [activeSources, setActiveSources] = useState<string[]>(settings.sources);
  const [chromeProfilePath, setChromeProfilePath] = useState<string>(settings.chromeProfilePath || '');
  const [backendUrl, setBackendUrl] = useState<string>(settings.backendUrl || '');
  const [criteria, setCriteria] = useState<string>(settings.criteria || '');
  
  // États pour l'analyse de CV
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fonction de test de connexion au backend
  const testConnection = async () => {
    if (!backendUrl) return;
    setConnectionStatus('testing');
    try {
      const response = await fetch(`${backendUrl}/health-check`);
      if (response.ok) setConnectionStatus('success');
      else setConnectionStatus('error');
    } catch (e) {
      setConnectionStatus('error');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!backendUrl) {
      alert("Veuillez d'abord configurer l'URL du Backend dans l'onglet Général.");
      setActiveTab('general');
      return;
    }

    setIsAnalyzing(true);
    try {
      // Appel au service qui communique avec ton app.py sur HF
      const extractedCriteria = await aiExtractCriteriaFromCV(file, backendUrl);
      setCriteria(extractedCriteria);
    } catch (error: any) {
      console.error("Erreur d'analyse:", error);
      alert("Erreur Gemini 2.5: " + (error.message || "Vérifiez votre backend"));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = () => {
    onSave({
      ...settings,
      sources: activeSources,
      chromeProfilePath,
      backendUrl,
      criteria,
      aiModel: 'gemini-2.5-flash' // On force le modèle de ta Knowledge Base
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header original */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex justify-between items-center bg-white flex-shrink-0">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">Paramètres</h2>
            <p className="text-slate-500 text-sm mt-1">Configurez votre scraper et l'IA Gemini 2.5</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
            <CloseIcon />
          </button>
        </div>

        {/* Tabs originales */}
        <div className="flex border-b border-slate-100 bg-slate-50/50 flex-shrink-0">
          <button
            onClick={() => setActiveTab('general')}
            className={`flex-1 py-3.5 text-sm font-semibold transition-all border-b-2 ${
              activeTab === 'general' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Général & Connexion
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`flex-1 py-3.5 text-sm font-semibold transition-all border-b-2 ${
              activeTab === 'ai' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            CV & Intelligence Artificielle
          </button>
        </div>

        {/* Contenu */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8">
          {activeTab === 'general' && (
            <div className="space-y-8 animate-in slide-in-from-left-4 duration-300">
              <section className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Connexion Backend (Hugging Face)</h3>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={backendUrl}
                    onChange={(e) => setBackendUrl(e.target.value)}
                    placeholder="https://votre-space.hf.space"
                    className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <button 
                    onClick={testConnection}
                    className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700 transition shadow-sm"
                  >
                    Tester
                  </button>
                </div>
                {connectionStatus !== 'idle' && (
                  <div className={`text-xs font-medium flex items-center gap-1 ${connectionStatus === 'success' ? 'text-green-600' : connectionStatus === 'error' ? 'text-red-600' : 'text-slate-500'}`}>
                    {connectionStatus === 'testing' && <SpinnerIcon className="animate-spin w-3 h-3" />}
                    {connectionStatus === 'success' && <><CheckCircleIcon className="w-3 h-3" /> Connecté au backend</>}
                    {connectionStatus === 'error' && <><ExclamationCircleIcon className="w-3 h-3" /> Impossible de joindre le backend</>}
                  </div>
                )}
              </section>

              <section className="space-y-4 pt-4 border-t border-slate-50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-6 bg-slate-400 rounded-full"></div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Scraping Local</h3>
                </div>
                <label className="block text-sm text-slate-600 font-medium">Chemin du Profil Chrome</label>
                <input
                  type="text"
                  value={chromeProfilePath}
                  onChange={(e) => setChromeProfilePath(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                  placeholder="/Users/nom/Library/Application Support/Google/Chrome/Default"
                />
              </section>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Analyse de CV (Gemini 2.5 Flash)</h3>
                        </div>
                    </div>
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-200 bg-slate-50/50 rounded-xl p-10 text-center hover:border-indigo-400 hover:bg-indigo-50/30 transition-all cursor-pointer group"
                    >
                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".pdf" className="hidden" />
                        <div className="flex flex-col items-center">
                            {isAnalyzing ? (
                                <SpinnerIcon className="w-10 h-10 text-indigo-600 animate-spin mb-3" />
                            ) : (
                                <UploadIcon className="w-10 h-10 text-slate-400 group-hover:text-indigo-500 mb-3 transition-colors" />
                            )}
                            <p className="text-slate-700 font-semibold">{isAnalyzing ? "Analyse intelligente en cours..." : "Cliquez pour importer votre CV (PDF)"}</p>
                            <p className="text-slate-400 text-xs mt-1">Gemini 2.5 extraira vos critères automatiquement</p>
                        </div>
                    </div>
                </section>

                <section className="space-y-4">
                    <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider">Critères de recherche extraits</label>
                    <textarea
                        value={criteria}
                        onChange={(e) => setCriteria(e.target.value)}
                        rows={8}
                        placeholder="Importez un CV pour remplir ce champ..."
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none leading-relaxed shadow-inner"
                    />
                </section>
            </div>
          )}
        </div>
        
        {/* Footer original */}
        <div className="p-4 sm:p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50 flex-shrink-0">
            {onClearData && (
                 <button 
                    onClick={onClearData}
                    className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition mr-auto"
                >
                    Réinitialiser
                </button>
            )}
            <button onClick={onClose} className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition">
                Annuler
            </button>
            <button 
                onClick={handleSave}
                className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 shadow-lg transition-all active:scale-95"
            >
                Enregistrer
            </button>
        </div>
      </div>
    </div>
  );
};
