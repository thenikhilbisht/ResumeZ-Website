import React from 'react';
import { motion } from 'framer-motion';
import { DashboardStatItem } from '../../data/dashboardData';

interface StatsOverviewProps {
  stats: DashboardStatItem[];
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ stats }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.05 }}
      className="relative overflow-hidden rounded-2xl border border-[#292344] bg-[#151329] shadow-xl transition-all hover:border-[#C6A75E]/30"
    >
      <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[#292344]">
        {stats.map((stat, idx) => (
          <div
            key={stat.id || idx}
            className="group relative flex flex-col items-center justify-center p-6 text-center transition-colors hover:bg-[#1B1833]"
          >
            <span className="text-xs font-medium text-[#AAA6B7] tracking-wider">
              {stat.label}
            </span>
            <div className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-[#E1C77A] group-hover:scale-105 transition-transform duration-200">
              {stat.value === 'N/A' ? <span className="text-sm font-normal text-[#706C7C]">No score yet</span> : stat.value}
            </div>
            {/* Subtle bottom gold highlight on hover */}
            <div className="absolute inset-x-8 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-[#C6A75E]/0 group-hover:via-[#C6A75E]/40 to-transparent transition-all duration-300" />
          </div>
        ))}
      </div>
    </motion.div>
  );
};
