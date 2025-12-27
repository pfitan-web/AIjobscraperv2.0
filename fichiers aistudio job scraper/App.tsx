
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Header } from './components/Header';
import { JobBoard } from './components/JobBoard';
import { JobDetailModal } from './components/JobDetailModal';
import { SettingsModal } from './components/SettingsModal';
import { PuppeteerScraper } from './components/PuppeteerScraper';
import { JobOffer, JobCategory, Settings, PuppeteerScraperConfig } from './types';
import { scoreAndCategorizeJob as aiScoreAndCategorizeJob } from './services/aiService';
import { SpinnerIcon } from './components/icons/SpinnerIcon';

// ═══════════════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL APP
// ═══════════════════════════════════════════════════════════════════════════

const defaultSettings: Settings = {
  sources: [], allCustomUrls: [], schedule: 'manual', criteria: `Je suis un développeur...`,
  chromeProfilePath: '', aiProvider: 'gemini', backendUrl: 'http://localhost:3001',
  jobKeywords: '', jobTitleFilter: '', locationFilter: '', locationRadius: 'any',
  contractTypeFilter: 'any', minSalary: undefined, maxSalary: undefined,
  remotePreference: 'any', professionalDomain: ''
};

const App: React.FC = () => {
  const [jobs, setJobs] = useState<Record<JobCategory, JobOffer[]>>(() => {
    try { const s = localStorage.getItem('aiJobScraperJobs'); return s ? JSON.parse(s) : { [JobCategory.NEW]: [], [JobCategory.MATCH]: [], [JobCategory.REVIEW]: [], [JobCategory.APPLIED]: [], [JobCategory.REJECTED]: [] }; } catch { return { [JobCategory.NEW]: [], [JobCategory.MATCH]: [], [JobCategory.REVIEW]: [], [JobCategory.APPLIED]: [], [JobCategory.REJECTED]: [] }; }
  });
  
  const [settings, setSettings] = useState<Settings>(() => {
    try { const s = localStorage.getItem('aiJobScraperSettings'); return s ? JSON.parse(s) : defaultSettings; } catch { return defaultSettings; }
  });

  // État du formulaire Scraper
  const [scraperConfig, setScraperConfig] = useState<PuppeteerScraperConfig>(() => {
    try {
      const saved = localStorage.getItem('puppeteerScraperConfig');
      return saved ? JSON.parse(saved) : {
        source: 'indeed', keywords: '', location: '', maxPages: 5, radius: 'any', contractType: 'any', remote: 'any', minSalary: '', maxSalary: '', sector: '', jobFunction: '',
        publishedDate: 'any', salaryType: 'any'
      };
    } catch { return { source: 'indeed', keywords: '', location: '', maxPages: 5, radius: 'any', contractType: 'any', remote: 'any', minSalary: '', maxSalary: '', sector: '', jobFunction: '', publishedDate: 'any', salaryType: 'any' }; }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobOffer | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => { localStorage.setItem('aiJobScraperJobs', JSON.stringify(jobs)); }, [jobs]);
  useEffect(() => { localStorage.setItem('aiJobScraperSettings', JSON.stringify(settings)); }, [settings]);
  useEffect(() => { localStorage.setItem('puppeteerScraperConfig', JSON.stringify(scraperConfig)); }, [scraperConfig]);

  const handleError = useCallback((e: any, context: string = "générale") => {
    const err = e as Error;
    setIsLoading(false);
    abortControllerRef.current = null;
    if (err.name === 'AbortError') { setError('Opération annulée.'); return; }
    let msg = `Erreur ${context}: ${err.message}`;
    if (err.message.includes('Failed to fetch')) { msg = `Erreur backend. Vérifiez URL dans Paramètres.`; window.dispatchEvent(new CustomEvent('open-settings-modal', { detail: { tab: 'general', focusField: 'backend-url' } })); }
    setError(msg);
  }, []);

  // --- STOP LOGIC ---
  const handleStopScraping = useCallback(async () => {
    if (!isLoading) return;
    
    // 1. Stop Frontend AI Loop & Fetch
    if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
    }

    // 2. Tell Backend to Kill Puppeteer
    try {
        setLoadingMessage("Arrêt du serveur...");
        await fetch(`${settings.backendUrl}/api/stop-scraping`, { 
            method: 'POST',
            headers: { 'ngrok-skip-browser-warning': 'true' }
        });
    } catch (e) {
        console.error("Erreur lors de l'arrêt backend:", e);
    } finally {
        setIsLoading(false);
        setLoadingMessage('');
        setError("Processus arrêté par l'utilisateur.");
    }
  }, [isLoading, settings.backendUrl]);

  const processScrapedJobs = useCallback(async (rawJobs: JobOffer[], signal: AbortSignal) => {
    if (rawJobs.length === 0) { setError("Aucune offre trouvée."); setIsLoading(false); return; }
    setLoadingMessage(`Analyse de ${rawJobs.length} offres avec l'IA...`);
    const processedJobs: JobOffer[] = [];
    for (let i = 0; i < rawJobs.length; i++) {
        if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
        const offer = rawJobs[i];
        setLoadingMessage(`IA: Analyse ${i + 1}/${rawJobs.length}...`);
        try {
          const result = await aiScoreAndCategorizeJob(offer, settings.criteria, 'gemini', settings.backendUrl, signal);
          processedJobs.push({ ...offer, ...result });
        } catch (e) { if ((e as Error).name === 'AbortError') throw e; processedJobs.push({ ...offer, category: JobCategory.REVIEW, reasoning: `Échec IA`, score: 0 }); }
    }
    setJobs(prev => {
      const newState = JSON.parse(JSON.stringify(prev));
      processedJobs.forEach(j => { 
          // Logique de fusion : on ajoute seulement si l'ID n'existe pas déjà
          if (!Object.values(newState).flat().some((ex: any) => ex.id === j.id)) {
              newState[j.category].unshift(j);
          }
      });
      return newState;
    });
    setIsLoading(false);
  }, [settings.criteria, settings.backendUrl]);

  const handleStartPuppeteerScrape = useCallback(async () => {
    setIsLoading(true); setError(null); setLoadingMessage('Scraping en cours...');
    const controller = new AbortController(); abortControllerRef.current = controller;
    
    const isCustomUrl = !['indeed', 'francetravail', 'linkedin', 'hellowork', 'jobijoba', 'googlejobs', 'full'].includes(scraperConfig.source);
    
    const bodyPayload = isCustomUrl 
        ? { url: scraperConfig.source, ...scraperConfig } 
        : scraperConfig;                                 
    
    const endpoint = isCustomUrl ? '/api/universal-scrape' : '/api/puppeteer-scrape';

    try {
      const response = await fetch(`${settings.backendUrl}${endpoint}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
        body: JSON.stringify(bodyPayload), signal: controller.signal,
      });
      if (!response.ok) throw new Error(await response.text());
      const data = await response.json();
      
      let jobsToProcess = [];
      if (isCustomUrl) {
          jobsToProcess = [{
              id: `univ-${Date.now()}`,
              title: data.title || 'Titre Inconnu',
              company: 'Inconnu', location: 'Non spécifié', url: scraperConfig.source, source: 'CustomURL', category: JobCategory.NEW,
              description: data.content
          }];
      } else {
          if (!data.success) throw new Error(data.error);
          jobsToProcess = data.jobs;
      }

      await processScrapedJobs(jobsToProcess, controller.signal);

    } catch (e) { handleError(e, 'Scraper'); }
  }, [settings.backendUrl, scraperConfig, processScrapedJobs, handleError]);

  const handleUniversalScrape = useCallback(async (url: string) => {
      setIsLoading(true); setError(null); setLoadingMessage('Extraction intelligente de la page...');
      const controller = new AbortController(); abortControllerRef.current = controller;
      try {
          const response = await fetch(`${settings.backendUrl}/api/universal-scrape`, {
              method: 'POST', headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
              body: JSON.stringify({ url }), signal: controller.signal,
          });
          if (!response.ok) throw new Error(await response.text());
          const data = await response.json();
          
          setLoadingMessage('Structuration par l\'IA...');
          const contextCriteria = scraperConfig.keywords ? `Critères recherchés: ${scraperConfig.keywords}` : "Analyse standard";
          
          const rawJob: JobOffer = {
              id: `univ-${Date.now()}`,
              title: data.title || 'Page Web',
              company: 'Inconnu', location: 'Non spécifié', url: url, source: 'Universal', category: JobCategory.NEW,
              description: `CONTENU DE LA PAGE:\n${data.content}\n\n${contextCriteria}`
          };
          await processScrapedJobs([rawJob], controller.signal);
      } catch (e) { handleError(e, 'Universel'); }
  }, [settings.backendUrl, processScrapedJobs, handleError, scraperConfig.keywords]);

  const moveJob = (id: string, from: JobCategory, to: JobCategory) => {
    const j = jobs[from].find(j => j.id === id);
    if (j) setJobs(p => ({ ...p, [from]: p[from].filter(x => x.id !== id), [to]: [{ ...j, category: to }, ...p[to]] }));
  };
  
  const handleDeleteJob = (id: string, cat: JobCategory) => {
    if (window.confirm("Supprimer cette offre ?")) setJobs(p => ({...p, [cat]: p[cat].filter(j => j.id !== id) }));
  };

  const handleClearData = useCallback(() => {
    if (window.confirm("Êtes-vous sûr de vouloir tout supprimer ? Cette action est irréversible.")) {
      localStorage.removeItem('aiJobScraperJobs');
      setJobs({ [JobCategory.NEW]: [], [JobCategory.MATCH]: [], [JobCategory.REVIEW]: [], [JobCategory.APPLIED]: [], [JobCategory.REJECTED]: [] });
    }
  }, []);

  const handleExportJobs = () => {
    const all = Object.values(jobs).flat() as JobOffer[];
    if (!all.length) return alert("Rien à exporter.");
    const csv = "\uFEFF" + ["ID;Titre;Entreprise;Loc;URL;Score;Cat;Salaire;Raison"].join(';') + '\n' + all.map(j => [`"${j.id}"`, `"${j.title}"`, `"${j.company}"`, `"${j.location}"`, `"${j.url}"`, j.score, `"${j.category}"`, `"${j.salaryRange}"`, `"${j.reasoning}"`].join(';')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' })); a.download = 'jobs.csv'; a.click();
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50 safe-pt safe-pb">
       <Header 
          onExportClick={handleExportJobs} 
          onSettingsClick={() => setIsSettingsOpen(true)}
          onClearData={handleClearData} 
          isLoading={isLoading} 
          hasJobs={Object.values(jobs).flat().length > 0} 
          onUniversalScrape={handleUniversalScrape} 
        />
      
      <div className="flex-grow flex flex-col items-center overflow-y-auto hide-scrollbar relative w-full">
        {/* Scraper Panel - Responsive Width */}
        <div className="w-full max-w-7xl mx-auto px-2 md:px-4 mt-2 flex-shrink-0 z-10">
            <PuppeteerScraper 
                config={scraperConfig} 
                setConfig={setScraperConfig} 
                onScrapeRequest={handleStartPuppeteerScrape}
                onStopRequest={handleStopScraping}
                isLoading={isLoading} 
                loadingMessage={loadingMessage} 
                customUrls={settings.allCustomUrls}
            />
        </div>

        {/* Feedback Messages */}
        {(isLoading || error) && (
          <div className="w-full max-w-5xl mx-auto px-4 mt-4 flex-shrink-0">
             {isLoading && <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-700 flex items-center animate-pulse"><SpinnerIcon className="w-4 h-4 mr-2 animate-spin" /><span className="text-xs">{loadingMessage}</span></div>}
             {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700"><span className="text-xs">{error}</span></div>}
          </div>
        )}

        {/* Kanban Board - Takes remaining height */}
        <div className="flex-grow w-full max-w-7xl mx-auto py-4 overflow-hidden">
             <JobBoard 
                jobsByUserCategory={jobs} 
                onJobClick={setSelectedJob} 
                onMoveJob={moveJob} 
                onDeleteJob={handleDeleteJob} 
            />
        </div>
      </div>

      {selectedJob && (
        <JobDetailModal 
            job={selectedJob} 
            cvFile={settings.cvFile} 
            apiKey={process.env.API_KEY} 
            onClose={() => setSelectedJob(null)} 
        />
      )}
      
      {isSettingsOpen && (
        <SettingsModal 
            settings={settings} 
            onSave={setSettings} 
            onClose={() => setIsSettingsOpen(false)} 
            onClearData={handleClearData} 
        />
      )}
    </div>
  );
};

export default App;
