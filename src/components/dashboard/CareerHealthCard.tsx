import React from 'react';
import { motion } from 'framer-motion';
import { CareerHealthMetric } from '../../data/dashboardData';
import { scoreColor } from '../../lib/theme';

interface CareerHealthCardProps {
  metrics: CareerHealthMetric[];
}

export const CareerHealthCard: React.FC<CareerHealthCardProps> = ({ metrics }) => {
  return (
    <div className="space-y-2.5">
      <div className="text-[11px] font-bold uppercase tracking-wider text-[#706C7C]">
        Career Health
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {metrics.map((metric, idx) => {
          const radius = 18;
          const circumference = 2 * Math.PI * radius;
          const strokeDashoffset = circumference - (metric.score / metric.maxScore) * circumference;
          const dynamicColor = scoreColor(metric.score);

          return (
            <motion.div
              key={metric.id || idx}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.1 + idx * 0.04 }}
              whileHover={{ y: -2 }}
              className="rounded-2xl border border-[#292344] bg-[#151329] p-4 flex items-center gap-3.5 shadow-md transition-all hover:bg-[#1B1833] hover:border-[#C6A75E]/30"
            >
              {/* Circular Progress Ring */}
              <div className="relative h-12 w-12 shrink-0 flex items-center justify-center">
                <svg className="h-12 w-12 -rotate-90 transform" viewBox="0 0 44 44">
                  <circle
                    cx="22"
                    cy="22"
                    r={radius}
                    className="stroke-[#292344]"
                    strokeWidth="3.5"
                    fill="transparent"
                  />
                  <motion.circle
                    cx="22"
                    cy="22"
                    r={radius}
                    stroke={dynamicColor}
                    strokeWidth="3.5"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 0.8, delay: 0.15 + idx * 0.08, ease: 'easeOut' }}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>
              </div>

              {/* Text Meta */}
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-[#AAA6B7] truncate">
                  {metric.title}
                </div>
                <div className="text-sm font-bold text-[#F5F1E8] tracking-tight mt-0.5">
                  {metric.score}/{metric.maxScore}
                </div>
                <div
                  className="text-[11px] font-medium mt-0.5"
                  style={{ color: dynamicColor }}
                >
                  {metric.status}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
