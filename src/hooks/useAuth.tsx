import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { isLandingDomain } from '@/lib/domainUtils';

const getAuthRedirectUrl = (path: string) => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return isLandingDomain()
    ? `https://fintrackplus.com/application${cleanPath}`
    : `${window.location.origin}${cleanPath}`;
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const intentionalSignOut = useRef(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        if (intentionalSignOut.current) {
          setSession(null);
          setUser(null);
          setLoading(false);
          intentionalSignOut.current = false;
        } else {
          // Unexpected sign-out — try to recover session
          supabase.auth.refreshSession().then(({ data }) => {
            if (data.session) {
              setSession(data.session);
              setUser(data.session.user);
            } else {
              setSession(null);
              setUser(null);
            }
            setLoading(false);
          });
        }
        return;
      }

      if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        return;
      }

      // All other events
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Check for existing session with retry
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSession(session);
        setUser(session.user);
        setLoading(false);
      } else {
        // No session — attempt refresh before giving up
        supabase.auth.refreshSession().then(({ data }) => {
          setSession(data.session);
          setUser(data.session?.user ?? null);
          setLoading(false);
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: getAuthRedirectUrl('/'),
        data: { name }
      }
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { error };
  };

  const signOut = async () => {
    intentionalSignOut.current = true;
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    try {
      const redirectTo = getAuthRedirectUrl('/reset-password');
      const { data, error: invokeError } = await supabase.functions.invoke('send-email', {
        body: { email, type: 'recovery', redirectTo },
      });
      if (invokeError) {
        return { error: new Error(invokeError.message || 'Failed to send reset email') };
      }
      if (data?.error) {
        return { error: new Error(data.error) };
      }
      return { error: null };
    } catch (err: any) {
      return { error: new Error(err.message || 'Failed to send reset email') };
    }
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { error };
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut, resetPassword, updatePassword }}>
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
