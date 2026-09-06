import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Target, Github, Code2 } from 'lucide-react';

interface QuickActionsProps {
  onNavigate: (tab: string) => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ onNavigate }) => {
  const actions = [
    {
      id: 'builder',
      label: 'Create Resume',
      icon: Plus,
      tab: 'builder',
      color: '#C6A75E',
    },
    {
      id: 'ats',
      label: 'Analyze Resume',
      icon: Target,
      tab: 'ats-analyzer',
      color: '#6366A8',
    },
    {
      id: 'github',
      label: 'Audit GitHub',
      icon: Github,
      tab: 'github-analyzer',
      color: '#6366A8',
    },
    {
      id: 'leetcode',
      label: 'Check LeetCode',
      icon: Code2,
      tab: 'leetcode-analyzer',
      color: '#C49A4A',
    },
  ];

  return (
    <div className="space-y-2.5">
      <div className="text-[11px] font-bold uppercase tracking-wider text-[#706C7C]">
        Quick Actions
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
        {actions.map((action, idx) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={action.id}
              id={`quick-action-${action.id}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.15 + idx * 0.04 }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onNavigate(action.tab)}
              className="flex items-center justify-center gap-2 rounded-xl border border-[#292344] bg-[#151329] px-4 py-3.5 text-xs sm:text-sm font-medium text-[#F5F1E8] shadow-md transition-all hover:border-[#C6A75E]/35 hover:bg-[#1B1833] hover:text-[#E1C77A] group cursor-pointer"
            >
              <Icon
                className="h-4 w-4 text-[#AAA6B7] group-hover:text-[#E1C77A] transition-colors shrink-0"
              />
              <span className="whitespace-nowrap">{action.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
