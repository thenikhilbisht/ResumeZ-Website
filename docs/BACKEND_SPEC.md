# ResumeZ — Backend Architecture Specification

**Document Version:** 1.0.0  
**Status:** Architectural Review & Approval Phase  
**Target Infrastructure:** ₹0 / Free-Tier Initial Deployment (Supabase Free Tier + Server-Side Edge Functions + AI APIs)  
**Security Standard:** Strict Zero-Trust Client, Row Level Security (RLS), Server-Authoritative Quotas & Credits  

---

## 1. System Architecture Overview

ResumeZ operates on a decoupled Client–BaaS architecture designed to achieve zero fixed hosting cost, low latency, robust data isolation, and enterprise-grade security.

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                            Client Layer (React + Vite SPA)                       │
│  - Supabase JS Client (Anon Key ONLY)                                            │
│  - Direct authenticated RLS access to PostgreSQL for CRUD operations             │
│  - Direct authenticated upload to Supabase Storage (Private Resume Bucket)       │
└───────────────────────┬───────────────────────────────┬──────────────────────────┘
                        │                               │
        Authenticated DB Queries (RLS)           Edge Function Invocations
        & Private Storage Uploads                (Bearer Auth Token)
                        │                               │
                        ▼                               ▼
┌────────────────────────────────────────┐    ┌────────────────────────────────────┐
│      Supabase PostgreSQL & Storage     │    │       Supabase Edge Functions      │
│  - Row Level Security (RLS) Enforced   │    │  (Deno Runtime / TypeScript)       │
│  - Profiles, Resumes, Analyses, Usage  │    │                                    │
│  - DB Triggers (Auth -> Profile, Sync) │    │  - analyze-resume (ATS + AI)       │
│  - Atomic Credit RPCs                  │    │  - analyze-github (Public API/AI)  │
│  - Private Storage Policies            │    │  - analyze-leetcode (GraphQL/AI)   │
└───────────────────▲────────────────────┘    │  - admin-manage (RBAC Protected)   │
                    │                         └─────────────────┬──────────────────┘
                    │ Service Role (Internal)                   │
                    └───────────────────────────────────────────┤
                                                                │ AI Calls & Integrations
                                                                ▼
                                              ┌────────────────────────────────────┐
                                              │    External Third-Party APIs       │
                                              │  - AI Provider (Gemini / Claude /  │
                                              │    OpenAI) via Server-Side Secrets │
                                              │  - GitHub REST API (v3)            │
                                              │  - LeetCode Public GraphQL API     │
                                              └────────────────────────────────────┘
```

### Core Architecture Pillars
1. **Zero-Trust Client:** The frontend is treated as an untrusted environment. All sensitive calculations (AI calls, score computations, credit deductions, profile evaluations) are executed exclusively within Supabase Edge Functions or database-level transactions.
2. **Database-Enforced Security:** Authorization is declared and enforced at the database level via PostgreSQL Row Level Security (RLS) policies based on `auth.uid()`.
3. **Atomic Quota Deductions:** Deducting credits and recording usage are executed inside atomic PostgreSQL functions (`SECURITY DEFINER` RPCs) to prevent double-spending, race conditions, or client-side tampering.
4. **₹0 Free-Tier Optimization:** Uses Supabase Free Tier (500MB DB, 1GB Storage, 50k Edge Function invocations/month, 50k monthly active users) and AI free tiers (e.g. Gemini 2.0 Flash / 1.5 Flash via Google AI Studio).

---

## 2. Authentication Flow & Identity Architecture

### 2.1 Auth Provider Integration
- **Engine:** Supabase Auth (GoTrue) using email/password and optional OAuth (GitHub/Google).
- **Session Handling:** JWT Bearer tokens stored in browser `localStorage` or `sessionStorage` with automatic refresh token rotation.
- **Client Security:** Frontend only receives the public `anon` key. The `service_role` key is strictly reserved for backend environment variables within Supabase Edge Functions.

### 2.2 Auth Lifecycle & State Resolution
```
1. User Signs Up / Logs In via supabase.auth.signUp() or signInWithPassword()
2. GoTrue creates record in auth.users
3. PostgreSQL Trigger `on_auth_user_created` automatically provisions:
   a. public.profiles record (with default role 'candidate')
   b. public.subscriptions record (assigned to 'free' plan)
   c. Initial credit allotment in public.usage_balances
4. Frontend waits for session resolution before mounting protected routes
5. Logout: `supabase.auth.signOut()` clears local tokens, resets global auth context, and aborts inflight secure calls.
```

---

## 3. PostgreSQL Database Schema & Relationships

### 3.1 Entity Relationship Diagram (Conceptual)
```
auth.users (Supabase Managed)
    │ 1:1
    ├────────► profiles (User Profile, Roles, Metadata)
    │ 1:1
    ├────────► usage_balances (Current credit balance, lifetime usage)
    │ 1:N
    ├────────► resumes (Saved resume drafts & builder content)
    │ 1:N
    ├────────► analyses (ATS & Resume analysis reports)
    │ 1:N
    ├────────► github_analyses (GitHub portfolio evaluations)
    │ 1:N
    ├────────► leetcode_analyses (LeetCode problem solving evaluations)
    │ 1:N
    ├────────► usage (Ledger of every credit transaction)
    │ 1:N
    └────────► subscriptions (Current and past user plan tiers)
```

### 3.2 Detailed Table Definitions (SQL DDL)

```sql
-- 1. Custom Types & Enums
CREATE TYPE user_role AS ENUM ('candidate', 'admin');
CREATE TYPE analysis_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due', 'trialing');

-- 2. Profiles Table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    role user_role NOT NULL DEFAULT 'candidate',
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

-- 3. Plans Table
CREATE TABLE public.plans (
    id TEXT PRIMARY KEY, -- 'free', 'pro', 'unlimited'
    name TEXT NOT NULL,
    monthly_credits INTEGER NOT NULL DEFAULT 10,
    price_cents INTEGER NOT NULL DEFAULT 0,
    features JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

-- 4. Subscriptions Table
CREATE TABLE public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan_id TEXT NOT NULL REFERENCES public.plans(id),
    status subscription_status NOT NULL DEFAULT 'active',
    current_period_start TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    current_period_end TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW() + INTERVAL '30 days'),
    canceled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

-- 5. Usage Balances Table (Current State)
CREATE TABLE public.usage_balances (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    credits_remaining INTEGER NOT NULL DEFAULT 10 CHECK (credits_remaining >= 0),
    lifetime_credits_used INTEGER NOT NULL DEFAULT 0 CHECK (lifetime_credits_used >= 0),
    last_refill_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

-- 6. Usage Ledger Table (Immutable Audit Log)
CREATE TABLE public.usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    feature TEXT NOT NULL, -- 'resume_ats_analysis', 'github_analysis', 'leetcode_analysis', 'resume_ai_rewrite'
    credits_deducted INTEGER NOT NULL CHECK (credits_deducted > 0),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

-- 7. Resumes Table (Builder Drafts & Parsed Content)
CREATE TABLE public.resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Untitled Resume',
    template_id TEXT NOT NULL DEFAULT 'modern_clean',
    content JSONB NOT NULL DEFAULT '{}'::jsonb,
    storage_path TEXT, -- Storage path if uploaded PDF/DOCX
    file_type TEXT, -- 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', or 'builder'
    is_archived BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

-- 8. Analyses Table (ATS & Job Match Reports)
CREATE TABLE public.analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    resume_id UUID REFERENCES public.resumes(id) ON DELETE SET NULL,
    target_job_title TEXT,
    job_description TEXT NOT NULL,
    overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
    status analysis_status NOT NULL DEFAULT 'completed',
    result_json JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

-- 9. GitHub Analyses Table
CREATE TABLE public.github_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
    status analysis_status NOT NULL DEFAULT 'completed',
    result_json JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

-- 10. LeetCode Analyses Table
CREATE TABLE public.leetcode_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
    status analysis_status NOT NULL DEFAULT 'completed',
    result_json JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

-- 11. Admin Settings & System Configurations Table
CREATE TABLE public.admin_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES public.profiles(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);
```

### 3.3 Strategic Indexes

```sql
-- Profiles & Auth lookup
CREATE INDEX idx_profiles_role ON public.profiles(role);

-- Resumes lookup
CREATE INDEX idx_resumes_user_id ON public.resumes(user_id);
CREATE INDEX idx_resumes_created_at ON public.resumes(created_at DESC);

-- Analyses lookup & history
CREATE INDEX idx_analyses_user_id ON public.analyses(user_id);
CREATE INDEX idx_analyses_resume_id ON public.analyses(resume_id);
CREATE INDEX idx_analyses_created_at ON public.analyses(created_at DESC);

-- GitHub & LeetCode history
CREATE INDEX idx_github_analyses_user_id ON public.github_analyses(user_id);
CREATE INDEX idx_leetcode_analyses_user_id ON public.leetcode_analyses(user_id);

-- Usage & Audit
CREATE INDEX idx_usage_user_id_created ON public.usage(user_id, created_at DESC);
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
```

---

## 4. Row Level Security (RLS) Strategy

Row Level Security is enabled on **every single table** in the public schema without exception.

```sql
-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.github_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leetcode_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
```

### 4.1 Helper Functions for Security & RBAC

```sql
-- Check if current authenticated user is an administrator
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
```

### 4.2 Policy Declarations

#### 1. `profiles`
- **SELECT**: Own profile (`auth.uid() = id`) OR Admin (`public.is_admin()`).
- **UPDATE**: Own profile (`auth.uid() = id`), but role column changes cannot be executed by non-admins (enforced via trigger).
- **INSERT / DELETE**: Restricted to system triggers / service role.

#### 2. `plans`
- **SELECT**: Public read for active plans (`is_active = true`) OR Admin.
- **INSERT / UPDATE / DELETE**: Admin only (`public.is_admin()`).

#### 3. `subscriptions` & `usage_balances`
- **SELECT**: Own records (`auth.uid() = user_id`) OR Admin.
- **INSERT / UPDATE / DELETE**: Service role and Admin only. Ordinary users cannot directly alter their balance or subscription tier.

#### 4. `usage` (Ledger)
- **SELECT**: Own usage logs (`auth.uid() = user_id`) OR Admin.
- **INSERT / UPDATE / DELETE**: Service role only (via Edge Function transactional RPC).

#### 5. `resumes`, `analyses`, `github_analyses`, `leetcode_analyses`
- **SELECT**: Own records (`auth.uid() = user_id`) OR Admin.
- **INSERT**: Authenticated user matching user_id (`auth.uid() = user_id`).
- **UPDATE**: Own records (`auth.uid() = user_id`).
- **DELETE**: Own records (`auth.uid() = user_id`).

#### 6. `admin_settings`
- **SELECT / INSERT / UPDATE / DELETE**: Admin only (`public.is_admin()`).

---

## 5. Storage Architecture & Policies

### 5.1 Storage Buckets
1. **`resumes` (Private Bucket):**
   - Stores raw uploaded PDFs and DOCX files.
   - Public access: **DISABLED (`public: false`)**.
   - Path structure: `{user_id}/{resume_id}/{timestamp}_{filename}`.
   - Max file size limit: **5 MB**.
   - Allowed MIME types: `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`.

2. **`avatars` (Public Bucket):**
   - User profile images.
   - Public access: **ENABLED (`public: true`)**.
   - Path structure: `{user_id}/avatar_{timestamp}.png`.
   - Max file size: **2 MB**.

### 5.2 Storage Security Policies (SQL)

```sql
-- Storage RLS on storage.objects for 'resumes' bucket
CREATE POLICY "Users can upload their own resumes"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'resumes' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view their own resumes"
ON storage.objects FOR SELECT TO authenticated
USING (
    bucket_id = 'resumes' AND
    ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
);

CREATE POLICY "Users can delete their own resumes"
ON storage.objects FOR DELETE TO authenticated
USING (
    bucket_id = 'resumes' AND
    (storage.foldername(name))[1] = auth.uid()::text
);
```

---

## 6. Server-Side Edge Functions & AI Engine

All AI and external data operations run inside **Supabase Edge Functions** (TypeScript on Deno runtime). No client ever connects directly to AI APIs or external scraping endpoints.

```
                  ┌─────────────────────────────────────────────────────────┐
                  │                 Client Request with JWT                 │
                  └───────────────────────────┬─────────────────────────────┘
                                              │
                                              ▼
                  ┌─────────────────────────────────────────────────────────┐
                  │           Edge Function Gateway Middleware              │
                  │  1. Verify JWT (extract user_id)                        │
                  │  2. Validate Request Body (Zod schema)                  │
                  │  3. Rate Limiter (IP/User sliding window)               │
                  │  4. Atomic Credit Pre-Check & Lock                      │
                  └───────────────────────────┬─────────────────────────────┘
                                              │
                                              ▼
                  ┌─────────────────────────────────────────────────────────┐
                  │                Service Execution Pipeline               │
                  │  - Text Extraction (PDF/DOCX) or API Fetch              │
                  │  - Prompt Construction & Guardrails                     │
                  │  - Structured JSON Output Enforcement                   │
                  │  - Model Fallback / Retry Handling                      │
                  └───────────────────────────┬─────────────────────────────┘
                                              │
                                              ▼
                  ┌─────────────────────────────────────────────────────────┐
                  │               Atomic Post-Execution Phase               │
                  │  - Call `deduct_credits_and_save_analysis()` RPC        │
                  │  - Write to analyses table & usage ledger               │
                  │  - Return sanitized payload to client                   │
                  └─────────────────────────────────────────────────────────┘
```

### 6.1 Edge Functions Manifest

| Function Name | Route | Purpose | Credit Cost | Free Tier Model |
| :--- | :--- | :--- | :--- | :--- |
| `analyze-resume` | `/functions/v1/analyze-resume` | Extracts text from uploaded resume, analyzes against job description, scores ATS match. | 2 Credits | Gemini 2.0 Flash / 1.5 Flash |
| `analyze-github` | `/functions/v1/analyze-github` | Fetches public GitHub repos, languages, commit activity, analyzes engineering maturity. | 1 Credit | Gemini 2.0 Flash / 1.5 Flash |
| `analyze-leetcode` | `/functions/v1/analyze-leetcode` | Fetches public LeetCode stats via GraphQL, analyzes algorithmic strengths & weaknesses. | 1 Credit | Gemini 2.0 Flash / 1.5 Flash |
| `enhance-resume-bullet` | `/functions/v1/enhance-bullet` | Rewrites individual resume bullet points into Google XYZ format (`Accomplished [X] as measured by [Y], by doing [Z]`). | 1 Credit | Gemini 2.0 Flash / 1.5 Flash |
| `admin-manage` | `/functions/v1/admin-manage` | Handles administrative actions (credit grants, plan updates, prompt config). | 0 (Admin) | None / Administrative |

---

## 7. Analysis Architectures & Data Structures

### 7.1 ATS Resume Analyzer Data Contract (`result_json`)

```typescript
export interface ATSAnalysisResult {
  overall_score: number; // 0-100
  summary: string;
  scoring_breakdown: {
    keyword_match_score: number; // 0-100
    experience_relevance_score: number; // 0-100
    skills_alignment_score: number; // 0-100
    formatting_readability_score: number; // 0-100
    impact_metrics_score: number; // 0-100
  };
  keywords_analysis: {
    matching_keywords: string[];
    missing_critical_keywords: string[];
    missing_recommended_keywords: string[];
    keyword_density_assessment: 'optimal' | 'under_represented' | 'stuffed';
  };
  section_evaluations: {
    section_name: 'summary' | 'experience' | 'education' | 'skills' | 'projects';
    status: 'strong' | 'acceptable' | 'needs_improvement' | 'missing';
    strengths: string[];
    weaknesses: string[];
    actionable_recommendations: string[];
  }[];
  formatting_feedback: {
    bullet_point_effectiveness: string;
    action_verb_usage: 'weak' | 'moderate' | 'strong';
    quantifiable_achievements_ratio: number; // e.g. 0.65 = 65% of bullets have numbers
    detected_red_flags: string[];
  };
  tailored_suggestions: {
    bullet_rewrite_examples: {
      original: string;
      suggested_rewrite: string;
      reasoning: string;
    }[];
    custom_tailoring_notes: string[];
  };
}
```

### 7.2 Resume Builder Data Contract (`content`)

```typescript
export interface ResumeBuilderContent {
  meta: {
    title: string;
    template_id: 'modern_clean' | 'tech_minimal' | 'executive_classic' | 'creative_compact';
    typography: {
      font_family: string;
      font_size_pt: number;
      line_spacing: number;
    };
    margins_mm: { top: number; right: number; bottom: number; left: number };
    accent_color: string;
  };
  personal_info: {
    full_name: string;
    headline: string;
    email: string;
    phone: string;
    location: string;
    website_url?: string;
    linkedin_url?: string;
    github_url?: string;
  };
  summary: {
    enabled: boolean;
    body: string;
  };
  experience: {
    id: string;
    job_title: string;
    company_name: string;
    location: string;
    start_date: string; // YYYY-MM
    end_date: string | 'Present';
    is_current: boolean;
    bullet_points: string[];
  }[];
  education: {
    id: string;
    institution: string;
    degree: string;
    field_of_study: string;
    location: string;
    start_date: string;
    end_date: string;
    gpa?: string;
    highlights?: string[];
  }[];
  skills: {
    category_name: string; // e.g. "Languages & Frameworks", "Cloud & DevOps"
    skills_list: string[];
  }[];
  projects: {
    id: string;
    title: string;
    subtitle?: string;
    live_url?: string;
    github_url?: string;
    tech_stack: string[];
    bullet_points: string[];
  }[];
  certifications: {
    id: string;
    title: string;
    issuing_organization: string;
    issue_date: string;
    credential_url?: string;
  }[];
  custom_sections?: {
    id: string;
    section_title: string;
    items: {
      title: string;
      date_or_subtitle?: string;
      description: string;
    }[];
  }[];
}
```

### 7.3 GitHub Analyzer Architecture & Data Contract
- **Ingestion:** Edge function calls GitHub Public REST API (`https://api.github.com/users/{username}`, `/users/{username}/repos?sort=updated&per_page=30`).
- **Processing:** Analyzes star count, fork ratio, commit frequency, primary language distribution, repository documentation (README quality indicators), and architectural diversity.
- **Output:**

```typescript
export interface GitHubAnalysisResult {
  username: string;
  overall_score: number; // 0-100
  developer_archetype: string; // e.g. "Full-Stack TypeScript Specialist", "Systems & Backend Builder"
  profile_summary: {
    total_public_repos: number;
    total_stars: number;
    followers: number;
    account_age_years: number;
    primary_languages: { language: string; percentage: number }[];
  };
  portfolio_strengths: string[];
  portfolio_weaknesses: string[];
  top_repositories_reviewed: {
    name: string;
    description: string;
    language: string;
    stars: number;
    insights: string;
    readme_quality: 'comprehensive' | 'basic' | 'missing';
  }[];
  actionable_recommendations: {
    priority: 'high' | 'medium' | 'low';
    area: 'documentation' | 'project_variety' | 'code_freshness' | 'testing';
    suggestion: string;
  }[];
}
```

### 7.4 LeetCode Analyzer Architecture & Data Contract
- **Ingestion:** Edge function sends a structured GraphQL query to LeetCode's public endpoint (`https://leetcode.com/graphql`) querying user public profile statistics:
  - `matchedUser(username: $username) { submitStats: submitStatsGlobal { acSubmissionNum { difficulty count } } }`
  - Contest ranking & badge achievements if public.
- **Graceful Fallback:** If the profile is private, non-existent, or rate-limited by LeetCode, return a standard error code without throwing an internal server exception.
- **Output:**

```typescript
export interface LeetCodeAnalysisResult {
  username: string;
  overall_score: number; // 0-100
  problem_solving_summary: {
    total_solved: number;
    easy_count: number;
    medium_count: number;
    hard_count: number;
    ranking?: number;
    acceptance_rate?: number;
  };
  readiness_assessment: {
    faang_readiness_level: 'entry' | 'intermediate' | 'advanced' | 'interview_ready';
    recommended_focus_areas: string[]; // e.g. "Dynamic Programming", "Graph Traversals"
    consistency_rating: 'high' | 'moderate' | 'low';
  };
  strengths: string[];
  gaps_identified: string[];
  targeted_study_plan: {
    topic: string;
    recommended_problem_types: string[];
    priority: 'urgent' | 'recommended' | 'optional';
  }[];
}
```

---

## 8. Atomic Credits & Quota Management

To satisfy the strict requirement that **refreshing the browser never restores credits** and **credits cannot be double-spent**, all deductions occur in a transactional PostgreSQL RPC using row locking (`SELECT ... FOR UPDATE`).

### 8.1 Transactional Credit Deduction RPC

```sql
CREATE OR REPLACE FUNCTION public.deduct_credits_and_record_usage(
    p_user_id UUID,
    p_feature TEXT,
    p_credits_cost INTEGER,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB AS $$
DECLARE
    v_current_balance INTEGER;
    v_new_balance INTEGER;
BEGIN
    -- 1. Lock the balance row to prevent concurrent race conditions
    SELECT credits_remaining INTO v_current_balance
    FROM public.usage_balances
    WHERE user_id = p_user_id
    FOR UPDATE;

    IF v_current_balance IS NULL THEN
        RAISE EXCEPTION 'User usage balance record not found.';
    END IF;

    -- 2. Verify sufficient funds
    IF v_current_balance < p_credits_cost THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'INSUFFICIENT_CREDITS',
            'credits_remaining', v_current_balance,
            'credits_required', p_credits_cost
        );
    END IF;

    -- 3. Deduct balance & increment lifetime counter
    v_new_balance := v_current_balance - p_credits_cost;
    
    UPDATE public.usage_balances
    SET 
        credits_remaining = v_new_balance,
        lifetime_credits_used = lifetime_credits_used + p_credits_cost,
        updated_at = TIMEZONE('utc', NOW())
    WHERE user_id = p_user_id;

    -- 4. Record immutable audit ledger
    INSERT INTO public.usage (user_id, feature, credits_deducted, metadata)
    VALUES (p_user_id, p_feature, p_credits_cost, p_metadata);

    RETURN jsonb_build_object(
        'success', true,
        'credits_remaining', v_new_balance,
        'credits_deducted', p_credits_cost
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 8.2 Monthly Credit Refill Job (pg_cron / Supabase Scheduled Function)
- Runs at `00:00 UTC on the 1st of every month`.
- Resets/tops up active users' `credits_remaining` to their subscription plan's `monthly_credits`.

---

## 9. Admin Panel Architecture & Real Authorization

Administrative capabilities are secured using real database and server-side authorization rather than frontend UI gating.

### 9.1 Admin Authorization Rules
1. Every admin action is validated by the database function `public.is_admin()`.
2. Admin Edge Functions verify the user's role directly against `public.profiles` using the caller's JWT:
   ```typescript
   const { data: profile } = await supabaseAdmin
     .from('profiles')
     .select('role')
     .eq('id', user.id)
     .single();
   if (profile?.role !== 'admin') {
     return new Response(JSON.stringify({ error: 'Forbidden: Admin privilege required' }), { status: 403 });
   }
   ```
3. Admins can:
   - View global analytics (total users, total analyses run, credit burn rate).
   - Search users and manually adjust credit balances (`public.admin_adjust_credits()`).
   - Modify active plans and features.
   - Update system prompt templates stored in `admin_settings`.
   - Inspect edge function error logs.

---

## 10. API Validation, Rate Limiting & Error Handling

### 10.1 Validation Layer (Zod in Edge Functions)
All inputs to Edge Functions are strictly validated before execution:
- **Resume Upload:** Magic byte check for PDF (`%PDF-`) and DOCX (`PK\x03\x04`), max size 5MB, non-empty extracted text length between 100 and 20,000 characters.
- **Job Description:** Minimum 50 characters, maximum 10,000 characters.
- **GitHub Username:** Regex pattern `^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$`.
- **LeetCode Username:** Regex pattern `^[a-zA-Z0-9_-]{3,30}$`.

### 10.2 Rate Limiting (Sliding Window)
To protect free-tier AI quotas and third-party limits:
- Max 5 AI analyses per user per 10 minutes.
- Max 20 external API lookups per IP per 10 minutes.
- Implemented using PostgreSQL in-memory timestamps or Upstash Redis Free Tier if high volume occurs.

### 10.3 Standardized Error Responses
Edge functions return consistent error payloads:
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_CREDITS | INVALID_FILE_FORMAT | RATE_LIMITED | AI_SERVICE_ERROR | USER_NOT_FOUND",
    "message": "Human-readable explanation for the user",
    "details": {}
  }
}
```

---

## 11. Security Checklist & Risk Mitigation

| Threat / Risk | Mitigation Strategy |
| :--- | :--- |
| **Leaked AI API Keys** | Keys (`GEMINI_API_KEY`, etc.) exist **only** as server-side secrets in Supabase Edge Functions / Vercel backend. Never in client bundles. |
| **Service Role Key Exposure** | Service role key is never bundled in frontend; only the public `anon` key is distributed. |
| **Unauthorized Data Access** | PostgreSQL RLS enabled across all tables; default deny; strictly checked with `auth.uid() = user_id`. |
| **Cross-User File Access** | Resumes stored in private bucket with path convention `{user_id}/*`. Storage RLS prevents reading other folders. |
| **Credit Tampering & Replays** | Credit balance maintained solely in DB. Deductions occur via `SECURITY DEFINER` RPC with row locking. |
| **Prompt Injection Attacks** | User inputs (resumes, job descriptions) are sanitized, isolated within system message delimiter blocks (`<resume_content>` ... `</resume_content>`), and forced into strict JSON schema response mode. |
| **Admin Privilege Escalation** | `profiles.role` column cannot be updated by normal users (enforced via trigger preventing role mutations). |

---

## 12. Environment Variables & Secrets Manifest

### Client-Side (Vite / Frontend)
```env
# Public Supabase Connection (Safe for browser)
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
VITE_APP_ENV="production"
```

### Server-Side (Supabase Edge Functions / Secrets Manager)
```env
# Supabase Internal Admin Key (NEVER expose to client)
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_URL="https://your-project.supabase.co"

# AI Provider API Keys
GEMINI_API_KEY="AIzaSy..."

# GitHub API Token (Optional for higher rate limits: 5000 req/hr vs 60 req/hr)
GITHUB_API_TOKEN="ghp_..."

# Webhook / Security Secrets
APP_ADMIN_SECRET_KEY="sec_..."
```

---

## 13. Required Database Migrations Sequence

1. `20260827000001_create_core_enums_and_profiles.sql`
2. `20260827000002_create_plans_and_subscriptions.sql`
3. `20260827000003_create_usage_and_credits_system.sql`
4. `20260827000004_create_resumes_and_builder.sql`
5. `20260827000005_create_analyses_tables.sql`
6. `20260827000006_create_admin_and_settings.sql`
7. `20260827000007_enable_rls_and_policies.sql`
8. `20260827000008_create_storage_buckets_and_policies.sql`
9. `20260827000009_create_auth_triggers_and_credit_rpcs.sql`

---

## 14. Backend Testing & Verification Strategy

1. **RLS Isolation Tests:**
   - Test User A attempting to query User B's resumes (must return 0 rows).
   - Test User A attempting to download User B's resume PDF from Storage (must return 403 Forbidden).
   - Test non-admin user attempting to read `admin_settings` (must return 403/0 rows).
2. **Credit Concurrency & Atomicity Tests:**
   - Simulate 5 parallel analysis requests for a user with 2 remaining credits. Exactly 1 request must succeed, 4 must fail with `INSUFFICIENT_CREDITS`, and balance must equal 0.
3. **Edge Function Payload Validation Tests:**
   - Submit malicious/corrupted files, empty job descriptions, and oversized inputs to verify graceful 400 Bad Request responses.
4. **Integration Mock Tests:**
   - Mock GitHub API downtime and LeetCode GraphQL private profile errors to verify fallback handling.

---

## 15. Open Questions & Architectural Decisions for Approval

Before proceeding to database migrations or Edge Function implementations, the following decisions require formal stakeholder review:

1. **AI Provider Selection for ₹0 Free-Tier:**
   - *Recommendation:* Google Gemini 2.0 Flash / 1.5 Flash via `@google/genai` (generous free tier with high RPM and native JSON schema output).
   - *Alternative:* OpenAI GPT-4o-mini or Anthropic Claude 3.5 Haiku (requires funded credits).
2. **Initial Free Credit Allotment & Costs:**
   - *Recommendation:* 10 free credits upon signup. ATS Resume Analysis = 2 credits, GitHub Analysis = 1 credit, LeetCode Analysis = 1 credit, Bullet Point AI Enhance = 1 credit. Monthly refill to 10 credits.
3. **PDF Text Extraction Strategy in Edge Functions:**
   - *Recommendation:* Extract text client-side via `pdfjs-dist` before sending to the Edge Function, OR use Deno-compatible PDF parsers (`pdf-parse` / `unpdf`) in the Edge Function.
4. **GitHub Rate Limit Strategy:**
   - *Recommendation:* Utilize a single server-side GitHub Personal Access Token (PAT) in the Edge Function to lift the rate limit from 60 req/hr (unauthenticated) to 5,000 req/hr.
5. **PDF Export Generation for Resume Builder:**
   - *Recommendation:* Client-side CSS print styles + standard `html2pdf.js` / `@react-pdf/renderer` for high-fidelity zero-cost PDF generation.
