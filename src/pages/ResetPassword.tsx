import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, CheckCircle2, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { appPath } from '@/lib/domainUtils';
import { supabase } from '@/integrations/supabase/client';
import { PageLoader } from '@/components/ui/skeleton-loader';

type VerifyState = 'verifying' | 'ready' | 'invalid';

export const ResetPasswordPage = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [verifyState, setVerifyState] = useState<VerifyState>('verifying');
  const [verifyError, setVerifyError] = useState<string>('');
  const { updatePassword } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const establishSession = async () => {
      try {
        // Try implicit flow first (hash tokens from generateLink)
        const hash = window.location.hash.startsWith('#')
          ? window.location.hash.substring(1)
          : window.location.hash;
        const hashParams = new URLSearchParams(hash);
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const hashError = hashParams.get('error_description') || hashParams.get('error');

        if (hashError) {
          setVerifyError(decodeURIComponent(hashError.replace(/\+/g, ' ')));
          setVerifyState('invalid');
          return;
        }

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) {
            setVerifyError(error.message);
            setVerifyState('invalid');
            return;
          }
          setVerifyState('ready');
          return;
        }

        // PKCE fallback (?code=)
        const queryParams = new URLSearchParams(window.location.search);
        const code = queryParams.get('code');
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            setVerifyError(error.message);
            setVerifyState('invalid');
            return;
          }
          setVerifyState('ready');
          return;
        }

        // No tokens — check if there's already an active session (e.g. detectSessionInUrl ran)
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setVerifyState('ready');
          return;
        }

        setVerifyError('No reset token found in the link.');
        setVerifyState('invalid');
      } catch (err: any) {
        setVerifyError(err?.message || 'Failed to verify reset link');
        setVerifyState('invalid');
      }
    };

    establishSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setIsLoading(true);
    const { error } = await updatePassword(password);
    setIsLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      // Clear URL hash so a refresh doesn't re-trigger flow
      if (window.history.replaceState) {
        window.history.replaceState(null, '', window.location.pathname);
      }
      setSuccess(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/app-icon-192.png" alt="FinTrack+" className="w-16 h-16 mx-auto mb-3 rounded-2xl shadow-lg" />
          <h1 className="text-2xl font-bold text-foreground">
            FinTrack<sup className="text-[0.6em] ml-0.5">+</sup>
          </h1>
          <p className="text-muted-foreground text-xs mt-1 flex items-center justify-center gap-1">
            <Sparkles size={12} className="text-primary" />
            An App by Saffron Events
          </p>
        </div>

        {verifyState === 'verifying' ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-border/50 text-center space-y-3"
          >
            <PageLoader className="min-h-[160px] py-4" />
            <h2 className="text-xl font-bold text-foreground">Verifying link…</h2>
            <p className="text-sm text-muted-foreground">Just a moment while we confirm your reset request.</p>
          </motion.div>
        ) : verifyState === 'invalid' ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-border/50 text-center space-y-5"
          >
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Link Expired or Invalid</h2>
            <p className="text-sm text-muted-foreground">
              {verifyError || 'This password reset link is no longer valid. Please request a new one.'}
            </p>
            <Button
              className="w-full h-12 rounded-xl text-base font-semibold"
              onClick={() => navigate(appPath('/auth'))}
            >
              Request New Link
            </Button>
          </motion.div>
        ) : success ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-border/50 text-center space-y-5"
          >
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Password Updated</h2>
            <p className="text-sm text-muted-foreground">Your password has been changed successfully.</p>
            <Button className="w-full h-12 rounded-xl text-base font-semibold" onClick={() => navigate(appPath('/'))}>
              Continue to App
            </Button>
          </motion.div>
        ) : (
          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onSubmit={handleSubmit}
            className="bg-card/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-border/50 space-y-5"
          >
            <div className="text-center mb-2">
              <h2 className="text-lg font-bold text-foreground">Set New Password</h2>
              <p className="text-sm text-muted-foreground mt-1">Enter your new password below</p>
            </div>

            <div>
              <Label htmlFor="new-password" className="text-xs text-muted-foreground uppercase tracking-wider font-medium">New Password</Label>
              <div className="relative mt-1.5">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-12 rounded-xl bg-background/50 border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                  required
                  minLength={6}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="confirm-password" className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Confirm Password</Label>
              <div className="relative mt-1.5">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 h-12 rounded-xl bg-background/50 border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <Button type="submit" className="w-full h-12 rounded-xl text-base font-semibold shadow-lg shadow-primary/25" disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Update Password'}
            </Button>
          </motion.form>
        )}
      </motion.div>
    </div>
  );
};
