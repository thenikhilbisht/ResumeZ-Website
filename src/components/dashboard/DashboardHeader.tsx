import React from 'react';
import { motion } from 'framer-motion';

interface DashboardHeaderProps {
  userName: string;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ userName }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-1.5"
    >
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F5F1E8] flex items-center gap-2">
        <span>Welcome back, {userName || 'Nikhil'}</span>
        <span className="inline-block hover:rotate-12 transition-transform cursor-default select-none">👋</span>
      </h1>
      <p className="text-sm text-[#AAA6B7] font-normal">
        Your career profile is looking good. Here's what needs your attention.
      </p>
    </motion.div>
  );
};
