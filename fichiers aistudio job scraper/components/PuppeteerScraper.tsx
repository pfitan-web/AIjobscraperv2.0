
import React, { useState } from 'react';
import { PuppeteerScraperConfig } from '../types';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { StopIcon } from './icons/StopIcon';

interface PuppeteerScraperProps {
  config: PuppeteerScraperConfig;
  setConfig: (cfg: PuppeteerScraperConfig) => void;
  onScrapeRequest: () => void;
  onStopRequest: () => void;
  isLoading: boolean;
  loadingMessage: string;
  customUrls: string[];
}

export const PuppeteerScraper: React.FC<PuppeteerScraperProps> = ({ 
  config, 
  setConfig, 
  onScrapeRequest, 
  onStopRequest,
  isLoading, 
  loadingMessage, 
  customUrls 
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validation : Il faut au moins un critère de recherche textuel
  const isValidSearch = config.keywords.trim() || config.sector.trim() || config.jobFunction.trim();

  const handleScrapeClick = () => {
    if (!isValidSearch) { 
        setError("Veuillez saisir au moins un mot-clé, un secteur ou une fonction."); 
        return; 
    }
    setError(null);
    onScrapeRequest();
    if (window.innerWidth < 768) {
        setIsCollapsed(true);
    }
  };

  return (
    <div className="bg-slate-800 rounded-xl shadow-xl border border-slate-700 w-full max-w-5xl mx-auto transition-all duration-300 overflow-hidden">
      
      {/* Header / Toggle Bar */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-700/50 transition-colors"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-2">
            <span className="text-2xl">🤖</span> 
            <h2 className="text-base md:text-lg font-semibold text-white">
                Configuration du Scraper
                <span className="ml-2 text-xs font-normal text-slate-400 hidden sm:inline-block">Indeed, LinkedIn, France Travail...</span>
            </h2>
        </div>
        <div className="flex items-center gap-2">
             <span className="bg-indigo-900/50 text-indigo-200 border border-indigo-700/50 px-2 py-0.5 rounded text-[10px] uppercase tracking-wide hidden sm:inline-block">
                Backend Local
            </span>
            <button className="p-1 text-slate-400 hover:text-white transition-transform duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transform ${isCollapsed ? 'rotate-180' : 'rotate-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
            </button>
        </div>
      </div>

      {/* Collapsible Content */}
      <div className={`${isCollapsed ? 'hidden' : 'block'} p-4 md:p-6 border-t border-slate-700 bg-slate-800`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
            <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Source</label>
            <select disabled={isLoading} value={config.source} onChange={(e) => setConfig({...config, source: e.target.value})} className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-3 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50">
                <option value="indeed">Indeed</option>
                <option value="francetravail">France Travail</option>
                <option value="linkedin">LinkedIn</option>
                <option value="hellowork">Hellowork</option>
                <option value="jobijoba">Jobijoba</option>
                <option value="googlejobs">Google Jobs</option>
                <option value="full">⚡ FULL (Toutes les sources)</option>
                
                {customUrls.length > 0 && (
                <optgroup label="--- Vos URLs Personnalisées ---">
                    {customUrls.map((url, idx) => (
                    <option key={idx} value={url}>{url}</option>
                    ))}
                </optgroup>
                )}
            </select>
            </div>
            <div>
            <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Pages à scanner</label>
            <select disabled={isLoading} value={config.maxPages} onChange={(e) => setConfig({...config, maxPages: parseInt(e.target.value)})} className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-3 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50">
                <option value={1}>1 page (~15 offres)</option>
                <option value={3}>3 pages (~45 offres)</option>
                <option value={5}>5 pages (~75 offres)</option>
                <option value={10}>10 pages (~150 offres)</option>
            </select>
            </div>
            <div className="md:col-span-2 grid grid-cols-3 gap-2">
                 <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Localisation</label>
                    <input disabled={isLoading} type="text" value={config.location} onChange={(e) => setConfig({...config, location: e.target.value})} placeholder="ex: Paris, Remote..." className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-3 py-3 text-sm focus:ring-2 focus:ring-indigo-500 placeholder-gray-500 outline-none disabled:opacity-50"/>
                 </div>
                 <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Rayon (km)</label>
                    <select disabled={isLoading} value={config.radius} onChange={(e) => setConfig({...config, radius: e.target.value === 'any' ? 'any' : parseInt(e.target.value)})} className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-2 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50">
                        <option value={0}>Lieu exact</option>
                        <option value={5}>5 km</option>
                        <option value={10}>10 km</option>
                        <option value={15}>15 km</option>
                        <option value={25}>25 km</option>
                        <option value={50}>50 km</option>
                        <option value={100}>100 km</option>
                        <option value="any">Large (Défaut)</option>
                    </select>
                 </div>
            </div>

            <div>
                <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Secteur / Domaine</label>
                <input disabled={isLoading} type="text" value={config.sector} onChange={(e) => setConfig({...config, sector: e.target.value})} placeholder="ex: Informatique, BTP..." className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-3 py-3 text-sm placeholder-gray-500 outline-none disabled:opacity-50"/>
            </div>
             <div>
                <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Fonction / Métier</label>
                <input disabled={isLoading} type="text" value={config.jobFunction} onChange={(e) => setConfig({...config, jobFunction: e.target.value})} placeholder="ex: Chef de projet..." className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-3 py-3 text-sm placeholder-gray-500 outline-none disabled:opacity-50"/>
            </div>

            <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Mots-clés (Poste, Compétences...)</label>
                <input disabled={isLoading} type="text" value={config.keywords} onChange={(e) => setConfig({...config, keywords: e.target.value})} placeholder="ex: développeur react, commercial..." className={`w-full bg-gray-700 text-white border rounded-lg px-3 py-3 text-sm focus:ring-2 focus:ring-indigo-500 placeholder-gray-500 outline-none disabled:opacity-50 ${!isValidSearch ? 'border-indigo-500/50 ring-1 ring-indigo-500/30' : 'border-gray-600'}`}/>
            </div>
        </div>

        <div className="mb-4">
            <button onClick={() => setShowAdvanced(!showAdvanced)} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium focus:outline-none py-2">
                {showAdvanced ? 'Masquer les filtres avancés' : 'Afficher filtres avancés (Salaire, Date, Contrat...)'}
            </button>
        </div>

        {showAdvanced && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-700/50 rounded-lg border border-gray-600 animate-fadeIn">
                {/* Ligne 1 */}
                <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Date de publication</label>
                    <select disabled={isLoading} value={config.publishedDate} onChange={(e) => setConfig({...config, publishedDate: e.target.value as any})} className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-3 py-2 text-sm outline-none disabled:opacity-50">
                        <option value="any">Peu importe</option>
                        <option value="24h">Dernières 24h</option>
                        <option value="3d">3 derniers jours</option>
                        <option value="7d">7 derniers jours</option>
                        <option value="14d">14 derniers jours</option>
                        <option value="30d">30 derniers jours</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Type de Contrat</label>
                    <select disabled={isLoading} value={config.contractType} onChange={(e) => setConfig({...config, contractType: e.target.value})} className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-3 py-2 text-sm outline-none disabled:opacity-50">
                        <option value="any">Tous</option>
                        <option value="CDI">CDI</option>
                        <option value="CDD">CDD</option>
                        <option value="Freelance">Freelance</option>
                        <option value="Alternance">Alternance</option>
                        <option value="Stage">Stage</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Télétravail</label>
                    <select disabled={isLoading} value={config.remote} onChange={(e) => setConfig({...config, remote: e.target.value})} className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-3 py-2 text-sm outline-none disabled:opacity-50">
                        <option value="any">Peu importe</option>
                        <option value="full">Total (Full Remote)</option>
                        <option value="hybrid">Hybride</option>
                        <option value="no_remote">Sur site / Non</option>
                    </select>
                </div>

                {/* Ligne 2 - Salaire */}
                <div className="md:col-span-3 lg:col-span-1">
                     <label className="block text-xs font-medium text-gray-400 mb-1">Salaire (Min - Max)</label>
                    <div className="flex gap-1 mb-1">
                        <input disabled={isLoading} type="number" value={config.minSalary} onChange={(e) => setConfig({...config, minSalary: e.target.value})} placeholder="Min" className="w-1/2 bg-gray-700 text-white border border-gray-600 rounded-lg px-2 py-2 text-sm placeholder-gray-500 outline-none disabled:opacity-50"/>
                        <input disabled={isLoading} type="number" value={config.maxSalary} onChange={(e) => setConfig({...config, maxSalary: e.target.value})} placeholder="Max" className="w-1/2 bg-gray-700 text-white border border-gray-600 rounded-lg px-2 py-2 text-sm placeholder-gray-500 outline-none disabled:opacity-50"/>
                    </div>
                     <select disabled={isLoading} value={config.salaryType} onChange={(e) => setConfig({...config, salaryType: e.target.value as any})} className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-1 py-2 text-xs outline-none disabled:opacity-50">
                        <option value="any">-- Type --</option>
                        <option value="brut_year">Brut / An</option>
                        <option value="brut_month">Brut / Mois</option>
                        <option value="net_year">Net / An</option>
                        <option value="net_month">Net / Mois</option>
                    </select>
                </div>
            </div>
        )}

        {isLoading ? (
             <button 
                onClick={onStopRequest}
                className="w-full py-4 rounded-xl font-bold text-sm md:text-base transition-all shadow-lg bg-red-600 text-white hover:bg-red-700 hover:shadow-red-500/25 flex items-center justify-center gap-2 animate-pulse"
            >
                <StopIcon className="w-6 h-6" />
                <span>STOPPER LE PROCESSUS</span>
                <span className="text-xs font-normal opacity-80 block ml-2">({loadingMessage})</span>
            </button>
        ) : (
            <button 
                onClick={handleScrapeClick} 
                disabled={!isValidSearch} 
                className={`w-full py-4 rounded-xl font-bold text-sm md:text-base transition-all transform active:scale-[0.98] shadow-lg ${!isValidSearch ? 'bg-gray-600 text-gray-300 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-indigo-500/25'}`}
            >
                🚀 Lancer le Scraping & Analyser avec l'IA
            </button>
        )}

        {error && <div className="mt-4 p-3 bg-red-900/40 border border-red-500/50 rounded-lg flex items-start gap-2 animate-fadeIn"><span className="text-red-400 mt-0.5">⚠️</span><p className="text-red-200 text-sm">{error}</p></div>}
      </div>
    </div>
  );
};
