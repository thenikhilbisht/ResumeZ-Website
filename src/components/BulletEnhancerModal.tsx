import { useAuth } from '../contexts/AuthContext';
import React, { useState } from 'react';
import { getAuthHeaders, getApiUrl } from '../lib/api';
import { Sparkles, X, Check, RefreshCw, AlertCircle, Coins } from 'lucide-react';
import { BulletEnhanceResponse } from '../types';

interface BulletEnhancerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialBullet: string;
  onApplyBullet: (newBullet: string) => void;
  creditsRemaining: number;
  onOpenCreditsModal: () => void;
}

export const BulletEnhancerModal: React.FC<BulletEnhancerModalProps> = ({
  isOpen,
  onClose,
  initialBullet,
  onApplyBullet,
  creditsRemaining,
  onOpenCreditsModal,
}) => {
  const { session, refreshProfile } = useAuth();

  const [bulletInput, setBulletInput] = useState<string>(initialBullet);
  const [targetRole, setTargetRole] = useState<string>('Senior Software Engineer');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<BulletEnhanceResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleEnhance = async () => {
    if (!bulletInput.trim()) {
      setError('Please provide a bullet point to enhance.');
      return;
    }

    if (creditsRemaining < 1) {
      onOpenCreditsModal();
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(getApiUrl('/api/ai/enhance-bullet'), {
        method: 'POST',
        headers: getAuthHeaders(session?.access_token),
        body: JSON.stringify({
          bullet_text: bulletInput,
          target_role: targetRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to enhance bullet point');
      }

      setResult(data.result);
      if (refreshProfile) {
        refreshProfile();
      }
    } catch (err: any) {
      setError(err.message || 'Error communicating with AI enhancer');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#080711]/80 backdrop-blur-md p-4">
      <div className="w-full max-w-2xl rounded-3xl border border-[#292344] bg-[#151329] p-6 shadow-2xl max-h-[90vh] overflow-y-auto text-[#F5F1E8]">
        <div className="flex items-center justify-between border-b border-[#292344] pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#C6A75E]/15 border border-[#C6A75E]/30 text-[#C6A75E]">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#F5F1E8]">
                Google XYZ Bullet Enhancer
              </h3>
              <p className="text-[11px] text-[#AAA6B7]">
                Formula: Accomplished [X] as measured by [Y], by doing [Z]
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 rounded-full bg-[#0E0C1B] border border-[#292344] px-2.5 py-1 text-[11px] font-semibold text-[#AAA6B7]">
              <Coins className="h-3 w-3 text-[#C6A75E]" />
              1 Credit
            </span>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-[#706C7C] hover:bg-[#1B1833] hover:text-[#F5F1E8] transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-[#A94D4D]/40 bg-[#A94D4D]/15 p-3 text-xs text-[#F5F1E8] flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-[#A94D4D]" />
            <span>{error}</span>
          </div>
        )}

        {/* Input area */}
        <div className="mt-4 space-y-3">
          <div>
            <label className="text-xs font-semibold text-[#AAA6B7]">Target Role</label>
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#292344] bg-[#0E0C1B] px-3 py-2 text-xs font-medium text-[#F5F1E8] focus:border-[#C6A75E] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#AAA6B7]">Original Bullet Point</label>
            <textarea
              rows={3}
              value={bulletInput}
              onChange={(e) => setBulletInput(e.target.value)}
              placeholder="e.g. Worked on database and made queries faster..."
              className="mt-1 w-full rounded-xl border border-[#292344] bg-[#0E0C1B] p-3 text-xs text-[#F5F1E8] focus:border-[#C6A75E] focus:outline-none font-mono"
            />
          </div>

          <button
            onClick={handleEnhance}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 rounded-xl btn-gold-primary py-2.5 text-xs font-semibold shadow-lg shadow-[#C6A75E]/10 transition disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#080711]" />
                <span className="text-[#080711]">Architecting Variations...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5 text-[#080711]" />
                <span className="text-[#080711]">Generate Google XYZ Variations (1 Credit)</span>
              </>
            )}
          </button>
        </div>

        {/* Result Area */}
        {result && (
          <div className="mt-6 space-y-4 pt-4 border-t border-[#292344]">
            {result.critique && (
              <div className="rounded-xl border border-[#C49A4A]/30 bg-[#C49A4A]/10 p-3 text-xs text-[#E1C77A]">
                <span className="font-bold">AI Diagnosis:</span> {result.critique}
              </div>
            )}

            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#706C7C]">
                Choose an Optimized Variation:
              </span>

              {result.variations.map((v, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-[#292344] bg-[#0E0C1B] p-4 hover:border-[#C6A75E]/40 transition flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-[#312E63] border border-[#6366A8]/40 px-2 py-0.5 text-[10px] font-bold text-[#E1C77A]">
                        {v.style}
                      </span>
                      <span className="text-[10px] text-[#AAA6B7]">Impact: {v.impact_metrics_highlighted}</span>
                    </div>
                    <p className="mt-2 text-xs font-medium text-[#F5F1E8] leading-relaxed">
                      "{v.enhanced_bullet}"
                    </p>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => {
                        onApplyBullet(v.enhanced_bullet);
                        onClose();
                      }}
                      className="flex items-center gap-1.5 rounded-lg btn-gold-primary px-3 py-1.5 text-xs font-semibold cursor-pointer"
                    >
                      <Check className="h-3.5 w-3.5 text-[#080711]" />
                      <span className="text-[#080711]">Apply to Resume</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
