import React, { useState, useRef, useEffect } from 'react';
import { Settings } from '../types';
import { CloseIcon } from './icons/CloseIcon';
import { UploadIcon } from './icons/UploadIcon';
import { extractCriteriaFromCV as aiExtractCriteriaFromCV } from '../services/aiService';
import { SpinnerIcon } from './icons/SpinnerIcon';

interface SettingsModalProps {
  settings: Settings;
  onSave: (newSettings: Settings) => void;
  onClose: () => void;
  onClearData?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ settings, onSave, onClose, onClearData }) => {
  // Debug pour savoir si le composant est monté
  useEffect(() => {
    console.log("MODAL SETTINGS CHARGÉ DANS LE DOM");
  }, []);

  const [activeTab, setActiveTab] = useState<'general' | 'ai'>('general');
  const [backendUrl, setBackendUrl] = useState(settings.backendUrl || '');
  const [criteria, setCriteria] = useState(settings.criteria || '');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleSave = () => {
    onSave({ ...settings, backendUrl, criteria });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        
        <div className="p-6 border-b flex justify-between items-center bg-white">
          <h2 className="text-xl font-bold text-slate-800">Paramètres</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
            <CloseIcon />
          </button>
        </div>

        <div className="flex border-b bg-slate-50">
          <button onClick={() => setActiveTab('general')} className={`flex-1 py-4 text-sm font-bold ${activeTab === 'general' ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`}>
            Général
          </button>
          <button onClick={() => setActiveTab('ai')} className={`flex-1 py-4 text-sm font-bold ${activeTab === 'ai' ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`}>
            IA & CV
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          {activeTab === 'general' && (
            <div className="space-y-4">
              <label className="block text-sm font-bold text-slate-700">URL Backend Hugging Face</label>
              <input 
                type="text" 
                value={backendUrl} 
                onChange={(e) => setBackendUrl(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg"
                placeholder="https://..."
              />
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="space-y-4">
               <button 
                onClick={() => document.getElementById('cv-upload')?.click()}
                disabled={isAnalyzing}
                className="w-full p-6 border-2 border-dashed border-indigo-200 rounded-xl bg-indigo-50 text-indigo-600 font-bold hover:bg-indigo-100 transition"
               >
                 {isAnalyzing ? <SpinnerIcon className="animate-spin mx-auto" /> : "📁 Cliquer pour analyser un CV"}
               </button>
               <input id="cv-upload" type="file" className="hidden" onChange={async (e) => {
                 const file = e.target.files?.[0];
                 if (file) {
                   setIsAnalyzing(true);
                   try {
                     const res = await aiExtractCriteriaFromCV(file, backendUrl);
                     setCriteria(res);
                   } catch (err) { alert(err); }
                   finally { setIsAnalyzing(false); }
                 }
               }} />
               <textarea 
                value={criteria} 
                onChange={(e) => setCriteria(e.target.value)}
                className="w-full h-40 p-4 bg-slate-50 border border-slate-200 rounded-xl"
               />
            </div>
          )}
        </div>

        <div className="p-6 border-t bg-slate-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 font-bold text-slate-500">Annuler</button>
          <button onClick={handleSave} className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold">Enregistrer</button>
        </div>
      </div>
    </div>
  );
};
