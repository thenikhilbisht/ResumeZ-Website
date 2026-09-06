import { useAuth } from '../contexts/AuthContext';
import React, { useState, useEffect } from 'react';
import { getAuthHeaders } from '../lib/api';
import { 
  X, 
  Coins, 
  CheckCircle2, 
  Clock, 
  Sparkles
} from 'lucide-react';
import { UsageBalance, CreditUsageRecord, Plan } from '../types';
import { DEFAULT_PLANS } from '../data/sampleData';

interface CreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  balance: UsageBalance | null;
  plans?: Plan[];
  onSelectPlan?: (planId: string) => void;
}

export const CreditsModal: React.FC<CreditsModalProps> = ({
  isOpen,
  onClose,
  balance,
  plans = DEFAULT_PLANS,
  onSelectPlan,
}) => {
  const { session, refreshProfile } = useAuth();

  const [usageHistory, setUsageHistory] = useState<CreditUsageRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'plans' | 'ledger'>('plans');
  const [, setIsLoading] = useState<boolean>(false);
  const [isRefilling, setIsRefilling] = useState<boolean>(false);
  const [refillStatus, setRefillStatus] = useState<string | null>(null);

  const fetchLedger = () => {
    setIsLoading(true);
    fetch('/api/user/usage', { headers: getAuthHeaders(session?.access_token) })
      .then((res) => res.json())
      .then((data) => {
        setUsageHistory(data.usage || []);
      })
      .catch((err) => console.error('Error fetching ledger:', err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    if (isOpen) {
      fetchLedger();
      setRefillStatus(null);
    }
  }, [isOpen]);

  const handleRefillCredits = async (amount: number, planName: string) => {
    setIsRefilling(true);
    setRefillStatus(null);
    try {
      const res = await fetch('/api/user/refill', {
        method: 'POST',
        headers: getAuthHeaders(session?.access_token),
        body: JSON.stringify({ amount, plan_name: planName }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setRefillStatus(`Added +${amount} credits! New balance: ${data.credits_remaining} credits.`);
        await refreshProfile();
        fetchLedger();
      } else {
        setRefillStatus(data.error || 'Failed to refill credits');
      }
    } catch (err: any) {
      console.error('Error refilling credits:', err);
      setRefillStatus(err.message || 'Error communicating with server');
    } finally {
      setIsRefilling(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#080711]/80 backdrop-blur-md p-4">
      <div className="w-full max-w-3xl rounded-3xl border border-[#292344] bg-[#151329] p-6 shadow-2xl max-h-[90vh] overflow-y-auto flex flex-col text-[#F5F1E8]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#292344] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#C6A75E]/15 border border-[#C6A75E]/30 text-[#C6A75E]">
              <Coins className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#F5F1E8]">
                Credits Balance & Usage Ledger
              </h3>
              <p className="text-xs text-[#AAA6B7]">
                Server-enforced credits protecting against client tampering and race conditions.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#706C7C] hover:bg-[#1B1833] hover:text-[#F5F1E8] transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Balance Highlight Meter */}
        <div className="mt-4 rounded-2xl bg-[#0E0C1B] border border-[#292344] p-5 text-[#F5F1E8] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-[#E1C77A]">Active Balance</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl font-black text-[#F5F1E8]">{balance?.credits_remaining ?? 0}</span>
              <span className="text-xs text-[#AAA6B7]">Credits available</span>
            </div>
            <p className="mt-1 text-[11px] text-[#706C7C]">
              Lifetime Consumed: {balance?.lifetime_credits_used ?? 0} Credits
            </p>
          </div>

          <div className="text-xs bg-[#151329] rounded-xl p-3 border border-[#292344] space-y-1">
            <div className="flex justify-between gap-4">
              <span className="text-[#AAA6B7]">ATS Resume Audit:</span>
              <span className="font-bold text-[#E1C77A]">2 Credits</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-[#AAA6B7]">GitHub Audit:</span>
              <span className="font-bold text-[#E1C77A]">1 Credit</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-[#AAA6B7]">LeetCode Audit:</span>
              <span className="font-bold text-[#E1C77A]">1 Credit</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-[#AAA6B7]">Google XYZ Bullet Rewrite:</span>
              <span className="font-bold text-[#E1C77A]">1 Credit</span>
            </div>
          </div>
        </div>

        {/* Refill status alert */}
        {refillStatus && (
          <div className="mt-3 flex items-center justify-between rounded-xl bg-[#4F9D69]/15 p-3 text-xs text-[#F5F1E8] border border-[#4F9D69]/30">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 shrink-0 text-[#4F9D69]" />
              <span>{refillStatus}</span>
            </div>
            <button
              onClick={() => setRefillStatus(null)}
              className="text-[11px] font-bold text-[#4F9D69] hover:underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Tab Toggle */}
        <div className="mt-4 flex border-b border-[#292344]">
          <button
            onClick={() => setActiveTab('plans')}
            className={`pb-2.5 text-xs font-bold border-b-2 px-4 transition cursor-pointer ${
              activeTab === 'plans'
                ? 'border-[#C6A75E] text-[#E1C77A]'
                : 'border-transparent text-[#706C7C] hover:text-[#F5F1E8]'
            }`}
          >
            Upgrade & Refill Plans
          </button>
          <button
            onClick={() => setActiveTab('ledger')}
            className={`pb-2.5 text-xs font-bold border-b-2 px-4 transition cursor-pointer ${
              activeTab === 'ledger'
                ? 'border-[#C6A75E] text-[#E1C77A]'
                : 'border-transparent text-[#706C7C] hover:text-[#F5F1E8]'
            }`}
          >
            Audit Ledger ({usageHistory.length})
          </button>
        </div>

        {/* Tab 1: Plans */}
        {activeTab === 'plans' && (
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {plans.map((p) => (
              <div
                key={p.id}
                className={`rounded-2xl border p-4 flex flex-col justify-between ${
                  p.popular
                    ? 'border-[#C6A75E] bg-[#1D1938]'
                    : 'border-[#292344] bg-[#0E0C1B]'
                }`}
              >
                <div>
                  <h4 className="text-xs font-bold text-[#F5F1E8]">{p.name}</h4>
                  <div className="mt-2 text-xl font-extrabold text-[#F5F1E8]">
                    ₹{p.price_inr}
                    <span className="text-xs font-normal text-[#706C7C]"> /mo</span>
                  </div>
                  <p className="text-xs font-bold text-[#E1C77A] mt-0.5">
                    {p.monthly_credits} Credits / mo
                  </p>

                  <ul className="mt-3 space-y-1 text-[11px] text-[#AAA6B7]">
                    {p.features.slice(0, 4).map((f, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#4F9D69]" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => {
                    if (p.price_inr > 0 && onSelectPlan) {
                      onSelectPlan(p.id);
                      onClose();
                    }
                  }}
                  disabled={p.price_inr === 0}
                  className={`mt-4 w-full rounded-xl py-2 text-xs font-semibold transition active:scale-95 cursor-pointer ${
                    p.price_inr === 0
                      ? 'border border-[#292344] bg-[#0E0C1B] text-[#706C7C] cursor-default'
                      : p.popular
                      ? 'btn-gold-primary'
                      : 'border border-[#C6A75E]/40 bg-[#151329] text-[#E1C77A] hover:bg-[#C6A75E]/10'
                  }`}
                >
                  {p.price_inr > 0 ? `Upgrade to ${p.name.split(' ')[0]}` : 'Current Starter Plan'}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: Ledger */}
        {activeTab === 'ledger' && (
          <div className="mt-4 space-y-2 max-h-[350px] overflow-y-auto">
            {usageHistory.length === 0 ? (
              <p className="text-center py-8 text-xs text-[#706C7C]">No usage recorded yet.</p>
            ) : (
              usageHistory.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl border border-[#292344] bg-[#0E0C1B] p-3 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <Clock className="h-4 w-4 text-[#706C7C]" />
                    <div>
                      <span className="font-semibold text-[#F5F1E8] capitalize">
                        {item.feature.replace(/_/g, ' ')}
                      </span>
                      <p className="text-[10px] text-[#706C7C]">
                        {new Date(item.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <span className={`font-bold ${item.credits_deducted > 0 ? 'text-[#A94D4D]' : 'text-[#4F9D69]'}`}>
                    {item.credits_deducted > 0 ? `-${item.credits_deducted}` : `+${Math.abs(item.credits_deducted)}`} Credits
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CreditsModal;
