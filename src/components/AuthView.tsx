import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Sparkles, ArrowRight, Lock } from 'lucide-react';

export const AuthView: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      if (!supabase) {
        throw new Error('Authentication service is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel environment variables.');
      }

      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          const msg = error.message || '';
          if (msg.includes('Invalid login credentials')) {
            throw new Error("Invalid email or password. If you haven't created an account yet, click 'Sign up' below to create one.");
          }
          if (msg.includes('Email not confirmed')) {
            throw new Error("Your email address is not confirmed yet. Please check your inbox or spam folder for the confirmation email.");
          }
          throw error;
        }
      } else {
        if (!fullName || !fullName.trim()) {
          throw new Error('Please enter your full name.');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters long.');
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName.trim(),
              role: 'candidate',
            },
          },
        });
        if (error) throw error;

        // Check if user already exists (Supabase returns user with empty identities array when user already exists)
        if (data?.user && data.user.identities && data.user.identities.length === 0) {
          setError('An account with this email address already exists. Please click "Sign in" below to log in.');
          setIsLogin(true);
          return;
        }

        if (data?.session) {
          setSuccessMessage('Account created and signed in successfully!');
        } else if (data?.user) {
          setSuccessMessage('Account created successfully! If required by your settings, please check your email inbox to confirm your account, or sign in now.');
          setIsLogin(true);
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#080711] px-4 py-12 sm:px-6 lg:px-8 text-[#F5F1E8]">
      <div className="w-full max-w-md space-y-8 rounded-3xl bg-[#151329] p-8 shadow-2xl border border-[#292344]">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#C6A75E]/15 border border-[#C6A75E]/30 text-[#C6A75E]">
            <Sparkles className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-[#F5F1E8]">
            {isLogin ? 'Sign in to ResumeZ AI' : 'Create an Account'}
          </h2>
          <p className="mt-1 text-xs text-[#AAA6B7]">
            {isLogin ? 'Welcome back. Access your AI career dashboard.' : 'Start analyzing and optimizing your developer resume.'}
          </p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          {successMessage && (
            <div className="rounded-xl border border-[#4F9D69]/40 bg-[#4F9D69]/15 p-3 text-xs text-[#4F9D69]">
              {successMessage}
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-[#A94D4D]/40 bg-[#A94D4D]/15 p-3 text-xs text-[#F5F1E8]">
              {error}
            </div>
          )}

          <div className="space-y-3">
            {!isLogin && (
              <div>
                <label className="block text-xs font-semibold text-[#AAA6B7] mb-1" htmlFor="fullName">Full Name</label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  className="w-full rounded-xl border border-[#292344] bg-[#0E0C1B] px-3.5 py-2.5 text-xs font-medium text-[#F5F1E8] focus:border-[#C6A75E] focus:outline-none"
                  placeholder="Alex Rivera"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#AAA6B7] mb-1" htmlFor="email-address">Email address</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full rounded-xl border border-[#292344] bg-[#0E0C1B] px-3.5 py-2.5 text-xs font-medium text-[#F5F1E8] focus:border-[#C6A75E] focus:outline-none"
                placeholder="developer@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#AAA6B7] mb-1" htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="w-full rounded-xl border border-[#292344] bg-[#0E0C1B] px-3.5 py-2.5 text-xs font-medium text-[#F5F1E8] focus:border-[#C6A75E] focus:outline-none"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl btn-gold-primary py-2.5 text-xs font-semibold shadow-lg shadow-[#C6A75E]/10 transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                'Processing...'
              ) : (
                <>
                  <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="text-center text-xs">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
            className="font-semibold text-[#C6A75E] hover:text-[#E1C77A] transition cursor-pointer"
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
};
