import React, { useState, useRef } from 'react';
import { Settings } from '../types';
import { CloseIcon } from './icons/CloseIcon';
import { UploadIcon } from './icons/UploadIcon';
import { extractCriteriaFromCV as aiExtractCriteriaFromCV } from '../services/aiService';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { ExclamationCircleIcon } from './icons/ExclamationCircleIcon';

interface SettingsModalProps {
  settings: Settings;
  onSave: (newSettings: Settings) => void;
  onClose: () => void;
  onClearData?: () => void;
}

type ConnectionStatus = 'idle' | 'testing' | 'success' | 'error';

export const SettingsModal: React.FC<SettingsModalProps> = ({ settings, onSave, onClose, onClearData }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'ai'>('general');
  const [backendUrl, setBackendUrl] = useState<string>(settings.backendUrl || '');
  const [criteria, setCriteria] = useState<string>(settings.criteria || '');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const testConnection = async () => {
    if (!backendUrl) return;
    setConnectionStatus('testing');
    try {
      const response = await fetch(`${backendUrl.replace(/\/$/, "")}/health-check`);
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
      const res = await aiExtractCriteriaFromCV(file, backendUrl);
      setCriteria(res);
    } catch (error: any) {
      alert("Erreur: " + error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = () => {
    onSave({ ...settings, backendUrl, criteria, aiModel: 'gemini-2.5-flash' });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Paramètres</h2>
            <p className="text-slate-500 text-sm mt-1">IA Gemini 2.5 Flash & Connexion</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><CloseIcon /></button>
        </div>

        <div className="flex border-b border-slate-100 bg-slate-50/50 flex-shrink-0">
          <button onClick={() => setActiveTab('general')} className={`flex-1 py-4 text-sm font-bold border-b-2 ${activeTab === 'general' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-slate-500'}`}>Général</button>
          <button onClick={() => setActiveTab('ai')} className={`flex-1 py-4 text-sm font-bold border-b-2 ${activeTab === 'ai' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-slate-500'}`}>CV & IA</button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <section className="space-y-4">
                <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider">URL Backend (Hugging Face)</label>
                <div className="flex gap-2">
                  <input type="text" value={backendUrl} onChange={(e) => setBackendUrl(e.target.value)} className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="https://..." />
                  <button onClick={testConnection} className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700">Tester</button>
                </div>
                {connectionStatus !== 'idle' && (
                  <div className={`text-xs font-medium flex items-center gap-1 ${connectionStatus === 'success' ? 'text-green-600' : connectionStatus === 'error' ? 'text-red-600' : 'text-slate-500'}`}>
                    {connectionStatus === 'testing' ? <SpinnerIcon className="animate-spin w-3 h-3" /> : connectionStatus === 'success' ? <CheckCircleIcon className="w-3 h-3" /> : <ExclamationCircleIcon className="w-3 h-3" />}
                    {connectionStatus === 'success' ? 'Connecté' : connectionStatus === 'error' ? 'Erreur de connexion' : 'Vérification...'}
                  </div>
                )}
              </section>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="space-y-6">
              <section>
                <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-slate-200 bg-slate-50/50 rounded-xl p-10 text-center hover:border-indigo-400 hover:bg-indigo-50/30 transition-all cursor-pointer group">
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".pdf" className="hidden" />
                  <div className="flex flex-col items-center">
                    {isAnalyzing ? <SpinnerIcon className="w-10 h-10 text-indigo-600 animate-spin mb-3" /> : <UploadIcon className="w-10 h-10 text-slate-400 group-hover:text-indigo-500 mb-3" />}
                    <p className="text-slate-700 font-semibold">{isAnalyzing ? "Analyse Gemini..." : "Importer CV (PDF)"}</p>
                  </div>
                </div>
              </section>
              <section className="space-y-2">
                <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider">Critères de recherche</label>
                <textarea value={criteria} onChange={(e) => setCriteria(e.target.value)} rows={6} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Critères extraits..." />
              </section>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50 flex-shrink-0">
          {onClearData && <button onClick={onClearData} className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition mr-auto">Réinitialiser</button>}
          <button onClick={onClose} className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-lg">Annuler</button>
          <button onClick={handleSave} className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 shadow-lg active:scale-95 transition-all">Enregistrer</button>
        </div>
      </div>
    </div>
  );
};
