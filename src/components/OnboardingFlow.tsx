import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  ArrowLeft,
  Check,
  PlusCircle,
  PieChart,
  FolderKanban,
  Sparkles,
  Download,
  Share,
  Smartphone,
  Monitor,
  Sun,
  Moon,
  SlidersHorizontal,
  Store,
  Grid3X3,
  Receipt,
  RefreshCcw,
  Users,
  CloudCheck,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme, type ThemeMode } from '@/hooks/useTheme';
import { useSubscription } from '@/hooks/useSubscription';

interface OnboardingFlowProps {
  onComplete: () => void;
  onActivateTrial: () => void;
  userName?: string;
}

type DeviceType = 'ios' | 'android' | 'desktop' | 'unknown';

const detectDevice = (): DeviceType => {
  const userAgent = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(userAgent)) return 'ios';
  if (/android/.test(userAgent)) return 'android';
  if (/windows|macintosh|linux/.test(userAgent) && !/mobile/.test(userAgent)) return 'desktop';
  return 'unknown';
};

const isInStandaloneMode = (): boolean => {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
};

// ─── Step Definitions ──────────────────────────────────────────────
const tourSteps = [
  {
    icon: Sparkles,
    title: 'Welcome to FinTrack+!',
    description: "Your personal finance companion. Let's take a quick tour to help you get started.",
    color: 'bg-primary',
  },
  {
    icon: SlidersHorizontal,
    title: 'Set Up Your Workspace',
    description: 'Before you start tracking, head to Settings to add your Projects, Vendors, and Categories. This helps you organize entries from day one.',
    color: 'bg-teal-500',
  },
  {
    icon: PlusCircle,
    title: 'Track Your Transactions',
    description: 'Tap the + button at the bottom dock. Use the toggle at the top of the form to switch between Expense and Income — one button handles both!',
    color: 'bg-emerald-500',
  },
  {
    icon: FolderKanban,
    title: 'Organize with Projects',
    description: 'Create projects like "Wedding" or "Renovation" to track spending for specific events and goals.',
    color: 'bg-amber-500',
  },
  {
    icon: Receipt,
    title: 'Receipts & GST Export',
    description: 'Attach receipts from camera or gallery, tag entries with GST, and export a CA-ready ZIP with CSVs + receipt images for tax filing.',
    color: 'bg-pink-500',
  },
  {
    icon: RefreshCcw,
    title: 'Recurring & Part Payments',
    description: 'Automate rent, salaries and subscriptions with recurring schedules. Track multi-installment vendor payments inline.',
    color: 'bg-cyan-500',
  },
  {
    icon: Users,
    title: 'Team & Roles',
    description: 'Invite up to 3 members. Owner manages billing & team, Admin handles all data, Employee logs entries for assigned projects only.',
    color: 'bg-blue-500',
  },
  {
    icon: CloudCheck,
    title: 'Backups & Sync',
    description: 'Twice-daily automated backups + offline-first sync. Your data stays safe even without internet.',
    color: 'bg-green-600',
  },
  {
    icon: PieChart,
    title: 'View AI Insights',
    description: 'Get smart summaries and spending analysis powered by AI. Understand where your money goes.',
    color: 'bg-violet-500',
  },
  {
    icon: Monitor,
    title: 'Choose Your Look',
    description: 'Pick a display mode that suits your style. You can always change this later in Settings.',
    color: 'bg-indigo-500',
  },
  {
    icon: Download,
    title: 'Install the App',
    description: 'Add FinTrack+ to your home screen for the best experience — faster access, offline support & full screen.',
    color: 'bg-blue-500',
  },
  {
    icon: ShieldCheck,
    title: 'Start your 7-day free trial',
    description: '',
    color: 'bg-primary',
  },
] as const;

// Index helpers
const SETUP_STEP = 1;
const TRANSACTION_STEP = 2;
const THEME_STEP = 9;
const INSTALL_STEP = 10;
const TRIAL_STEP = 11;

// ─── Setup Suggestion Visual ───────────────────────────────────────
const SetupSuggestion = () => (
  <div className="mt-4 text-left space-y-3">
    {[
      { icon: FolderKanban, label: 'Add Projects', example: 'e.g., Wedding, Renovation', color: 'text-amber-500' },
      { icon: Store, label: 'Add Vendors', example: 'e.g., suppliers, freelancers', color: 'text-blue-500' },
      { icon: Grid3X3, label: 'Add Categories', example: 'e.g., Travel, Catering', color: 'text-violet-500' },
    ].map(({ icon: Icon, label, example, color }) => (
      <div key={label} className="flex items-center gap-3 p-2 rounded-xl bg-muted/50">
        <div className={`w-8 h-8 rounded-lg bg-background flex items-center justify-center ${color}`}>
          <Icon size={16} />
        </div>
        <div>
          <span className="text-sm font-medium">{label}</span>
          <span className="text-xs text-muted-foreground ml-1">({example})</span>
        </div>
      </div>
    ))}
  </div>
);

// ─── Transaction Toggle Preview ────────────────────────────────────
const TransactionTogglePreview = () => (
  <div className="mt-4 flex justify-center">
    <div className="inline-flex rounded-full bg-muted p-1 gap-1">
      <div className="px-4 py-1.5 rounded-full bg-destructive/15 text-destructive text-xs font-semibold">
        Expense
      </div>
      <div className="px-4 py-1.5 rounded-full bg-emerald-500/15 text-emerald-600 text-xs font-semibold">
        Income
      </div>
    </div>
  </div>
);

// ─── Theme Picker Cards ────────────────────────────────────────────
const themeOptions: { mode: ThemeMode; label: string; icon: React.ElementType; swatch: string; swatchBorder: string }[] = [
  { mode: 'light', label: 'Light', icon: Sun, swatch: 'bg-white', swatchBorder: 'border-gray-300' },
  { mode: 'dark', label: 'Dark', icon: Moon, swatch: 'bg-slate-800', swatchBorder: 'border-slate-600' },
  { mode: 'oled', label: 'OLED Black', icon: Smartphone, swatch: 'bg-black', swatchBorder: 'border-gray-700' },
];

const ThemePickerCards = ({ currentMode, onPick }: { currentMode: ThemeMode; onPick: (m: ThemeMode) => void }) => (
  <div className="flex gap-3 mt-5 justify-center">
    {themeOptions.map(({ mode, label, icon: Icon, swatch, swatchBorder }) => {
      const selected = currentMode === mode;
      return (
        <button
          key={mode}
          onClick={() => onPick(mode)}
          className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-3 w-[100px] transition-all duration-200
            ${selected ? 'border-primary ring-2 ring-primary/30 scale-105' : `border-border ${swatchBorder} hover:border-muted-foreground/40`}`}
        >
          <div className={`w-10 h-10 rounded-xl ${swatch} border ${swatchBorder} flex items-center justify-center`}>
            <Icon size={18} className={mode === 'light' ? 'text-amber-500' : 'text-white'} />
          </div>
          <span className="text-xs font-medium">{label}</span>
          {selected && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
              <Check size={10} className="text-primary-foreground" />
            </motion.div>
          )}
        </button>
      );
    })}
  </div>
);

// ─── Install Instructions ──────────────────────────────────────────
const InstallInstructions = ({ device }: { device: DeviceType }) => {
  const instructions: Record<DeviceType, { steps: string[]; icon: React.ElementType }> = {
    ios: {
      steps: [
        'Tap the Share button (□↑) in Safari',
        'Scroll down and tap "Add to Home Screen"',
        'Tap "Add" to confirm',
      ],
      icon: Share,
    },
    android: {
      steps: [
        'Tap the menu (⋮) in Chrome',
        'Select "Add to Home screen" or "Install app"',
        'Tap "Add" or "Install" to confirm',
      ],
      icon: Download,
    },
    desktop: {
      steps: [
        'Look for the install icon (+) in the address bar',
        'Click "Install" and confirm',
      ],
      icon: Download,
    },
    unknown: {
      steps: [
        'Open your browser menu',
        'Look for "Add to Home Screen" or "Install"',
        'Confirm the installation',
      ],
      icon: Download,
    },
  };

  const deviceLabels: Record<DeviceType, string> = {
    ios: 'iPhone/iPad',
    android: 'Android',
    desktop: 'Desktop',
    unknown: 'Your Device',
  };

  const info = instructions[device];

  return (
    <div className="mt-4 text-left space-y-3">
      <div className="flex items-center justify-center gap-2 mb-3">
        <Smartphone size={14} className="text-primary" />
        <span className="text-xs text-muted-foreground">
          Detected: <span className="font-medium text-foreground">{deviceLabels[device]}</span>
        </span>
      </div>
      {info.steps.map((step, i) => (
        <div key={i} className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 text-xs font-bold">
            {i + 1}
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{step}</p>
        </div>
      ))}
    </div>
  );
};

// ─── Trial Activation Card Body ────────────────────────────────────
const TrialCardBody = () => {
  const ticks = [
    '7-day free trial',
    'Up to 3 team members',
    'Unlimited transactions & projects',
    'Cancel anytime — access until period end',
  ];

  return (
    <div className="mt-2 text-left space-y-4">
      {/* Pricing block */}
      <div className="rounded-2xl border border-border bg-muted/40 p-4 text-center">
        <div className="text-3xl font-bold text-foreground">
          ₹599<span className="text-base font-medium text-muted-foreground">/month</span>
        </div>
        <div className="text-xs text-muted-foreground mt-1">incl. 18% GST</div>
        <div className="mt-3 pt-3 border-t border-border space-y-1 text-xs">
          <div className="flex justify-between text-muted-foreground">
            <span>Subscription (net)</span>
            <span className="font-medium text-foreground">₹507.63</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>GST (18%)</span>
            <span className="font-medium text-foreground">₹91.37</span>
          </div>
        </div>
      </div>

      {/* Feature ticks */}
      <div className="space-y-2">
        {ticks.map((t) => (
          <div key={t} className="flex items-start gap-2">
            <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
              <Check size={12} />
            </div>
            <span className="text-sm text-foreground">{t}</span>
          </div>
        ))}
      </div>

      {/* Mandate verification info */}
      <div className="flex items-start gap-2 rounded-xl bg-amber-500/10 border border-amber-500/30 p-3">
        <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
        <p className="text-xs text-foreground/90 leading-relaxed">
          <span className="font-semibold">₹1–₹5 refundable verification charge</span> required by RBI for recurring mandates. Auto-refunded in 5–7 business days. First ₹599 charge happens only after the 7-day trial.
        </p>
      </div>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────
export const OnboardingFlow = ({ onComplete, onActivateTrial, userName }: OnboardingFlowProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [device, setDevice] = useState<DeviceType>('unknown');
  const [isInstalled, setIsInstalled] = useState(false);
  const { mode: currentThemeMode, setTheme } = useTheme();
  const { isActive: subActive } = useSubscription();

  useEffect(() => {
    setDevice(detectDevice());
    setIsInstalled(isInStandaloneMode());
  }, []);

  const totalSteps = tourSteps.length;
  const isFirstStep = currentStep === 0;
  const isSetupStep = currentStep === SETUP_STEP;
  const isTransactionStep = currentStep === TRANSACTION_STEP;
  const isThemeStep = currentStep === THEME_STEP;
  const isInstallStep = currentStep === INSTALL_STEP;
  const isTrialStep = currentStep === TRIAL_STEP;

  const handleNext = () => {
    if (isTrialStep) {
      if (subActive) {
        onComplete();
      } else {
        onActivateTrial();
      }
      return;
    }
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const step = tourSteps[currentStep];
  const Icon = step.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="w-full max-w-md my-auto">
        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 mb-6 flex-wrap">
          {tourSteps.map((_, index) => (
            <motion.div
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentStep
                  ? 'w-6 bg-primary'
                  : index < currentStep
                    ? 'w-2 bg-primary/50'
                    : 'w-2 bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-card rounded-3xl p-8 shadow-card border border-border text-center"
          >
            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
              className={`w-20 h-20 mx-auto mb-6 rounded-2xl ${step.color} flex items-center justify-center`}
            >
              <Icon className="w-10 h-10 text-white" />
            </motion.div>

            {/* Title */}
            <h2 className="text-2xl font-bold mb-3">
              {isFirstStep && userName ? `Welcome, ${userName}!` : step.title}
            </h2>

            {/* Description */}
            {step.description && (
              <p className="text-muted-foreground mb-4 leading-relaxed">
                {isInstallStep && isInstalled
                  ? "You're already using FinTrack+ as an installed app. You're all set!"
                  : step.description}
              </p>
            )}

            {/* Conditional content */}
            {isSetupStep && <SetupSuggestion />}
            {isTransactionStep && <TransactionTogglePreview />}
            {isThemeStep && <ThemePickerCards currentMode={currentThemeMode} onPick={setTheme} />}
            {isInstallStep && !isInstalled && <InstallInstructions device={device} />}
            {isTrialStep && <TrialCardBody />}

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              {!isFirstStep && (
                <Button
                  variant="outline"
                  onClick={handlePrev}
                  className="flex-1"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              )}

              <Button
                onClick={handleNext}
                className={`flex-1 ${isFirstStep ? 'w-full' : ''}`}
              >
                {isTrialStep ? (
                  subActive ? (
                    <>
                      Go to Dashboard
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  ) : (
                    <>
                      Activate Trial
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )
                ) : (
                  <>
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default OnboardingFlow;
