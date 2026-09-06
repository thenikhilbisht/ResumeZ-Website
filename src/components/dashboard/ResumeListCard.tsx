import React from 'react';
import { motion } from 'framer-motion';
import { DashboardResumeItem } from '../../data/dashboardData';
import { scoreColor } from '../../lib/theme';

interface ResumeListCardProps {
  resumes: DashboardResumeItem[];
  onCreateNew: () => void;
  onViewResume: (resume: DashboardResumeItem) => void;
  onAnalyzeResume: (resume: DashboardResumeItem) => void;
}

export const ResumeListCard: React.FC<ResumeListCardProps> = ({
  resumes,
  onCreateNew,
  onViewResume,
  onAnalyzeResume,
}) => {
  return (
    <div className="space-y-2.5">
      <div className="text-[11px] font-bold uppercase tracking-wider text-[#706C7C]">
        Your Resumes
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.15 }}
        className="rounded-2xl border border-[#292344] bg-[#151329] p-5 sm:p-6 shadow-xl space-y-4"
      >
        <div className="divide-y divide-[#292344]">
          {resumes.map((resume, idx) => (
            <div
              key={resume.id || idx}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3.5 first:pt-0 last:pb-0 group"
            >
              {/* Left Details: Title | Updated time */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                <span className="font-semibold text-[#F5F1E8] group-hover:text-[#E1C77A] transition-colors">
                  {resume.title}
                </span>
                <span className="text-[#292344] hidden sm:inline">•</span>
                <span className="text-xs text-[#AAA6B7]">{resume.updatedTime}</span>
              </div>

              {/* Right Details: ATS Score & [ View ] [ Analyze ] */}
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5 font-medium">
                  <span className="text-[#AAA6B7]">ATS Score:</span>
                  <span
                    className="font-bold"
                    style={{ color: scoreColor(resume.atsScore) }}
                  >
                    {resume.atsScore}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onViewResume(resume)}
                    className="text-[#AAA6B7] hover:text-[#F5F1E8] transition-colors font-medium px-1 py-0.5 cursor-pointer"
                  >
                    [ View ]
                  </button>
                  <button
                    onClick={() => onAnalyzeResume(resume)}
                    className="text-[#C6A75E] hover:text-[#E1C77A] transition-colors font-semibold px-1 py-0.5 cursor-pointer"
                  >
                    [ Analyze ]
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Action: [ + Create New Resume ] */}
        <div className="pt-3 border-t border-[#292344]">
          <button
            id="dash-create-resume-link"
            onClick={onCreateNew}
            className="text-xs font-semibold text-[#C6A75E] hover:text-[#E1C77A] transition-colors cursor-pointer flex items-center gap-1"
          >
            [ + Create New Resume ]
          </button>
        </div>
      </motion.div>
    </div>
  );
};
