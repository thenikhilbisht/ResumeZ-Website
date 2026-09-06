import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  ChevronDown,
  FileText,
  Target,
  Github,
  Code2,
  Zap,
  User,
  Settings,
  Shield,
  LogOut,
  Check,
  Menu,
  X,
  CreditCard,
  Activity
} from 'lucide-react';
import { UserProfile, UsageBalance } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: UserProfile | null;
  balance: UsageBalance | null;
  onSwitchRole: (role: 'candidate' | 'admin') => void;
  onLogout: () => void;
  onOpenCreditsModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  user,
  balance,
  onSwitchRole,
  onLogout,
  onOpenCreditsModal,
}) => {
  const [resumeOpen, setResumeOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const resumeRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (resumeRef.current && !resumeRef.current.contains(target)) {
        setResumeOpen(false);
      }
      if (moreRef.current && !moreRef.current.contains(target)) {
        setMoreOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(target)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Determine active states for dropdown parents
  const isResumeActive = activeTab === 'builder' || activeTab === 'ats-analyzer';
  const isMoreActive = activeTab === 'github-analyzer' || activeTab === 'leetcode-analyzer';

  // Format user display name
  const getDisplayName = () => {
    if (user?.full_name?.trim()) {
      const parts = user.full_name.trim().split(' ');
      return parts[0];
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'Candidate';
  };

  const getUserInitials = () => {
    if (user?.full_name?.trim()) {
      const parts = user.full_name.trim().split(/\s+/);
      if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return 'RZ';
  };

  const isAuthorizedAdmin = Boolean(user?.is_admin || user?.role === 'admin');
  const creditsCount = balance?.credits_remaining ?? 10;

  return (
    <header
      id="main-top-navbar"
      className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#080711]/85 backdrop-blur-[18px] text-[#F5F1E8]"
    >
      <div className="mx-auto flex max-w-[1440px] h-16 items-center justify-between px-4 sm:px-8">
        {/* Left Side: Brand + Primary Navigation */}
        <div className="flex items-center gap-8 lg:gap-10">
          {/* 1. BRAND */}
          <button
            id="brand-logo-btn"
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-2 group focus:outline-none transition cursor-pointer"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#312E63] to-[#6366A8] border border-[#7C6BA8]/30 shadow-sm shadow-[#6366A8]/20 group-hover:scale-105 transition-transform">
              <Sparkles className="h-4 w-4 text-[#E1C77A]" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold tracking-tight text-[#F5F1E8] group-hover:text-[#E1C77A] transition-colors">
                ResumeZ
              </span>
              <span className="rounded-md bg-[#C6A75E]/15 border border-[#C6A75E]/30 px-1.5 py-0.5 text-[10px] font-semibold text-[#E1C77A] tracking-wider">
                AI
              </span>
            </div>
          </button>

          {/* 2. PRIMARY NAVIGATION (Desktop) */}
          <nav className="hidden md:flex items-center gap-1.5 lg:gap-2">
            {/* Overview */}
            <button
              id="nav-overview-btn"
              onClick={() => setActiveTab('home')}
              className={`rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'home'
                  ? 'bg-[#C6A75E]/12 text-[#E1C77A] border border-[#C6A75E]/30 font-semibold shadow-xs'
                  : 'text-[#AAA6B7] hover:text-[#F5F1E8] hover:bg-[#151329]'
              }`}
            >
              Overview
            </button>

            {/* Dashboard */}
            <button
              id="nav-dashboard-btn"
              onClick={() => setActiveTab('dashboard')}
              className={`rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-[#C6A75E]/12 text-[#E1C77A] border border-[#C6A75E]/30 font-semibold shadow-xs'
                  : 'text-[#AAA6B7] hover:text-[#F5F1E8] hover:bg-[#151329]'
              }`}
            >
              Dashboard
            </button>

            {/* 3. Resume ▾ Dropdown */}
            <div
              ref={resumeRef}
              className="relative"
              onMouseEnter={() => setResumeOpen(true)}
              onMouseLeave={() => setResumeOpen(false)}
            >
              <button
                id="nav-resume-dropdown-btn"
                onClick={() => setResumeOpen((prev) => !prev)}
                className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium whitespace-nowrap transition-all cursor-pointer ${
                  isResumeActive || resumeOpen
                    ? 'bg-[#C6A75E]/12 text-[#E1C77A] border border-[#C6A75E]/30 font-semibold shadow-xs'
                    : 'text-[#AAA6B7] hover:text-[#F5F1E8] hover:bg-[#151329]'
                }`}
              >
                <span>Resume</span>
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform duration-200 ${
                    resumeOpen ? 'rotate-180 text-[#E1C77A]' : 'text-[#706C7C]'
                  }`}
                />
              </button>

              {resumeOpen && (
                <div
                  id="resume-dropdown-menu"
                  className="absolute left-0 top-full pt-1.5 w-52 z-50 animate-in fade-in zoom-in-95 duration-150"
                >
                  <div className="rounded-xl border border-[#292344] bg-[#151329] p-1.5 shadow-2xl backdrop-blur-xl">
                    <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#706C7C]">
                      Resume
                    </div>
                    <div className="h-px bg-[#292344] my-1" />

                    <button
                      id="dropdown-item-resume-builder"
                      onClick={() => {
                        setActiveTab('builder');
                        setResumeOpen(false);
                      }}
                      className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors cursor-pointer ${
                        activeTab === 'builder'
                          ? 'bg-[#C6A75E]/15 text-[#E1C77A] font-semibold'
                          : 'text-[#AAA6B7] hover:bg-[#1B1833] hover:text-[#F5F1E8]'
                      }`}
                    >
                      <FileText className="h-3.5 w-3.5 text-[#C6A75E] shrink-0" />
                      <span>Resume Builder</span>
                    </button>

                    <button
                      id="dropdown-item-ats-analyzer"
                      onClick={() => {
                        setActiveTab('ats-analyzer');
                        setResumeOpen(false);
                      }}
                      className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors cursor-pointer ${
                        activeTab === 'ats-analyzer'
                          ? 'bg-[#C6A75E]/15 text-[#E1C77A] font-semibold'
                          : 'text-[#AAA6B7] hover:bg-[#1B1833] hover:text-[#F5F1E8]'
                      }`}
                    >
                      <Target className="h-3.5 w-3.5 text-[#6366A8] shrink-0" />
                      <span>ATS Analyzer</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 4. More ▾ Dropdown */}
            <div
              ref={moreRef}
              className="relative"
              onMouseEnter={() => setMoreOpen(true)}
              onMouseLeave={() => setMoreOpen(false)}
            >
              <button
                id="nav-more-dropdown-btn"
                onClick={() => setMoreOpen((prev) => !prev)}
                className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium whitespace-nowrap transition-all cursor-pointer ${
                  isMoreActive || moreOpen
                    ? 'bg-[#C6A75E]/12 text-[#E1C77A] border border-[#C6A75E]/30 font-semibold shadow-xs'
                    : 'text-[#AAA6B7] hover:text-[#F5F1E8] hover:bg-[#151329]'
                }`}
              >
                <span>More</span>
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform duration-200 ${
                    moreOpen ? 'rotate-180 text-[#E1C77A]' : 'text-[#706C7C]'
                  }`}
                />
              </button>

              {moreOpen && (
                <div
                  id="more-dropdown-menu"
                  className="absolute left-0 top-full pt-1.5 w-52 z-50 animate-in fade-in zoom-in-95 duration-150"
                >
                  <div className="rounded-xl border border-[#292344] bg-[#151329] p-1.5 shadow-2xl backdrop-blur-xl">
                    <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#706C7C]">
                      More Tools
                    </div>
                    <div className="h-px bg-[#292344] my-1" />

                    <button
                      id="dropdown-item-github-audit"
                      onClick={() => {
                        setActiveTab('github-analyzer');
                        setMoreOpen(false);
                      }}
                      className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors cursor-pointer ${
                        activeTab === 'github-analyzer'
                          ? 'bg-[#C6A75E]/15 text-[#E1C77A] font-semibold'
                          : 'text-[#AAA6B7] hover:bg-[#1B1833] hover:text-[#F5F1E8]'
                      }`}
                    >
                      <Github className="h-3.5 w-3.5 text-[#6366A8] shrink-0" />
                      <span>GitHub Audit</span>
                    </button>

                    <button
                      id="dropdown-item-leetcode-audit"
                      onClick={() => {
                        setActiveTab('leetcode-analyzer');
                        setMoreOpen(false);
                      }}
                      className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors cursor-pointer ${
                        activeTab === 'leetcode-analyzer'
                          ? 'bg-[#C6A75E]/15 text-[#E1C77A] font-semibold'
                          : 'text-[#AAA6B7] hover:bg-[#1B1833] hover:text-[#F5F1E8]'
                      }`}
                    >
                      <Code2 className="h-3.5 w-3.5 text-[#C49A4A] shrink-0" />
                      <span>LeetCode Audit</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* Right Side: Credits Pill + Profile Dropdown */}
        {/* Right Side: Credits Pill + Profile Dropdown */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              {/* Credits Pill */}
              <button
                id="credit-balance-pill"
                onClick={onOpenCreditsModal}
                className="flex items-center gap-1.5 rounded-full border border-[#C6A75E]/30 bg-[#C6A75E]/10 px-3 py-1.5 text-xs font-semibold text-[#E1C77A] hover:bg-[#C6A75E]/20 hover:border-[#C6A75E]/50 transition-all shadow-xs cursor-pointer active:scale-95"
                title="Click to view credits & usage ledger"
              >
                <Zap className="h-3.5 w-3.5 text-[#C6A75E] fill-[#C6A75E]/30" />
                <span>{creditsCount} credits</span>
              </button>

              {/* Profile Dropdown */}
              <div ref={profileRef} className="relative">
                <button
                  id="user-profile-menu-btn"
                  onClick={() => setProfileOpen((prev) => !prev)}
                  className="flex items-center gap-2 rounded-lg border border-[#292344] bg-[#151329] px-2.5 py-1.5 text-xs font-medium text-[#F5F1E8] hover:bg-[#1B1833] hover:border-[#C6A75E]/40 transition-all cursor-pointer shadow-xs focus:outline-none"
                >
                  {user?.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt="Avatar"
                      className="h-5 w-5 rounded-full object-cover border border-[#C6A75E]/30"
                    />
                  ) : (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1D1938] text-[10px] font-bold text-[#E1C77A] border border-[#292344]">
                      {getUserInitials()}
                    </div>
                  )}
                  <span className="font-semibold">{getDisplayName()}</span>
                  <ChevronDown
                    className={`h-3 w-3 text-[#706C7C] transition-transform duration-200 ${
                      profileOpen ? 'rotate-180 text-[#E1C77A]' : ''
                    }`}
                  />
                </button>

                {profileOpen && (
                  <div
                    id="profile-dropdown-menu"
                    className="absolute right-0 top-full pt-1.5 w-60 z-50 animate-in fade-in zoom-in-95 duration-150"
                  >
                    <div className="rounded-xl border border-[#292344] bg-[#151329] p-1.5 shadow-2xl backdrop-blur-xl">
                      {/* User info preview with avatar */}
                      <div className="flex items-center gap-2.5 px-2.5 py-2 border-b border-[#292344] mb-1">
                        {user?.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt="Avatar"
                            className="h-8 w-8 rounded-full object-cover border border-[#C6A75E]/40 shrink-0"
                          />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1D1938] text-xs font-bold text-[#E1C77A] border border-[#292344] shrink-0">
                            {getUserInitials()}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-[#F5F1E8] truncate">
                            {user?.full_name || 'Candidate User'}
                          </p>
                          <p className="text-[11px] text-[#AAA6B7] truncate">
                            {user?.email || 'thenikhilbisht@gmail.com'}
                          </p>
                        </div>
                      </div>

                      {/* Navigation items */}
                      <div className="space-y-0.5">
                        <button
                          id="profile-menu-profile-btn"
                          onClick={() => {
                            setActiveTab('settings');
                            setProfileOpen(false);
                          }}
                          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs text-[#AAA6B7] hover:bg-[#1B1833] hover:text-[#F5F1E8] transition-colors cursor-pointer"
                        >
                          <User className="h-3.5 w-3.5 text-[#706C7C]" />
                          <span>Profile</span>
                        </button>

                        <button
                          id="profile-menu-settings-btn"
                          onClick={() => {
                            setActiveTab('settings');
                            setProfileOpen(false);
                          }}
                          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs text-[#AAA6B7] hover:bg-[#1B1833] hover:text-[#F5F1E8] transition-colors cursor-pointer"
                        >
                          <Settings className="h-3.5 w-3.5 text-[#706C7C]" />
                          <span>Settings</span>
                        </button>

                        <button
                          id="profile-menu-credits-btn"
                          onClick={() => {
                            onOpenCreditsModal();
                            setProfileOpen(false);
                          }}
                          className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-[#AAA6B7] hover:bg-[#1B1833] hover:text-[#F5F1E8] transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5">
                            <CreditCard className="h-3.5 w-3.5 text-[#C6A75E]" />
                            <span>Credits</span>
                          </div>
                          <span className="text-[10px] font-bold text-[#E1C77A] bg-[#C6A75E]/15 border border-[#C6A75E]/30 px-1.5 py-0.5 rounded-full">
                            {creditsCount}
                          </span>
                        </button>

                        <button
                          id="profile-menu-resumes-btn"
                          onClick={() => {
                            setActiveTab('dashboard');
                            setProfileOpen(false);
                          }}
                          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs text-[#AAA6B7] hover:bg-[#1B1833] hover:text-[#F5F1E8] transition-colors cursor-pointer"
                        >
                          <FileText className="h-3.5 w-3.5 text-[#706C7C]" />
                          <span>My Resumes</span>
                        </button>

                        <button
                          id="profile-menu-activity-btn"
                          onClick={() => {
                            setActiveTab('ats-analyzer');
                            setProfileOpen(false);
                          }}
                          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs text-[#AAA6B7] hover:bg-[#1B1833] hover:text-[#F5F1E8] transition-colors cursor-pointer"
                        >
                          <Activity className="h-3.5 w-3.5 text-[#706C7C]" />
                          <span>My Activity</span>
                        </button>
                      </div>

                      {/* Divider */}
                      <div className="h-px bg-[#292344] my-1" />

                      {/* Role Section */}
                      <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#706C7C]">
                        Role
                      </div>

                      <button
                        id="profile-role-candidate-btn"
                        onClick={() => {
                          onSwitchRole('candidate');
                          setProfileOpen(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors cursor-pointer ${
                          user?.role === 'candidate' || !user?.role
                            ? 'bg-[#C6A75E]/15 text-[#E1C77A] font-semibold'
                            : 'text-[#AAA6B7] hover:bg-[#1B1833] hover:text-[#F5F1E8]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <User className="h-3.5 w-3.5 text-[#706C7C]" />
                          <span>Candidate</span>
                        </div>
                        {(user?.role === 'candidate' || !user?.role) && (
                          <Check className="h-3.5 w-3.5 text-[#E1C77A]" />
                        )}
                      </button>

                      {/* Only show Admin option if authorized */}
                      {isAuthorizedAdmin && (
                        <button
                          id="profile-role-admin-btn"
                          onClick={() => {
                            onSwitchRole('admin');
                            setProfileOpen(false);
                          }}
                          className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors cursor-pointer ${
                            user?.role === 'admin'
                              ? 'bg-[#312E63]/60 text-[#F5F1E8] font-semibold'
                              : 'text-[#AAA6B7] hover:bg-[#1B1833] hover:text-[#F5F1E8]'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Shield className="h-3.5 w-3.5 text-[#6366A8]" />
                            <span>Admin</span>
                          </div>
                          {user?.role === 'admin' && (
                            <Check className="h-3.5 w-3.5 text-[#6366A8]" />
                          )}
                        </button>
                      )}

                      {/* Admin panel quick link if active admin */}
                      {user?.role === 'admin' && (
                        <button
                          id="profile-menu-admin-panel-btn"
                          onClick={() => {
                            setActiveTab('admin');
                            setProfileOpen(false);
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-[#E1C77A] hover:bg-[#C6A75E]/15 transition-colors font-medium mt-0.5 cursor-pointer"
                        >
                          <Shield className="h-3.5 w-3.5 text-[#C6A75E]" />
                          <span>Admin Control Center</span>
                        </button>
                      )}

                      {/* Divider */}
                      <div className="h-px bg-[#292344] my-1" />

                      {/* Sign out */}
                      <button
                        id="profile-menu-logout-btn"
                        onClick={() => {
                          onLogout();
                          setProfileOpen(false);
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-[#A94D4D] hover:bg-[#A94D4D]/15 transition-colors font-medium cursor-pointer"
                      >
                        <LogOut className="h-3.5 w-3.5 text-[#A94D4D]" />
                        <span>Sign out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <button
              onClick={() => setActiveTab('dashboard')}
              className="rounded-lg btn-gold-primary px-5 py-2 text-xs font-semibold shadow-xs transition hover:scale-105 cursor-pointer text-[#080711]"
            >
              Sign In
            </button>
          )}
        </div>

        {/* Mobile View Controls */}
        <div className="flex md:hidden items-center gap-2">
          {user ? (
            <>
              {/* Mobile Credits Pill */}
              <button
                onClick={onOpenCreditsModal}
                className="flex items-center gap-1 rounded-full border border-[#C6A75E]/30 bg-[#C6A75E]/10 px-2.5 py-1 text-xs font-semibold text-[#E1C77A]"
              >
                <Zap className="h-3 w-3 text-[#C6A75E] fill-[#C6A75E]/30" />
                <span>{creditsCount}</span>
              </button>

              <button
                id="mobile-menu-toggle-btn"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="rounded-lg p-1.5 text-[#AAA6B7] hover:bg-[#151329] hover:text-[#F5F1E8] transition cursor-pointer"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </>
          ) : (
            <button
              onClick={() => setActiveTab('dashboard')}
              className="rounded-lg btn-gold-primary px-3 py-1.5 text-[11px] font-semibold shadow-xs transition cursor-pointer text-[#080711]"
            >
              Sign In
            </button>
          )}
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="border-b border-[#292344] bg-[#0E0C1B] px-4 pt-2 pb-6 md:hidden">
          <div className="space-y-1">
            <button
              onClick={() => {
                setActiveTab('home');
                setMobileMenuOpen(false);
              }}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium ${
                activeTab === 'home'
                  ? 'bg-[#C6A75E]/15 text-[#E1C77A] font-semibold'
                  : 'text-[#AAA6B7] hover:bg-[#151329]'
              }`}
            >
              Overview
            </button>

            <button
              onClick={() => {
                setActiveTab('dashboard');
                setMobileMenuOpen(false);
              }}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium ${
                activeTab === 'dashboard'
                  ? 'bg-[#C6A75E]/15 text-[#E1C77A] font-semibold'
                  : 'text-[#AAA6B7] hover:bg-[#151329]'
              }`}
            >
              Dashboard
            </button>

            {/* Resume Category */}
            <div className="pt-2">
              <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#706C7C]">
                Resume
              </span>
              <div className="mt-1 space-y-1">
                <button
                  onClick={() => {
                    setActiveTab('builder');
                    setMobileMenuOpen(false);
                  }}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium ${
                    activeTab === 'builder'
                      ? 'bg-[#C6A75E]/15 text-[#E1C77A] font-semibold'
                      : 'text-[#AAA6B7] hover:bg-[#151329]'
                  }`}
                >
                  <FileText className="h-3.5 w-3.5 text-[#C6A75E]" />
                  <span>Resume Builder</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('ats-analyzer');
                    setMobileMenuOpen(false);
                  }}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium ${
                    activeTab === 'ats-analyzer'
                      ? 'bg-[#C6A75E]/15 text-[#E1C77A] font-semibold'
                      : 'text-[#AAA6B7] hover:bg-[#151329]'
                  }`}
                >
                  <Target className="h-3.5 w-3.5 text-[#6366A8]" />
                  <span>ATS Analyzer</span>
                </button>
              </div>
            </div>

            {/* More Category */}
            <div className="pt-2">
              <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#706C7C]">
                More
              </span>
              <div className="mt-1 space-y-1">
                <button
                  onClick={() => {
                    setActiveTab('github-analyzer');
                    setMobileMenuOpen(false);
                  }}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium ${
                    activeTab === 'github-analyzer'
                      ? 'bg-[#C6A75E]/15 text-[#E1C77A] font-semibold'
                      : 'text-[#AAA6B7] hover:bg-[#151329]'
                  }`}
                >
                  <Github className="h-3.5 w-3.5 text-[#6366A8]" />
                  <span>GitHub Audit</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('leetcode-analyzer');
                    setMobileMenuOpen(false);
                  }}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium ${
                    activeTab === 'leetcode-analyzer'
                      ? 'bg-[#C6A75E]/15 text-[#E1C77A] font-semibold'
                      : 'text-[#AAA6B7] hover:bg-[#151329]'
                  }`}
                >
                  <Code2 className="h-3.5 w-3.5 text-[#C49A4A]" />
                  <span>LeetCode Audit</span>
                </button>
              </div>
            </div>

            {/* Account & Role */}
            <div className="mt-3 pt-3 border-t border-[#292344] space-y-1">
              <button
                onClick={() => {
                  setActiveTab('settings');
                  setMobileMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-[#AAA6B7] hover:bg-[#151329]"
              >
                <Settings className="h-3.5 w-3.5 text-[#706C7C]" />
                <span>Profile & Settings</span>
              </button>

              <button
                onClick={() => {
                  onLogout();
                  setMobileMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-[#A94D4D] hover:bg-[#A94D4D]/15"
              >
                <LogOut className="h-3.5 w-3.5 text-[#A94D4D]" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
