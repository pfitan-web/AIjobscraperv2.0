import React, { useState, useRef } from 'react';
import { Settings, CvFile, AIProvider } from '../types';
import { CloseIcon } from './icons/CloseIcon';
import { UploadIcon } from './icons/UploadIcon';
import { extractCriteriaFromCV } from '../services/aiService';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { TrashIcon } from './icons/TrashIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';

interface SettingsModalProps {
  settings: Settings;
  onSave: (newSettings: Settings) => void;
  onClose: () => void;
  onClearData?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ settings, onSave, onClose, onClearData }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'ai'>('general');
  const [loading, setLoading] = useState(false);
  
  // --- États locaux synchronisés avec les types d'origine ---
  const [backendUrl, setBackendUrl] = useState(settings.backendUrl || '');
  const [criteria, setCriteria] = useState(settings.criteria || '');
  const [aiModel, setAiModel] = useState(settings.aiModel || 'gemini-2.5-flash');
  const [cvFile, setCvFile] = useState<CvFile | undefined>(settings.cvFile);
  const [activeSources, setActiveSources] = useState<string[]>(settings.sources || []);
  const [chromeProfilePath, setChromeProfilePath] = useState(settings.chromeProfilePath || '');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Conversion propre en Base64 pour le stockage persistant
  const toBase64 = (file: File): Promise<string> => 
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!backendUrl) {
      alert("Erreur : Veuillez d'abord configurer l'URL du Backend dans l'onglet Général.");
      setActiveTab('general');
      return;
    }

    setLoading(true);
    try {
      // 1. Extraction via le service (qui appelle Gemini 2.5 sur le backend)
      const analysisText = await extractCriteriaFromCV(file, backendUrl);
      
      // 2. Préparation de l'objet CvFile pour le state
      const base64Data = await toBase64(file);
      
      const newCv: CvFile = {
        name: file.name,
        type: file.type,
        data: base64Data,
        extractedCriteria: analysisText
      };

      setCvFile(newCv);
      setCriteria(analysisText); // Mise à jour automatique du textarea
    } catch (error: any) {
      console.error("Erreur d'analyse:", error);
      alert("Échec de l'analyse : " + (error.message || "Vérifiez votre connexion backend."));
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
      cvFile,
      sources: activeSources,
      chromeProfilePath
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header - Style AI Studio */}
        <div className="p-6 border-b flex justify-between items-center bg-indigo-600 text-white">
          <div>
            <h2 className="text-xl font-bold">Configuration AI Studio</h2>
            <p className="text-indigo-100 text-xs">Modèle actif : {aiModel}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-transform hover:rotate-90">
            <CloseIcon />
          </button>
        </div>

        {/* Navigation Onglets */}
        <div className="flex border-b bg-slate-50">
          <button 
            onClick={() => setActiveTab('general')}
            className={`flex-1 py-4 text-sm font-bold transition-all ${activeTab === 'general' ? 'bg-white border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            ⚙️ Général & Scraping
          </button>
          <button 
            onClick={() => setActiveTab('ai')}
            className={`flex-1 py-4 text-sm font-bold transition-all ${activeTab === 'ai' ? 'bg-white border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            🧠 Intelligence & CV
          </button>
        </div>

        {/* Contenu */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* --- ONGLET GÉNÉRAL --- */}
          {activeTab === 'general' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <section className="space-y-3">
                <label className="block text-sm font-bold text-slate-700">URL du Backend (Hugging Face / FastAPI)</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={backendUrl} 
                    onChange={(e) => setBackendUrl(e.target.value)}
                    placeholder="https://votre-space.hf.space"
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  />
                  {backendUrl.includes('hf.space') && <div className="absolute right-3 top-3 text-green-500"><CheckCircleIcon /></div>}
                </div>
              </section>

              <section className="space-y-3">
                <label className="block text-sm font-bold text-slate-700">Chemin du Profil Chrome (Scraping local)</label>
                <input 
                  type="text" 
                  value={chromeProfilePath} 
                  onChange={(e) => setChromeProfilePath(e.target.value)}
                  placeholder="/Users/nom/Library/Application Support/Google/Chrome/Default"
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs"
                />
              </section>
            </div>
          )}

          {/* --- ONGLET IA & CV --- */}
          {activeTab === 'ai' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Zone Upload CV */}
              <div className={`p-5 border-2 border-dashed rounded-2xl transition-all ${cvFile ? 'border-green-200 bg-green-50' : 'border-slate-200 bg-slate-50'}`}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-800">
                      {cvFile ? '✅ CV chargé' : '📁 Votre CV (PDF)'}
                    </h3>
                    <p className="text-xs text-slate-500 truncate max-w-[200px]">
                      {cvFile ? cvFile.name : 'Aucun fichier sélectionné'}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    {cvFile && (
                      <button onClick={() => setCvFile(undefined)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                        <TrashIcon />
                      </button>
                    )}
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={loading}
                      className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-bold shadow-md hover:bg-indigo-700 disabled:opacity-50 transition-all"
                    >
                      {loading ? <SpinnerIcon className="animate-spin" /> : <UploadIcon />}
                      {cvFile ? 'Remplacer' : 'Analyser via Gemini 2.5'}
                    </button>
                  </div>
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf" />
              </div>

              {/* Sélection Modèle Gemini */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700">Modèle Gemini</label>
                <select 
                  value={aiModel} 
                  onChange={(e) => setAiModel(e.target.value)}
                  className="w-full p-3.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash (Le plus rapide - Recommandé)</option>
                  <option value="gemini-2.0-flash">Gemini 2.0 Flash (Stable)</option>
                  <option value="gemini-2.0-pro-exp-02-05">Gemini 2.0 Pro Experimental (Plus puissant)</option>
                </select>
              </div>

              {/* Critères extraits */}
              <div className="space-y-3">
                <label className="block text-sm font-bold text-slate-700">Mes Critères de recherche (Extraits par l'IA)</label>
                <textarea 
                  value={criteria} 
                  onChange={(e) => setCriteria(e.target.value)}
                  rows={8}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none leading-relaxed"
                  placeholder="L'analyse de votre CV remplira automatiquement ce champ..."
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
          {onClearData && (
            <button onClick={onClearData} className="text-red-500 text-xs font-bold hover:underline">
              🗑️ Réinitialiser toutes les données
            </button>
          )}
          <div className="flex gap-3 w-full sm:w-auto">
            <button onClick={onClose} className="flex-1 sm:flex-none px-6 py-3 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition">
              Annuler
            </button>
            <button onClick={handleSave} className="flex-1 sm:flex-none bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all">
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
