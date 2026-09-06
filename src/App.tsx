import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { Navbar } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { ViewLoadingFallback } from './components/ViewLoadingFallback';
import { NotFoundView } from './components/NotFoundView';
import { CreditsModal } from './components/CreditsModal';

// Resilient dynamic import helper with automatic retry and chunk invalidation recovery
function lazyWithRetry<T extends React.ComponentType<any>>(
  factory: () => Promise<any>,
  namedExport?: string
) {
  return lazy(async () => {
    try {
      const mod = await factory();
      if (namedExport && mod[namedExport]) {
        return { default: mod[namedExport] };
      }
      return mod.default ? mod : { default: mod[Object.keys(mod)[0]] };
    } catch (error: any) {
      console.warn('Dynamic chunk import failed, retrying once...', error);
      await new Promise((resolve) => setTimeout(resolve, 400));
      try {
        const mod = await factory();
        if (namedExport && mod[namedExport]) {
          return { default: mod[namedExport] };
        }
        return mod.default ? mod : { default: mod[Object.keys(mod)[0]] };
      } catch (retryError: any) {
        const isChunkError =
          error?.message?.includes('Failed to fetch dynamically imported module') ||
          error?.message?.includes('dynamically imported module') ||
          error?.name === 'ChunkLoadError';
        const hasReloaded = sessionStorage.getItem('chunk_reload_attempt');
        if (isChunkError && !hasReloaded) {
          sessionStorage.setItem('chunk_reload_attempt', 'true');
          window.location.reload();
          return new Promise(() => {});
        }
        sessionStorage.removeItem('chunk_reload_attempt');
        throw retryError;
      }
    }
  });
}

const DashboardView = lazyWithRetry(() => import('./components/DashboardView'), 'DashboardView');
const ResumeAnalyzerView = lazyWithRetry(() => import('./components/ResumeAnalyzerView'), 'ResumeAnalyzerView');
const ResumeBuilderView = lazyWithRetry(() => import('./components/ResumeBuilderView'), 'ResumeBuilderView');
const GitHubAnalyzerView = lazyWithRetry(() => import('./components/GitHubAnalyzerView'), 'GitHubAnalyzerView');
const LeetCodeAnalyzerView = lazyWithRetry(() => import('./components/LeetCodeAnalyzerView'), 'LeetCodeAnalyzerView');
const AdminView = lazyWithRetry(() => import('./components/AdminView'), 'AdminView');
const ProfileSettingsView = lazyWithRetry(() => import('./components/ProfileSettingsView'), 'ProfileSettingsView');
const CheckoutPaymentView = lazyWithRetry(() => import('./components/CheckoutPaymentView'), 'CheckoutPaymentView');
const Chatbot = lazyWithRetry(() => import('./components/Chatbot'), 'Chatbot');
const AuthView = lazyWithRetry(() => import('./components/AuthView'), 'AuthView');

import { 
  ResumeDocument, 
  ResumeAnalysisRecord, 
  GitHubAnalysisRecord, 
  LeetCodeAnalysisRecord,
  UserProfile
} from './types';

import { useAuth } from './contexts/AuthContext';
import { getAuthHeaders, getApiUrl } from './lib/api';
import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Route Mapping Utilities
const tabToPath: Record<string, string> = {
  home: '/',
  dashboard: '/dashboard',
  'ats-analyzer': '/ats-analyzer',
  builder: '/builder',
  'github-analyzer': '/github-analyzer',
  'leetcode-analyzer': '/leetcode-analyzer',
  admin: '/admin',
  settings: '/settings',
  checkout: '/checkout',
  auth: '/login',
};

const pathToTab = (pathname: string): string => {
  const clean = pathname.toLowerCase().replace(/\/$/, '') || '/';
  if (clean === '/') return 'home';
  if (clean === '/dashboard') return 'dashboard';
  if (clean === '/ats-analyzer') return 'ats-analyzer';
  if (clean === '/builder') return 'builder';
  if (clean === '/github-analyzer') return 'github-analyzer';
  if (clean === '/leetcode-analyzer') return 'leetcode-analyzer';
  if (clean === '/admin') return 'admin';
  if (clean === '/settings') return 'settings';
  if (clean === '/checkout') return 'checkout';
  if (clean === '/login' || clean === '/auth' || clean === '/signup') return 'auth';
  return 'not-found';
};

const PROTECTED_TABS = new Set([
  'dashboard',
  'ats-analyzer',
  'builder',
  'github-analyzer',
  'leetcode-analyzer',
  'admin',
  'settings',
  'checkout',
]);

export default function App() {
  const [activeTab, setActiveTab] = useState<string>(() => pathToTab(window.location.pathname));
  const { session, profile, balance, isLoading, signOut, refreshProfile } = useAuth();

  const [resumes, setResumes] = useState<ResumeDocument[]>([]);
  const [analyses, setAnalyses] = useState<ResumeAnalysisRecord[]>([]);
  const [githubAnalyses, setGithubAnalyses] = useState<GitHubAnalysisRecord[]>([]);
  const [leetcodeAnalyses, setLeetcodeAnalyses] = useState<LeetCodeAnalysisRecord[]>([]);
  const [selectedResumeToEdit, setSelectedResumeToEdit] = useState<ResumeDocument | null>(null);
  const [isCreditsModalOpen, setIsCreditsModalOpen] = useState<boolean>(false);
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<string>('pro');

  // Navigate with browser history synchronization
  const navigateTo = useCallback((tab: string, replace = false) => {
    setActiveTab(tab);
    const targetPath = tabToPath[tab] || '/';
    if (window.location.pathname !== targetPath) {
      if (replace) {
        window.history.replaceState({ tab }, '', targetPath);
      } else {
        window.history.pushState({ tab }, '', targetPath);
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Listen for browser Back and Forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const tab = pathToTab(window.location.pathname);
      setActiveTab(tab);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const isAuthenticated = Boolean(session);
  const userAccessToken = session?.access_token;

  // Synchronize initial route after auth resolves
  useEffect(() => {
    if (isLoading) return;

    const currentTab = pathToTab(window.location.pathname);

    if (isAuthenticated) {
      // Authenticated user
      if (currentTab === 'auth') {
        navigateTo('dashboard', true);
      } else if (currentTab === 'home' && window.location.pathname === '/') {
        // If logged in and on root, send to dashboard
        navigateTo('dashboard', true);
      } else if (currentTab === 'not-found') {
        setActiveTab('not-found');
      } else {
        setActiveTab(currentTab);
      }
    } else {
      // Unauthenticated user
      if (PROTECTED_TABS.has(currentTab)) {
        // Redirect to login if trying to access protected route
        setActiveTab('auth');
      } else if (currentTab === 'not-found') {
        setActiveTab('not-found');
      } else if (currentTab === 'auth') {
        setActiveTab('auth');
      } else {
        setActiveTab('home');
      }
    }
  }, [isAuthenticated, isLoading, navigateTo]);

  // Load user data ONLY when authenticated
  const loadUserData = useCallback(async () => {
    if (!userAccessToken) {
      setResumes([]);
      setAnalyses([]);
      setGithubAnalyses([]);
      setLeetcodeAnalyses([]);
      return;
    }

    try {
      const headers = getAuthHeaders(userAccessToken);
      const [resumesRes, analysesRes] = await Promise.allSettled([
        fetch(getApiUrl('/api/resumes'), { headers }),
        fetch(getApiUrl('/api/analyses'), { headers }),
      ]);

      if (resumesRes.status === 'fulfilled' && resumesRes.value.ok) {
        const resumesData = await resumesRes.value.json();
        setResumes(resumesData.resumes || []);
      }

      if (analysesRes.status === 'fulfilled' && analysesRes.value.ok) {
        const analysesData = await analysesRes.value.json();
        setAnalyses(analysesData.resume_analyses || []);
        setGithubAnalyses(analysesData.github_analyses || []);
        setLeetcodeAnalyses(analysesData.leetcode_analyses || []);
      }
    } catch (err) {
      console.warn('[App] Notice while fetching user data:', err);
    }
  }, [userAccessToken]);

  useEffect(() => {
    if (userAccessToken) {
      loadUserData();
    }
  }, [userAccessToken, loadUserData]);

  const handleOpenCheckout = (planId: string) => {
    setSelectedPlanForCheckout(planId);
    navigateTo('checkout');
  };

  const handleLogout = async () => {
    await signOut();
    setResumes([]);
    setAnalyses([]);
    setGithubAnalyses([]);
    setLeetcodeAnalyses([]);
    navigateTo('home', true);
  };

  // Resume builder saving
  const handleSaveResume = async (resumeData: Partial<ResumeDocument>) => {
    if (!session?.access_token) return;

    if (resumeData.id) {
      const res = await fetch(getApiUrl(`/api/resumes/${resumeData.id}`), {
        method: 'PUT',
        headers: getAuthHeaders(session.access_token),
        body: JSON.stringify(resumeData),
      });
      if (res.ok) {
        const data = await res.json();
        setResumes((prev) => prev.map((r) => (r.id === data.resume.id ? data.resume : r)));
      }
    } else {
      const res = await fetch(getApiUrl('/api/resumes'), {
        method: 'POST',
        headers: getAuthHeaders(session.access_token),
        body: JSON.stringify(resumeData),
      });
      if (res.ok) {
        const data = await res.json();
        setResumes((prev) => [data.resume, ...prev]);
        setSelectedResumeToEdit(data.resume);
      }
    }
  };

  const handleDeleteResume = async (id: string) => {
    if (!session?.access_token) return;
    const res = await fetch(getApiUrl(`/api/resumes/${id}`), {
      method: 'DELETE',
      headers: getAuthHeaders(session.access_token),
    });
    if (res.ok) {
      setResumes((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const handleUpdateProfile = async (data: Partial<UserProfile>) => {
    if (!session?.access_token) return;
    const res = await fetch(getApiUrl('/api/user/profile'), {
      method: 'PUT',
      headers: getAuthHeaders(session.access_token),
      body: JSON.stringify(data),
    });
    if (res.ok) {
      await refreshProfile();
      return { success: true };
    } else {
      const err = await res.json();
      throw new Error(err.error || err.message || 'Failed to update profile');
    }
  };

  const handleDeleteAccount = async () => {
    if (!session?.access_token) return;
    const res = await fetch(getApiUrl('/api/user/account'), {
      method: 'DELETE',
      headers: getAuthHeaders(session.access_token),
    });
    if (res.ok) {
      await signOut();
      navigateTo('home', true);
    } else {
      const err = await res.json();
      throw new Error(err.error || err.message || 'Failed to delete account');
    }
  };

  const handleATSComplete = (newAnalysis: ResumeAnalysisRecord) => {
    setAnalyses((prev) => [newAnalysis, ...prev]);
    refreshProfile();
  };

  const handleGitHubComplete = (newAnalysis: GitHubAnalysisRecord) => {
    setGithubAnalyses((prev) => [newAnalysis, ...prev]);
    refreshProfile();
  };

  const handleLeetCodeComplete = (newAnalysis: LeetCodeAnalysisRecord) => {
    setLeetcodeAnalyses((prev) => [newAnalysis, ...prev]);
    refreshProfile();
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080711] text-[#F5F1E8]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-[#C6A75E]" />
          <p className="text-sm text-[#AAA6B7]">Checking your session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080711] text-[#F5F1E8] flex flex-col selection:bg-[#C6A75E] selection:text-[#080711]">
      {/* Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={navigateTo}
        user={profile}
        balance={balance}
        onSwitchRole={undefined as any}
        onLogout={handleLogout}
        onOpenCreditsModal={() => setIsCreditsModalOpen(true)}
      />

      <AnimatePresence mode="wait">
        {!session && activeTab !== 'home' ? (
          <motion.div
            key="auth-view"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="flex-1 w-full"
          >
            <Suspense fallback={<ViewLoadingFallback />}>
              <AuthView />
            </Suspense>
          </motion.div>
        ) : (
          <motion.main
            key={`main-${activeTab}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className={`flex-1 w-full mx-auto ${
              activeTab === 'dashboard' ? 'max-w-[1440px] px-0' : 'max-w-7xl px-4 pt-6 sm:px-6 lg:px-8'
            }`}
          >
            <Suspense fallback={<ViewLoadingFallback />}>
              {activeTab === 'home' && (
                <HomeView
                  onNavigate={navigateTo}
                  onOpenCreditsModal={() => {
                    if (session) {
                      setIsCreditsModalOpen(true);
                    } else {
                      navigateTo('auth');
                    }
                  }}
                  onSelectPlan={(planId) => {
                    if (session) {
                      handleOpenCheckout(planId);
                    } else {
                      navigateTo('auth');
                    }
                  }}
                />
              )}

              {activeTab === 'dashboard' && (
                <DashboardView
                  user={profile}
                  balance={balance}
                  resumes={resumes}
                  analyses={analyses}
                  githubAnalyses={githubAnalyses}
                  leetcodeAnalyses={leetcodeAnalyses}
                  onNavigate={navigateTo}
                  onSelectResumeToEdit={(resume) => {
                    setSelectedResumeToEdit(resume);
                    navigateTo('builder');
                  }}
                  onViewAnalysisReport={() => {
                    navigateTo('ats-analyzer');
                  }}
                  onDeleteResume={handleDeleteResume}
                  onOpenCreditsModal={() => setIsCreditsModalOpen(true)}
                />
              )}

              {activeTab === 'ats-analyzer' && (
                <ResumeAnalyzerView
                  onAnalysisComplete={handleATSComplete}
                  creditsRemaining={balance?.credits_remaining ?? 0}
                  onOpenCreditsModal={() => setIsCreditsModalOpen(true)}
                />
              )}

              {activeTab === 'builder' && (
                <ResumeBuilderView
                  initialResume={selectedResumeToEdit}
                  onSaveResume={handleSaveResume}
                  creditsRemaining={balance?.credits_remaining ?? 0}
                  onOpenCreditsModal={() => setIsCreditsModalOpen(true)}
                />
              )}

              {activeTab === 'github-analyzer' && (
                <GitHubAnalyzerView
                  onAnalysisComplete={handleGitHubComplete}
                  creditsRemaining={balance?.credits_remaining ?? 0}
                  onOpenCreditsModal={() => setIsCreditsModalOpen(true)}
                />
              )}

              {activeTab === 'leetcode-analyzer' && (
                <LeetCodeAnalyzerView
                  onAnalysisComplete={handleLeetCodeComplete}
                  creditsRemaining={balance?.credits_remaining ?? 0}
                  onOpenCreditsModal={() => setIsCreditsModalOpen(true)}
                />
              )}

              {activeTab === 'admin' && (
                <AdminView
                  currentUser={profile}
                  onRefreshUserData={loadUserData}
                />
              )}

              {activeTab === 'settings' && (
                <ProfileSettingsView
                  user={profile}
                  balance={balance}
                  onUpdateProfile={handleUpdateProfile}
                  onOpenCreditsModal={() => setIsCreditsModalOpen(true)}
                  onDeleteAccount={handleDeleteAccount}
                  onLogout={handleLogout}
                  savedResumesCount={resumes.length}
                />
              )}

              {activeTab === 'checkout' && (
                <CheckoutPaymentView
                  selectedPlanId={selectedPlanForCheckout}
                  onSelectPlan={(id) => setSelectedPlanForCheckout(id)}
                  user={profile}
                  balance={balance}
                  onBack={() => navigateTo('dashboard')}
                  onPaymentSubmitted={async () => {
                    await refreshProfile();
                    await loadUserData();
                  }}
                />
              )}

              {!['home', 'dashboard', 'ats-analyzer', 'builder', 'github-analyzer', 'leetcode-analyzer', 'admin', 'settings', 'checkout', 'auth'].includes(activeTab) && (
                <NotFoundView onNavigateHome={() => navigateTo('home')} />
              )}
            </Suspense>
          </motion.main>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="no-print border-t border-[#292344] bg-[#0E0C1B] py-6 text-center text-xs text-[#AAA6B7]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#F5F1E8]">ResumeZ AI</span>
            <span>• Built for Software Engineers & Recruiters</span>
          </div>
          <div className="flex items-center gap-4 text-[#706C7C]">
            <span>Production Architecture</span>
            <span>•</span>
            <span>Supabase Auth & Gemini 2.0 AI</span>
          </div>
        </div>
      </footer>

      {/* Credits & Usage Ledger Modal */}
      <CreditsModal
        isOpen={isCreditsModalOpen}
        onClose={() => setIsCreditsModalOpen(false)}
        balance={balance}
        onSelectPlan={handleOpenCheckout}
      />

      {/* AI Assistant Chatbot */}
      {session && (
        <Suspense fallback={null}>
          <Chatbot />
        </Suspense>
      )}
    </div>
  );
}
