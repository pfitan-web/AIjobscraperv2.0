
import React, { useState } from 'react';
import { JobOffer, CvFile } from '../types';
import { CloseIcon } from './icons/CloseIcon';
import { GoogleGenAI } from "@google/genai";
import { SpinnerIcon } from './icons/SpinnerIcon';
import { LightningIcon } from './icons/LightningIcon';

interface JobDetailModalProps {
  job: JobOffer;
  cvFile?: CvFile;
  onClose: () => void;
  apiKey?: string;
}

export const JobDetailModal: React.FC<JobDetailModalProps> = ({ job, cvFile, onClose, apiKey }) => {
  const { title, company, location, url, description, score, reasoning, contractType, salaryRange, keyHighlights, logoUrl, isEasyApply } = job;
  const [activeTab, setActiveTab] = useState<'details' | 'coverLetter'>('details');
  const [coverLetter, setCoverLetter] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [imgError, setImgError] = useState(false);

  const handleGenerateCoverLetter = async () => {
    if (!apiKey) return alert("Clé API manquante");
    if (!cvFile && !job.reasoning) return alert("Veuillez d'abord uploader un CV dans les paramètres.");
    
    setIsGenerating(true);
    try {
        const ai = new GoogleGenAI({ apiKey });
        const contextData = cvFile ? cvFile.extractedCriteria : "Utilisateur sans CV uploadé, baser sur l'analyse.";
        
        const prompt = `
            Rédige une lettre de motivation professionnelle, convaincante et personnalisée pour ce poste.
            
            POSTE:
            Titre: ${title}
            Entreprise: ${company}
            Description: ${description}

            CANDIDAT (Informations extraites du CV):
            ${contextData}

            INSTRUCTIONS:
            - Ton : Professionnel, enthousiaste, direct.
            - Structure : Introduction accrocheuse, Corps (Match compétences/besoins), Conclusion avec appel à l'action.
            - Langue : Français.
            - Format : Texte brut prêt à copier-coller (pas de markdown compliqué).
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });
        
        setCoverLetter(response.text);
    } catch (e) {
        console.error(e);
        setCoverLetter("Erreur lors de la génération. Vérifiez votre clé API ou réessayez.");
    } finally {
        setIsGenerating(false);
    }
  };

  const companyInitial = company ? company.charAt(0).toUpperCase() : '?';

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-6" role="dialog" aria-modal="true">
      {/* 
         Mobile: Fixed full screen (h-full), rounded top only
         Desktop: Max width/height with margin, rounded all corners 
      */}
      <div className="bg-white w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-3xl sm:rounded-2xl flex flex-col overflow-hidden animate-slideUp sm:animate-fadeIn shadow-2xl safe-pb">
        
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/50 flex-shrink-0 safe-pt">
          <div className="flex gap-4 pr-4 w-full">
            {/* Logo in Header */}
            <div className="flex-shrink-0 mt-1">
                {logoUrl && !imgError ? (
                    <img 
                        src={logoUrl} 
                        alt={company} 
                        className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl object-contain bg-white border border-slate-200 p-1 shadow-sm"
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br from-indigo-100 to-white border border-indigo-100 flex items-center justify-center text-indigo-400 font-bold text-2xl shadow-sm">
                        {companyInitial}
                    </div>
                )}
            </div>

            <div className="min-w-0 flex-grow">
                <h2 className="text-lg sm:text-2xl font-bold text-slate-800 leading-tight line-clamp-2">{title}</h2>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5">
                    <p className="text-slate-600 font-medium text-sm">{company}</p>
                    <span className="text-slate-300">•</span>
                    <p className="text-slate-500 text-sm">{location}</p>
                    {isEasyApply && (
                        <span className="ml-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100">
                            <LightningIcon className="w-3 h-3" />
                            Réponse Rapide
                        </span>
                    )}
                </div>
            </div>
          </div>
          
          <button 
            onClick={onClose} 
            className="p-2 -mr-2 -mt-2 rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition flex-shrink-0"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 px-4 sm:px-6 bg-white flex-shrink-0">
             <button 
                className={`flex-1 sm:flex-none text-center py-3 px-4 font-medium text-sm border-b-2 transition-colors ${activeTab === 'details' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                onClick={() => setActiveTab('details')}
            >
                Détails
            </button>
            <button 
                className={`flex-1 sm:flex-none text-center py-3 px-4 font-medium text-sm border-b-2 transition-colors ${activeTab === 'coverLetter' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                onClick={() => setActiveTab('coverLetter')}
            >
                Lettre Motiv. ✨
            </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-grow bg-white pb-24 sm:pb-6">
          
          {activeTab === 'details' && (
            <>
              {/* AI Insights Card */}
              <div className="mb-6 sm:mb-8 bg-indigo-50/50 border border-indigo-100 p-4 sm:p-5 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-indigo-900 flex items-center text-sm sm:text-base gap-2">
                        <span className="text-lg">🤖</span> Analyse IA
                    </h4>
                    {score !== undefined && (
                        <span className={`px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-bold ${score >= 80 ? 'bg-emerald-100 text-emerald-700' : score >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                            {score}% Match
                        </span>
                    )}
                </div>
                
                {reasoning && <p className="text-indigo-900/80 text-sm leading-relaxed mb-4 border-l-2 border-indigo-200 pl-3 italic">"{reasoning}"</p>}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    {(contractType || salaryRange) && (
                    <>
                        {contractType && (
                            <div className="bg-white p-3 rounded-lg border border-indigo-100 shadow-sm flex flex-col">
                                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">Type de Contrat</span>
                                <p className="text-slate-800 font-medium text-sm">{contractType}</p>
                            </div>
                        )}
                        {salaryRange && (
                            <div className="bg-white p-3 rounded-lg border border-indigo-100 shadow-sm flex flex-col">
                                 <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">Salaire Estimé</span>
                                 <p className="text-emerald-700 font-bold text-sm">{salaryRange}</p>
                            </div>
                        )}
                    </>
                    )}
                </div>

                {keyHighlights && keyHighlights.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">Points forts détectés</p>
                    <ul className="space-y-2">
                      {keyHighlights.map((highlight, index) => (
                        <li key={index} className="flex items-start text-sm text-slate-700">
                          <span className="mr-2 text-emerald-500 flex-shrink-0 mt-0.5">✓</span>
                          <span>{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Job Description */}
              <h4 className="font-bold text-lg text-slate-800 mb-4 border-b border-slate-100 pb-2">Description du poste</h4>
              <div className="prose prose-slate prose-sm max-w-none text-slate-600 leading-relaxed whitespace-pre-wrap font-light">
                {description}
              </div>
            </>
          )}

          {activeTab === 'coverLetter' && (
              <div className="h-full flex flex-col">
                  {!coverLetter ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                          <div className="mb-4 p-4 bg-indigo-50 rounded-full text-indigo-600">
                              <span className="text-3xl">✍️</span>
                          </div>
                          <h3 className="text-lg font-bold text-slate-800 mb-2">Générez votre lettre</h3>
                          <p className="text-slate-500 text-sm max-w-sm mb-6">
                              L'IA va utiliser votre CV et la description de cette offre pour rédiger une lettre de motivation personnalisée.
                          </p>
                          <button 
                            onClick={handleGenerateCoverLetter}
                            disabled={isGenerating}
                            className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:bg-indigo-700 transition flex items-center gap-2"
                          >
                             {isGenerating ? <SpinnerIcon className="w-5 h-5 animate-spin"/> : null}
                             {isGenerating ? 'Rédaction en cours...' : 'Générer la lettre'}
                          </button>
                      </div>
                  ) : (
                      <div className="animate-fadeIn h-full flex flex-col">
                          <div className="flex justify-between items-center mb-4">
                              <h3 className="font-bold text-slate-800">Proposition de Lettre</h3>
                              <button 
                                onClick={() => { navigator.clipboard.writeText(coverLetter); alert('Copié !'); }}
                                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium bg-indigo-50 px-3 py-1 rounded-lg"
                              >
                                  Copier
                              </button>
                          </div>
                          <textarea 
                            className="flex-grow w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm leading-relaxed text-slate-700 focus:ring-2 focus:ring-indigo-500 resize-none min-h-[300px]"
                            value={coverLetter}
                            onChange={(e) => setCoverLetter(e.target.value)}
                          />
                      </div>
                  )}
              </div>
          )}

        </div>

        {/* Footer - Fixed at bottom on mobile */}
        <div className="p-4 sm:p-6 border-t border-slate-100 bg-white/95 backdrop-blur flex justify-end flex-shrink-0 safe-pb fixed bottom-0 left-0 right-0 sm:static sm:bottom-auto z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] sm:shadow-none">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center justify-center w-full sm:w-auto px-6 py-3 font-semibold rounded-xl shadow-lg hover:-translate-y-0.5 transition-all duration-200 ${isEasyApply ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
          >
            {isEasyApply ? (
                <>
                    <LightningIcon className="w-5 h-5 mr-2" />
                    Candidature Rapide
                </>
            ) : (
                <>
                    Postuler sur le site
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0l-6 6"></path></svg>
                </>
            )}
          </a>
        </div>
      </div>
    </div>
  );
};
