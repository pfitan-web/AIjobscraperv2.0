import React, { useState } from 'react';
import { CloseIcon } from './icons/CloseIcon';
import { extractCriteriaFromCV } from '../services/aiService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: any;
  setSettings: (settings: any) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  setSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'cv'>('general');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [testStatus, setTestStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    try {
      const criteria = await extractCriteriaFromCV(file);
      setSettings({ ...settings, searchCriteria: criteria });
      alert("CV Analysé avec succès ! Critères mis à jour.");
    } catch (error) {
      alert("Erreur analyse CV: " + error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const testConnection = async () => {
    try {
        setTestStatus("Test...");
        const res = await fetch(`${settings.backendUrl}/health-check`);
        if(res.ok) setTestStatus("Connexion OK ✅");
        else setTestStatus("Erreur serveur ❌");
    } catch(e) {
        setTestStatus("Backend inaccessible ❌");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        
        {/* En-tête avec Titre et Croix */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800">Paramètres</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <CloseIcon className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Barre d'onglets */}
        <div className="flex border-b border-gray-200 px-6">
          <button
            className={`py-4 mr-6 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'general'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('general')}
          >
            Général & Connexion
          </button>
          <button
            className={`py-4 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'cv'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('cv')}
          >
            CV & Intelligence Artificielle
          </button>
        </div>

        {/* Contenu */}
        <div className="p-6 space-y-6">
          
          {/* ONGLET GENERAL */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              
              {/* Section Backend */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
                  <label className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Connexion Backend</label>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL du Backend</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={settings.backendUrl}
                      onChange={(e) => setSettings({ ...settings, backendUrl: e.target.value })}
                      className="flex-1 p-2 border border-gray-300 rounded-md text-sm"
                      placeholder="https://..."
                    />
                    <button 
                        onClick={testConnection}
                        className="bg-gray-700 text-white px-4 py-2 rounded-md text-sm hover:bg-gray-800"
                    >
                        Tester
                    </button>
                  </div>
                  {testStatus && <p className="text-xs mt-2 font-medium text-gray-600">{testStatus}</p>}
                  <p className="text-xs text-gray-400 mt-2">L'adresse de votre serveur Hugging Face ou Local.</p>
                </div>
              </div>

              {/* Section Sources */}
              <div>
                 <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
                  <label className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Sources de données</label>
                </div>
                <div className="flex gap-2 mb-2">
                    <input type="text" placeholder="Ajouter une URL (ex: Indeed...)" className="flex-1 p-2 border border-gray-300 rounded-md text-sm" />
                    <button className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm">Ajouter</button>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg text-center bg-gray-50">
                    <p className="text-sm text-gray-500">Aucune URL personnalisée ajoutée.</p>
                </div>
              </div>
            </div>
          )}

          {/* ONGLET CV */}
          {activeTab === 'cv' && (
            <div className="space-y-6">
               <div>
                  <label className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-2 block">Mon CV</label>
                  <div className="border-2 border-dashed border-indigo-100 bg-indigo-50 rounded-xl p-8 text-center hover:bg-indigo-100 transition-colors cursor-pointer relative">
                    <input 
                        type="file" 
                        accept=".pdf" 
                        onChange={handleFileUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="text-indigo-600 font-medium mb-1">
                        {isAnalyzing ? "Analyse en cours..." : "Importer CV (PDF)"}
                    </div>
                    <p className="text-xs text-indigo-400">Max 5Mo. Sera utilisé pour générer les critères.</p>
                  </div>
               </div>

               <div>
                  <label className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-2 block">Critères d'analyse IA</label>
                  <p className="text-xs text-gray-500 mb-2">Généré automatiquement depuis votre CV.</p>
                  <textarea
                    value={settings.searchCriteria}
                    onChange={(e) => setSettings({ ...settings, searchCriteria: e.target.value })}
                    className="w-full h-32 p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Je suis un développeur..."
                  />
               </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-xl">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium">
            Annuler
          </button>
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-sm transition-all transform hover:scale-105"
          >
            Enregistrer
          </button>
        </div>

      </div>
    </div>
  );
};
