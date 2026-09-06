import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { UserProfile, UsageBalance } from '../types';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  balance: UsageBalance | null;
  role: 'candidate' | 'admin' | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [balance, setBalance] = useState<UsageBalance | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Clear legacy guest ID from browser storage
  useEffect(() => {
    try {
      localStorage.removeItem('resumez_guest_id');
    } catch {
      // Ignore
    }
  }, []);

  const fetchProfileAndBalance = useCallback(
    async (activeSession: Session | null) => {
      const token = activeSession?.access_token;
      if (!token) {
        setProfile(null);
        setBalance(null);
        return;
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (res.ok) {
          const data = await res.json();
          if (data.user) setProfile(data.user);
          if (data.balance) setBalance(data.balance);
        } else if (res.status === 401) {
          // Token is invalid/expired
          setProfile(null);
          setBalance(null);
        }
      } catch (err) {
        console.warn('[Auth] Error fetching user profile:', err);
      }
    },
    []
  );

  useEffect(() => {
    let isMounted = true;

    // 1. Initial Session Restoration
    supabase.auth
      .getSession()
      .then(({ data: { session: initSession } }) => {
        if (!isMounted) return;
        setSession(initSession);
        setUser(initSession?.user ?? null);
        if (initSession) {
          fetchProfileAndBalance(initSession).finally(() => {
            if (isMounted) setIsLoading(false);
          });
        } else {
          setProfile(null);
          setBalance(null);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setSession(null);
          setUser(null);
          setProfile(null);
          setBalance(null);
          setIsLoading(false);
        }
      });

    // 2. Auth State Change Listener (Login, Logout, Token Rotation)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!isMounted) return;
      
      setSession((prevSession) => {
        if (prevSession?.access_token === newSession?.access_token) {
          return prevSession;
        }
        return newSession;
      });

      setUser(newSession?.user ?? null);

      if (newSession) {
        await fetchProfileAndBalance(newSession);
      } else {
        setProfile(null);
        setBalance(null);
      }
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfileAndBalance]);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore
    } finally {
      setSession(null);
      setUser(null);
      setProfile(null);
      setBalance(null);
    }
  };

  const refreshProfile = async () => {
    await fetchProfileAndBalance(session);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        balance,
        role: (profile?.role as any) || null,
        isLoading,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
