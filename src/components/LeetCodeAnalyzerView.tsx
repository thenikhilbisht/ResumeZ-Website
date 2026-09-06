import { useAuth } from '../contexts/AuthContext';
import React, { useState } from 'react';
import { getAuthHeaders } from '../lib/api';
import { 
  Code2, 
  Sparkles, 
  Coins, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Calendar
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { LeetCodeAnalysisResult, LeetCodeAnalysisRecord } from '../types';
import { scoreColor } from '../lib/theme';

interface LeetCodeAnalyzerViewProps {
  onAnalysisComplete: (analysis: LeetCodeAnalysisRecord) => void;
  creditsRemaining: number;
  onOpenCreditsModal: () => void;
}

export const LeetCodeAnalyzerView: React.FC<LeetCodeAnalyzerViewProps> = ({
  onAnalysisComplete,
  creditsRemaining,
  onOpenCreditsModal,
}) => {
  const { session } = useAuth();

  const [username, setUsername] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<LeetCodeAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAudit = async (targetUsername?: string) => {
    const userToAudit = (targetUsername || username).trim();
    if (!userToAudit) {
      setError('Please enter a LeetCode username');
      return;
    }

    if (creditsRemaining < 1) {
      onOpenCreditsModal();
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/analyze-leetcode', {
        method: 'POST',
        headers: getAuthHeaders(session?.access_token),
        body: JSON.stringify({ username: userToAudit }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to analyze LeetCode profile');
      }

      setResult(data.analysis.result_json);
      onAnalysisComplete(data.analysis);

      if (data.analysis.result_json.overall_score >= 80) {
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.7 },
        });
      }
    } catch (err: any) {
      setError(err.message || 'Error executing LeetCode analysis');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-16 text-[#F5F1E8]">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#292344] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#C49A4A]/20 border border-[#C49A4A]/40 text-[#E1C77A]">
              <Code2 className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#F5F1E8]">
              LeetCode & FAANG Algorithm Readiness Audit
            </h1>
          </div>
          <p className="mt-1 text-xs text-[#AAA6B7]">
            Evaluate problem-solving volume, Easy/Medium/Hard distribution, and get a structured 4-week interview roadmap.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-full bg-[#151329] border border-[#292344] px-3 py-1.5 text-xs font-semibold text-[#AAA6B7]">
            <Coins className="h-3.5 w-3.5 text-[#C6A75E]" />
            <span>Cost: 1 Credit</span>
          </div>
        </div>
      </div>

      {/* Input Section */}
      <div className="rounded-3xl border border-[#292344] bg-[#151329] p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter LeetCode username (e.g. alex_coder)"
              className="w-full rounded-xl border border-[#292344] bg-[#0E0C1B] px-4 py-2.5 text-xs font-medium text-[#F5F1E8] focus:border-[#C6A75E] focus:outline-none"
            />
          </div>

          <button
            id="run-leetcode-audit-btn"
            onClick={() => handleAudit()}
            disabled={isLoading}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl btn-gold-primary px-6 py-2.5 text-xs font-semibold shadow-lg shadow-[#C6A75E]/10 transition disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin text-[#080711]" />
                <span className="text-[#080711]">Auditing Algorithmic Stats...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 text-[#080711]" />
                <span className="text-[#080711]">Audit LeetCode (1 Credit)</span>
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-[#A94D4D]/40 bg-[#A94D4D]/15 p-3 text-xs text-[#F5F1E8]">
            {error}
          </div>
        )}
      </div>

      {/* Results Section */}
      {result && (
        <div className="space-y-6">
          {/* Top Scorecard */}
          <div className="rounded-3xl border border-[#292344] bg-[#151329] p-6 sm:p-8 shadow-2xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-[#F5F1E8]">
                    LeetCode Profile: {result.username}
                  </h2>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    result.readiness_assessment.faang_readiness_level === 'interview_ready'
                      ? 'bg-[#4F9D69]/15 border border-[#4F9D69]/30 text-[#4F9D69]'
                      : result.readiness_assessment.faang_readiness_level === 'advanced'
                      ? 'bg-[#6366A8]/20 border border-[#6366A8]/40 text-[#E1C77A]'
                      : 'bg-[#C49A4A]/20 border border-[#C49A4A]/40 text-[#E1C77A]'
                  }`}>
                    {result.readiness_assessment.faang_readiness_level.replace('_', ' ').toUpperCase()}
                  </span>
                </div>

                <p className="mt-1 text-xs text-[#AAA6B7]">
                  Consistency Rating: <span className="font-semibold capitalize text-[#F5F1E8]">{result.readiness_assessment.consistency_rating}</span>
                </p>
              </div>

              <div className="flex flex-col items-center bg-[#0E0C1B] rounded-2xl p-4 border border-[#292344] text-center min-w-[140px]">
                <span
                  className="text-3xl font-black"
                  style={{ color: scoreColor(result.overall_score) }}
                >
                  {result.overall_score}
                </span>
                <span className="text-[11px] font-bold text-[#706C7C]">
                  / 100 Algorithm Score
                </span>
              </div>
            </div>

            {/* Solved Distribution Counters */}
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-[#292344] pt-6">
              <div className="rounded-2xl border border-[#292344] bg-[#0E0C1B] p-4 text-center">
                <span className="text-2xl font-black text-[#F5F1E8]">
                  {result.problem_solving_summary.total_solved}
                </span>
                <p className="text-xs font-semibold text-[#AAA6B7] mt-0.5">Total Solved</p>
              </div>

              <div className="rounded-2xl border border-[#4F9D69]/30 bg-[#4F9D69]/10 p-4 text-center">
                <span className="text-2xl font-black text-[#4F9D69]">
                  {result.problem_solving_summary.easy_count}
                </span>
                <p className="text-xs font-semibold text-[#4F9D69] mt-0.5">Easy</p>
              </div>

              <div className="rounded-2xl border border-[#C49A4A]/30 bg-[#C49A4A]/10 p-4 text-center">
                <span className="text-2xl font-black text-[#E1C77A]">
                  {result.problem_solving_summary.medium_count}
                </span>
                <p className="text-xs font-semibold text-[#E1C77A] mt-0.5">Medium (FAANG Core)</p>
              </div>

              <div className="rounded-2xl border border-[#A94D4D]/30 bg-[#A94D4D]/10 p-4 text-center">
                <span className="text-2xl font-black text-[#A94D4D]">
                  {result.problem_solving_summary.hard_count}
                </span>
                <p className="text-xs font-semibold text-[#A94D4D] mt-0.5">Hard</p>
              </div>
            </div>
          </div>

          {/* 4-Week Targeted Study Plan */}
          <div className="rounded-3xl border border-[#292344] bg-[#151329] p-6 shadow-xl">
            <h3 className="text-sm font-bold text-[#F5F1E8] flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#C6A75E]" />
              Targeted Algorithm Practice Roadmap
            </h3>
            <p className="mt-1 text-xs text-[#AAA6B7]">
              High-yield patterns prioritized according to your identified knowledge gaps.
            </p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {result.targeted_study_plan.map((item, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-[#292344] bg-[#0E0C1B] p-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#F5F1E8]">
                        {item.topic}
                      </span>
                      <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                        item.priority === 'urgent'
                          ? 'bg-[#A94D4D]/20 border border-[#A94D4D]/30 text-[#A94D4D]'
                          : 'bg-[#C49A4A]/20 border border-[#C49A4A]/30 text-[#E1C77A]'
                      }`}>
                        {item.priority}
                      </span>
                    </div>

                    <div className="mt-3">
                      <span className="text-[11px] font-semibold text-[#706C7C]">Core Patterns:</span>
                      <ul className="mt-1 space-y-1 text-xs text-[#AAA6B7]">
                        {item.recommended_problem_types.map((p, idx) => (
                          <li key={idx} className="flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#C6A75E]" />
                            <span>{p}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Strengths & Gaps */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-[#292344] bg-[#151329] p-6 shadow-xl">
              <h3 className="text-sm font-bold text-[#F5F1E8] flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#4F9D69]" />
                Algorithmic Strengths
              </h3>
              <ul className="mt-3 space-y-2 text-xs text-[#AAA6B7]">
                {result.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#4F9D69] mt-1.5 shrink-0" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl border border-[#292344] bg-[#151329] p-6 shadow-xl">
              <h3 className="text-sm font-bold text-[#F5F1E8] flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-[#C49A4A]" />
                Identified Blindspots
              </h3>
              <ul className="mt-3 space-y-2 text-xs text-[#AAA6B7]">
                {result.gaps_identified.map((g, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#C49A4A] mt-1.5 shrink-0" />
                    <span>{g}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
