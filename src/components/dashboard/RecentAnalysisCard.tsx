import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { RecentAnalysisItem } from '../../data/dashboardData';

interface RecentAnalysisCardProps {
  analyses: RecentAnalysisItem[];
}

export const RecentAnalysisCard: React.FC<RecentAnalysisCardProps> = ({ analyses }) => {
  return (
    <div className="space-y-2.5">
      <div className="text-[11px] font-bold uppercase tracking-wider text-[#706C7C]">
        Recent Analyses
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.2 }}
        className="rounded-2xl border border-[#292344] bg-[#151329] p-5 shadow-xl space-y-4"
      >
        <div className="space-y-3.5">
          {analyses.map((item, idx) => (
            <div key={item.id || idx} className="space-y-1 group">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-[#4F9D69] shrink-0 stroke-[2.5]" />
                  <span className="font-semibold text-[#F5F1E8] group-hover:text-[#E1C77A] transition-colors">
                    {item.title}
                  </span>
                </div>
                <span className="text-[#706C7C] text-[11px]">{item.timestamp}</span>
              </div>
              <p className="text-[11px] text-[#AAA6B7] pl-5.5 truncate">
                {item.subtitle}
              </p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
