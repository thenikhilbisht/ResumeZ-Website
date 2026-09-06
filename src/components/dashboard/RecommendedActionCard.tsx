import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';

interface RecommendedActionCardProps {
  onActionClick: () => void;
}

export const RecommendedActionCard: React.FC<RecommendedActionCardProps> = ({ onActionClick }) => {
  return (
    <div className="space-y-2.5">
      <div className="text-[11px] font-bold uppercase tracking-wider text-[#706C7C]">
        Your Next Best Action
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        whileHover={{ y: -2 }}
        className="card-luxury-premium group overflow-hidden"
      >
        <div className="relative rounded-[17px] bg-[#151329] p-6 sm:p-7">
          {/* Eyebrow badge */}
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#E1C77A]">
            <Sparkles className="h-3.5 w-3.5 text-[#C6A75E] fill-[#C6A75E]/30" />
            <span>Recommended next step</span>
          </div>

          {/* Heading */}
          <h3 className="mt-2.5 text-lg sm:text-xl font-bold tracking-tight text-[#F5F1E8]">
            Improve your ATS resume score
          </h3>

          {/* Description */}
          <p className="mt-2 text-xs sm:text-sm text-[#AAA6B7] leading-relaxed max-w-2xl">
            Your resume matches 74% of the target job requirements. Adding 5 missing keywords could improve your score.
          </p>

          {/* Gold Primary Button */}
          <motion.button
            id="rec-action-improve-btn"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={onActionClick}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl btn-gold-primary py-3 px-4 text-sm font-semibold cursor-pointer"
          >
            <span>Improve Resume</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 text-[#080711]" />
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};
