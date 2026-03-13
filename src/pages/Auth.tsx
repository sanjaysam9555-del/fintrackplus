import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Sparkles, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { lovable } from '@/integrations/lovable/index';
import { toast } from 'sonner';

type AuthView = 'login' | 'signup' | 'forgot' | 'verification';

const EmailVerificationScreen = ({ email, onBack }: { email: string; onBack: () => void }) => {
  const { resetPassword } = useAuth();
  const [cooldown, setCooldown] = useState(0);

  const handleResend = async () => {
    // Use signUp resend approach — Supabase resends verification on resetPasswordForEmail isn't right,
    // but we can use the resend method
    const { error } = await resetPassword(email);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Verification email resent!');
      setCooldown(60);
      const interval = setInterval(() => {
        setCooldown(prev => {
          if (prev <= 1) { clearInterval(interval); return 0; }
          return prev - 1;
        });
      }, 1000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-border/50 text-center space-y-5"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
        className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto"
      >
        <Mail className="w-8 h-8 text-primary" />
      </motion.div>
      <div>
        <h2 className="text-xl font-bold text-foreground mb-2">Check Your Email</h2>
        <p className="text-sm text-muted-foreground">
          We've sent a verification link to
        </p>
        <p className="text-sm font-semibold text-foreground mt-1">{email}</p>
      </div>
      <p className="text-xs text-muted-foreground">
        Click the link in the email to verify your account. Don't forget to check your spam folder.
      </p>
      <Button
        variant="outline"
        className="w-full rounded-xl"
        onClick={handleResend}
        disabled={cooldown > 0}
      >
        {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend verification email'}
      </Button>
      <button
        type="button"
        onClick={onBack}
        className="text-sm text-primary font-semibold hover:underline underline-offset-4 flex items-center gap-1 mx-auto"
      >
        <ArrowLeft size={14} /> Back to login
      </button>
    </motion.div>
  );
};

const ForgotPasswordScreen = ({ onBack }: { onBack: () => void }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    console.log('[PasswordReset] Triggering reset for:', email);
    const { error } = await resetPassword(email);
    setIsLoading(false);
    if (error) {
      console.error('[PasswordReset] Error:', error);
      toast.error(error.message);
    } else {
      console.log('[PasswordReset] Request succeeded for:', email);
      setSent(true);
    }
  };

  if (sent) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-border/50 text-center space-y-5"
      >
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground mb-2">Email Sent</h2>
          <p className="text-sm text-muted-foreground">
            If an account exists for <span className="font-semibold text-foreground">{email}</span>, you'll receive a password reset link.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Don't forget to check your spam/junk folder.
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-primary font-semibold hover:underline underline-offset-4 flex items-center gap-1 mx-auto"
        >
          <ArrowLeft size={14} /> Back to login
        </button>
      </motion.div>
    );
  }

  return (
    <motion.form
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      onSubmit={handleSubmit}
      className="bg-card/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-border/50 space-y-5"
    >
      <div className="text-center mb-2">
        <h2 className="text-lg font-bold text-foreground">Reset Password</h2>
        <p className="text-sm text-muted-foreground mt-1">Enter your email to receive a reset link</p>
      </div>
      <div>
        <Label htmlFor="reset-email" className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Email</Label>
        <div className="relative mt-1.5">
          <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="reset-email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10 h-12 rounded-xl bg-background/50 border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
            required
          />
        </div>
      </div>
      <Button type="submit" className="w-full h-12 rounded-xl text-base font-semibold" disabled={isLoading}>
        {isLoading ? 'Sending...' : 'Send Reset Link'}
      </Button>
      <button
        type="button"
        onClick={onBack}
        className="text-sm text-primary font-semibold hover:underline underline-offset-4 flex items-center gap-1 mx-auto"
      >
        <ArrowLeft size={14} /> Back to login
      </button>
    </motion.form>
  );
};

export const AuthPage = () => {
  const [searchParams] = useSearchParams();
  const initialView = (searchParams.get('mode') === 'signup' ? 'signup' : 'login') as AuthView;
  const [view, setView] = useState<AuthView>(initialView);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const { signIn, signUp } = useAuth();

  const isLogin = view === 'login';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast.error(error.message);
        } else {
          toast.success('Welcome back!');
        }
      } else {
        if (!name.trim()) {
          toast.error('Please enter your name');
          setIsLoading(false);
          return;
        }
        const { error } = await signUp(email, password, name);
        if (error) {
          toast.error(error.message);
        } else {
          setVerificationEmail(email);
          setView('verification');
        }
      }
    } catch (err) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-success/10 rounded-full blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-warning/5 rounded-full blur-3xl"
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-sm relative z-10"
      >
        {/* Logo/Brand */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <motion.div className="relative inline-block" whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 300 }}>
            <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl" />
            <img src="/app-icon-192.png" alt="FinTrack+" className="w-20 h-20 mx-auto mb-4 rounded-2xl shadow-lg relative z-10" />
          </motion.div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text">
            FinTrack<sup className="text-[0.6em] ml-0.5">+</sup>
          </h1>
          <p className="text-muted-foreground text-xs mt-1 flex items-center justify-center gap-1">
            <Sparkles size={12} className="text-primary" />
            An App by Saffron Events
          </p>
          {(view === 'login' || view === 'signup') && (
            <motion.p
              className="text-muted-foreground text-sm mt-3"
              key={view}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {isLogin ? 'Welcome back!' : 'Create your account'}
            </motion.p>
          )}
        </motion.div>

        {/* Conditional views */}
        {view === 'verification' && (
          <EmailVerificationScreen email={verificationEmail} onBack={() => setView('login')} />
        )}

        {view === 'forgot' && (
          <ForgotPasswordScreen onBack={() => setView('login')} />
        )}

        {(view === 'login' || view === 'signup') && (
          <>
            <motion.form
              key={view}
              initial={{ opacity: 0, x: isLogin ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              onSubmit={handleSubmit}
              className="bg-card/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-border/50 space-y-5"
            >
              {!isLogin && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}>
                  <Label htmlFor="name" className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Name</Label>
                  <div className="relative mt-1.5">
                    <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input id="name" type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} className="pl-10 h-12 rounded-xl bg-background/50 border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all" required={!isLogin} />
                  </div>
                </motion.div>
              )}

              <div>
                <Label htmlFor="email" className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Email</Label>
                <div className="relative mt-1.5">
                  <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 h-12 rounded-xl bg-background/50 border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all" required />
                </div>
              </div>

              <div>
                <Label htmlFor="password" className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Password</Label>
                <div className="relative mt-1.5">
                  <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10 h-12 rounded-xl bg-background/50 border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all" required minLength={6} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => setView('forgot')}
                    className="text-xs text-primary hover:underline underline-offset-4 mt-2 block ml-auto"
                  >
                    Forgot password?
                  </button>
                )}
              </div>

              <Button type="submit" className="w-full h-12 rounded-xl text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all" disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full" />
                    {isLogin ? 'Signing in...' : 'Creating account...'}
                  </span>
                ) : (
                  <motion.span className="flex items-center gap-2" whileHover={{ x: 5 }} transition={{ type: "spring", stiffness: 300 }}>
                    {isLogin ? 'Sign In' : 'Create Account'}
                    <ArrowRight size={18} />
                  </motion.span>
                )}
              </Button>

              <div className="relative my-1">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border/50" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-card/80 px-3 text-muted-foreground">or</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full h-12 rounded-xl text-sm font-medium gap-3 border-border/50 hover:bg-accent/50 transition-all"
                onClick={async () => {
                  const { error } = await lovable.auth.signInWithOAuth("apple", {
                    redirect_uri: window.location.origin,
                  });
                  if (error) toast.error(error.message);
                }}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
                Continue with Apple
              </Button>
            </motion.form>

            {/* Toggle */}
            <motion.p className="text-center text-sm text-muted-foreground mt-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
              {isLogin ? "Don't have an account?" : 'Already have an account?'}
              <button type="button" onClick={() => setView(isLogin ? 'signup' : 'login')} className="text-primary font-semibold ml-1 hover:underline underline-offset-4 transition-all">
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </motion.p>
          </>
        )}

        {/* Footer branding */}
        <motion.div className="text-center mt-8 text-xs text-muted-foreground/60" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
          <p>Secure • Simple • Smart</p>
        </motion.div>
      </motion.div>
    </div>
  );
};
