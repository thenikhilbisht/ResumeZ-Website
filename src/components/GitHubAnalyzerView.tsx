import { useAuth } from '../contexts/AuthContext';
import React, { useState } from 'react';
import { getAuthHeaders } from '../lib/api';
import { 
  Github, 
  Sparkles, 
  Coins, 
  Star, 
  GitFork, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  BookOpen
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { GitHubAnalysisResult, GitHubAnalysisRecord } from '../types';
import { scoreColor } from '../lib/theme';

interface GitHubAnalyzerViewProps {
  onAnalysisComplete: (analysis: GitHubAnalysisRecord) => void;
  creditsRemaining: number;
  onOpenCreditsModal: () => void;
}

export const GitHubAnalyzerView: React.FC<GitHubAnalyzerViewProps> = ({
  onAnalysisComplete,
  creditsRemaining,
  onOpenCreditsModal,
}) => {
  const { session } = useAuth();

  const [username, setUsername] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<GitHubAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAudit = async (targetUsername?: string) => {
    const userToAudit = (targetUsername || username).trim();
    if (!userToAudit) {
      setError('Please provide a GitHub username');
      return;
    }

    if (creditsRemaining < 1) {
      onOpenCreditsModal();
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/analyze-github', {
        method: 'POST',
        headers: getAuthHeaders(session?.access_token),
        body: JSON.stringify({ username: userToAudit }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to analyze GitHub profile');
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
      setError(err.message || 'Error executing GitHub portfolio audit');
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
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#312E63] border border-[#6366A8]/40 text-[#E1C77A]">
              <Github className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#F5F1E8]">
              GitHub Portfolio & Code Quality Auditor
            </h1>
          </div>
          <p className="mt-1 text-xs text-[#AAA6B7]">
            Audit public repositories, commit patterns, README quality, and define your engineering archetype for tech recruiters.
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
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#706C7C]">@</span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter GitHub username (e.g. alexrivera)"
              className="w-full rounded-xl border border-[#292344] bg-[#0E0C1B] pl-8 pr-4 py-2.5 text-xs font-medium text-[#F5F1E8] focus:border-[#C6A75E] focus:outline-none"
            />
          </div>

          <button
            id="run-github-audit-btn"
            onClick={() => handleAudit()}
            disabled={isLoading}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl btn-gold-primary px-6 py-2.5 text-xs font-semibold shadow-lg shadow-[#C6A75E]/10 transition disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin text-[#080711]" />
                <span className="text-[#080711]">Auditing Repositories...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 text-[#080711]" />
                <span className="text-[#080711]">Audit GitHub (1 Credit)</span>
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
          {/* Top Profile Card */}
          <div className="rounded-3xl border border-[#292344] bg-[#151329] p-6 sm:p-8 shadow-2xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <img
                  src={result.profile_summary.avatar_url || `https://github.com/${result.username}.png`}
                  alt={result.username}
                  className="h-16 w-16 rounded-2xl border-2 border-[#C6A75E]/40 object-cover"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-[#F5F1E8]">
                      {result.profile_summary.name || result.username}
                    </h2>
                    <span className="text-xs text-[#AAA6B7]">@{result.username}</span>
                  </div>
                  <p className="mt-1 text-xs text-[#AAA6B7] max-w-md">
                    {result.profile_summary.bio || 'Public software engineering profile.'}
                  </p>

                  <div className="mt-3 flex items-center gap-2">
                    <span className="rounded-full bg-[#312E63] border border-[#6366A8]/40 px-3 py-0.5 text-xs font-bold text-[#E1C77A]">
                      Archetype: {result.developer_archetype}
                    </span>
                  </div>
                </div>
              </div>

              {/* Score Badge */}
              <div className="flex flex-col items-center bg-[#0E0C1B] rounded-2xl p-4 border border-[#292344] text-center min-w-[140px]">
                <span
                  className="text-3xl font-black"
                  style={{ color: scoreColor(result.overall_score) }}
                >
                  {result.overall_score}
                </span>
                <span className="text-[11px] font-bold text-[#706C7C]">
                  / 100 Quality Score
                </span>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-[#292344] pt-6 text-center">
              <div>
                <span className="text-lg font-bold text-[#E1C77A]">
                  {result.profile_summary.total_public_repos}
                </span>
                <p className="text-[11px] text-[#AAA6B7]">Public Repositories</p>
              </div>
              <div>
                <span className="text-lg font-bold text-[#E1C77A]">
                  {result.profile_summary.total_stars}
                </span>
                <p className="text-[11px] text-[#AAA6B7]">Total Stars</p>
              </div>
              <div>
                <span className="text-lg font-bold text-[#E1C77A]">
                  {result.profile_summary.followers}
                </span>
                <p className="text-[11px] text-[#AAA6B7]">Followers</p>
              </div>
              <div>
                <span className="text-lg font-bold text-[#E1C77A]">
                  {result.profile_summary.following}
                </span>
                <p className="text-[11px] text-[#AAA6B7]">Following</p>
              </div>
            </div>
          </div>

          {/* Top Repositories Reviewed */}
          <div className="rounded-3xl border border-[#292344] bg-[#151329] p-6 shadow-xl">
            <h3 className="text-sm font-bold text-[#F5F1E8] flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-[#C6A75E]" />
              Repository Quality & Documentation Reviews
            </h3>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {result.top_repositories_reviewed.map((repo, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-[#292344] bg-[#0E0C1B] p-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-[#F5F1E8] truncate">
                        {repo.name}
                      </h4>
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                        repo.readme_quality === 'comprehensive'
                          ? 'bg-[#4F9D69]/15 border border-[#4F9D69]/30 text-[#4F9D69]'
                          : 'bg-[#C6A75E]/15 border border-[#C6A75E]/30 text-[#E1C77A]'
                      }`}>
                        README: {repo.readme_quality}
                      </span>
                    </div>

                    <p className="mt-1 text-[11px] text-[#AAA6B7] line-clamp-2">
                      {repo.description}
                    </p>

                    <div className="mt-2 flex items-center gap-3 text-[11px] text-[#AAA6B7]">
                      <span className="font-semibold text-[#F5F1E8]">
                        {repo.language}
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-[#C6A75E]" /> {repo.stars}
                      </span>
                      <span className="flex items-center gap-1">
                        <GitFork className="h-3 w-3 text-[#706C7C]" /> {repo.forks}
                      </span>
                    </div>
                  </div>

                  <p className="mt-3 text-[11px] text-[#E1C77A] italic border-t border-[#292344] pt-2">
                    💡 {repo.insights}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Actionable Recommendations & Gaps */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Strengths & Weaknesses */}
            <div className="rounded-3xl border border-[#292344] bg-[#151329] p-6 shadow-xl space-y-4">
              <h3 className="text-sm font-bold text-[#F5F1E8]">
                Portfolio Assessment
              </h3>

              <div>
                <span className="text-xs font-bold text-[#4F9D69]">Strengths:</span>
                <ul className="mt-1 space-y-1 text-xs text-[#AAA6B7]">
                  {result.portfolio_strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#4F9D69] mt-0.5" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-2 border-t border-[#292344]">
                <span className="text-xs font-bold text-[#C49A4A]">Areas to Strengthen:</span>
                <ul className="mt-1 space-y-1 text-xs text-[#AAA6B7]">
                  {result.portfolio_weaknesses.map((w, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-[#C49A4A] mt-0.5" />
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Recruiter-Ready Suggestions */}
            <div className="rounded-3xl border border-[#292344] bg-[#151329] p-6 shadow-xl">
              <h3 className="text-sm font-bold text-[#F5F1E8]">
                High-Impact Optimization Steps
              </h3>

              <div className="mt-4 space-y-3">
                {result.actionable_recommendations.map((rec, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-[#292344] bg-[#0E0C1B] p-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#6366A8]">
                        {rec.area.replace('_', ' ')}
                      </span>
                      <span className={`rounded px-1.5 py-0.2 text-[9px] font-bold uppercase ${
                        rec.priority === 'high' ? 'bg-[#A94D4D]/20 border border-[#A94D4D]/30 text-[#A94D4D]' : 'bg-[#292344] text-[#AAA6B7]'
                      }`}>
                        {rec.priority} priority
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[#F5F1E8]">
                      {rec.suggestion}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
