export type UserRole = 'candidate' | 'admin';

export type TemplateId = 'modern_clean' | 'tech_minimal' | 'executive_classic' | 'creative_compact';

export type AdminAnalytics = AdminStats;
export type CreditUsageRecord = UsageLedgerItem;

export interface BulletEnhanceResponse {
  original: string;
  critique: string;
  variations: {
    style: string;
    enhanced_bullet: string;
    impact_metrics_highlighted: string;
  }[];
}


export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  bio?: string;
  role: UserRole;
  is_admin?: boolean;
  phone?: string;
  phone_country_code?: string;
  phone_verified?: boolean;
  professional_title?: string;
  location?: string;
  country?: string;
  experience_level?: string;
  years_experience?: string | number;
  target_role?: string;
  skills?: string[];
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
  leetcode_url?: string;
  other_url?: string;
  preferred_work_type?: 'remote' | 'hybrid' | 'onsite' | 'any';
  preferred_location?: string;
  employment_preference?: string;
  expected_salary?: string;
  notice_period?: string;
  plan_id?: string;
  plan_name?: string;
  subscription_status?: 'free' | 'pending' | 'active' | 'expired';
  subscription_expires_at?: string;
  pending_plan_name?: string;
  created_at: string;
  updated_at: string;
}

export interface UsageBalance {
  user_id: string;
  credits_remaining: number;
  lifetime_credits_used: number;
  last_refill_at: string;
  updated_at: string;
}

export interface UsageLedgerItem {
  id: string;
  user_id: string;
  feature: 'resume_ats_analysis' | 'github_analysis' | 'leetcode_analysis' | 'resume_ai_rewrite' | 'admin_adjustment' | 'subscription_credit';
  credits_deducted: number;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface Plan {
  id: string;
  name: string;
  monthly_credits: number;
  price_inr: number;
  features: string[];
  is_active: boolean;
  popular?: boolean;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  current_period_start: string;
  current_period_end: string;
}

export interface PaymentRequest {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  plan_id: string;
  plan_name: string;
  amount_inr: number;
  monthly_credits: number;
  utr_number: string;
  payer_upi_id?: string;
  payer_phone?: string;
  payment_method: 'upi_qr' | 'upi_id';
  status: 'pending' | 'verified' | 'rejected';
  submitted_at: string;
  verified_at?: string;
  verified_by?: string;
  admin_notes?: string;
  rejection_reason?: string;
}

export interface PaymentConfig {
  upi_id: string;
  merchant_name: string;
  account_name: string;
  qr_instruction: string;
  support_email: string;
  support_phone?: string;
  is_active: boolean;
}

// ---------------- ATS Analyzer Types ----------------

export interface ATSScoringBreakdown {
  keyword_match_score: number; // 0-100
  experience_relevance_score: number; // 0-100
  skills_alignment_score: number; // 0-100
  formatting_readability_score: number; // 0-100
  impact_metrics_score: number; // 0-100
}

export interface SectionEvaluation {
  section_name: 'summary' | 'experience' | 'education' | 'skills' | 'projects' | 'general';
  status: 'strong' | 'acceptable' | 'needs_improvement' | 'missing';
  strengths: string[];
  weaknesses: string[];
  actionable_recommendations: string[];
}

export interface BulletRewriteExample {
  original: string;
  suggested_rewrite: string;
  reasoning: string;
}

export interface ATSAnalysisResult {
  overall_score: number; // 0-100
  summary: string;
  verdict: 'Excellent Match' | 'Good Match' | 'Moderate Fit' | 'Needs Significant Optimization';
  scoring_breakdown: ATSScoringBreakdown;
  keywords_analysis: {
    matching_keywords: string[];
    missing_critical_keywords: string[];
    missing_recommended_keywords: string[];
    keyword_density_assessment: 'optimal' | 'under_represented' | 'stuffed';
  };
  section_evaluations: SectionEvaluation[];
  formatting_feedback: {
    bullet_point_effectiveness: string;
    action_verb_usage: 'weak' | 'moderate' | 'strong';
    quantifiable_achievements_ratio: number;
    detected_red_flags: string[];
  };
  tailored_suggestions: {
    bullet_rewrite_examples: BulletRewriteExample[];
    custom_tailoring_notes: string[];
  };
}

export interface ResumeAnalysisRecord {
  id: string;
  user_id: string;
  resume_id?: string;
  target_job_title?: string;
  job_description: string;
  overall_score: number;
  result_json: ATSAnalysisResult;
  created_at: string;
}

// ---------------- Resume Builder Types ----------------

export interface ResumeMeta {
  title: string;
  template_id: 'modern_clean' | 'tech_minimal' | 'executive_classic' | 'creative_compact';
  typography: {
    font_family: 'inter' | 'serif' | 'mono' | 'sans';
    font_size_pt: number;
    line_spacing: number;
  };
  margins_mm: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  accent_color: string;
}

export interface ResumePersonalInfo {
  full_name: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  website_url?: string;
  linkedin_url?: string;
  github_url?: string;
}

export interface ResumeExperienceItem {
  id: string;
  job_title: string;
  company_name: string;
  location: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  bullet_points: string[];
}

export interface ResumeEducationItem {
  id: string;
  institution: string;
  degree: string;
  field_of_study: string;
  location: string;
  start_date: string;
  end_date: string;
  gpa?: string;
  highlights?: string[];
}

export interface ResumeSkillCategory {
  id: string;
  category_name: string;
  skills_list: string[];
}

export interface ResumeProjectItem {
  id: string;
  title: string;
  subtitle?: string;
  live_url?: string;
  github_url?: string;
  tech_stack: string[];
  bullet_points: string[];
}

export interface ResumeCertificationItem {
  id: string;
  title: string;
  issuing_organization: string;
  issue_date: string;
  credential_url?: string;
}

export interface ResumeCustomSection {
  id: string;
  section_title: string;
  items: {
    title: string;
    subtitle?: string;
    description: string;
  }[];
}

export interface ResumeContent {
  meta: ResumeMeta;
  personal_info: ResumePersonalInfo;
  summary: {
    enabled: boolean;
    body: string;
  };
  experience: ResumeExperienceItem[];
  education: ResumeEducationItem[];
  skills: ResumeSkillCategory[];
  projects: ResumeProjectItem[];
  certifications: ResumeCertificationItem[];
  custom_sections?: ResumeCustomSection[];
}

export interface ResumeDocument {
  id: string;
  user_id: string;
  title: string;
  template_id: string;
  content: ResumeContent;
  storage_path?: string;
  file_type: 'builder' | 'application/pdf' | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

// ---------------- GitHub Analyzer Types ----------------

export interface GitHubRepositoryInsight {
  name: string;
  description: string;
  language: string;
  stars: number;
  forks: number;
  insights: string;
  readme_quality: 'comprehensive' | 'basic' | 'missing';
}

export interface GitHubAnalysisResult {
  username: string;
  overall_score: number;
  developer_archetype: string;
  profile_summary: {
    name: string;
    bio: string;
    avatar_url: string;
    total_public_repos: number;
    total_stars: number;
    followers: number;
    following: number;
    primary_languages: { language: string; percentage: number }[];
  };
  portfolio_strengths: string[];
  portfolio_weaknesses: string[];
  top_repositories_reviewed: GitHubRepositoryInsight[];
  actionable_recommendations: {
    priority: 'high' | 'medium' | 'low';
    area: 'documentation' | 'project_variety' | 'code_freshness' | 'testing';
    suggestion: string;
  }[];
}

export interface GitHubAnalysisRecord {
  id: string;
  user_id: string;
  username: string;
  overall_score: number;
  result_json: GitHubAnalysisResult;
  created_at: string;
}

// ---------------- LeetCode Analyzer Types ----------------

export interface LeetCodeAnalysisResult {
  username: string;
  overall_score: number;
  problem_solving_summary: {
    total_solved: number;
    easy_count: number;
    medium_count: number;
    hard_count: number;
    global_ranking?: number;
    acceptance_rate?: number;
    contest_rating?: number;
  };
  readiness_assessment: {
    faang_readiness_level: 'entry' | 'intermediate' | 'advanced' | 'interview_ready';
    consistency_rating: 'high' | 'moderate' | 'low';
    recommended_focus_areas: string[];
  };
  strengths: string[];
  gaps_identified: string[];
  targeted_study_plan: {
    topic: string;
    recommended_problem_types: string[];
    priority: 'urgent' | 'recommended' | 'optional';
  }[];
}

export interface LeetCodeAnalysisRecord {
  id: string;
  user_id: string;
  username: string;
  overall_score: number;
  result_json: LeetCodeAnalysisResult;
  created_at: string;
}

// ---------------- Admin Types ----------------

export interface AdminStats {
  total_users: number;
  total_resumes: number;
  total_analyses: number;
  total_credits_consumed: number;
  active_subscribers: number;
  ai_success_rate: number;
}

export interface AdminUserListItem {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  credits_remaining: number;
  lifetime_credits_used: number;
  plan_name: string;
  resumes_count: number;
  analyses_count: number;
  created_at: string;
}

export interface AdminSettingItem {
  key: string;
  value: any;
  description: string;
  updated_at: string;
}
