import React, { useState, useEffect, useRef } from 'react';
import { getApiUrl } from '../lib/api';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  Briefcase,
  Award,
  Code,
  Linkedin,
  Github,
  ExternalLink,
  ShieldCheck,
  KeyRound,
  Smartphone,
  AlertTriangle,
  Check,
  Save,
  Loader2,
  Trash2,
  LogOut,
  ChevronRight,
  Sparkles,
  Upload,
  X,
  Clock,
  DollarSign,
  Calendar,
  Lock,
  Zap,
  CreditCard,
  CheckCircle2,
  HelpCircle,
  Laptop
} from 'lucide-react';
import { UserProfile, UsageBalance } from '../types';
import { supabase } from '../lib/supabase';

interface ProfileSettingsViewProps {
  user: UserProfile | null;
  balance: UsageBalance | null;
  onUpdateProfile: (data: Partial<UserProfile>) => Promise<any>;
  onOpenCreditsModal: () => void;
  onDeleteAccount?: () => Promise<void>;
  onLogout?: () => void;
  savedResumesCount?: number;
}

type TabKey = 'profile' | 'career' | 'links' | 'security' | 'credits' | 'danger';

const COUNTRY_CODES = [
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+1', country: 'United States / Canada', flag: '🇺🇸' },
  { code: '+44', country: 'United Kingdom', flag: '🇬🇧' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬' },
  { code: '+971', country: 'UAE', flag: '🇦🇪' },
  { code: '+81', country: 'Japan', flag: '🇯🇵' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+31', country: 'Netherlands', flag: '🇳🇱' },
];

const POPULAR_SKILLS = [
  'React',
  'TypeScript',
  'Node.js',
  'Python',
  'Next.js',
  'PostgreSQL',
  'AWS',
  'Docker',
  'GraphQL',
  'Tailwind CSS',
  'System Design',
  'Data Structures'
];

export const ProfileSettingsView: React.FC<ProfileSettingsViewProps> = ({
  user,
  balance,
  onUpdateProfile,
  onOpenCreditsModal,
  onDeleteAccount,
  onLogout,
  savedResumesCount = 0,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<TabKey>('profile');

  // Profile fields state
  const [fullName, setFullName] = useState<string>(user?.full_name || '');
  const [avatarUrl, setAvatarUrl] = useState<string>(user?.avatar_url || '');
  const [phoneCountryCode, setPhoneCountryCode] = useState<string>(user?.phone_country_code || '+91');
  const [phone, setPhone] = useState<string>(user?.phone || '');
  const [phoneVerified, setPhoneVerified] = useState<boolean>(Boolean(user?.phone_verified));
  const [professionalTitle, setProfessionalTitle] = useState<string>(user?.professional_title || '');
  const [location, setLocation] = useState<string>(user?.location || '');
  const [country, setCountry] = useState<string>(user?.country || 'India');
  const [bio, setBio] = useState<string>(user?.bio || '');

  // Career fields state
  const [targetRole, setTargetRole] = useState<string>(user?.target_role || '');
  const [experienceLevel, setExperienceLevel] = useState<string>(user?.experience_level || 'Mid-Level (3-5 yrs)');
  const [yearsExperience, setYearsExperience] = useState<string>(String(user?.years_experience || '3'));
  const [skills, setSkills] = useState<string[]>(user?.skills || ['React', 'TypeScript', 'Node.js']);
  const [newSkillInput, setNewSkillInput] = useState<string>('');
  const [preferredWorkType, setPreferredWorkType] = useState<string>(user?.preferred_work_type || 'remote');
  const [preferredLocation, setPreferredLocation] = useState<string>(user?.preferred_location || '');
  const [employmentPreference, setEmploymentPreference] = useState<string>(user?.employment_preference || 'Full-time');
  const [expectedSalary, setExpectedSalary] = useState<string>(user?.expected_salary || '');
  const [noticePeriod, setNoticePeriod] = useState<string>(user?.notice_period || '30 Days');

  // Professional links state
  const [linkedinUrl, setLinkedinUrl] = useState<string>(user?.linkedin_url || '');
  const [githubUrl, setGithubUrl] = useState<string>(user?.github_url || '');
  const [portfolioUrl, setPortfolioUrl] = useState<string>(user?.portfolio_url || '');
  const [leetcodeUrl, setLeetcodeUrl] = useState<string>(user?.leetcode_url || '');
  const [otherUrl, setOtherUrl] = useState<string>(user?.other_url || '');

  // Status & Feedback state
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Security - Password change
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [isChangingPassword, setIsChangingPassword] = useState<boolean>(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Phone verification modal simulation
  const [isVerifyingPhone, setIsVerifyingPhone] = useState<boolean>(false);
  const [phoneVerifyStep, setPhoneVerifyStep] = useState<'idle' | 'sending' | 'otp' | 'verified'>('idle');
  const [otpCode, setOtpCode] = useState<string>('');

  // Delete account confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // File input ref for avatar
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Keep form in sync if user changes externally
  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setAvatarUrl(user.avatar_url || '');
      setPhoneCountryCode(user.phone_country_code || '+91');
      setPhone(user.phone || '');
      setPhoneVerified(Boolean(user.phone_verified));
      setProfessionalTitle(user.professional_title || '');
      setLocation(user.location || '');
      setCountry(user.country || 'India');
      setBio(user.bio || '');
      setTargetRole(user.target_role || '');
      setExperienceLevel(user.experience_level || 'Mid-Level (3-5 yrs)');
      setYearsExperience(String(user.years_experience || '3'));
      if (user.skills && Array.isArray(user.skills)) {
        setSkills(user.skills);
      }
      setPreferredWorkType(user.preferred_work_type || 'remote');
      setPreferredLocation(user.preferred_location || '');
      setEmploymentPreference(user.employment_preference || 'Full-time');
      setExpectedSalary(user.expected_salary || '');
      setNoticePeriod(user.notice_period || '30 Days');
      setLinkedinUrl(user.linkedin_url || '');
      setGithubUrl(user.github_url || '');
      setPortfolioUrl(user.portfolio_url || '');
      setLeetcodeUrl(user.leetcode_url || '');
      setOtherUrl(user.other_url || '');
    }
  }, [user]);

  // Compute User Initials
  const getUserInitials = () => {
    if (fullName && fullName.trim().length > 0) {
      const parts = fullName.trim().split(/\s+/);
      if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return 'RZ';
  };

  // Profile completeness calculation
  const completionItems = [
    { label: 'Full Name', completed: Boolean(fullName && fullName.trim().length > 0), tab: 'profile' },
    { label: 'Verified Email', completed: Boolean(user?.email), tab: 'profile' },
    { label: 'Phone Number', completed: Boolean(phone && phone.trim().length >= 7), tab: 'profile' },
    { label: 'Professional Title', completed: Boolean(professionalTitle && professionalTitle.trim().length > 0), tab: 'profile' },
    { label: 'Location / City', completed: Boolean(location && location.trim().length > 0), tab: 'profile' },
    { label: 'Professional Bio', completed: Boolean(bio && bio.trim().length >= 20), tab: 'profile' },
    { label: 'Target Job Role', completed: Boolean(targetRole && targetRole.trim().length > 0), tab: 'career' },
    { label: 'Experience Level', completed: Boolean(experienceLevel), tab: 'career' },
    { label: 'Technical Skills (3+)', completed: skills.length >= 3, tab: 'career' },
    { label: 'Work Preference', completed: Boolean(preferredWorkType), tab: 'career' },
    { label: 'LinkedIn Profile', completed: Boolean(linkedinUrl && linkedinUrl.trim().length > 5), tab: 'links' },
    { label: 'GitHub / Portfolio', completed: Boolean((githubUrl && githubUrl.trim().length > 5) || (portfolioUrl && portfolioUrl.trim().length > 5)), tab: 'links' },
  ];

  const completedCount = completionItems.filter(i => i.completed).length;
  const completionPercentage = Math.round((completedCount / completionItems.length) * 100);

  // Handle Save
  const handleSaveAll = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const payload: Partial<UserProfile> = {
        full_name: fullName,
        avatar_url: avatarUrl,
        phone,
        phone_country_code: phoneCountryCode,
        phone_verified: phoneVerified,
        professional_title: professionalTitle,
        location,
        country,
        bio,
        target_role: targetRole,
        experience_level: experienceLevel,
        years_experience: yearsExperience,
        skills,
        preferred_work_type: preferredWorkType as any,
        preferred_location: preferredLocation,
        employment_preference: employmentPreference,
        expected_salary: expectedSalary,
        notice_period: noticePeriod,
        linkedin_url: linkedinUrl,
        github_url: githubUrl,
        portfolio_url: portfolioUrl,
        leetcode_url: leetcodeUrl,
        other_url: otherUrl,
      };

      await onUpdateProfile(payload);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setSaveError(err.message || 'Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Avatar Upload Handler
  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit. Please choose a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Add Skill
  const handleAddSkill = (skillToAdd?: string) => {
    const target = (skillToAdd || newSkillInput).trim();
    if (!target) return;
    if (!skills.some(s => s.toLowerCase() === target.toLowerCase())) {
      setSkills([...skills, target]);
    }
    setNewSkillInput('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  // Handle Phone Verification
  const handleVerifyPhoneClick = () => {
    if (!phone || phone.trim().length < 7) {
      alert('Please enter a valid phone number first.');
      return;
    }
    setIsVerifyingPhone(true);
    setPhoneVerifyStep('sending');
    setTimeout(() => {
      setPhoneVerifyStep('otp');
      setOtpCode('7492'); // simulated OTP code
    }, 1000);
  };

  const handleConfirmOtp = async () => {
    try {
      const token = supabase ? (await supabase.auth.getSession()).data.session?.access_token : undefined;
      const res = await fetch(getApiUrl('/api/user/verify-phone'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ phone: `${phoneCountryCode} ${phone}` })
      });
      if (res.ok) {
        setPhoneVerified(true);
        setPhoneVerifyStep('verified');
        setTimeout(() => {
          setIsVerifyingPhone(false);
          setPhoneVerifyStep('idle');
        }, 1500);
      }
    } catch (err) {
      console.error('Phone verification failed', err);
    }
  };

  // Handle Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setIsChangingPassword(true);
    setPasswordMessage(null);

    try {
      if (!supabase) {
        throw new Error('Authentication is unconfigured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
      }
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setPasswordMessage({ type: 'error', text: error.message });
      } else {
        setPasswordMessage({ type: 'success', text: 'Password successfully updated!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      setPasswordMessage({ type: 'error', text: err.message || 'Failed to update password.' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Handle Account Deletion
  const handleDeleteAccountConfirm = async () => {
    if (deleteConfirmationText !== 'DELETE') return;
    setIsDeleting(true);
    try {
      if (onDeleteAccount) {
        await onDeleteAccount();
      }
    } catch (err) {
      console.error(err);
      alert('Failed to delete account. Please try again or contact support.');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto text-[#F5F1E8] pb-24 space-y-8 animate-in fade-in duration-200">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#292344] pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#AAA6B7] mb-1">
            <span>Settings</span>
            <ChevronRight className="h-3 w-3 text-[#706C7C]" />
            <span className="text-[#E1C77A] font-medium">Candidate Account & Security</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F5F1E8]">
            Account & Security Settings
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#AAA6B7]">
            Manage your personal candidate identity, career preferences, professional links, security credentials, and credit quota.
          </p>
        </div>

        {/* Action Save Button Top */}
        <div className="flex items-center gap-3">
          <button
            id="settings-top-save-btn"
            type="button"
            onClick={() => handleSaveAll()}
            disabled={isSaving}
            className="flex items-center gap-2 rounded-xl btn-gold-primary px-5 py-2.5 text-xs font-semibold shadow-lg shadow-[#C6A75E]/15 transition active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-[#080711]" />
                <span className="text-[#080711]">Saving...</span>
              </>
            ) : saveSuccess ? (
              <>
                <Check className="h-3.5 w-3.5 text-[#080711]" />
                <span className="text-[#080711]">Changes Saved!</span>
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5 text-[#080711]" />
                <span className="text-[#080711]">Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Profile Completeness Card */}
      <div className="rounded-2xl border border-[#292344] bg-[#151329] p-5 shadow-lg relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#C6A75E]/15 text-[#E1C77A] border border-[#C6A75E]/30 shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#F5F1E8]">
                  Candidate Profile Strength
                </h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  completionPercentage >= 80 
                    ? 'bg-[#4F9D69]/15 text-[#4F9D69] border-[#4F9D69]/30' 
                    : completionPercentage >= 50 
                    ? 'bg-[#C6A75E]/15 text-[#E1C77A] border-[#C6A75E]/30' 
                    : 'bg-[#C49A4A]/15 text-[#C49A4A] border-[#C49A4A]/30'
                }`}>
                  {completionPercentage >= 80 ? 'All-Star Candidate' : completionPercentage >= 50 ? 'Strong Profile' : 'Incomplete Profile'}
                </span>
              </div>
              <p className="text-xs text-[#AAA6B7] mt-0.5">
                Complete all profile dimensions to maximize ATS matching accuracy and recruiter visibility.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-center">
            <span className="text-xl font-extrabold text-[#E1C77A]">
              {completionPercentage}%
            </span>
            <span className="text-xs text-[#706C7C]">
              ({completedCount}/{completionItems.length} completed)
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-[#0E0C1B] rounded-full h-2.5 overflow-hidden border border-[#292344]">
          <div
            className="bg-gradient-to-r from-[#C6A75E] to-[#E1C77A] h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>

        {/* Checklist Chips */}
        <div className="mt-4 pt-3 border-t border-[#292344]/60 flex flex-wrap gap-2 text-[11px]">
          {completionItems.map((item, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setActiveSubTab(item.tab as TabKey)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                item.completed
                  ? 'bg-[#4F9D69]/10 border-[#4F9D69]/30 text-[#4F9D69]'
                  : 'bg-[#0E0C1B] border-[#292344] text-[#AAA6B7] hover:border-[#C6A75E]/40'
              }`}
            >
              {item.completed ? (
                <CheckCircle2 className="h-3 w-3 shrink-0" />
              ) : (
                <span className="h-1.5 w-1.5 rounded-full bg-[#706C7C] shrink-0" />
              )}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Notification Toast for Save Feedback */}
      {saveSuccess && (
        <div className="flex items-center gap-3 p-3.5 rounded-xl border border-[#4F9D69]/40 bg-[#4F9D69]/10 text-xs text-[#4F9D69] animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Profile changes saved successfully to your cloud account!</span>
        </div>
      )}
      {saveError && (
        <div className="flex items-center gap-3 p-3.5 rounded-xl border border-[#A94D4D]/40 bg-[#A94D4D]/10 text-xs text-[#A94D4D] animate-in fade-in">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* Main Settings Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: SaaS Sidebar Navigation (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-2xl border border-[#292344] bg-[#151329] p-3 shadow-xl space-y-1">
            <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[#706C7C]">
              Settings Categories
            </div>

            <button
              id="settings-tab-profile"
              type="button"
              onClick={() => setActiveSubTab('profile')}
              className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-medium transition-all cursor-pointer ${
                activeSubTab === 'profile'
                  ? 'bg-[#C6A75E]/15 text-[#E1C77A] font-semibold border border-[#C6A75E]/30'
                  : 'text-[#AAA6B7] hover:bg-[#1B1833] hover:text-[#F5F1E8]'
              }`}
            >
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-[#C6A75E]" />
                <span>Profile Information</span>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-[#706C7C]" />
            </button>

            <button
              id="settings-tab-career"
              type="button"
              onClick={() => setActiveSubTab('career')}
              className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-medium transition-all cursor-pointer ${
                activeSubTab === 'career'
                  ? 'bg-[#C6A75E]/15 text-[#E1C77A] font-semibold border border-[#C6A75E]/30'
                  : 'text-[#AAA6B7] hover:bg-[#1B1833] hover:text-[#F5F1E8]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Briefcase className="h-4 w-4 text-[#6366A8]" />
                <span>Career Profile</span>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-[#706C7C]" />
            </button>

            <button
              id="settings-tab-links"
              type="button"
              onClick={() => setActiveSubTab('links')}
              className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-medium transition-all cursor-pointer ${
                activeSubTab === 'links'
                  ? 'bg-[#C6A75E]/15 text-[#E1C77A] font-semibold border border-[#C6A75E]/30'
                  : 'text-[#AAA6B7] hover:bg-[#1B1833] hover:text-[#F5F1E8]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Globe className="h-4 w-4 text-[#C49A4A]" />
                <span>Professional Links</span>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-[#706C7C]" />
            </button>

            <button
              id="settings-tab-security"
              type="button"
              onClick={() => setActiveSubTab('security')}
              className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-medium transition-all cursor-pointer ${
                activeSubTab === 'security'
                  ? 'bg-[#C6A75E]/15 text-[#E1C77A] font-semibold border border-[#C6A75E]/30'
                  : 'text-[#AAA6B7] hover:bg-[#1B1833] hover:text-[#F5F1E8]'
              }`}
            >
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-4 w-4 text-[#4F9D69]" />
                <span>Account & Security</span>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-[#706C7C]" />
            </button>

            <button
              id="settings-tab-credits"
              type="button"
              onClick={() => setActiveSubTab('credits')}
              className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-medium transition-all cursor-pointer ${
                activeSubTab === 'credits'
                  ? 'bg-[#C6A75E]/15 text-[#E1C77A] font-semibold border border-[#C6A75E]/30'
                  : 'text-[#AAA6B7] hover:bg-[#1B1833] hover:text-[#F5F1E8]'
              }`}
            >
              <div className="flex items-center gap-3">
                <CreditCard className="h-4 w-4 text-[#C6A75E]" />
                <span>Credits & Quota</span>
              </div>
              <span className="text-[10px] font-bold text-[#E1C77A] bg-[#C6A75E]/15 px-2 py-0.5 rounded-full">
                {balance?.credits_remaining ?? 0}
              </span>
            </button>

            <div className="h-px bg-[#292344] my-1" />

            <button
              id="settings-tab-danger"
              type="button"
              onClick={() => setActiveSubTab('danger')}
              className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-medium transition-all cursor-pointer ${
                activeSubTab === 'danger'
                  ? 'bg-[#A94D4D]/20 text-[#A94D4D] font-semibold border border-[#A94D4D]/40'
                  : 'text-[#A94D4D] hover:bg-[#A94D4D]/10'
              }`}
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-4 w-4" />
                <span>Danger Zone</span>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-[#A94D4D]/60" />
            </button>
          </div>

          {/* Quick Stats / Account Summary Widget */}
          <div className="rounded-2xl border border-[#292344] bg-[#0E0C1B] p-5 space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#706C7C]">
              Cloud Account Overview
            </span>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-[#AAA6B7]">
                <span>Account Role:</span>
                <span className="font-semibold text-[#F5F1E8] capitalize">
                  {user?.role === 'admin' ? 'Administrator' : 'Candidate'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[#AAA6B7]">
                <span>Saved Resumes:</span>
                <span className="font-semibold text-[#F5F1E8]">
                  {savedResumesCount} active
                </span>
              </div>
              <div className="flex items-center justify-between text-[#AAA6B7]">
                <span>Available Credits:</span>
                <span className="font-bold text-[#E1C77A]">
                  {balance?.credits_remaining ?? 0}
                </span>
              </div>
              <div className="flex items-center justify-between text-[#AAA6B7]">
                <span>Data Isolation:</span>
                <span className="font-semibold text-[#4F9D69] flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" /> Supabase RLS
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Active Subtab Content Panels (8 cols) */}
        <div className="lg:col-span-8">
          {/* TAB 1: PROFILE INFORMATION */}
          {activeSubTab === 'profile' && (
            <div className="rounded-2xl border border-[#292344] bg-[#151329] p-6 sm:p-8 shadow-xl space-y-6">
              <div className="border-b border-[#292344] pb-4">
                <h2 className="text-lg font-bold text-[#F5F1E8] flex items-center gap-2">
                  <User className="h-5 w-5 text-[#C6A75E]" />
                  Candidate Profile Information
                </h2>
                <p className="text-xs text-[#AAA6B7] mt-1">
                  Your core candidate identity, contact details, and career elevator pitch.
                </p>
              </div>

              {/* Avatar Uploader Section */}
              <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl border border-[#292344] bg-[#0E0C1B]">
                <div className="relative group">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Avatar"
                      className="h-20 w-20 rounded-2xl object-cover border-2 border-[#C6A75E]/50 shadow-md"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-2xl bg-[#1D1938] flex items-center justify-center text-xl font-bold text-[#E1C77A] border-2 border-[#292344] shadow-md">
                      {getUserInitials()}
                    </div>
                  )}
                </div>

                <div className="space-y-2 text-center sm:text-left flex-1">
                  <h4 className="text-xs font-bold text-[#F5F1E8]">
                    Profile Photo / Avatar
                  </h4>
                  <p className="text-[11px] text-[#AAA6B7]">
                    Supports PNG, JPG, or WebP up to 5MB. Clear headshots enhance recruiter trust.
                  </p>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                    <input
                      type="file"
                      ref={avatarInputRef}
                      onChange={handleAvatarFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#C6A75E]/40 bg-[#C6A75E]/10 text-xs font-semibold text-[#E1C77A] hover:bg-[#C6A75E]/20 transition cursor-pointer"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      <span>Upload Photo</span>
                    </button>
                    {avatarUrl && (
                      <button
                        type="button"
                        onClick={() => setAvatarUrl('')}
                        className="px-3 py-1.5 rounded-lg border border-[#292344] bg-[#151329] text-xs text-[#AAA6B7] hover:text-[#A94D4D] transition cursor-pointer"
                      >
                        Remove Photo
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="text-xs font-semibold text-[#AAA6B7] block mb-1">
                    Full Name <span className="text-[#C6A75E]">*</span>
                  </label>
                  <input
                    id="input-full-name"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Nikhil Bisht"
                    className="w-full rounded-xl border border-[#292344] bg-[#0E0C1B] px-3.5 py-2.5 text-xs text-[#F5F1E8] focus:border-[#C6A75E] focus:outline-none transition"
                  />
                </div>

                {/* Email Address (Read-only) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-[#AAA6B7]">
                      Email Address
                    </label>
                    <span className="text-[10px] text-[#706C7C] flex items-center gap-1">
                      <Lock className="h-3 w-3" /> Read-only
                    </span>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl border border-[#292344] bg-[#0E0C1B]/80 px-3.5 py-2.5 text-xs text-[#706C7C]">
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{user?.email || 'authenticated-user@resumez.ai'}</span>
                  </div>
                </div>

                {/* Phone Number with Country Code */}
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-[#AAA6B7]">
                      Phone Number
                    </label>
                    {phoneVerified ? (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-[#4F9D69]">
                        <CheckCircle2 className="h-3 w-3" /> Verified
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleVerifyPhoneClick}
                        className="text-[11px] font-medium text-[#C6A75E] hover:underline cursor-pointer"
                      >
                        Verify phone number
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={phoneCountryCode}
                      onChange={(e) => setPhoneCountryCode(e.target.value)}
                      className="w-28 rounded-xl border border-[#292344] bg-[#0E0C1B] px-3 py-2.5 text-xs text-[#F5F1E8] focus:border-[#C6A75E] focus:outline-none transition cursor-pointer shrink-0"
                    >
                      {COUNTRY_CODES.map((item) => (
                        <option key={item.code} value={item.code} className="bg-[#151329] text-[#F5F1E8]">
                          {item.flag} {item.code}
                        </option>
                      ))}
                    </select>
                    <div className="relative flex-1">
                      <input
                        id="input-phone-number"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="9876543210"
                        className="w-full rounded-xl border border-[#292344] bg-[#0E0C1B] px-3.5 py-2.5 text-xs text-[#F5F1E8] focus:border-[#C6A75E] focus:outline-none transition"
                      />
                    </div>
                  </div>
                </div>

                {/* Professional Title */}
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-[#AAA6B7] block mb-1">
                    Professional Title / Headline
                  </label>
                  <input
                    id="input-professional-title"
                    type="text"
                    value={professionalTitle}
                    onChange={(e) => setProfessionalTitle(e.target.value)}
                    placeholder="e.g. Senior Full-Stack Engineer | Distributed Systems & AI"
                    className="w-full rounded-xl border border-[#292344] bg-[#0E0C1B] px-3.5 py-2.5 text-xs text-[#F5F1E8] focus:border-[#C6A75E] focus:outline-none transition"
                  />
                </div>

                {/* City / Location */}
                <div>
                  <label className="text-xs font-semibold text-[#AAA6B7] block mb-1">
                    Location / City
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-3 h-3.5 w-3.5 text-[#706C7C]" />
                    <input
                      id="input-location"
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. New Delhi, Bengaluru, San Francisco"
                      className="w-full rounded-xl border border-[#292344] bg-[#0E0C1B] pl-9 pr-3.5 py-2.5 text-xs text-[#F5F1E8] focus:border-[#C6A75E] focus:outline-none transition"
                    />
                  </div>
                </div>

                {/* Country */}
                <div>
                  <label className="text-xs font-semibold text-[#AAA6B7] block mb-1">
                    Country
                  </label>
                  <input
                    id="input-country"
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="e.g. India, United States"
                    className="w-full rounded-xl border border-[#292344] bg-[#0E0C1B] px-3.5 py-2.5 text-xs text-[#F5F1E8] focus:border-[#C6A75E] focus:outline-none transition"
                  />
                </div>

                {/* Bio */}
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-[#AAA6B7]">
                      Professional Bio / Career Summary
                    </label>
                    <span className="text-[10px] text-[#706C7C]">
                      {bio.length}/600 characters
                    </span>
                  </div>
                  <textarea
                    id="input-bio"
                    rows={4}
                    maxLength={600}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Provide a concise summary highlighting your engineering philosophy, impact metrics, and key tech stack competencies..."
                    className="w-full rounded-xl border border-[#292344] bg-[#0E0C1B] p-3 text-xs text-[#F5F1E8] focus:border-[#C6A75E] focus:outline-none transition resize-none leading-relaxed"
                  />
                </div>
              </div>

              {/* Bottom Action */}
              <div className="pt-4 border-t border-[#292344] flex justify-end">
                <button
                  type="button"
                  onClick={() => handleSaveAll()}
                  disabled={isSaving}
                  className="flex items-center gap-2 rounded-xl btn-gold-primary px-6 py-2.5 text-xs font-semibold shadow-lg shadow-[#C6A75E]/15 transition cursor-pointer"
                >
                  <Save className="h-3.5 w-3.5 text-[#080711]" />
                  <span className="text-[#080711]">{isSaving ? 'Saving...' : 'Save Profile Changes'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: CAREER PROFILE */}
          {activeSubTab === 'career' && (
            <div className="rounded-2xl border border-[#292344] bg-[#151329] p-6 sm:p-8 shadow-xl space-y-6">
              <div className="border-b border-[#292344] pb-4">
                <h2 className="text-lg font-bold text-[#F5F1E8] flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-[#6366A8]" />
                  Career Profile & Target Preferences
                </h2>
                <p className="text-xs text-[#AAA6B7] mt-1">
                  Configure your target job roles, skills inventory, experience seniority, and work requirements.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Target Role */}
                <div>
                  <label className="text-xs font-semibold text-[#AAA6B7] block mb-1">
                    Current / Target Job Role <span className="text-[#C6A75E]">*</span>
                  </label>
                  <input
                    id="input-target-role"
                    type="text"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    placeholder="e.g. Senior Frontend Architect, Staff Engineer"
                    className="w-full rounded-xl border border-[#292344] bg-[#0E0C1B] px-3.5 py-2.5 text-xs text-[#F5F1E8] focus:border-[#C6A75E] focus:outline-none transition"
                  />
                </div>

                {/* Experience Level */}
                <div>
                  <label className="text-xs font-semibold text-[#AAA6B7] block mb-1">
                    Experience Seniority Level
                  </label>
                  <select
                    id="select-experience-level"
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value)}
                    className="w-full rounded-xl border border-[#292344] bg-[#0E0C1B] px-3.5 py-2.5 text-xs text-[#F5F1E8] focus:border-[#C6A75E] focus:outline-none transition cursor-pointer"
                  >
                    <option value="Fresher / Entry (0-1 yrs)">Fresher / Entry Level (0-1 yrs)</option>
                    <option value="Early Career (1-3 yrs)">Early Career (1-3 yrs)</option>
                    <option value="Mid-Level (3-5 yrs)">Mid-Level (3-5 yrs)</option>
                    <option value="Senior Engineer (5-8 yrs)">Senior Engineer (5-8 yrs)</option>
                    <option value="Lead / Staff Engineer (8-12 yrs)">Lead / Staff Engineer (8-12 yrs)</option>
                    <option value="Principal / Director (12+ yrs)">Principal / Director (12+ yrs)</option>
                  </select>
                </div>

                {/* Years of Experience */}
                <div>
                  <label className="text-xs font-semibold text-[#AAA6B7] block mb-1">
                    Total Years of Experience
                  </label>
                  <input
                    id="input-years-experience"
                    type="number"
                    min="0"
                    max="50"
                    value={yearsExperience}
                    onChange={(e) => setYearsExperience(e.target.value)}
                    className="w-full rounded-xl border border-[#292344] bg-[#0E0C1B] px-3.5 py-2.5 text-xs text-[#F5F1E8] focus:border-[#C6A75E] focus:outline-none transition"
                  />
                </div>

                {/* Notice Period */}
                <div>
                  <label className="text-xs font-semibold text-[#AAA6B7] block mb-1">
                    Notice Period
                  </label>
                  <select
                    id="select-notice-period"
                    value={noticePeriod}
                    onChange={(e) => setNoticePeriod(e.target.value)}
                    className="w-full rounded-xl border border-[#292344] bg-[#0E0C1B] px-3.5 py-2.5 text-xs text-[#F5F1E8] focus:border-[#C6A75E] focus:outline-none transition cursor-pointer"
                  >
                    <option value="Immediate / Serving Notice">Immediate / Serving Notice</option>
                    <option value="15 Days">15 Days</option>
                    <option value="30 Days">30 Days</option>
                    <option value="60 Days">60 Days</option>
                    <option value="90 Days">90 Days</option>
                  </select>
                </div>

                {/* Preferred Work Type */}
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-[#AAA6B7] block mb-2">
                    Preferred Work Arrangement
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      { id: 'remote', label: 'Remote', desc: 'Work from anywhere' },
                      { id: 'hybrid', label: 'Hybrid', desc: '2-3 days office' },
                      { id: 'onsite', label: 'On-site', desc: 'Full office presence' },
                      { id: 'any', label: 'Flexible', desc: 'Open to any format' },
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setPreferredWorkType(mode.id)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          preferredWorkType === mode.id
                            ? 'bg-[#C6A75E]/15 border-[#C6A75E]/40 text-[#F5F1E8]'
                            : 'bg-[#0E0C1B] border-[#292344] text-[#AAA6B7] hover:border-[#706C7C]'
                        }`}
                      >
                        <div className="text-xs font-bold text-[#F5F1E8]">{mode.label}</div>
                        <div className="text-[10px] text-[#706C7C] mt-0.5">{mode.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Expected Salary & Employment Preference */}
                <div>
                  <label className="text-xs font-semibold text-[#AAA6B7] block mb-1">
                    Expected Compensation
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3.5 top-3 h-3.5 w-3.5 text-[#706C7C]" />
                    <input
                      id="input-expected-salary"
                      type="text"
                      value={expectedSalary}
                      onChange={(e) => setExpectedSalary(e.target.value)}
                      placeholder="e.g. ₹28,00,000 / $140,000"
                      className="w-full rounded-xl border border-[#292344] bg-[#0E0C1B] pl-9 pr-3.5 py-2.5 text-xs text-[#F5F1E8] focus:border-[#C6A75E] focus:outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#AAA6B7] block mb-1">
                    Employment Type
                  </label>
                  <select
                    id="select-employment-preference"
                    value={employmentPreference}
                    onChange={(e) => setEmploymentPreference(e.target.value)}
                    className="w-full rounded-xl border border-[#292344] bg-[#0E0C1B] px-3.5 py-2.5 text-xs text-[#F5F1E8] focus:border-[#C6A75E] focus:outline-none transition cursor-pointer"
                  >
                    <option value="Full-time">Full-time Permanent</option>
                    <option value="Contract">Contract / C2C</option>
                    <option value="Freelance">Freelance / Advisory</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>

                {/* Skills Interactive Inventory */}
                <div className="sm:col-span-2 space-y-3 pt-2">
                  <label className="text-xs font-semibold text-[#AAA6B7] block">
                    Core Technical Skills & Tooling ({skills.length} added)
                  </label>

                  {/* Active Skill Chips */}
                  <div className="flex flex-wrap gap-2 min-h-12 p-3 rounded-xl border border-[#292344] bg-[#0E0C1B]">
                    {skills.map((skill) => (
                      <span
                        key={skill}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#151329] border border-[#292344] text-xs font-medium text-[#E1C77A] group hover:border-[#C6A75E]/50 transition"
                      >
                        <span>{skill}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          className="text-[#706C7C] hover:text-[#A94D4D] cursor-pointer"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                    {skills.length === 0 && (
                      <span className="text-xs text-[#706C7C] italic py-1">
                        No skills added yet. Add your key languages and tools below.
                      </span>
                    )}
                  </div>

                  {/* Add Skill Input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSkillInput}
                      onChange={(e) => setNewSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSkill();
                        }
                      }}
                      placeholder="Type a skill and press Enter (e.g. Kubernetes, Rust, PyTorch)..."
                      className="flex-1 rounded-xl border border-[#292344] bg-[#0E0C1B] px-3.5 py-2 text-xs text-[#F5F1E8] focus:border-[#C6A75E] focus:outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddSkill()}
                      className="px-4 py-2 rounded-xl bg-[#1B1833] border border-[#292344] text-xs font-medium text-[#F5F1E8] hover:border-[#C6A75E]/40 transition cursor-pointer"
                    >
                      + Add
                    </button>
                  </div>

                  {/* Quick-add recommendations */}
                  <div>
                    <span className="text-[11px] text-[#706C7C] mr-2">Quick suggestions:</span>
                    <div className="inline-flex flex-wrap gap-1.5 mt-1">
                      {POPULAR_SKILLS.filter(s => !skills.includes(s)).slice(0, 8).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => handleAddSkill(s)}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-[#0E0C1B] border border-[#292344] text-[#AAA6B7] hover:border-[#C6A75E] hover:text-[#E1C77A] transition cursor-pointer"
                        >
                          +{s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Action */}
              <div className="pt-4 border-t border-[#292344] flex justify-end">
                <button
                  type="button"
                  onClick={() => handleSaveAll()}
                  disabled={isSaving}
                  className="flex items-center gap-2 rounded-xl btn-gold-primary px-6 py-2.5 text-xs font-semibold shadow-lg shadow-[#C6A75E]/15 transition cursor-pointer"
                >
                  <Save className="h-3.5 w-3.5 text-[#080711]" />
                  <span className="text-[#080711]">{isSaving ? 'Saving...' : 'Save Career Preferences'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: PROFESSIONAL LINKS */}
          {activeSubTab === 'links' && (
            <div className="rounded-2xl border border-[#292344] bg-[#151329] p-6 sm:p-8 shadow-xl space-y-6">
              <div className="border-b border-[#292344] pb-4">
                <h2 className="text-lg font-bold text-[#F5F1E8] flex items-center gap-2">
                  <Globe className="h-5 w-5 text-[#C49A4A]" />
                  Social & Developer Profiles
                </h2>
                <p className="text-xs text-[#AAA6B7] mt-1">
                  Connect your verified code repositories, competitive coding badges, and personal portfolio links.
                </p>
              </div>

              <div className="space-y-4">
                {/* LinkedIn */}
                <div className="p-4 rounded-xl border border-[#292344] bg-[#0E0C1B] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Linkedin className="h-4 w-4 text-[#0A66C2]" />
                      <label className="text-xs font-bold text-[#F5F1E8]">LinkedIn Profile</label>
                    </div>
                    {linkedinUrl && (
                      <a
                        href={linkedinUrl.startsWith('http') ? linkedinUrl : `https://${linkedinUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[11px] text-[#C6A75E] hover:underline"
                      >
                        <span>Open profile</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  <input
                    id="input-linkedin-url"
                    type="url"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="https://linkedin.com/in/yourusername"
                    className="w-full rounded-xl border border-[#292344] bg-[#151329] px-3.5 py-2.5 text-xs text-[#F5F1E8] focus:border-[#C6A75E] focus:outline-none transition"
                  />
                </div>

                {/* GitHub */}
                <div className="p-4 rounded-xl border border-[#292344] bg-[#0E0C1B] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Github className="h-4 w-4 text-[#F5F1E8]" />
                      <label className="text-xs font-bold text-[#F5F1E8]">GitHub Profile</label>
                    </div>
                    {githubUrl && (
                      <a
                        href={githubUrl.startsWith('http') ? githubUrl : `https://${githubUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[11px] text-[#C6A75E] hover:underline"
                      >
                        <span>Open profile</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  <input
                    id="input-github-url"
                    type="url"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/yourusername"
                    className="w-full rounded-xl border border-[#292344] bg-[#151329] px-3.5 py-2.5 text-xs text-[#F5F1E8] focus:border-[#C6A75E] focus:outline-none transition"
                  />
                </div>

                {/* Portfolio Website */}
                <div className="p-4 rounded-xl border border-[#292344] bg-[#0E0C1B] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-[#4F9D69]" />
                      <label className="text-xs font-bold text-[#F5F1E8]">Personal Portfolio Website</label>
                    </div>
                    {portfolioUrl && (
                      <a
                        href={portfolioUrl.startsWith('http') ? portfolioUrl : `https://${portfolioUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[11px] text-[#C6A75E] hover:underline"
                      >
                        <span>Open site</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  <input
                    id="input-portfolio-url"
                    type="url"
                    value={portfolioUrl}
                    onChange={(e) => setPortfolioUrl(e.target.value)}
                    placeholder="https://yourportfolio.dev"
                    className="w-full rounded-xl border border-[#292344] bg-[#151329] px-3.5 py-2.5 text-xs text-[#F5F1E8] focus:border-[#C6A75E] focus:outline-none transition"
                  />
                </div>

                {/* LeetCode Profile */}
                <div className="p-4 rounded-xl border border-[#292344] bg-[#0E0C1B] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Code className="h-4 w-4 text-[#FFA116]" />
                      <label className="text-xs font-bold text-[#F5F1E8]">LeetCode Profile</label>
                    </div>
                    {leetcodeUrl && (
                      <a
                        href={leetcodeUrl.startsWith('http') ? leetcodeUrl : `https://${leetcodeUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[11px] text-[#C6A75E] hover:underline"
                      >
                        <span>Open profile</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  <input
                    id="input-leetcode-url"
                    type="url"
                    value={leetcodeUrl}
                    onChange={(e) => setLeetcodeUrl(e.target.value)}
                    placeholder="https://leetcode.com/yourhandle"
                    className="w-full rounded-xl border border-[#292344] bg-[#151329] px-3.5 py-2.5 text-xs text-[#F5F1E8] focus:border-[#C6A75E] focus:outline-none transition"
                  />
                </div>

                {/* Additional Link */}
                <div className="p-4 rounded-xl border border-[#292344] bg-[#0E0C1B] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4 text-[#AAA6B7]" />
                      <label className="text-xs font-bold text-[#F5F1E8]">Other Link (Twitter / Blog / Kaggle)</label>
                    </div>
                    {otherUrl && (
                      <a
                        href={otherUrl.startsWith('http') ? otherUrl : `https://${otherUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[11px] text-[#C6A75E] hover:underline"
                      >
                        <span>Open</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  <input
                    id="input-other-url"
                    type="url"
                    value={otherUrl}
                    onChange={(e) => setOtherUrl(e.target.value)}
                    placeholder="https://x.com/yourhandle or https://medium.com/@you"
                    className="w-full rounded-xl border border-[#292344] bg-[#151329] px-3.5 py-2.5 text-xs text-[#F5F1E8] focus:border-[#C6A75E] focus:outline-none transition"
                  />
                </div>
              </div>

              {/* Bottom Action */}
              <div className="pt-4 border-t border-[#292344] flex justify-end">
                <button
                  type="button"
                  onClick={() => handleSaveAll()}
                  disabled={isSaving}
                  className="flex items-center gap-2 rounded-xl btn-gold-primary px-6 py-2.5 text-xs font-semibold shadow-lg shadow-[#C6A75E]/15 transition cursor-pointer"
                >
                  <Save className="h-3.5 w-3.5 text-[#080711]" />
                  <span className="text-[#080711]">{isSaving ? 'Saving...' : 'Save Profile Links'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: ACCOUNT & SECURITY */}
          {activeSubTab === 'security' && (
            <div className="space-y-6">
              {/* Authentication & Security Settings */}
              <div className="rounded-2xl border border-[#292344] bg-[#151329] p-6 sm:p-8 shadow-xl space-y-6">
                <div className="border-b border-[#292344] pb-4">
                  <h2 className="text-lg font-bold text-[#F5F1E8] flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-[#4F9D69]" />
                    Account Security & Credentials
                  </h2>
                  <p className="text-xs text-[#AAA6B7] mt-1">
                    Manage your primary authentication methods, password encryption, and multi-factor preferences.
                  </p>
                </div>

                {/* Email Verification Card */}
                <div className="flex items-center justify-between p-4 rounded-xl border border-[#292344] bg-[#0E0C1B]">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-[#4F9D69]/15 border border-[#4F9D69]/30 flex items-center justify-center text-[#4F9D69]">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#F5F1E8]">{user?.email}</div>
                      <div className="text-[11px] text-[#AAA6B7]">Primary Authentication Email</div>
                    </div>
                  </div>
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#4F9D69]/15 border border-[#4F9D69]/30 text-xs font-semibold text-[#4F9D69]">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Verified
                  </span>
                </div>

                {/* Change Password Form */}
                <form onSubmit={handleChangePassword} className="p-5 rounded-xl border border-[#292344] bg-[#0E0C1B] space-y-4">
                  <h3 className="text-xs font-bold text-[#F5F1E8] flex items-center gap-2">
                    <KeyRound className="h-4 w-4 text-[#C6A75E]" />
                    Change Account Password
                  </h3>

                  {passwordMessage && (
                    <div
                      className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                        passwordMessage.type === 'success'
                          ? 'bg-[#4F9D69]/15 border border-[#4F9D69]/30 text-[#4F9D69]'
                          : 'bg-[#A94D4D]/15 border border-[#A94D4D]/30 text-[#A94D4D]'
                      }`}
                    >
                      {passwordMessage.type === 'success' ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                      )}
                      <span>{passwordMessage.text}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-[#AAA6B7] block mb-1">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        className="w-full rounded-xl border border-[#292344] bg-[#151329] px-3.5 py-2 text-xs text-[#F5F1E8] focus:border-[#C6A75E] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[#AAA6B7] block mb-1">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        className="w-full rounded-xl border border-[#292344] bg-[#151329] px-3.5 py-2 text-xs text-[#F5F1E8] focus:border-[#C6A75E] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={isChangingPassword || !newPassword}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1B1833] border border-[#292344] text-xs font-semibold text-[#E1C77A] hover:bg-[#C6A75E]/15 hover:border-[#C6A75E]/30 transition disabled:opacity-40 cursor-pointer"
                    >
                      {isChangingPassword ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>Updating Password...</span>
                        </>
                      ) : (
                        <span>Update Password</span>
                      )}
                    </button>
                  </div>
                </form>

                {/* Two-Factor Authentication (2FA) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl border border-[#292344] bg-[#0E0C1B]">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-[#AAA6B7]" />
                      <h4 className="text-xs font-bold text-[#F5F1E8]">Two-Factor Authentication (2FA)</h4>
                    </div>
                    <p className="text-[11px] text-[#AAA6B7]">
                      Add an additional layer of biometric or authenticator app protection to safeguard your candidate resume records.
                    </p>
                  </div>
                  <span className="self-start sm:self-center px-3 py-1 rounded-full bg-[#292344]/60 border border-[#706C7C]/30 text-[11px] font-medium text-[#AAA6B7]">
                    Coming Soon (v2.4)
                  </span>
                </div>

                {/* Active Sessions */}
                <div className="space-y-3 p-5 rounded-xl border border-[#292344] bg-[#0E0C1B]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Laptop className="h-4 w-4 text-[#C6A75E]" />
                      <h4 className="text-xs font-bold text-[#F5F1E8]">Active Sessions</h4>
                    </div>
                    <span className="text-[10px] text-[#706C7C]">
                      1 Active Session
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-[#151329] border border-[#292344]">
                    <div className="space-y-0.5">
                      <div className="text-xs font-semibold text-[#F5F1E8] flex items-center gap-2">
                        <span>Web Browser Session</span>
                        <span className="text-[10px] text-[#4F9D69] font-medium bg-[#4F9D69]/15 px-2 py-0.5 rounded-full border border-[#4F9D69]/30">
                          Active Now (This Device)
                        </span>
                      </div>
                      <div className="text-[11px] text-[#706C7C]">
                        TLS 1.3 Encrypted · Authenticated via Supabase
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: CREDITS & QUOTA */}
          {activeSubTab === 'credits' && (
            <div className="rounded-2xl border border-[#292344] bg-[#151329] p-6 sm:p-8 shadow-xl space-y-6">
              <div className="border-b border-[#292344] pb-4">
                <h2 className="text-lg font-bold text-[#F5F1E8] flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-[#C6A75E]" />
                  AI Credits Allocation & Usage Quota
                </h2>
                <p className="text-xs text-[#AAA6B7] mt-1">
                  Real-time database balance, lifetime usage metrics, and monthly credit renewal policies.
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl border border-[#292344] bg-[#0E0C1B]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#706C7C]">
                    Available Credits
                  </span>
                  <div className="text-3xl font-extrabold text-[#E1C77A] mt-1">
                    {balance?.credits_remaining ?? 0}
                  </div>
                  <p className="text-[11px] text-[#AAA6B7] mt-1">
                    Available for ATS analyses & GitHub audits
                  </p>
                </div>

                <div className="p-5 rounded-2xl border border-[#292344] bg-[#0E0C1B]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#706C7C]">
                    Lifetime Consumed
                  </span>
                  <div className="text-3xl font-extrabold text-[#F5F1E8] mt-1">
                    {balance?.lifetime_credits_used ?? 0}
                  </div>
                  <p className="text-[11px] text-[#AAA6B7] mt-1">
                    Total credits spent on AI evaluations
                  </p>
                </div>

                <div className="p-5 rounded-2xl border border-[#292344] bg-[#0E0C1B]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#706C7C]">
                    Monthly Allowance
                  </span>
                  <div className="text-3xl font-extrabold text-[#6366A8] mt-1">
                    20
                  </div>
                  <p className="text-[11px] text-[#AAA6B7] mt-1">
                    Replenished each monthly cycle
                  </p>
                </div>
              </div>

              {/* Policy Explanation */}
              <div className="p-5 rounded-xl border border-[#292344] bg-[#0E0C1B] space-y-3">
                <h4 className="text-xs font-bold text-[#F5F1E8] flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#C6A75E]" />
                  Monthly Expiration Policy
                </h4>
                <p className="text-xs text-[#AAA6B7] leading-relaxed">
                  To maintain fair AI inference capacity across all software engineering candidates, any unused free monthly credits automatically expire at the end of each monthly billing cycle. Top-up packs and bonus credits persist in your ledger until used.
                </p>
              </div>

              {/* View Ledger Action Button */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-xl border border-[#C6A75E]/30 bg-[#C6A75E]/10">
                <div className="space-y-0.5 text-center sm:text-left">
                  <div className="text-xs font-bold text-[#E1C77A]">Audit Ledger & Pricing Tiers</div>
                  <div className="text-[11px] text-[#AAA6B7]">
                    View all timestamped transactions and explore pro refill packages.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onOpenCreditsModal}
                  className="px-5 py-2 rounded-xl btn-gold-primary text-xs font-semibold text-[#080711] shadow-md transition active:scale-95 cursor-pointer whitespace-nowrap"
                >
                  Open Credits Ledger Modal
                </button>
              </div>
            </div>
          )}

          {/* TAB 6: DANGER ZONE */}
          {activeSubTab === 'danger' && (
            <div className="rounded-2xl border border-[#A94D4D]/40 bg-[#151329] p-6 sm:p-8 shadow-xl space-y-6">
              <div className="border-b border-[#A94D4D]/30 pb-4">
                <h2 className="text-lg font-bold text-[#A94D4D] flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Danger Zone
                </h2>
                <p className="text-xs text-[#AAA6B7] mt-1">
                  Destructive account actions. Please proceed with extreme caution.
                </p>
              </div>

              <div className="space-y-4">
                {/* Sign out all devices */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl border border-[#292344] bg-[#0E0C1B]">
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-[#F5F1E8]">Sign Out of Current Session</h4>
                    <p className="text-[11px] text-[#AAA6B7]">
                      Safely terminates your active browser authentication token.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onLogout}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#292344] bg-[#1B1833] text-xs font-medium text-[#AAA6B7] hover:text-[#F5F1E8] hover:border-[#706C7C] transition cursor-pointer self-start sm:self-center"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>

                {/* Delete Account */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl border border-[#A94D4D]/40 bg-[#A94D4D]/10">
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-[#A94D4D]">Delete ResumeZ Account Permanently</h4>
                    <p className="text-[11px] text-[#AAA6B7]">
                      Permanently wipes your candidate profile, all saved resume drafts, ATS score history, GitHub analyses, and credit balance. This action cannot be reversed.
                    </p>
                  </div>
                  <button
                    id="btn-trigger-delete-account"
                    type="button"
                    onClick={() => setShowDeleteModal(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#A94D4D] text-xs font-bold text-white hover:bg-[#8D3B3B] transition shadow-md cursor-pointer self-start sm:self-center whitespace-nowrap"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete Account</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: PHONE VERIFICATION SIMULATION */}
      {isVerifyingPhone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl border border-[#292344] bg-[#151329] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#F5F1E8] flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-[#C6A75E]" />
                Verify Phone Number
              </h3>
              <button
                type="button"
                onClick={() => setIsVerifyingPhone(false)}
                className="text-[#706C7C] hover:text-[#F5F1E8]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {phoneVerifyStep === 'sending' && (
              <div className="py-6 flex flex-col items-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-[#C6A75E]" />
                <p className="text-xs text-[#AAA6B7]">Dispatching verification code via SMS...</p>
              </div>
            )}

            {phoneVerifyStep === 'otp' && (
              <div className="space-y-3">
                <p className="text-xs text-[#AAA6B7]">
                  Enter the 4-digit code sent to <strong className="text-[#F5F1E8]">{phoneCountryCode} {phone}</strong>
                </p>
                <div className="p-2.5 rounded-lg bg-[#0E0C1B] border border-[#292344] text-center">
                  <span className="text-[11px] text-[#706C7C]">Demo SMS Code: </span>
                  <span className="text-xs font-bold text-[#E1C77A] tracking-widest">{otpCode}</span>
                </div>
                <input
                  type="text"
                  maxLength={4}
                  defaultValue={otpCode}
                  className="w-full text-center tracking-widest text-lg font-bold rounded-xl border border-[#292344] bg-[#0E0C1B] py-2 text-[#F5F1E8] focus:border-[#C6A75E] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleConfirmOtp}
                  className="w-full py-2 rounded-xl btn-gold-primary text-xs font-bold text-[#080711] cursor-pointer"
                >
                  Confirm & Verify Phone
                </button>
              </div>
            )}

            {phoneVerifyStep === 'verified' && (
              <div className="py-6 flex flex-col items-center gap-2 text-[#4F9D69]">
                <CheckCircle2 className="h-8 w-8" />
                <p className="text-xs font-bold">Phone Number Verified!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: DELETE ACCOUNT CONFIRMATION */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-[#A94D4D]/50 bg-[#151329] p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-[#A94D4D]">
              <AlertTriangle className="h-6 w-6 shrink-0" />
              <h3 className="text-base font-bold">Permanently Delete Account?</h3>
            </div>

            <p className="text-xs text-[#AAA6B7] leading-relaxed">
              This will immediately delete your candidate profile for <strong className="text-[#F5F1E8]">{user?.email}</strong>. All your resumes, ATS analyses, GitHub audits, and credit balance will be permanently purged from the database.
            </p>

            <div className="space-y-2 pt-2">
              <label className="text-xs text-[#AAA6B7] block">
                Type <strong className="text-[#A94D4D]">DELETE</strong> to confirm:
              </label>
              <input
                id="input-delete-confirm-text"
                type="text"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                placeholder="DELETE"
                className="w-full rounded-xl border border-[#A94D4D]/40 bg-[#0E0C1B] px-3.5 py-2 text-xs text-[#F5F1E8] focus:border-[#A94D4D] focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#292344]">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmationText('');
                }}
                className="px-4 py-2 rounded-xl border border-[#292344] bg-[#0E0C1B] text-xs font-medium text-[#AAA6B7] hover:text-[#F5F1E8] cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-delete-account"
                type="button"
                onClick={handleDeleteAccountConfirm}
                disabled={deleteConfirmationText !== 'DELETE' || isDeleting}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#A94D4D] text-xs font-bold text-white hover:bg-[#8D3B3B] transition disabled:opacity-40 cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Deleting Account...</span>
                  </>
                ) : (
                  <span>Delete Forever</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
