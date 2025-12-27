
import React, { useState } from 'react';
import { DownloadIcon } from './icons/DownloadIcon';
import { CogIcon } from './icons/CogIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { TrashIcon } from './icons/TrashIcon';

interface HeaderProps {
  onExportClick: () => void;
  onSettingsClick: () => void;
  onClearData: () => void;
  isLoading: boolean;
  hasJobs: boolean;
  onUniversalScrape: (url: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onExportClick, onSettingsClick, onClearData, hasJobs, isLoading, onUniversalScrape }) => {
  const [urlInput, setUrlInput] = useState('');

  const handleScrape = () => {
    if (urlInput.trim()) {
      onUniversalScrape(urlInput.trim());
      setUrlInput('');
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 flex-shrink-0 z-20 shadow-sm">
      <div className="h-16 px-3 md:px-6 flex items-center justify-between gap-2 md:gap-4">
        
        {/* Brand / Logo Area */}
        <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-8 h-8 md:w-9 md:h-9 bg-gradient-to-br from-indigo-600 to-blue-500 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    <path d="M11 8v6M8 11h6" strokeOpacity="0.5" />
                </svg>
            </div>
            <div className="flex flex-col hidden sm:flex">
                <h1 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight leading-none">AI Job Scraper</h1>
                <span className="text-[10px] text-slate-500 font-medium tracking-wide uppercase mt-0.5">Assistant de recherche</span>
            </div>
        </div>

        {/* Universal Scraper Input - Responsive */}
        <div className="flex-grow max-w-xl mx-auto flex items-center gap-2">
            <div className="relative w-full">
                <input 
                    type="text" 
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="URL d'offre..."
                    className="w-full h-9 md:h-10 pl-3 pr-2 md:px-4 rounded-lg bg-slate-100 border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm transition-all truncate"
                    onKeyDown={(e) => e.key === 'Enter' && handleScrape()}
                />
            </div>
            <button 
                onClick={handleScrape}
                disabled={isLoading || !urlInput.trim()}
                className="h-9 md:h-10 w-10 md:w-auto px-0 md:px-4 bg-indigo-600 text-white rounded-lg font-medium text-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all shadow-md flex-shrink-0"
            >
                {isLoading ? <SpinnerIcon className="w-4 h-4 animate-spin"/> : (
                    <>
                        <span className="hidden md:inline">Scanner</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </>
                )}
            </button>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-1 md:space-x-3 flex-shrink-0">
           {hasJobs && (
            <>
                <button
                onClick={onClearData}
                title="Tout supprimer"
                className="flex items-center justify-center p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-all duration-200"
                >
                <TrashIcon className="h-5 w-5 md:h-6 md:w-6" />
                </button>
                <button
                onClick={onExportClick}
                title="Exporter"
                className="flex items-center justify-center p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all duration-200"
                >
                <DownloadIcon className="h-5 w-5 md:h-6 md:w-6" />
                </button>
            </>
           )}

            <button
              onClick={onSettingsClick}
              title="Paramètres"
              className="flex items-center justify-center p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all duration-200"
            >
              <CogIcon className="h-5 w-5 md:h-6 md:w-6" />
            </button>
        </div>
      </div>
    </header>
  );
};
