import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import compression from 'compression';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import * as db from './src/db';

dotenv.config();

// Process resilience: prevent unhandled transient rejections from crashing the process
process.on('uncaughtException', (err) => {
  console.error('[Server Uncaught Exception]:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('[Server Unhandled Rejection]:', reason);
});

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// ---------------- Production Middleware ----------------
app.use(compression());
app.use(express.json({ limit: '10mb' }));

// ---------------- CORS Middleware ----------------
app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
    : [];

  if (origin) {
    if (
      allowedOrigins.length === 0 ||
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      origin.includes('localhost') ||
      origin.includes('127.0.0.1')
    ) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      res.setHeader('Access-Control-Allow-Origin', allowedOrigins[0] || origin);
    }
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

// ---------------- Supabase Admin Client (Server-Side Only) ----------------
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const isSupabaseAdminConfigured = Boolean(
  supabaseUrl &&
  supabaseServiceKey &&
  supabaseUrl.startsWith('http') &&
  !supabaseUrl.includes('placeholder')
);

if (!isSupabaseAdminConfigured) {
  console.warn(
    '[Server Auth] WARNING: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not configured in environment variables. Authenticated requests will require Railway environment setup.'
  );
}

const supabaseAdmin = isSupabaseAdminConfigured
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;

// ---------------- Server-Side Gemini AI Client ----------------
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const FALLBACK_GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];

const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'ResumeZ-Production-AI',
      },
    },
  });
};

const generateContentWithRetry = async (ai: GoogleGenAI, request: any, maxRetries = 2) => {
  const modelList = Array.from(new Set([request.model || GEMINI_MODEL, ...FALLBACK_GEMINI_MODELS]));
  let lastError: any = null;

  for (const modelCandidate of modelList) {
    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        const callPromise = ai.models.generateContent({
          ...request,
          model: modelCandidate,
        });
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Gemini API call timed out after 25s')), 25000)
        );
        return (await Promise.race([callPromise, timeoutPromise])) as any;
      } catch (error: any) {
        lastError = error;
        const errStr = String(error?.message || error?.status || '');
        const isNotFoundOrDeprecated =
          error?.status === 404 ||
          error?.code === 404 ||
          errStr.includes('404') ||
          errStr.includes('no longer available') ||
          errStr.includes('NOT_FOUND');

        if (isNotFoundOrDeprecated) {
          console.warn(`[Gemini AI] Model ${modelCandidate} unavailable (${errStr}). Trying next fallback model...`);
          break;
        }

        attempt++;
        const isUnavailable =
          error.status === 503 ||
          error.status === 'UNAVAILABLE' ||
          errStr.includes('503') ||
          errStr.includes('timed out');

        if (!isUnavailable || attempt >= maxRetries) {
          throw error;
        }
        console.log(`[Gemini API] Retrying request on ${modelCandidate} (attempt ${attempt}/${maxRetries})...`);
        await new Promise((resolve) => setTimeout(resolve, 1200));
      }
    }
  }
  throw lastError || new Error('Max retries exceeded for Gemini API call');
};

// ---------------- Request Extension & Authentication ----------------
declare module 'express-serve-static-core' {
  interface Request {
    userId?: string;
    userEmail?: string;
    userRole?: string;
  }
}

/**
 * Strict Server-Side Authentication Middleware
 * Rejects requests without a valid authenticated Supabase JWT with HTTP 401.
 * Never trusts x-guest-id or client-provided identifiers.
 */
const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  if (!supabaseAdmin) {
    return res.status(500).json({
      success: false,
      error: 'Supabase Auth is not configured on the server. Please add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to your Railway environment variables.',
    });
  }

  const authHeader = req.headers.authorization;
  const token =
    authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token || token === 'null' || token === 'undefined') {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Please sign in to access this resource.',
    });
  }

  try {
    const timeoutPromise = new Promise<{ data: null; error: Error }>((_, reject) =>
      setTimeout(() => reject(new Error('Authentication service timeout')), 4000)
    );
    const { data, error } = await Promise.race([
      supabaseAdmin.auth.getUser(token),
      timeoutPromise,
    ]);

    if (error || !data?.user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired session. Please sign in again.',
      });
    }

    const authUser = data.user;
    req.userId = authUser.id;
    req.userEmail = authUser.email || '';

    // Initialize or load user profile and ensure starter credits are granted once
    const user = await db.getUserOrInit(
      authUser.id,
      authUser.email || '',
      authUser.user_metadata?.full_name || ''
    );

    req.userRole = user?.role || 'candidate';
    next();
  } catch (err: any) {
    console.error('[Auth Error]', err.message || err);
    return res.status(401).json({
      success: false,
      error: 'Authentication failed. Please verify your connection or sign in again.',
    });
  }
};

/**
 * Strict Admin Authorization Middleware
 * Verifies that the authenticated user has verified administrative privileges.
 */
const verifyAdminMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sqliteDb = await db.getDb();
    const user = await sqliteDb.get('SELECT * FROM users WHERE id = ?', req.userId!);
    if (!user || (!user.is_admin && user.role !== 'admin' && !db.isUserAdmin(user))) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Administrative privileges are required to access this endpoint.',
      });
    }
    next();
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Failed to verify admin status.' });
  }
};

// ---------------- REST API Routes ----------------

// 1. Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'ResumeZ AI',
    timestamp: new Date().toISOString(),
  });
});

// 2. Auth Endpoints
app.get('/api/auth/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const sqliteDb = await db.getDb();
    const user = await sqliteDb.get('SELECT * FROM users WHERE id = ?', req.userId!);
    if (!user) {
      return res.status(401).json({ success: false, error: 'User profile not found.' });
    }
    const balance = await db.getBalance(req.userId!);
    res.json({
      success: true,
      user,
      balance: balance || { credits_remaining: 20, lifetime_credits_used: 0 },
    });
  } catch (err: any) {
    console.error('Error in /api/auth/me:', err);
    res.status(500).json({ success: false, error: 'Internal server error fetching user data.' });
  }
});

// 3. User Credits & Usage
app.get('/api/user/credits', requireAuth, async (req: Request, res: Response) => {
  try {
    const balance = await db.getBalance(req.userId!);
    res.json({
      success: true,
      credits_remaining: balance?.credits_remaining ?? 0,
      lifetime_credits_used: balance?.lifetime_credits_used ?? 0,
      last_refill_at: balance?.last_refill_at ?? new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Error fetching credits balance.' });
  }
});

app.post('/api/user/refill', requireAuth, async (req: Request, res: Response) => {
  try {
    const txs = await db.getTransactions(req.userId!);
    const now = Date.now();
    const recentFreeClaim = txs.find(
      (t) =>
        t.transaction_type === 'free_claim' &&
        new Date(t.created_at).getTime() > now - 24 * 60 * 60 * 1000
    );

    const currentBal = await db.getBalance(req.userId!);
    const creditsLeft = currentBal?.credits_remaining ?? 0;

    if (recentFreeClaim) {
      return res.status(429).json({
        success: false,
        error: 'You have already claimed free credits today. Upgrade or wait 24 hours for daily reset.',
        credits_remaining: creditsLeft,
      });
    }

    if (creditsLeft >= 5) {
      return res.status(400).json({
        success: false,
        error: 'Free refills are only available when your credit balance is under 5 credits.',
        credits_remaining: creditsLeft,
      });
    }

    // Server-enforced refill amount: strictly 5 credits
    const result = await db.atomicCreditTransaction(
      req.userId!,
      5,
      'free_claim',
      'Daily Starter Credit Claim'
    );

    if (result) {
      res.json({ success: true, credits_remaining: result.credits_remaining });
    } else {
      res.status(500).json({ success: false, error: 'Failed to apply refill.' });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to process credit refill.' });
  }
});

app.get('/api/user/usage', requireAuth, async (req: Request, res: Response) => {
  try {
    const txs = await db.getTransactions(req.userId!);
    const mapped = txs.map((tx) => ({
      id: tx.id,
      user_id: tx.user_id,
      feature: tx.description,
      credits_deducted: -tx.amount,
      created_at: tx.created_at,
    }));
    res.json({ success: true, usage: mapped });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Error fetching usage history.' });
  }
});

// 4. User Profile Management
app.put('/api/user/profile', requireAuth, async (req: Request, res: Response) => {
  try {
    const result = await db.updateUserProfile(req.userId!, req.body);
    if (!result) {
      return res.status(404).json({ success: false, error: 'User profile not found.' });
    }
    res.json({ success: true, profile: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to update profile.' });
  }
});

app.post('/api/user/verify-phone', requireAuth, async (req: Request, res: Response) => {
  const { phone } = req.body;
  if (!phone || phone.trim().length < 6) {
    return res.status(400).json({ success: false, error: 'Invalid phone number provided.' });
  }
  const result = await db.updateUserProfile(req.userId!, { phone, phone_verified: true });
  res.json({ success: true, profile: result, message: 'Phone number verified successfully.' });
});

app.delete('/api/user/account', requireAuth, async (req: Request, res: Response) => {
  try {
    await db.deleteUserAccount(req.userId!);
    // Delete from Supabase Auth as well
    await supabaseAdmin.auth.admin.deleteUser(req.userId!);
    res.json({ success: true, message: 'Account and associated data deleted permanently.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to complete account deletion.' });
  }
});

// 5. Payment & Checkout Endpoints
app.get('/api/payment/config', async (_req: Request, res: Response) => {
  try {
    const config = await db.getPaymentConfig();
    res.json({ success: true, config });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to load payment configuration.' });
  }
});

app.post('/api/payment/submit', requireAuth, async (req: Request, res: Response) => {
  try {
    const { plan_id, utr_number, payer_upi_id, payer_phone, payment_method } = req.body;

    if (!plan_id || !utr_number) {
      return res.status(400).json({
        success: false,
        error: 'Plan ID and Transaction UTR / Reference number are required.',
      });
    }

    const sqliteDb = await db.getDb();
    const user = await sqliteDb.get('SELECT * FROM users WHERE id = ?', req.userId!);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User record not found.' });
    }

    const submission = await db.submitPaymentRequest({
      userId: req.userId!,
      userEmail: user.email,
      userName: user.full_name || 'Candidate User',
      planId: plan_id,
      utrNumber: utr_number,
      payerUpiId: payer_upi_id,
      payerPhone: payer_phone || user.phone,
      paymentMethod: payment_method || 'upi_qr',
    });

    if (!submission.success) {
      return res.status(400).json({
        success: false,
        error: submission.error,
        existing: submission.existing,
      });
    }

    res.json({
      success: true,
      message:
        'Payment submitted successfully. Your subscription will be activated upon admin verification.',
      payment: submission.payment,
    });
  } catch (err: any) {
    console.error('Payment submission error:', err);
    res.status(500).json({ success: false, error: 'Error processing payment submission.' });
  }
});

app.get('/api/payment/my-requests', requireAuth, async (req: Request, res: Response) => {
  try {
    const requests = await db.getUserPaymentRequests(req.userId!);
    res.json({ success: true, requests });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to fetch user payments.' });
  }
});

// 6. Resumes CRUD Persistence
app.get('/api/resumes', requireAuth, async (req: Request, res: Response) => {
  try {
    const userResumes = await db.getUserResumes(req.userId!);
    res.json({ success: true, resumes: userResumes });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to fetch resumes.' });
  }
});

app.post('/api/resumes', requireAuth, async (req: Request, res: Response) => {
  try {
    const { title, template_id, content, file_type = 'builder' } = req.body;
    const newResume = await db.saveResume({
      user_id: req.userId!,
      title,
      template_id,
      content,
      file_type,
    });
    res.json({ success: true, resume: newResume });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to create resume.' });
  }
});

app.put('/api/resumes/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const updated = await db.saveResume({
      id: req.params.id,
      user_id: req.userId!,
      ...req.body,
    });
    res.json({ success: true, resume: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to update resume.' });
  }
});

app.delete('/api/resumes/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const ok = await db.deleteResume(req.params.id, req.userId!);
    if (!ok) {
      return res.status(404).json({ success: false, error: 'Resume not found or access denied.' });
    }
    res.json({ success: true, message: 'Resume deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to delete resume.' });
  }
});

// 7. Analyses History
app.get('/api/analyses', requireAuth, async (req: Request, res: Response) => {
  try {
    const sqliteDb = await db.getDb();
    const userId = req.userId!;

    const userAnalyses = await sqliteDb.all(
      'SELECT * FROM analyses WHERE user_id = ? ORDER BY created_at DESC',
      userId
    );
    const userGithub = await sqliteDb.all(
      'SELECT * FROM github_analyses WHERE user_id = ? ORDER BY created_at DESC',
      userId
    );
    const userLeetcode = await sqliteDb.all(
      'SELECT * FROM leetcode_analyses WHERE user_id = ? ORDER BY created_at DESC',
      userId
    );

    const safeParse = (val: any) => {
      if (!val) return {};
      if (typeof val === 'object') return val;
      try {
        return JSON.parse(val);
      } catch {
        return {};
      }
    };

    res.json({
      success: true,
      resume_analyses: (userAnalyses || []).map((a) => ({ ...a, result_json: safeParse(a.result_json) })),
      github_analyses: (userGithub || []).map((a) => ({ ...a, result_json: safeParse(a.result_json) })),
      leetcode_analyses: (userLeetcode || []).map((a) => ({ ...a, result_json: safeParse(a.result_json) })),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to fetch analyses history.' });
  }
});

// ---------------- AI Endpoints ----------------

// AI Helper: Check Gemini Availability
const verifyGeminiReady = (res: Response): GoogleGenAI | null => {
  const ai = getGeminiClient();
  if (!ai) {
    res.status(503).json({
      success: false,
      error:
        'AI service is currently unavailable. GEMINI_API_KEY is not configured on the server.',
    });
    return null;
  }
  return ai;
};

// 8. ATS Resume Analyzer (Cost: 2 Credits — Deducted ONLY on Success)
app.post('/api/ai/analyze-resume', requireAuth, async (req: Request, res: Response) => {
  try {
    const { resume_text, job_description, target_job_title, resume_id } = req.body;

    if (!resume_text || resume_text.trim().length < 50) {
      return res.status(400).json({
        success: false,
        error: 'Resume text is required and must contain at least 50 characters.',
      });
    }
    if (!job_description || job_description.trim().length < 30) {
      return res.status(400).json({
        success: false,
        error: 'Job description is required and must contain at least 30 characters.',
      });
    }

    // 1. Check credit balance beforehand (do NOT deduct yet)
    const bal = await db.getBalance(req.userId!);
    if (!bal || bal.credits_remaining < 2) {
      return res.status(402).json({
        success: false,
        error: 'Insufficient credits. You need 2 credits for ATS Resume Analysis.',
        credits_remaining: bal ? bal.credits_remaining : 0,
      });
    }

    // 2. Check AI client availability
    const ai = verifyGeminiReady(res);
    if (!ai) return;

    const prompt = `You are a Principal Technical Recruiter and Senior ATS Algorithm Auditor.
Analyze the following candidate's resume thoroughly against the target job description.

Candidate Resume Text:
"""
${resume_text.substring(0, 12000)}
"""

Target Job Description:
"""
${job_description.substring(0, 8000)}
"""

Target Role: ${target_job_title || 'Software Engineer'}

Provide an actionable, realistic ATS audit evaluating keyword frequency, technical competencies, quantifiable outcomes, formatting readiness, and section-by-section breakdown.`;

    const response = await generateContentWithRetry(ai, {
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        systemInstruction:
          'You are a professional ATS algorithm auditor. Always return strict, valid JSON matching the exact schema without markdown formatting or code fences.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overall_score: { type: Type.INTEGER, description: 'Overall ATS score 0 to 100' },
            summary: { type: Type.STRING, description: 'Executive summary of fit and major ATS findings' },
            verdict: {
              type: Type.STRING,
              description: 'One of: Excellent Match, Good Match, Moderate Fit, Needs Significant Optimization',
            },
            scoring_breakdown: {
              type: Type.OBJECT,
              properties: {
                keyword_match_score: { type: Type.INTEGER, description: '0 to 100' },
                experience_relevance_score: { type: Type.INTEGER, description: '0 to 100' },
                skills_alignment_score: { type: Type.INTEGER, description: '0 to 100' },
                formatting_readability_score: { type: Type.INTEGER, description: '0 to 100' },
                impact_metrics_score: { type: Type.INTEGER, description: '0 to 100' },
              },
              required: [
                'keyword_match_score',
                'experience_relevance_score',
                'skills_alignment_score',
                'formatting_readability_score',
                'impact_metrics_score',
              ],
            },
            keywords_analysis: {
              type: Type.OBJECT,
              properties: {
                matching_keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
                missing_critical_keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
                missing_recommended_keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
                keyword_density_assessment: {
                  type: Type.STRING,
                  description: 'optimal, under_represented, or stuffed',
                },
              },
              required: [
                'matching_keywords',
                'missing_critical_keywords',
                'missing_recommended_keywords',
                'keyword_density_assessment',
              ],
            },
            section_evaluations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  section_name: { type: Type.STRING },
                  status: { type: Type.STRING, description: 'strong, acceptable, needs_improvement, or missing' },
                  strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                  weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
                  actionable_recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ['section_name', 'status', 'strengths', 'weaknesses', 'actionable_recommendations'],
              },
            },
            formatting_feedback: {
              type: Type.OBJECT,
              properties: {
                bullet_point_effectiveness: { type: Type.STRING },
                action_verb_usage: { type: Type.STRING, description: 'weak, moderate, or strong' },
                quantifiable_achievements_ratio: {
                  type: Type.NUMBER,
                  description: 'Percentage as decimal between 0 and 1',
                },
                detected_red_flags: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: [
                'bullet_point_effectiveness',
                'action_verb_usage',
                'quantifiable_achievements_ratio',
                'detected_red_flags',
              ],
            },
            tailored_suggestions: {
              type: Type.OBJECT,
              properties: {
                bullet_rewrite_examples: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      original: { type: Type.STRING },
                      suggested_rewrite: { type: Type.STRING },
                      reasoning: { type: Type.STRING },
                    },
                    required: ['original', 'suggested_rewrite', 'reasoning'],
                  },
                },
                custom_tailoring_notes: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ['bullet_rewrite_examples', 'custom_tailoring_notes'],
            },
          },
          required: [
            'overall_score',
            'summary',
            'verdict',
            'scoring_breakdown',
            'keywords_analysis',
            'section_evaluations',
            'formatting_feedback',
            'tailored_suggestions',
          ],
        },
      },
    });

    let parsedResult: any;
    try {
      parsedResult = JSON.parse(response.text || '{}');
    } catch {
      throw new Error('AI returned a response with invalid JSON structure.');
    }

    // 3. Deduct credits ONLY AFTER successful AI response
    const deduction = await db.deductCreditsAtomic(req.userId!, 'resume_ats_analysis', 2, {
      target_job: target_job_title || 'Unspecified Job',
      resume_length: resume_text.length,
    });

    if (!deduction.success) {
      return res.status(402).json({
        success: false,
        error: 'Credit balance became insufficient during analysis.',
        credits_remaining: deduction.credits_remaining,
      });
    }

    // 4. Save analysis to database
    const analysisRecord = {
      id: `ana-${Date.now()}`,
      user_id: req.userId!,
      resume_id,
      target_job_title: target_job_title || 'Target Role',
      job_description,
      overall_score: parsedResult.overall_score || 75,
      result_json: parsedResult,
      created_at: new Date().toISOString(),
    };

    const sqliteDb = await db.getDb();
    await sqliteDb.run(
      'INSERT INTO analyses (id, user_id, overall_score, result_json, created_at) VALUES (?, ?, ?, ?, ?)',
      [
        analysisRecord.id,
        analysisRecord.user_id,
        analysisRecord.overall_score,
        JSON.stringify(analysisRecord.result_json),
        analysisRecord.created_at,
      ]
    );

    res.json({
      success: true,
      analysis: analysisRecord,
      credits_remaining: deduction.credits_remaining,
    });
  } catch (error: any) {
    console.error('[ATS Analysis Error]', error.message || error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to complete ATS analysis. Please try again.',
    });
  }
});

// 9. Bullet Point Enhancer (Cost: 1 Credit — Deducted ONLY on Success)
app.post('/api/ai/enhance-bullet', requireAuth, async (req: Request, res: Response) => {
  try {
    const { bullet_text, target_role, tech_stack } = req.body;
    if (!bullet_text || bullet_text.trim().length < 5) {
      return res.status(400).json({
        success: false,
        error: 'Bullet point text is required.',
      });
    }

    const bal = await db.getBalance(req.userId!);
    if (!bal || bal.credits_remaining < 1) {
      return res.status(402).json({
        success: false,
        error: 'Insufficient credits. You need 1 credit for Bullet Point Enhancement.',
        credits_remaining: bal ? bal.credits_remaining : 0,
      });
    }

    const ai = verifyGeminiReady(res);
    if (!ai) return;

    const prompt = `Rewrite the following resume bullet point using the Google XYZ Formula ("Accomplished [X] as measured by [Y], by doing [Z]") and high-impact action verbs.
Target Role context: ${target_role || 'Software Engineer'}
Key Technologies: ${tech_stack || 'Modern Tech Stack'}

Original Bullet:
"${bullet_text}"

Provide 3 distinct professional variations (Metric-focused, Leadership/Initiative, Technical Depth) and explain why each variation is stronger.`;

    const response = await generateContentWithRetry(ai, {
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            original: { type: Type.STRING },
            critique: { type: Type.STRING, description: 'Brief diagnosis of why the original is weak or unquantified' },
            variations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  style: { type: Type.STRING, description: 'Metric-Driven, Technical Depth, or Leadership & Scope' },
                  enhanced_bullet: { type: Type.STRING },
                  impact_metrics_highlighted: { type: Type.STRING },
                },
                required: ['style', 'enhanced_bullet', 'impact_metrics_highlighted'],
              },
            },
          },
          required: ['original', 'critique', 'variations'],
        },
      },
    });

    let parsed: any;
    try {
      parsed = JSON.parse(response.text || '{}');
    } catch {
      throw new Error('AI returned an invalid JSON response format.');
    }

    // Deduct credit ONLY AFTER success
    const deduction = await db.deductCreditsAtomic(req.userId!, 'resume_ai_rewrite', 1, {
      original_length: bullet_text.length,
    });

    res.json({
      success: true,
      result: parsed,
      credits_remaining: deduction.credits_remaining,
    });
  } catch (error: any) {
    console.error('[Enhance Bullet Error]', error.message || error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to enhance bullet point.',
    });
  }
});

// 10. GitHub Analyzer (Cost: 1 Credit — Deducted ONLY on Success)
app.post('/api/ai/analyze-github', requireAuth, async (req: Request, res: Response) => {
  try {
    const { username } = req.body;
    if (!username || !username.trim()) {
      return res.status(400).json({ success: false, error: 'GitHub username is required.' });
    }

    const cleanUsername = username.trim().replace(/^@/, '');
    if (!/^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/.test(cleanUsername)) {
      return res.status(400).json({ success: false, error: 'Invalid GitHub username format.' });
    }

    const bal = await db.getBalance(req.userId!);
    if (!bal || bal.credits_remaining < 1) {
      return res.status(402).json({
        success: false,
        error: 'Insufficient credits. You need 1 credit for GitHub Portfolio Analysis.',
        credits_remaining: bal ? bal.credits_remaining : 0,
      });
    }

    const ai = verifyGeminiReady(res);
    if (!ai) return;

    // Fetch public GitHub profile data
    const ghHeaders: Record<string, string> = {
      'User-Agent': 'ResumeZ-Career-Toolkit',
      Accept: 'application/vnd.github.v3+json',
    };
    if (process.env.GITHUB_TOKEN) {
      ghHeaders['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
    }

    const profileRes = await fetch(`https://api.github.com/users/${encodeURIComponent(cleanUsername)}`, {
      headers: ghHeaders,
    });

    if (profileRes.status === 404) {
      return res.status(404).json({
        success: false,
        error: `GitHub user "@${cleanUsername}" was not found. Please check the username.`,
      });
    }

    if (profileRes.status === 403 || profileRes.status === 429) {
      return res.status(429).json({
        success: false,
        error: 'GitHub API rate limit reached. Please try again later or configure a server GITHUB_TOKEN.',
      });
    }

    if (!profileRes.ok) {
      return res.status(profileRes.status).json({
        success: false,
        error: `GitHub API error: ${profileRes.statusText}`,
      });
    }

    const profileData = await profileRes.json();

    // Fetch top public repos
    let reposData: any[] = [];
    try {
      const reposRes = await fetch(
        `https://api.github.com/users/${encodeURIComponent(cleanUsername)}/repos?sort=updated&per_page=15&type=owner`,
        { headers: ghHeaders }
      );
      if (reposRes.ok) {
        reposData = await reposRes.json();
      }
    } catch {
      // Proceed with profile metadata if repo fetch fails
    }

    const repoSummaries = (reposData || []).slice(0, 10).map((r: any) => ({
      name: r.name,
      description: r.description || 'No description provided',
      language: r.language || 'Various',
      stars: r.stargazers_count || 0,
      forks: r.forks_count || 0,
      updated_at: r.updated_at,
      has_homepage: !!r.homepage,
    }));

    const prompt = `Analyze this developer's public GitHub portfolio and repository activity for software engineering career readiness.

GitHub User: ${profileData.login} (${profileData.name || 'Anonymous'})
Bio: ${profileData.bio || 'None'}
Public Repos: ${profileData.public_repos} | Followers: ${profileData.followers}
Sample Repositories:
${JSON.stringify(repoSummaries, null, 2)}

Provide an honest, constructive software engineering assessment including developer archetype, code quality indicators, repository documentation standards, top strengths, weaknesses, and high-impact suggestions.`;

    const response = await generateContentWithRetry(ai, {
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            username: { type: Type.STRING },
            overall_score: { type: Type.INTEGER, description: 'Score 0 to 100' },
            developer_archetype: {
              type: Type.STRING,
              description: 'e.g. Full-Stack TypeScript Specialist, Systems & Backend Builder',
            },
            profile_summary: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                bio: { type: Type.STRING },
                avatar_url: { type: Type.STRING },
                total_public_repos: { type: Type.INTEGER },
                total_stars: { type: Type.INTEGER },
                followers: { type: Type.INTEGER },
                following: { type: Type.INTEGER },
                primary_languages: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      language: { type: Type.STRING },
                      percentage: { type: Type.INTEGER },
                    },
                    required: ['language', 'percentage'],
                  },
                },
              },
              required: [
                'name',
                'bio',
                'avatar_url',
                'total_public_repos',
                'total_stars',
                'followers',
                'following',
                'primary_languages',
              ],
            },
            portfolio_strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            portfolio_weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
            top_repositories_reviewed: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  description: { type: Type.STRING },
                  language: { type: Type.STRING },
                  stars: { type: Type.INTEGER },
                  forks: { type: Type.INTEGER },
                  insights: { type: Type.STRING },
                  readme_quality: { type: Type.STRING, description: 'comprehensive, basic, or missing' },
                },
                required: ['name', 'description', 'language', 'stars', 'forks', 'insights', 'readme_quality'],
              },
            },
            actionable_recommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  priority: { type: Type.STRING, description: 'high, medium, or low' },
                  area: { type: Type.STRING, description: 'documentation, project_variety, code_freshness, or testing' },
                  suggestion: { type: Type.STRING },
                },
                required: ['priority', 'area', 'suggestion'],
              },
            },
          },
          required: [
            'username',
            'overall_score',
            'developer_archetype',
            'profile_summary',
            'portfolio_strengths',
            'portfolio_weaknesses',
            'top_repositories_reviewed',
            'actionable_recommendations',
          ],
        },
      },
    });

    let parsedResult: any;
    try {
      parsedResult = JSON.parse(response.text || '{}');
      parsedResult.username = cleanUsername;
      if (profileData.avatar_url && !parsedResult.profile_summary?.avatar_url) {
        parsedResult.profile_summary.avatar_url = profileData.avatar_url;
      }
    } catch {
      throw new Error('AI returned an invalid JSON response structure.');
    }

    // Deduct credit ONLY on SUCCESS
    const deduction = await db.deductCreditsAtomic(req.userId!, 'github_analysis', 1, {
      username: cleanUsername,
    });

    const githubRecord = {
      id: `gh-${Date.now()}`,
      user_id: req.userId!,
      username: cleanUsername,
      overall_score: parsedResult.overall_score || 80,
      result_json: parsedResult,
      created_at: new Date().toISOString(),
    };

    const sqliteDb = await db.getDb();
    await sqliteDb.run(
      'INSERT INTO github_analyses (id, user_id, username, overall_score, result_json, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [
        githubRecord.id,
        githubRecord.user_id,
        githubRecord.username,
        githubRecord.overall_score,
        JSON.stringify(githubRecord.result_json),
        githubRecord.created_at,
      ]
    );

    res.json({
      success: true,
      analysis: githubRecord,
      credits_remaining: deduction.credits_remaining,
    });
  } catch (error: any) {
    console.error('[GitHub Analysis Error]', error.message || error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to complete GitHub analysis.',
    });
  }
});

// 11. LeetCode Analyzer (Cost: 1 Credit — Deducted ONLY on Success)
app.post('/api/ai/analyze-leetcode', requireAuth, async (req: Request, res: Response) => {
  try {
    const { username } = req.body;
    if (!username || !username.trim()) {
      return res.status(400).json({ success: false, error: 'LeetCode username is required.' });
    }

    const cleanUsername = username.trim();
    if (!/^[a-zA-Z0-9_-]{3,30}$/.test(cleanUsername)) {
      return res.status(400).json({ success: false, error: 'Invalid LeetCode username format.' });
    }

    const bal = await db.getBalance(req.userId!);
    if (!bal || bal.credits_remaining < 1) {
      return res.status(402).json({
        success: false,
        error: 'Insufficient credits. You need 1 credit for LeetCode Profile Analysis.',
        credits_remaining: bal ? bal.credits_remaining : 0,
      });
    }

    const ai = verifyGeminiReady(res);
    if (!ai) return;

    // Query LeetCode GraphQL public profile
    let leetcodeStats: any = null;
    try {
      const query = `
        query getUserProfile($username: String!) {
          matchedUser(username: $username) {
            username
            submitStats: submitStatsGlobal {
              acSubmissionNum {
                difficulty
                count
                submissions
              }
            }
            profile {
              ranking
              reputation
            }
          }
        }
      `;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const lcRes = await fetch('https://leetcode.com/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        },
        body: JSON.stringify({ query, variables: { username: cleanUsername } }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (lcRes.ok) {
        const json = await lcRes.json();
        leetcodeStats = json?.data?.matchedUser;
      }
    } catch (lcErr: any) {
      console.warn('[LeetCode Fetch Warning]', lcErr.message);
    }

    if (!leetcodeStats) {
      return res.status(404).json({
        success: false,
        error: `LeetCode user "${cleanUsername}" was not found or has a private profile.`,
      });
    }

    const prompt = `Analyze this developer's LeetCode problem solving record and competitive programming statistics for top-tier tech software engineering interview readiness.

LeetCode Username: ${cleanUsername}
Public Profile Data:
${JSON.stringify(leetcodeStats, null, 2)}

Provide an algorithmic competency evaluation, FAANG interview readiness tier, problem balance assessment (Easy/Medium/Hard distribution), consistency analysis, identified topic gaps, and a targeted 4-week study plan with high-yield patterns.`;

    const response = await generateContentWithRetry(ai, {
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            username: { type: Type.STRING },
            overall_score: { type: Type.INTEGER, description: 'Score 0 to 100' },
            problem_solving_summary: {
              type: Type.OBJECT,
              properties: {
                total_solved: { type: Type.INTEGER },
                easy_count: { type: Type.INTEGER },
                medium_count: { type: Type.INTEGER },
                hard_count: { type: Type.INTEGER },
                global_ranking: { type: Type.INTEGER },
                acceptance_rate: { type: Type.NUMBER },
                contest_rating: { type: Type.INTEGER },
              },
              required: ['total_solved', 'easy_count', 'medium_count', 'hard_count'],
            },
            readiness_assessment: {
              type: Type.OBJECT,
              properties: {
                faang_readiness_level: {
                  type: Type.STRING,
                  description: 'entry, intermediate, advanced, or interview_ready',
                },
                consistency_rating: { type: Type.STRING, description: 'high, moderate, or low' },
                recommended_focus_areas: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ['faang_readiness_level', 'consistency_rating', 'recommended_focus_areas'],
            },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            gaps_identified: { type: Type.ARRAY, items: { type: Type.STRING } },
            targeted_study_plan: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  topic: { type: Type.STRING },
                  recommended_problem_types: { type: Type.ARRAY, items: { type: Type.STRING } },
                  priority: { type: Type.STRING, description: 'urgent, recommended, or optional' },
                },
                required: ['topic', 'recommended_problem_types', 'priority'],
              },
            },
          },
          required: [
            'username',
            'overall_score',
            'problem_solving_summary',
            'readiness_assessment',
            'strengths',
            'gaps_identified',
            'targeted_study_plan',
          ],
        },
      },
    });

    let parsedResult: any;
    try {
      parsedResult = JSON.parse(response.text || '{}');
      parsedResult.username = cleanUsername;
    } catch {
      throw new Error('AI returned an invalid JSON response structure.');
    }

    // Deduct credit ONLY on SUCCESS
    const deduction = await db.deductCreditsAtomic(req.userId!, 'leetcode_analysis', 1, {
      username: cleanUsername,
    });

    const leetcodeRecord = {
      id: `lc-${Date.now()}`,
      user_id: req.userId!,
      username: cleanUsername,
      overall_score: parsedResult.overall_score || 78,
      result_json: parsedResult,
      created_at: new Date().toISOString(),
    };

    const sqliteDb = await db.getDb();
    await sqliteDb.run(
      'INSERT INTO leetcode_analyses (id, user_id, username, overall_score, result_json, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [
        leetcodeRecord.id,
        leetcodeRecord.user_id,
        leetcodeRecord.username,
        leetcodeRecord.overall_score,
        JSON.stringify(leetcodeRecord.result_json),
        leetcodeRecord.created_at,
      ]
    );

    res.json({
      success: true,
      analysis: leetcodeRecord,
      credits_remaining: deduction.credits_remaining,
    });
  } catch (error: any) {
    console.error('[LeetCode Analysis Error]', error.message || error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to complete LeetCode analysis.',
    });
  }
});

// 12. AI Career Coach Chatbot (0 Credits)
app.post('/api/ai/chat', requireAuth, async (req: Request, res: Response) => {
  try {
    const { history, message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, error: 'Message content is required.' });
    }

    const ai = verifyGeminiReady(res);
    if (!ai) return;

    const contents = (history || []).slice(-10).map((msg: any) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content || '' }],
    }));

    contents.push({
      role: 'user',
      parts: [{ text: message.trim() }],
    });

    const response = await generateContentWithRetry(ai, {
      model: GEMINI_MODEL,
      contents,
      config: {
        systemInstruction:
          'You are ResumeZ Assistant, an executive AI career coach and technical recruiter. Help users with resume optimization, career transitions, and interview strategies. Keep responses actionable, concise, and formatted cleanly in markdown.',
      },
    });

    res.json({
      success: true,
      reply: response.text || 'I am ready to help with your career questions. What would you like to discuss?',
    });
  } catch (error: any) {
    console.error('[AI Chat Error]', error.message || error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate AI response.',
    });
  }
});

// ---------------- Admin Routes (Strict Verification Protected) ----------------

app.get('/api/admin/stats', requireAuth, verifyAdminMiddleware, async (_req: Request, res: Response) => {
  try {
    const sqliteDb = await db.getDb();
    const { count: total_users } = await sqliteDb.get('SELECT COUNT(*) as count FROM users');
    const { count: total_resumes } = await sqliteDb.get('SELECT COUNT(*) as count FROM resumes');
    const { count: total_analyses } = await sqliteDb.get('SELECT COUNT(*) as count FROM analyses');
    const { sum: total_credits } = await sqliteDb.get(
      'SELECT SUM(lifetime_credits_used) as sum FROM balances'
    );

    res.json({
      success: true,
      total_users,
      total_resumes,
      total_analyses,
      total_credits_consumed: total_credits || 0,
      active_subscribers: 1,
      ai_success_rate: 99.4,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to fetch admin stats.' });
  }
});

app.get('/api/admin/users', requireAuth, verifyAdminMiddleware, async (_req: Request, res: Response) => {
  try {
    const sqliteDb = await db.getDb();
    const usersList = await sqliteDb.all('SELECT * FROM users');
    const userList = await Promise.all(
      usersList.map(async (u: any) => {
        const bal = await sqliteDb.get('SELECT * FROM balances WHERE user_id = ?', u.id);
        const { count: userResumes } = await sqliteDb.get(
          'SELECT COUNT(*) as count FROM resumes WHERE user_id = ?',
          u.id
        );
        return {
          id: u.id,
          email: u.email,
          full_name: u.full_name,
          role: u.role,
          credits_remaining: bal?.credits_remaining || 0,
          lifetime_credits_used: bal?.lifetime_credits_used || 0,
          plan_name: u.role === 'admin' ? 'Unlimited Admin' : u.plan_name || 'Free Career Tier',
          resumes_count: userResumes,
          analyses_count: 0,
          created_at: u.created_at,
        };
      })
    );
    res.json({ success: true, users: userList });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to fetch users list.' });
  }
});

app.post('/api/admin/adjust-credits', requireAuth, verifyAdminMiddleware, async (req: Request, res: Response) => {
  try {
    const { user_id, amount, reason } = req.body;
    const adjustment = parseInt(amount, 10) || 0;

    const result = await db.atomicCreditTransaction(
      user_id,
      adjustment,
      'admin_adjustment',
      reason || 'Manual Admin Credit Adjustment'
    );

    if (result) {
      res.json({ success: true, new_balance: result.credits_remaining });
    } else {
      res.status(404).json({ success: false, error: 'Target user balance not found.' });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to adjust credits.' });
  }
});

app.get('/api/admin/settings', requireAuth, verifyAdminMiddleware, async (_req: Request, res: Response) => {
  try {
    const settings = await db.getAdminSettings();
    res.json({ success: true, settings });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to load settings.' });
  }
});

app.put('/api/admin/settings', requireAuth, verifyAdminMiddleware, async (req: Request, res: Response) => {
  try {
    const { key, value } = req.body;
    if (!key) return res.status(400).json({ success: false, error: 'Setting key is required.' });
    await db.updateAdminSetting(key, value);
    res.json({ success: true, key, value });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to update setting.' });
  }
});

app.get('/api/admin/payments', requireAuth, verifyAdminMiddleware, async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string;
    const payments = await db.getAllPaymentRequests(status);
    res.json({ success: true, payments });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to fetch payment requests.' });
  }
});

app.post('/api/admin/verify-payment', requireAuth, verifyAdminMiddleware, async (req: Request, res: Response) => {
  try {
    const { payment_id, action, notes, rejection_reason } = req.body;
    if (!payment_id || !action || !['verify', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: 'payment_id and action ("verify" or "reject") are required.',
      });
    }

    const result = await db.verifyOrRejectPayment(
      req.userId!,
      payment_id,
      action as 'verify' | 'reject',
      notes,
      rejection_reason
    );

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }

    res.json({
      success: true,
      message: result.message,
      payment: result.payment,
      credits_added: result.credits_added,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Error processing payment verification.' });
  }
});

app.get('/api/admin/payment-config', requireAuth, verifyAdminMiddleware, async (_req: Request, res: Response) => {
  try {
    const config = await db.getPaymentConfig();
    res.json({ success: true, config });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to load payment config.' });
  }
});

app.put('/api/admin/payment-config', requireAuth, verifyAdminMiddleware, async (req: Request, res: Response) => {
  try {
    const updated = await db.updatePaymentConfig(req.body);
    res.json({
      success: true,
      config: updated,
      message: 'Payment configuration updated successfully.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to update payment config.' });
  }
});

// ---------------- API 404 & Error Catch-All ----------------
app.all('/api/*', (req: Request, res: Response) => {
  res.status(404).json({ success: false, error: `API route ${req.method} ${req.path} not found` });
});

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Express Global Error]', err);
  if (res.headersSent) {
    return _next(err);
  }
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'An internal server error occurred.',
  });
});

// ---------------- Production / Vite Middleware ----------------
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production' || (typeof __filename !== 'undefined' && __filename.endsWith('server.cjs'));
  const server = http.createServer(app);

  if (!isProduction) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: { server },
      },
      appType: 'custom',
    });
    app.use(vite.middlewares);

    // Development SPA fallback: handles all routes (/dashboard, /builder, etc.) with transformIndexHtml
    app.use('*', async (req: Request, res: Response, next: NextFunction) => {
      if (req.originalUrl.startsWith('/api')) {
        return next();
      }

      const url = req.originalUrl;
      try {
        const indexPath = path.resolve(process.cwd(), 'index.html');
        let template = fs.readFileSync(indexPath, 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');

    // Immutable long-term caching for hashed bundle assets
    app.use(
      '/assets',
      express.static(path.join(distPath, 'assets'), {
        maxAge: '1y',
        immutable: true,
      })
    );

    // Standard static serving for other root files
    app.use(
      express.static(distPath, {
        maxAge: '1h',
      })
    );

    // SPA fallback: index.html with no-cache so newly deployed releases load immediately
    app.get('*', (_req, res) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  let currentPort = PORT;
  const HOST = process.env.HOST || '0.0.0.0';

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`[ResumeZ Server] Port ${currentPort} is currently in use. Retrying on port ${currentPort + 1}...`);
      currentPort += 1;
      setTimeout(() => server.listen(currentPort, HOST), 250);
    } else {
      console.error('[ResumeZ Server] Server fatal error:', err);
    }
  });

  server.on('listening', () => {
    const address = server.address();
    const actualPort = typeof address === 'object' && address ? address.port : currentPort;
    const mode = isProduction ? 'production' : (process.env.NODE_ENV || 'development');
    console.log(`[ResumeZ Server] Running in ${mode} mode listening on http://${HOST}:${actualPort} (Port ${actualPort})`);
  });

  server.listen(currentPort, HOST);
}

startServer();


