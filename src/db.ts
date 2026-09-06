import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

const DB_FILE = path.join(process.cwd(), 'database.json');

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabasePostgresConfigured = Boolean(
  supabaseUrl &&
  supabaseKey &&
  supabaseUrl.startsWith('http') &&
  !supabaseUrl.includes('placeholder') &&
  !supabaseKey.includes('placeholder')
);

export const supabasePg = isSupabasePostgresConfigured
  ? createClient(supabaseUrl, supabaseKey, { auth: { autoRefreshToken: false, persistSession: false } })
  : null;

export interface DbUser {
  id: string;
  email: string;
  full_name: string;
  role: 'candidate' | 'admin';
  is_admin: boolean;
  created_at: string;
  updated_at: string;
  bio?: string;
  avatar_url?: string;
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
  preferred_work_type?: string;
  preferred_location?: string;
  employment_preference?: string;
  expected_salary?: string;
  notice_period?: string;
  plan_id?: string;
  plan_name?: string;
  subscription_status?: string;
  subscription_expires_at?: string;
  pending_plan_name?: string;
}

export interface DbBalance {
  user_id: string;
  credits_remaining: number;
  lifetime_credits_used: number;
  last_refill_at: string;
  updated_at: string;
}

export interface DbCreditTransaction {
  id: string;
  user_id: string;
  amount: number;
  transaction_type: string;
  description: string;
  created_at: string;
  expires_at?: string | null;
}

export interface DbResume {
  id: string;
  user_id: string;
  title: string;
  template_id: string;
  content: any;
  storage_path?: string;
  file_type: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbAnalysis {
  id: string;
  user_id: string;
  resume_id?: string;
  target_job_title?: string;
  job_description?: string;
  overall_score: number;
  result_json: any;
  created_at: string;
}

export interface DbGithubAnalysis {
  id: string;
  user_id: string;
  username: string;
  overall_score: number;
  result_json: any;
  created_at: string;
}

export interface DbLeetcodeAnalysis {
  id: string;
  user_id: string;
  username: string;
  overall_score: number;
  result_json: any;
  created_at: string;
}

export interface DbPaymentRequest {
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
  payment_method: string;
  status: 'pending' | 'verified' | 'rejected';
  submitted_at: string;
  verified_at?: string;
  verified_by?: string;
  admin_notes?: string;
  rejection_reason?: string;
}

export interface DbPaymentConfig {
  upi_id: string;
  merchant_name: string;
  account_name: string;
  qr_instruction: string;
  support_email: string;
  support_phone: string;
  is_active: boolean;
}

interface DatabaseSchema {
  users: DbUser[];
  balances: DbBalance[];
  credit_transactions: DbCreditTransaction[];
  resumes: DbResume[];
  analyses: DbAnalysis[];
  github_analyses: DbGithubAnalysis[];
  leetcode_analyses: DbLeetcodeAnalysis[];
  payment_requests: DbPaymentRequest[];
  payment_config: DbPaymentConfig;
  admin_settings: Record<string, any>;
}

export const AUTHORITATIVE_PLANS: Record<
  string,
  { id: string; name: string; price_inr: number; monthly_credits: number }
> = {
  pro: {
    id: 'pro',
    name: 'Pro Career Accelerator',
    price_inr: 499,
    monthly_credits: 50,
  },
  executive: {
    id: 'executive',
    name: 'Executive & Recruiter Tier',
    price_inr: 1299,
    monthly_credits: 200,
  },
};

let data: DatabaseSchema = {
  users: [],
  balances: [],
  credit_transactions: [],
  resumes: [],
  analyses: [],
  github_analyses: [],
  leetcode_analyses: [],
  payment_requests: [],
  payment_config: {
    upi_id: 'resumez@icici',
    merchant_name: 'ResumeZ AI Technologies',
    account_name: 'ResumeZ Careers Ltd',
    qr_instruction: 'Scan using Google Pay, PhonePe, Paytm, BHIM, or any UPI app. Then submit your 12-digit UTR.',
    support_email: 'billing@resumez.ai',
    support_phone: '+91 98765 43210',
    is_active: true,
  },
  admin_settings: {
    ats_scoring_model: { version: '2.4-advanced', temperature: 0.2 },
    free_tier_monthly_credits: { credits: 20, refill_cron: '0 0 1 * *' },
    max_upload_size_mb: { size_mb: 5 },
    rate_limit_per_user_10m: { max_calls: 5 },
  },
};

export function getAdminEmails(): string[] {
  const envList = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const defaults = ['thenikhilbisht@gmail.com', 'admin@resumez.ai'];
  return Array.from(new Set([...defaults, ...envList]));
}

export function isUserAdmin(user: { email?: string; role?: string; is_admin?: boolean } | null): boolean {
  if (!user) return false;
  if (user.is_admin === true) return true;
  const adminEmails = getAdminEmails();
  const userEmail = (user.email || '').toLowerCase().trim();
  return Boolean(userEmail && adminEmails.includes(userEmail));
}

// Data Sanitization on Startup
function sanitizeData() {
  // 1. Remove mock/fake guest users
  const isGuest = (id: string) => !id || id.startsWith('guest') || id.startsWith('test_guest');
  data.users = (data.users || []).filter((u) => !isGuest(u.id));
  data.balances = (data.balances || []).filter((b) => !isGuest(b.user_id));
  data.credit_transactions = (data.credit_transactions || []).filter((t) => !isGuest(t.user_id));
  data.resumes = (data.resumes || []).filter((r) => !isGuest(r.user_id));

  // 2. Repair corrupted analyses where id was stored as an array of params
  const repairedAnalyses: DbAnalysis[] = [];
  for (const a of data.analyses || []) {
    if (Array.isArray((a as any).id)) {
      const arr = (a as any).id;
      const id = String(arr[0] || `ana-${Date.now()}`);
      const user_id = String(arr[1] || '');
      const overall_score = Number(arr[2]) || 75;
      let result_json = arr[3];
      if (typeof result_json === 'string') {
        try {
          result_json = JSON.parse(result_json);
        } catch {
          result_json = {};
        }
      }
      const created_at = String(arr[4] || new Date().toISOString());

      if (user_id && !isGuest(user_id)) {
        repairedAnalyses.push({
          id,
          user_id,
          overall_score,
          result_json,
          created_at,
        });
      }
    } else if (a.user_id && !isGuest(a.user_id)) {
      if (typeof a.result_json === 'string') {
        try {
          a.result_json = JSON.parse(a.result_json);
        } catch {
          // ignore
        }
      }
      repairedAnalyses.push(a);
    }
  }
  data.analyses = repairedAnalyses;

  // 3. Ensure admin flags are accurate for verified admin emails
  const adminEmails = getAdminEmails();
  for (const u of data.users) {
    if (adminEmails.includes((u.email || '').toLowerCase())) {
      u.is_admin = true;
      u.role = 'admin';
    }
  }
}

// Load database from disk
function loadDb() {
  if (fs.existsSync(DB_FILE)) {
    try {
      const fileData = fs.readFileSync(DB_FILE, 'utf8');
      const parsed = JSON.parse(fileData);
      data = {
        users: parsed.users || [],
        balances: parsed.balances || [],
        credit_transactions: parsed.credit_transactions || [],
        resumes: parsed.resumes || [],
        analyses: parsed.analyses || [],
        github_analyses: parsed.github_analyses || [],
        leetcode_analyses: parsed.leetcode_analyses || [],
        payment_requests: parsed.payment_requests || [],
        payment_config: parsed.payment_config || data.payment_config,
        admin_settings: parsed.admin_settings || data.admin_settings,
      };
      sanitizeData();
      saveDb();
    } catch (e) {
      console.error('[Database] Failed to load DB file, initializing fresh store:', e);
    }
  } else {
    saveDb();
  }
}

// Save database atomically to disk
function saveDb() {
  try {
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('[Database] Failed to save DB to file:', err);
  }
}

loadDb();

// Helper to flatten spread vs array arguments
function flattenParams(params: any[]): any[] {
  if (params.length === 1 && Array.isArray(params[0])) {
    return params[0];
  }
  return params;
}

// Database query interface
export async function getDb() {
  return {
    get: async <T = any>(sql: string, ...args: any[]): Promise<T | null> => {
      const params = flattenParams(args);
      if (sql.includes('FROM users WHERE id = ?')) {
        return (data.users.find((u) => u.id === params[0]) || null) as T | null;
      }
      if (sql.includes('FROM balances WHERE user_id = ?')) {
        return (data.balances.find((b) => b.user_id === params[0]) || null) as T | null;
      }
      if (sql.includes('SELECT COUNT(*) as count FROM users')) {
        return { count: data.users.length } as T;
      }
      if (sql.includes('SELECT COUNT(*) as count FROM resumes WHERE user_id = ?')) {
        return { count: data.resumes.filter((r) => r.user_id === params[0] && !r.is_archived).length } as T;
      }
      if (sql.includes('SELECT COUNT(*) as count FROM resumes')) {
        return { count: data.resumes.filter((r) => !r.is_archived).length } as T;
      }
      if (sql.includes('SELECT COUNT(*) as count FROM analyses')) {
        return {
          count: data.analyses.length + data.github_analyses.length + data.leetcode_analyses.length,
        } as T;
      }
      if (sql.includes('SELECT SUM(lifetime_credits_used) as sum FROM balances')) {
        return {
          sum: data.balances.reduce((acc, b) => acc + (b.lifetime_credits_used || 0), 0),
        } as T;
      }
      return null;
    },

    all: async <T = any>(sql: string, ...args: any[]): Promise<T[]> => {
      const params = flattenParams(args);
      if (sql.includes('FROM analyses WHERE user_id = ?')) {
        return data.analyses
          .filter((a) => a.user_id === params[0])
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) as T[];
      }
      if (sql.includes('FROM github_analyses WHERE user_id = ?')) {
        return data.github_analyses
          .filter((a) => a.user_id === params[0])
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) as T[];
      }
      if (sql.includes('FROM leetcode_analyses WHERE user_id = ?')) {
        return data.leetcode_analyses
          .filter((a) => a.user_id === params[0])
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) as T[];
      }
      if (sql.includes('SELECT * FROM users')) {
        return [...data.users] as T[];
      }
      if (sql.includes('FROM resumes WHERE user_id = ?')) {
        return data.resumes
          .filter((r) => r.user_id === params[0] && !r.is_archived)
          .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()) as T[];
      }
      return [];
    },

    run: async (sql: string, ...args: any[]) => {
      const params = flattenParams(args);

      if (sql.includes('INSERT INTO analyses')) {
        const id = String(params[0]);
        const user_id = String(params[1]);
        const overall_score = Number(params[2]) || 0;
        let result_json = params[3];
        if (typeof result_json === 'string') {
          try {
            result_json = JSON.parse(result_json);
          } catch {
            // keep raw
          }
        }
        const created_at = String(params[4] || new Date().toISOString());

        // Remove any existing with this ID
        data.analyses = data.analyses.filter((a) => a.id !== id);
        data.analyses.push({ id, user_id, overall_score, result_json, created_at });
        saveDb();
      }

      if (sql.includes('INSERT INTO github_analyses')) {
        const id = String(params[0]);
        const user_id = String(params[1]);
        const username = String(params[2]);
        const overall_score = Number(params[3]) || 0;
        let result_json = params[4];
        if (typeof result_json === 'string') {
          try {
            result_json = JSON.parse(result_json);
          } catch {
            // keep raw
          }
        }
        const created_at = String(params[5] || new Date().toISOString());

        data.github_analyses = data.github_analyses.filter((g) => g.id !== id);
        data.github_analyses.push({ id, user_id, username, overall_score, result_json, created_at });
        saveDb();
      }

      if (sql.includes('INSERT INTO leetcode_analyses')) {
        const id = String(params[0]);
        const user_id = String(params[1]);
        const username = String(params[2]);
        const overall_score = Number(params[3]) || 0;
        let result_json = params[4];
        if (typeof result_json === 'string') {
          try {
            result_json = JSON.parse(result_json);
          } catch {
            // keep raw
          }
        }
        const created_at = String(params[5] || new Date().toISOString());

        data.leetcode_analyses = data.leetcode_analyses.filter((l) => l.id !== id);
        data.leetcode_analyses.push({ id, user_id, username, overall_score, result_json, created_at });
        saveDb();
      }

      if (sql.includes('UPDATE users SET full_name = COALESCE')) {
        const user = data.users.find((u) => u.id === params[2]);
        if (user) {
          if (params[0]) user.full_name = params[0];
          user.updated_at = new Date().toISOString();
          saveDb();
        }
      }
    },
  };
}

// User Initialization and Profile Management
export async function getUserOrInit(userId: string, email: string, fullName: string) {
  if (!userId || userId.startsWith('guest') || userId.startsWith('test_guest')) {
    return null;
  }

  let user = data.users.find((u) => u.id === userId);
  const authorizedAdmin = isUserAdmin({ email, is_admin: false });

  if (!user) {
    const now = new Date().toISOString();
    user = {
      id: userId,
      email: email || '',
      full_name: fullName || (email ? email.split('@')[0] : 'Candidate User'),
      role: authorizedAdmin ? 'admin' : 'candidate',
      is_admin: authorizedAdmin,
      created_at: now,
      updated_at: now,
    };
    data.users.push(user);
    saveDb();

    if (supabasePg) {
      Promise.resolve(
        supabasePg.from('profiles').upsert({
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          updated_at: now,
        })
      ).catch(() => {});
    }
  } else {
    // Keep email and admin privileges synchronized
    if (email && user.email !== email) {
      user.email = email;
      user.updated_at = new Date().toISOString();
    }
    if (authorizedAdmin && !user.is_admin) {
      user.is_admin = true;
      user.role = 'admin';
      user.updated_at = new Date().toISOString();
      saveDb();
    }
  }

  // Initialize balance and grant starter credits ONCE
  let balance = data.balances.find((b) => b.user_id === userId);
  if (!balance) {
    const now = new Date().toISOString();
    balance = {
      user_id: userId,
      credits_remaining: 0,
      lifetime_credits_used: 0,
      last_refill_at: now,
      updated_at: now,
    };
    data.balances.push(balance);
    saveDb();

    // Check if initial credit transaction already exists
    const hasInitialTx = data.credit_transactions.some((t) => t.user_id === userId);
    if (!hasInitialTx) {
      await atomicCreditTransaction(userId, 20, 'monthly_credit', 'Initial Starter Free Credits');
    }
  }

  return user;
}

export async function updateUserProfile(userId: string, updates: Record<string, any>) {
  const user = data.users.find((u) => u.id === userId);
  if (!user) return null;

  // Security: Never allow a standard user to modify administrative status, roles, credits, or subscription
  const forbiddenFields = [
    'id',
    'email',
    'role',
    'is_admin',
    'credits_remaining',
    'lifetime_credits_used',
    'subscription_status',
    'plan_id',
    'plan_name',
    'subscription_expires_at',
  ];

  for (const field of forbiddenFields) {
    delete updates[field];
  }

  const allowedFields = [
    'full_name',
    'bio',
    'avatar_url',
    'phone',
    'phone_country_code',
    'phone_verified',
    'professional_title',
    'location',
    'country',
    'experience_level',
    'years_experience',
    'target_role',
    'skills',
    'linkedin_url',
    'github_url',
    'portfolio_url',
    'leetcode_url',
    'other_url',
    'preferred_work_type',
    'preferred_location',
    'employment_preference',
    'expected_salary',
    'notice_period',
  ];

  for (const key of allowedFields) {
    if (updates[key] !== undefined) {
      (user as any)[key] = updates[key];
    }
  }

  user.updated_at = new Date().toISOString();
  saveDb();
  return user;
}

export async function deleteUserAccount(userId: string): Promise<boolean> {
  data.users = data.users.filter((u) => u.id !== userId);
  data.balances = data.balances.filter((b) => b.user_id !== userId);
  data.credit_transactions = data.credit_transactions.filter((t) => t.user_id !== userId);
  data.resumes = data.resumes.filter((r) => r.user_id !== userId);
  data.analyses = data.analyses.filter((a) => a.user_id !== userId);
  data.github_analyses = data.github_analyses.filter((g) => g.user_id !== userId);
  data.leetcode_analyses = data.leetcode_analyses.filter((l) => l.user_id !== userId);
  data.payment_requests = data.payment_requests.filter((p) => p.user_id !== userId);
  saveDb();
  return true;
}

// ---------------- Credit System ----------------

export async function getBalance(userId: string): Promise<DbBalance | null> {
  await processExpiredCredits(userId);
  const bal = data.balances.find((b) => b.user_id === userId);
  return bal ? { ...bal } : null;
}

export async function getTransactions(userId: string): Promise<DbCreditTransaction[]> {
  return data.credit_transactions
    .filter((t) => t.user_id === userId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function deductCreditsAtomic(
  userId: string,
  feature: string,
  cost: number,
  metadata: any = {}
): Promise<{ success: boolean; error?: string; credits_remaining: number }> {
  await processExpiredCredits(userId);

  const bal = data.balances.find((b) => b.user_id === userId);
  if (!bal || bal.credits_remaining < cost) {
    return {
      success: false,
      error: 'INSUFFICIENT_CREDITS',
      credits_remaining: bal ? bal.credits_remaining : 0,
    };
  }

  bal.credits_remaining -= cost;
  bal.lifetime_credits_used += cost;
  bal.updated_at = new Date().toISOString();

  const txId = `tx-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  data.credit_transactions.push({
    id: txId,
    user_id: userId,
    amount: -cost,
    transaction_type: 'credit_used',
    description: feature,
    created_at: new Date().toISOString(),
  });

  saveDb();
  return { success: true, credits_remaining: bal.credits_remaining };
}

export async function atomicCreditTransaction(
  userId: string,
  amount: number,
  type: string,
  description: string,
  expiresInDays: number | null = null
): Promise<{ success: boolean; credits_remaining: number } | null> {
  const bal = data.balances.find((b) => b.user_id === userId);
  if (!bal) return null;

  bal.credits_remaining += amount;
  bal.updated_at = new Date().toISOString();

  const txId = `tx-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

  let expiresAt: string | null = null;
  if (expiresInDays !== null) {
    const date = new Date();
    date.setDate(date.getDate() + expiresInDays);
    expiresAt = date.toISOString();
  } else if (type === 'monthly_credit') {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    expiresAt = date.toISOString();
  }

  data.credit_transactions.push({
    id: txId,
    user_id: userId,
    amount,
    transaction_type: type,
    description,
    created_at: new Date().toISOString(),
    expires_at: expiresAt,
  });

  saveDb();
  return { success: true, credits_remaining: bal.credits_remaining };
}

async function processExpiredCredits(userId: string) {
  const now = new Date().toISOString();
  const expiredTx = data.credit_transactions.filter(
    (t) => t.user_id === userId && t.expires_at && t.expires_at < now
  );

  let updated = false;
  for (const tx of expiredTx) {
    tx.expires_at = null; // Mark expired

    const bal = data.balances.find((b) => b.user_id === userId);
    if (!bal) continue;

    const amountToExpire = Math.min(bal.credits_remaining, tx.amount);
    if (amountToExpire > 0) {
      bal.credits_remaining -= amountToExpire;
      bal.updated_at = new Date().toISOString();
      const expireTxId = `tx-exp-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      data.credit_transactions.push({
        id: expireTxId,
        user_id: userId,
        amount: -amountToExpire,
        transaction_type: 'credit_expired',
        description: 'Unused credits expired',
        created_at: new Date().toISOString(),
      });
      updated = true;
    }
  }

  if (updated) {
    saveDb();
  }
}

// ---------------- Resumes CRUD Persistence ----------------

export async function getUserResumes(userId: string): Promise<DbResume[]> {
  return (data.resumes || [])
    .filter((r) => r.user_id === userId && !r.is_archived)
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
}

export async function getResumeById(id: string, userId: string): Promise<DbResume | null> {
  const r = (data.resumes || []).find((res) => res.id === id);
  if (!r || r.user_id !== userId) return null;
  return { ...r };
}

export async function saveResume(resume: {
  id?: string;
  user_id: string;
  title?: string;
  template_id?: string;
  content?: any;
  file_type?: string;
  is_archived?: boolean;
}): Promise<DbResume> {
  const now = new Date().toISOString();
  if (resume.id) {
    const existing = (data.resumes || []).find((r) => r.id === resume.id && r.user_id === resume.user_id);
    if (existing) {
      if (resume.title !== undefined) existing.title = resume.title;
      if (resume.template_id !== undefined) existing.template_id = resume.template_id;
      if (resume.content !== undefined) existing.content = resume.content;
      if (resume.file_type !== undefined) existing.file_type = resume.file_type;
      if (resume.is_archived !== undefined) existing.is_archived = resume.is_archived;
      existing.updated_at = now;
      saveDb();
      return { ...existing };
    }
  }

  const newResume: DbResume = {
    id: resume.id || `res-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    user_id: resume.user_id,
    title: resume.title || 'Untitled Resume',
    template_id: resume.template_id || 'modern_clean',
    content: resume.content || {},
    file_type: resume.file_type || 'builder',
    is_archived: Boolean(resume.is_archived),
    created_at: now,
    updated_at: now,
  };
  data.resumes.push(newResume);
  saveDb();
  return { ...newResume };
}

export async function deleteResume(id: string, userId: string): Promise<boolean> {
  const index = (data.resumes || []).findIndex((r) => r.id === id && r.user_id === userId);
  if (index === -1) return false;
  data.resumes.splice(index, 1);
  saveDb();
  return true;
}

// ---------------- Admin Settings Persistence ----------------

export async function getAdminSettings(): Promise<Record<string, any>> {
  return { ...data.admin_settings };
}

export async function updateAdminSetting(key: string, value: any): Promise<void> {
  if (!data.admin_settings) data.admin_settings = {};
  data.admin_settings[key] = value;
  saveDb();
}

// ---------------- Subscription & Payment Management ----------------

export async function getPaymentConfig(): Promise<DbPaymentConfig> {
  if (!data.payment_config) {
    data.payment_config = {
      upi_id: 'resumez@icici',
      merchant_name: 'ResumeZ AI Technologies',
      account_name: 'ResumeZ Careers Ltd',
      qr_instruction: 'Scan using Google Pay, PhonePe, Paytm, BHIM, or any UPI app. Then submit your 12-digit UTR.',
      support_email: 'billing@resumez.ai',
      support_phone: '+91 98765 43210',
      is_active: true,
    };
    saveDb();
  }
  return { ...data.payment_config };
}

export async function updatePaymentConfig(updates: Partial<DbPaymentConfig>): Promise<DbPaymentConfig> {
  data.payment_config = {
    ...data.payment_config,
    ...updates,
  };
  saveDb();
  return { ...data.payment_config };
}

export async function submitPaymentRequest(params: {
  userId: string;
  userEmail: string;
  userName: string;
  planId: string;
  utrNumber: string;
  payerUpiId?: string;
  payerPhone?: string;
  paymentMethod?: string;
}): Promise<{ success: boolean; error?: string; payment?: DbPaymentRequest; existing?: any }> {
  const { userId, userEmail, userName, planId, utrNumber, payerUpiId, payerPhone, paymentMethod } = params;

  // Server authoritative plan lookup
  const plan = AUTHORITATIVE_PLANS[planId];
  if (!plan) {
    return {
      success: false,
      error: 'Invalid subscription plan selected. Supported plans: Pro, Executive.',
    };
  }

  const cleanUtr = (utrNumber || '').trim().toUpperCase();
  if (cleanUtr.length < 8 || !/^[A-Z0-9]+$/.test(cleanUtr)) {
    return {
      success: false,
      error: 'Please enter a valid 12-digit UPI Reference / UTR Number.',
    };
  }

  // Prevent duplicate UTR across non-rejected payments
  const duplicateUtr = (data.payment_requests || []).find(
    (p) => p.utr_number.toUpperCase() === cleanUtr && p.status !== 'rejected'
  );
  if (duplicateUtr) {
    return {
      success: false,
      error: 'This Transaction ID / UTR has already been submitted for verification.',
      existing: duplicateUtr,
    };
  }

  // Prevent duplicate pending payment for the same plan by same user
  const existingPending = (data.payment_requests || []).find(
    (p) => p.user_id === userId && p.plan_id === planId && p.status === 'pending'
  );
  if (existingPending) {
    return {
      success: false,
      error: 'You already have a pending payment verification for this plan.',
      existing: existingPending,
    };
  }

  const newPayment: DbPaymentRequest = {
    id: `pay-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    user_id: userId,
    user_email: userEmail,
    user_name: userName,
    plan_id: plan.id,
    plan_name: plan.name,
    amount_inr: plan.price_inr,
    monthly_credits: plan.monthly_credits,
    utr_number: cleanUtr,
    payer_upi_id: (payerUpiId || '').trim(),
    payer_phone: (payerPhone || '').trim(),
    payment_method: paymentMethod || 'upi_qr',
    status: 'pending',
    submitted_at: new Date().toISOString(),
  };

  data.payment_requests.push(newPayment);

  // Set pending indicator on user profile (Plan is NOT active until admin verifies)
  const user = data.users.find((u) => u.id === userId);
  if (user) {
    user.subscription_status = 'pending';
    user.pending_plan_name = plan.name;
    user.updated_at = new Date().toISOString();
  }

  saveDb();
  return { success: true, payment: newPayment };
}

export async function getUserPaymentRequests(userId: string): Promise<DbPaymentRequest[]> {
  return (data.payment_requests || [])
    .filter((p) => p.user_id === userId)
    .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());
}

export async function getAllPaymentRequests(statusFilter?: string): Promise<DbPaymentRequest[]> {
  let list = data.payment_requests || [];
  if (statusFilter && statusFilter !== 'all') {
    list = list.filter((p) => p.status === statusFilter);
  }
  return [...list].sort(
    (a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
  );
}

export async function verifyOrRejectPayment(
  adminUserId: string,
  paymentId: string,
  action: 'verify' | 'reject',
  notes?: string,
  rejectionReason?: string
): Promise<{
  success: boolean;
  error?: string;
  payment?: DbPaymentRequest;
  credits_added?: number;
  message?: string;
}> {
  const payment = (data.payment_requests || []).find((p) => p.id === paymentId);
  if (!payment) {
    return { success: false, error: 'Payment request not found' };
  }

  if (payment.status !== 'pending') {
    return { success: false, error: `Payment is already marked as ${payment.status}` };
  }

  const now = new Date().toISOString();

  if (action === 'verify') {
    payment.status = 'verified';
    payment.verified_at = now;
    payment.verified_by = adminUserId;
    payment.admin_notes = notes || 'Payment verified against UPI settlement record';

    // 1. Activate plan on user profile
    const user = data.users.find((u) => u.id === payment.user_id);
    if (user) {
      user.plan_id = payment.plan_id;
      user.plan_name = payment.plan_name;
      user.subscription_status = 'active';
      user.subscription_expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      delete user.pending_plan_name;
      user.updated_at = now;
    }

    // 2. Add monthly credits associated with the verified plan
    await atomicCreditTransaction(
      payment.user_id,
      payment.monthly_credits,
      'subscription_credit',
      `${payment.plan_name} Monthly Subscription Refill`
    );

    saveDb();
    return {
      success: true,
      payment,
      credits_added: payment.monthly_credits,
      message: `Payment verified. ${payment.plan_name} activated with +${payment.monthly_credits} credits.`,
    };
  } else {
    payment.status = 'rejected';
    payment.verified_at = now;
    payment.verified_by = adminUserId;
    payment.rejection_reason = rejectionReason || 'Invalid or unverified transaction reference';

    // Revert pending status if no other pending payments exist
    const otherPending = data.payment_requests.some(
      (p) => p.user_id === payment.user_id && p.id !== paymentId && p.status === 'pending'
    );
    if (!otherPending) {
      const user = data.users.find((u) => u.id === payment.user_id);
      if (user && user.subscription_status === 'pending') {
        user.subscription_status = user.plan_id && user.plan_id !== 'free' ? 'active' : 'free';
        delete user.pending_plan_name;
        user.updated_at = now;
      }
    }

    saveDb();
    return {
      success: true,
      payment,
      message: 'Payment request marked as rejected.',
    };
  }
}
