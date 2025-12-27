
import React from 'react';
import { JobOffer, JobCategory } from '../types';
import { JobColumn } from './JobColumn';

interface JobBoardProps {
  jobsByUserCategory: Record<JobCategory, JobOffer[]>;
  onJobClick: (job: JobOffer) => void;
  onMoveJob: (jobId: string, from: JobCategory, to: JobCategory) => void;
  onDeleteJob: (jobId: string, category: JobCategory) => void;
}

export const JobBoard: React.FC<JobBoardProps> = ({ jobsByUserCategory, onJobClick, onMoveJob, onDeleteJob }) => {
  const categories = Object.values(JobCategory);

  return (
    <div className="flex gap-4 md:gap-6 h-full w-full overflow-x-auto overflow-y-hidden snap-x snap-mandatory px-4 md:px-6 pb-4 items-start custom-scrollbar">
      {categories.map(category => (
        <div key={category} className="flex-shrink-0 w-[85vw] sm:w-80 md:w-96 flex flex-col h-full snap-center md:snap-align-none bg-slate-50/50 rounded-xl border border-slate-200/60 shadow-sm transition-all">
            <JobColumn
              category={category}
              jobs={jobsByUserCategory[category]}
              onJobClick={onJobClick}
              onMoveJob={onMoveJob}
              onDeleteJob={onDeleteJob}
            />
        </div>
      ))}
      {/* Spacer to ensure the last column has right margin when scrolling */}
      <div className="w-2 flex-shrink-0"></div>
    </div>
  );
};
