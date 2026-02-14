import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, CheckCircle2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export const ResetPasswordPage = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { updatePassword } = useAuth();
  const navigate = useNavigate();

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

        {success ? (
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
            <Button className="w-full h-12 rounded-xl text-base font-semibold" onClick={() => navigate('/')}>
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
