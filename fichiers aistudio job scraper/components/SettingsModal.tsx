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

  // --- États strictement identiques à ton fichier source ---
  const [activeSources, setActiveSources] = useState<string[]>(settings.sources);
  const [allUserCustomUrls, setAllUserCustomUrls] = useState<string[]>(settings.allCustomUrls || []);
  const [chromeProfilePath, setChromeProfilePath] = useState<string>(settings.chromeProfilePath || '');
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [backendUrl, setBackendUrl] = useState<string>(settings.backendUrl || '');
  const [criteria, setCriteria] = useState<string>(settings.criteria || '');
  
  // --- États de gestion IA ---
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setIsAnalyzing(true);
    try {
      const extractedCriteria = await aiExtractCriteriaFromCV(file, backendUrl);
      setCriteria(extractedCriteria);
    } catch (error: any) {
      alert("Erreur Gemini 2.5: " + error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = () => {
    onSave({
      ...settings,
      sources: activeSources,
      allCustomUrls: allUserCustomUrls,
      chromeProfilePath,
      backendUrl,
      criteria,
      aiModel: 'gemini-2.5-flash'
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header Style AI Studio */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex justify-between items-center bg-white flex-shrink-0">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">Paramètres</h2>
            <p className="text-slate-500 text-sm mt-1">Gérez vos préférences et la connexion IA</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
            <CloseIcon />
          </button>
        </div>

        {/* Tabs Style AI Studio */}
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

        <div className="flex-1 overflow-y-auto p-4 sm:p-8">
          {activeTab === 'general' && (
            <div className="space-y-8 animate-in slide-in-from-left-4">
              {/* Backend URL Section */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Configuration Serveur</h3>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={backendUrl}
                    onChange={(e) => setBackendUrl(e.target.value)}
                    placeholder="https://votre-space.hf.space"
                    className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
                  />
                  <button onClick={testConnection} className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700 transition">
                    Tester
                  </button>
                </div>
                {connectionStatus !== 'idle' && (
                  <div className={`text-xs font-medium flex items-center gap-1 ${connectionStatus === 'success' ? 'text-green-600' : connectionStatus === 'error' ? 'text-red-600' : 'text-slate-500'}`}>
                    {connectionStatus === 'testing' && <SpinnerIcon className="animate-spin w-3 h-3" />}
                    {connectionStatus === 'success' && <CheckCircleIcon className="w-3 h-3" />}
                    {connectionStatus === 'error' && <ExclamationCircleIcon className="w-3 h-3" />}
                    {connectionStatus === 'success' ? 'Connexion établie' : connectionStatus === 'error' ? 'Serveur injoignable' : 'Vérification...'}
                  </div>
                )}
              </section>

              {/* Chrome Path Section */}
              <section className="space-y-4 pt-4 border-t border-slate-50">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-slate-300 rounded-full"></div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Navigation Locale</h3>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase">Profil Chrome (optionnel)</label>
                    <input
                        type="text"
                        value={chromeProfilePath}
                        onChange={(e) => setChromeProfilePath(e.target.value)}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                        placeholder="Ex: /Users/nom/Library/Application Support/Google/Chrome/Default"
                    />
                </div>
              </section>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="space-y-8 animate-in slide-in-from-right-4">
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Analyseur de CV Intelligent</h3>
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
                    <p className="text-slate-700 font-semibold">{isAnalyzing ? "Gemini 2.5 analyse votre profil..." : "Importer votre CV (PDF)"}</p>
                    <p className="text-slate-400 text-xs mt-1">Les critères seront extraits automatiquement</p>
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider
