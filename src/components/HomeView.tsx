import React from 'react';
import { 
  Sparkles, 
  FileText, 
  Github, 
  Code2, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  Zap, 
  Lock, 
  Cpu
} from 'lucide-react';
import { DEFAULT_PLANS } from '../data/sampleData';

interface HomeViewProps {
  onNavigate: (tab: string) => void;
  onOpenCreditsModal: () => void;
  onSelectPlan?: (planId: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate, onOpenCreditsModal, onSelectPlan }) => {
  return (
    <div className="space-y-16 pb-20 text-[#F5F1E8]">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-10 sm:pt-16">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#C6A75E]/30 bg-[#C6A75E]/10 px-4 py-1 text-xs font-semibold text-[#E1C77A]">
            <Sparkles className="h-3.5 w-3.5 text-[#C6A75E]" />
            <span>Next-Generation Career Intelligence & ATS Scoring</span>
          </div>

          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-[#F5F1E8] sm:text-6xl">
            Land Top Tech Interviews with{' '}
            <span className="text-[#E1C77A]">
              AI Precision
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base text-[#AAA6B7] sm:text-lg">
            ResumeZ is the unified career engineering toolkit: audit resumes against real ATS algorithms, craft high-impact bullet points with Google’s XYZ formula, and evaluate your GitHub & LeetCode readiness.
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button
              id="hero-ats-btn"
              onClick={() => onNavigate('ats-analyzer')}
              className="flex items-center gap-2 rounded-xl btn-gold-primary px-6 py-3.5 text-sm font-semibold cursor-pointer"
            >
              <Sparkles className="h-4 w-4 text-[#080711]" />
              <span>Analyze Resume for ATS (2 Credits)</span>
              <ArrowRight className="h-4 w-4 text-[#080711]" />
            </button>
            <button
              id="hero-builder-btn"
              onClick={() => onNavigate('builder')}
              className="flex items-center gap-2 rounded-xl btn-secondary-luxury px-6 py-3.5 text-sm font-semibold cursor-pointer"
            >
              <FileText className="h-4 w-4 text-[#C6A75E]" />
              <span>Open Resume Builder</span>
            </button>
          </div>

          {/* Trust & Architecture Badges */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-[#AAA6B7]">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-[#4F9D69]" />
              <span>Row-Level Security (RLS) Protected</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Lock className="h-4 w-4 text-[#6366A8]" />
              <span>Private Documents & Zero Data Leakage</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Cpu className="h-4 w-4 text-[#7C6BA8]" />
              <span>Gemini 2.0 / 1.5 Server-Side Intelligence</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-[#C6A75E]" />
              <span>100% Free ₹0 Starter Tier</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Core Pillars Grid */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-[#F5F1E8] sm:text-3xl">
            Comprehensive Career Optimization Suite
          </h2>
          <p className="mt-2 text-sm text-[#AAA6B7]">
            Engineered specifically for software engineers, product managers, and modern technical professionals.
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Feature 1: ATS Analyzer */}
          <div className="group relative rounded-2xl border border-[#292344] bg-[#151329] p-6 shadow-xl transition hover:border-[#C6A75E]/40 hover:bg-[#1B1833]">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#312E63]/40 border border-[#6366A8]/30 text-[#E1C77A]">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-base font-bold text-[#F5F1E8]">AI ATS Resume Analyzer</h3>
            <p className="mt-2 text-xs leading-relaxed text-[#AAA6B7]">
              Scans your resume against real recruiter job descriptions. Extracts hard skills, computes keyword density, and flags parsing vulnerabilities.
            </p>
            <div className="mt-4 flex items-center justify-between border-t border-[#292344] pt-3">
              <span className="text-[11px] font-semibold text-[#E1C77A]">Cost: 2 Credits</span>
              <button
                onClick={() => onNavigate('ats-analyzer')}
                className="text-xs font-semibold text-[#F5F1E8] flex items-center gap-1 hover:text-[#E1C77A] transition-colors cursor-pointer"
              >
                Launch <ArrowRight className="h-3 w-3 text-[#C6A75E]" />
              </button>
            </div>
          </div>

          {/* Feature 2: Resume Builder */}
          <div className="group relative rounded-2xl border border-[#292344] bg-[#151329] p-6 shadow-xl transition hover:border-[#C6A75E]/40 hover:bg-[#1B1833]">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#C6A75E]/15 border border-[#C6A75E]/30 text-[#C6A75E]">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-base font-bold text-[#F5F1E8]">Interactive Resume Builder</h3>
            <p className="mt-2 text-xs leading-relaxed text-[#AAA6B7]">
              Clean structured editor with live preview, typography & margin controls, multi-template switching, and 1-click Google XYZ formula bullet enhancer.
            </p>
            <div className="mt-4 flex items-center justify-between border-t border-[#292344] pt-3">
              <span className="text-[11px] font-semibold text-[#4F9D69]">Free drafts & export</span>
              <button
                onClick={() => onNavigate('builder')}
                className="text-xs font-semibold text-[#F5F1E8] flex items-center gap-1 hover:text-[#E1C77A] transition-colors cursor-pointer"
              >
                Launch <ArrowRight className="h-3 w-3 text-[#C6A75E]" />
              </button>
            </div>
          </div>

          {/* Feature 3: GitHub Analyzer */}
          <div className="group relative rounded-2xl border border-[#292344] bg-[#151329] p-6 shadow-xl transition hover:border-[#C6A75E]/40 hover:bg-[#1B1833]">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#312E63]/40 border border-[#6366A8]/30 text-[#6366A8]">
              <Github className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-base font-bold text-[#F5F1E8]">GitHub Portfolio Audit</h3>
            <p className="mt-2 text-xs leading-relaxed text-[#AAA6B7]">
              Analyzes your public repositories, code consistency, documentation standards, and project complexity to define your engineering archetype.
            </p>
            <div className="mt-4 flex items-center justify-between border-t border-[#292344] pt-3">
              <span className="text-[11px] font-semibold text-[#6366A8]">Cost: 1 Credit</span>
              <button
                onClick={() => onNavigate('github-analyzer')}
                className="text-xs font-semibold text-[#F5F1E8] flex items-center gap-1 hover:text-[#E1C77A] transition-colors cursor-pointer"
              >
                Launch <ArrowRight className="h-3 w-3 text-[#C6A75E]" />
              </button>
            </div>
          </div>

          {/* Feature 4: LeetCode Analyzer */}
          <div className="group relative rounded-2xl border border-[#292344] bg-[#151329] p-6 shadow-xl transition hover:border-[#C6A75E]/40 hover:bg-[#1B1833]">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#C49A4A]/15 border border-[#C49A4A]/30 text-[#C49A4A]">
              <Code2 className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-base font-bold text-[#F5F1E8]">LeetCode Interview Audit</h3>
            <p className="mt-2 text-xs leading-relaxed text-[#AAA6B7]">
              Assesses your algorithm solved distribution (Easy/Med/Hard), consistency rating, and provides a targeted 4-week FAANG roadmap.
            </p>
            <div className="mt-4 flex items-center justify-between border-t border-[#292344] pt-3">
              <span className="text-[11px] font-semibold text-[#C49A4A]">Cost: 1 Credit</span>
              <button
                onClick={() => onNavigate('leetcode-analyzer')}
                className="text-xs font-semibold text-[#F5F1E8] flex items-center gap-1 hover:text-[#E1C77A] transition-colors cursor-pointer"
              >
                Launch <ArrowRight className="h-3 w-3 text-[#C6A75E]" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Step Flow */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="rounded-3xl border border-[#292344] bg-[#0E0C1B] p-8 sm:p-12 shadow-2xl">
          <div className="text-center">
            <h2 className="text-xl font-bold text-[#F5F1E8] sm:text-2xl">How ResumeZ Works</h2>
            <p className="mt-1 text-xs text-[#AAA6B7]">From raw resume to interview shortlist in 3 simple steps</p>
          </div>

          <div className="mt-10 grid gap-8 md:grid-cols-3">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#C6A75E] font-bold text-[#080711] shadow-md">
                1
              </div>
              <h4 className="mt-4 text-sm font-bold text-[#F5F1E8]">Upload or Paste Resume</h4>
              <p className="mt-2 text-xs text-[#AAA6B7]">
                Provide your existing PDF/DOCX or build cleanly in our structured editor. Add target job descriptions.
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#312E63] border border-[#6366A8]/40 font-bold text-[#E1C77A] shadow-md">
                2
              </div>
              <h4 className="mt-4 text-sm font-bold text-[#F5F1E8]">Gemini ATS Algorithm Audit</h4>
              <p className="mt-2 text-xs text-[#AAA6B7]">
                Server-side AI analyzes keyword alignment, experience relevance, bullet metrics, and formatting red flags.
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#4F9D69] font-bold text-[#080711] shadow-md">
                3
              </div>
              <h4 className="mt-4 text-sm font-bold text-[#F5F1E8]">Optimize & Export Clean PDF</h4>
              <p className="mt-2 text-xs text-[#AAA6B7]">
                Apply 1-click Google XYZ bullet enhancements, verify ATS score improvements, and export clean print PDFs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Transparent Pricing Plans */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center">
          <span className="rounded-full bg-[#4F9D69]/15 border border-[#4F9D69]/30 px-3 py-1 text-xs font-semibold text-[#4F9D69]">
            Target ₹0 / Free Tier Deployment
          </span>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-[#F5F1E8] sm:text-3xl">
            Transparent, Server-Authoritative Credits
          </h2>
          <p className="mt-2 text-sm text-[#AAA6B7]">
            Start completely free with 10 monthly credits. Upgrade only when you need massive volume.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3 items-stretch">
          {DEFAULT_PLANS.map((plan) => {
            const isPro = plan.popular;
            return (
              <div
                key={plan.id}
                className={`relative flex flex-col justify-between rounded-2xl p-6 shadow-xl transition ${
                  isPro
                    ? 'card-luxury-premium'
                    : 'border border-[#292344] bg-[#151329]'
                }`}
              >
                <div className={isPro ? 'rounded-[17px] bg-[#151329] p-2' : ''}>
                  {isPro && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#C6A75E] to-[#E1C77A] px-3.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#080711] shadow-md">
                      Most Popular
                    </span>
                  )}

                  <div>
                    <h3 className="text-base font-bold text-[#F5F1E8]">{plan.name}</h3>
                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-[#E1C77A]">
                        ₹{plan.price_inr}
                      </span>
                      <span className="text-xs text-[#706C7C]">/ month</span>
                    </div>
                    <p className="mt-1 text-xs font-semibold text-[#C6A75E]">
                      {plan.monthly_credits} Credits / Month
                    </p>

                    <ul className="mt-6 space-y-2.5 text-xs text-[#AAA6B7]">
                      {plan.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-[#4F9D69]" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-8 pt-4 border-t border-[#292344]">
                    <button
                      onClick={() => {
                        if (plan.price_inr > 0 && onSelectPlan) {
                          onSelectPlan(plan.id);
                        } else {
                          onOpenCreditsModal();
                        }
                      }}
                      className={`w-full rounded-xl py-2.5 text-xs font-semibold transition cursor-pointer ${
                        isPro
                          ? 'btn-gold-primary'
                          : 'btn-secondary-luxury'
                      }`}
                    >
                      {plan.price_inr === 0 ? 'Active Free Plan' : `Upgrade to ${plan.name.split(' ')[0]}`}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
