import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, Clock, TrendingUp } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getApiUrl } from '../../lib/api';

interface CreditsCardProps {
  creditsCount: number;
  onOpenCreditsModal: () => void;
}

export const CreditsCard: React.FC<CreditsCardProps> = ({
  creditsCount,
  onOpenCreditsModal,
}) => {
  const { session } = useAuth();
  const [usedThisMonth, setUsedThisMonth] = useState(0);
  const accessToken = session?.access_token;

  useEffect(() => {
    // Fetch ledger to calculate this month's usage
    const fetchUsage = async () => {
      if (!accessToken) return;
      try {
        const res = await fetch(getApiUrl('/api/user/usage'), {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          const now = new Date();
          const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

          let used = 0;
          data.usage?.forEach((tx: any) => {
            if (tx.credits_deducted > 0 && new Date(tx.created_at).getTime() >= firstDay) {
              used += tx.credits_deducted;
            }
          });
          setUsedThisMonth(used);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchUsage();
  }, [accessToken, creditsCount]);

  const monthlyTotal = 20; // Default monthly allotment for Career Free Tier
  // For a simple calculation if they used X credits, their expiring is available credits. 
  // If available credits > monthlyTotal, only monthlyTotal - used expires.
  const expiring = Math.max(0, creditsCount);
  
  const nextResetDate = new Date();
  nextResetDate.setMonth(nextResetDate.getMonth() + 1);
  nextResetDate.setDate(1);
  
  const usagePercentage = Math.min(100, Math.round((usedThisMonth / monthlyTotal) * 100));

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-bold uppercase tracking-wider text-[#706C7C]">
          Credit Overview
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.25 }}
        className="rounded-2xl border border-[#292344] bg-[#151329] p-5 shadow-xl space-y-4 group hover:border-[#C6A75E]/30 transition-colors"
      >
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          {/* Active Balance */}
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#C6A75E]/15 border border-[#C6A75E]/30 text-[#E1C77A]">
              <Zap className="h-5 w-5 fill-[#C6A75E] text-[#C6A75E]" />
            </div>
            <div>
              <div className="text-2xl font-black text-[#F5F1E8] leading-tight">
                {creditsCount}
              </div>
              <div className="text-xs text-[#AAA6B7] font-semibold">Available Credits</div>
            </div>
          </div>
          
          <button
            onClick={onOpenCreditsModal}
            className="flex items-center gap-1.5 rounded-lg border border-[#292344] bg-[#1B1833] px-3 py-1.5 text-xs font-semibold text-[#F5F1E8] hover:bg-[#292344] transition-colors cursor-pointer self-start sm:self-center"
          >
            <TrendingUp className="h-3.5 w-3.5 text-[#C6A75E]" />
            View History
          </button>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5 pt-2 border-t border-[#292344]/50">
          <div className="flex justify-between text-xs">
            <span className="text-[#AAA6B7]">Usage this month</span>
            <span className="font-semibold text-[#F5F1E8]">{usedThisMonth} / {monthlyTotal}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[#0E0C1B] border border-[#292344]">
            <div 
              className="h-full bg-[#C6A75E] transition-all duration-500 rounded-full" 
              style={{ width: `${usagePercentage}%` }}
            />
          </div>
        </div>
        
        {/* Detail Stats */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="rounded-xl bg-[#0E0C1B] border border-[#292344] p-2.5 flex items-start gap-2">
            <Clock className="h-4 w-4 text-[#A94D4D] mt-0.5" />
            <div>
              <div className="text-xs font-bold text-[#F5F1E8]">{expiring}</div>
              <div className="text-[10px] text-[#706C7C]">Expiring Credits</div>
            </div>
          </div>
          <div className="rounded-xl bg-[#0E0C1B] border border-[#292344] p-2.5 flex items-start gap-2">
            <Zap className="h-4 w-4 text-[#4F9D69] mt-0.5" />
            <div>
              <div className="text-xs font-bold text-[#F5F1E8]">{nextResetDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</div>
              <div className="text-[10px] text-[#706C7C]">Next Credit Reset</div>
            </div>
          </div>
        </div>
        
      </motion.div>
    </div>
  );
};
