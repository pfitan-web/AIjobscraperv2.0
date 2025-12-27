
import React, { useState } from 'react';
import { JobOffer, JobCategory } from '../types';
import { TrashIcon } from './icons/TrashIcon';
import { LightningIcon } from './icons/LightningIcon';

interface ScoreDisplayProps {
  score?: number;
}

const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ score }) => {
  if (score === undefined || score === null) return null;

  let colorClass = 'text-slate-600 bg-slate-100';
  if (score >= 80) colorClass = 'text-emerald-700 bg-emerald-100';
  else if (score >= 60) colorClass = 'text-amber-700 bg-amber-100';
  else colorClass = 'text-red-700 bg-red-100';

  return (
    <div className={`flex-shrink-0 px-2.5 py-1 rounded-lg text-xs font-bold ${colorClass}`}>
      {score}%
    </div>
  );
};

interface JobCardProps {
  job: JobOffer;
  onJobClick: (job: JobOffer) => void;
  onMoveJob: (jobId: string, from: JobCategory, to: JobCategory) => void;
  onDeleteJob: (jobId: string, category: JobCategory) => void;
}

export const JobCard: React.FC<JobCardProps> = ({ job, onJobClick, onDeleteJob }) => {
  const { title, company, location, source, score, reasoning, contractType, salaryRange, logoUrl, isEasyApply } = job;
  const [imgError, setImgError] = useState(false);
  
  const isAnalyzing = (job as any).isAnalyzing;

  if (isAnalyzing) {
    return (
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 relative overflow-hidden">
         <div className="animate-pulse flex flex-col space-y-3">
            <div className="flex gap-3">
                <div className="w-10 h-10 bg-slate-200 rounded-lg flex-shrink-0"></div>
                <div className="flex-grow space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                    <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                </div>
            </div>
            <div className="flex gap-2 mt-2">
                <div className="h-5 bg-slate-100 rounded w-16"></div>
                <div className="h-5 bg-slate-100 rounded w-16"></div>
            </div>
         </div>
      </div>
    );
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteJob(job.id, job.category);
  };

  // Génération d'une initiale pour le fallback logo
  const companyInitial = company ? company.charAt(0).toUpperCase() : '?';

  return (
    <div 
      onClick={() => onJobClick(job)}
      className="bg-white p-3 md:p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-indigo-200 transition-all duration-200 cursor-pointer group relative"
    >
      <div className="flex gap-3 mb-3">
        {/* Logo Section */}
        <div className="flex-shrink-0 pt-1">
            {logoUrl && !imgError ? (
                <img 
                    src={logoUrl} 
                    alt={company} 
                    className="w-10 h-10 md:w-11 md:h-11 rounded-lg object-contain bg-white border border-slate-100 p-0.5"
                    onError={() => setImgError(true)}
                />
            ) : (
                <div className="w-10 h-10 md:w-11 md:h-11 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-300/50 flex items-center justify-center text-slate-500 font-bold text-lg shadow-inner">
                    {companyInitial}
                </div>
            )}
        </div>

        {/* Header Content Section */}
        <div className="flex-grow min-w-0">
             <div className="flex justify-between items-start gap-1">
                <h3 className="font-semibold text-slate-800 text-sm leading-snug line-clamp-2 pr-6" title={title}>
                    {title}
                </h3>
                {score !== undefined ? (
                    <ScoreDisplay score={score} />
                ) : (
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded-md font-medium">New</span>
                )}
            </div>
            
            <div className="mt-1">
                <p className="text-xs font-medium text-slate-600 truncate">{company}</p>
                <p className="text-[11px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                    {location} 
                    <span className="w-0.5 h-0.5 bg-slate-300 rounded-full"></span> 
                    {source}
                </p>
            </div>
        </div>
      </div>

      {/* Tags Section */}
      <div className="flex flex-wrap gap-2 mb-3">
           {isEasyApply && (
               <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded border border-blue-100 flex items-center gap-1 font-medium">
                   <LightningIcon className="w-3 h-3" />
                   Rapide
               </span>
           )}
           {contractType && (
            <span className="text-[10px] px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-100">
                {contractType}
            </span>
           )}
           {salaryRange && (
             <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded border border-emerald-100 truncate max-w-full">
                {salaryRange}
            </span>
           )}
      </div>

      {reasoning && (
         <p className="text-xs text-slate-500 line-clamp-2 bg-slate-50/80 p-2 rounded-lg border border-slate-100 italic">
            "{reasoning}"
         </p>
      )}

      {/* Delete Button (Visible on hover on desktop, smaller on mobile) */}
      <button 
        onClick={handleDelete}
        className="absolute bottom-2 right-2 p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full opacity-100 md:opacity-0 group-hover:opacity-100 transition-all z-10"
        title="Supprimer cette offre"
      >
        <TrashIcon className="w-4 h-4" />
      </button>
    </div>
  );
};
