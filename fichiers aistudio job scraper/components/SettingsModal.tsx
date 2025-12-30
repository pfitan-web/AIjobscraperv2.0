import React, { useState, useRef } from 'react';
import { Settings, CvFile } from '../types';
import { CloseIcon } from './icons/CloseIcon';
import { UploadIcon } from './icons/UploadIcon';
import { extractCriteriaFromCV } from '../services/aiService';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { TrashIcon } from './icons/TrashIcon';

interface SettingsModalProps {
  settings: Settings;
  onSave: (newSettings: Settings) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ settings, onSave, onClose }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'ai'>('general');
  const [loading, setLoading] = useState(false);
  
  // États locaux synchronisés avec settings
  const [backendUrl, setBackendUrl] = useState(settings.backendUrl || '');
  const [criteria, setCriteria] = useState(settings.criteria || '');
  const [aiModel, setAiModel] = useState(settings.aiModel || 'gemini-2.0-flash');
  const [cvFile, setCvFile] = useState<CvFile | undefined>(settings.cvFile);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !backendUrl) return;

    setLoading(true);
    try {
      const analysis = await extractCriteriaFromCV(file, backendUrl);
      const reader = new FileReader();
      reader.onloadend = () => {
        const newCv: CvFile = {
          name: file.name,
          type: file.type,
          data: reader.result as string,
          extractedCriteria: analysis
        };
        setCvFile(newCv);
        setCriteria(analysis); // Remplit automatiquement les critères
      };
      reader.readAsDataURL(file);
    } catch (error) {
      alert("Erreur : " + error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    onSave({
      ...settings,
      backendUrl,
      criteria,
      aiModel,
      cvFile
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center bg-indigo-600 text-white">
          <h2 className="text-xl font-bold">Paramètres</h2>
          <button onClick={onClose} className="hover:rotate-90 transition-transform"><CloseIcon /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b text-sm font-medium">
          <button 
            onClick={() => setActiveTab('general')}
            className={`flex-1 py-3 ${activeTab === 'general' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500'}`}
          >
            Configuration Backend
          </button>
          <button 
            onClick={() => setActiveTab('ai')}
            className={`flex-1 py-3 ${activeTab === 'ai' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500'}`}
          >
            Intelligence Artificielle
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'general' && (
            <section className="space-y-4">
              <label className="block text-sm font-semibold text-slate-700">URL du Backend (Hugging Face)</label>
              <input 
                type="text" 
                value={backendUrl} 
                onChange={(e) => setBackendUrl(e.target.value)}
                placeholder="https://votre-space.hf.space"
                className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </section>
          )}

          {activeTab === 'ai' && (
            <section className="space-y-6">
              {/* Upload CV */}
              <div className="p-4 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-800">Mon CV</h3>
                    <p className="text-xs text-slate-500">{cvFile ? cvFile.name : 'Aucun fichier sélectionné'}</p>
                  </div>
                  <div className="flex gap-2">
                    {cvFile && (
                      <button onClick={() => setCvFile(undefined)} className="p-2 text-red-500"><TrashIcon /></button>
                    )}
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={loading}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
                    >
                      {loading ? <SpinnerIcon /> : <UploadIcon />} Analyser mon CV
                    </button>
                  </div>
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf" />
              </div>

              {/* Model Select */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">Modèle Gemini</label>
                <select 
                  value={aiModel} 
                  onChange={(e) => setAiModel(e.target.value)}
                  className="w-full p-3 border rounded-xl"
                >
                  <option value="gemini-2.0-flash">Gemini 2.0 Flash (Stable)</option>
                  <option value="gemini-3-flash">Gemini 3.0 Flash (Preview)</option>
                </select>
              </div>

              {/* Criteria Textarea */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">Mes Critères / Résumé</label>
                <textarea 
                  value={criteria} 
                  onChange={(e) => setCriteria(e.target.value)}
                  rows={6}
                  className="w-full p-3 border rounded-xl text-sm"
                  placeholder="Collez vos critères ou laissez l'IA les extraire du CV..."
                />
              </div>
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-slate-600">Annuler</button>
          <button onClick={handleSave} className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold">Enregistrer</button>
        </div>
      </div>
    </div>
  );
};
