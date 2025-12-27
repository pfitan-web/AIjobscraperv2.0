
import React from 'react';
import { CogIcon } from './icons/CogIcon';

interface SidebarProps {
  onSettingsClick: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onSettingsClick }) => {
  return (
    <div className="hidden md:flex flex-col w-20 lg:w-64 bg-slate-900 border-r border-slate-800 h-full flex-shrink-0 transition-all duration-300">
      {/* Logo Area */}
      <div className="h-16 flex items-center justify-center lg:justify-start lg:px-6 border-b border-slate-800">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0 relative overflow-hidden shadow-lg shadow-indigo-500/20 group-hover:bg-indigo-500 transition-colors">
            {/* Magnifying glass with integrated AI glyph */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              {/* Magnifying glass lens */}
              <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="2" />
              {/* Magnifying glass handle */}
              <path d="M15 15 L20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />

              {/* Stylized 'AI' glyph inside the lens */}
              <g transform="translate(6, 6)"> {/* Adjust position to be centered in lens */}
                {/* Letter A */}
                <path d="M2 7 L4 1 L6 7" stroke="#4DD0E1" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="3" y1="4" x2="5" y2="4" stroke="#4DD0E1" strokeWidth="0.8" strokeLinecap="round" />
                {/* Glowing dots on the 'A' (simulating circuitry) */}
                <circle cx="2" cy="7" r="0.4" fill="#4DD0E1" opacity="0.8" />
                <circle cx="4" cy="1" r="0.4" fill="#4DD0E1" opacity="0.8" />
                <circle cx="6" cy="7" r="0.4" fill="#4DD0E1" opacity="0.8" />
                
                {/* Letter I */}
                <line x1="8" y1="1" x2="8" y2="7" stroke="#4DD0E1" strokeWidth="0.8" strokeLinecap="round" />
                <circle cx="8" cy="1" r="0.4" fill="#4DD0E1" opacity="0.8" />
                <circle cx="8" cy="7" r="0.4" fill="#4DD0E1" opacity="0.8" />
              </g>
            </svg>
        </div>
        <span className="ml-3 font-bold text-lg text-white hidden lg:block tracking-tight font-sans">AI JobScraper</span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-6 px-2 space-y-2">
        <button className="w-full flex items-center justify-center lg:justify-start px-3 py-3 rounded-xl bg-indigo-600 text-white shadow-lg group">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          <span className="ml-3 font-medium hidden lg:block">Tableau</span>
        </button>
        
        {/* Placeholder Links for visual fidelity to design */}
        <button className="w-full flex items-center justify-center lg:justify-start px-3 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition group">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span className="ml-3 font-medium hidden lg:block">Statistiques</span>
        </button>
        
         <button className="w-full flex items-center justify-center lg:justify-start px-3 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition group">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
           <span className="ml-3 font-medium hidden lg:block">Actualités</span>
        </button>
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-slate-800">
        <button 
            onClick={onSettingsClick}
            className="w-full flex items-center justify-center lg:justify-start px-3 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition"
            aria-label="Paramètres"
        >
            <CogIcon className="h-6 w-6" />
            <span className="ml-3 font-medium hidden lg:block">Paramètres</span>
        </button>
      </div>
    </div>
  );
};
