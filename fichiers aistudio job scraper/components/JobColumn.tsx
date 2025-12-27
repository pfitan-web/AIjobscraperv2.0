
import React from 'react';
import { JobOffer, JobCategory } from '../types';
import { JobCard } from './JobCard';

interface JobColumnProps {
  category: JobCategory;
  jobs: JobOffer[];
  onJobClick: (job: JobOffer) => void;
  onMoveJob: (jobId: string, from: JobCategory, to: JobCategory) => void;
  onDeleteJob: (jobId: string, category: JobCategory) => void;
}

const categoryStyles: Record<JobCategory, { bg: string, text: string, dot: string, border: string }> = {
  [JobCategory.NEW]: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', border: 'border-blue-100' },
  [JobCategory.MATCH]: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', border: 'border-emerald-100' },
  [JobCategory.REVIEW]: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', border: 'border-amber-100' },
  [JobCategory.APPLIED]: { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500', border: 'border-purple-100' },
  [JobCategory.REJECTED]: { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400', border: 'border-slate-200' },
};

export const JobColumn: React.FC<JobColumnProps> = ({ category, jobs, onJobClick, onMoveJob, onDeleteJob }) => {
  const styles = categoryStyles[category];

  return (
    <div className="flex flex-col h-full p-2">
      <div className={`flex items-center justify-between mb-3 p-3 rounded-lg border ${styles.bg} ${styles.border}`}>
        <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${styles.dot} shadow-sm`}></div>
            <h2 className={`font-bold text-xs tracking-wider uppercase ${styles.text}`}>
            {category}
            </h2>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/60 ${styles.text}`}>
          {jobs.length}
        </span>
      </div>
      
      <div className="flex-grow overflow-y-auto custom-scrollbar pr-1 pb-1 space-y-3">
        {jobs.length > 0 ? jobs.map(job => (
          <JobCard 
            key={job.id} 
            job={job} 
            onJobClick={onJobClick} 
            onMoveJob={onMoveJob}
            onDeleteJob={onDeleteJob}
          />
        )) : (
            <div className="h-24 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center text-slate-400 text-xs italic">
                Aucune offre
            </div>
        )}
      </div>
    </div>
  );
};
