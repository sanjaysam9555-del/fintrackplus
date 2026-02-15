import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  PlusCircle, 
  PieChart, 
  Bell, 
  FolderKanban,
  Sparkles,
  Download,
  Share,
  Plus,
  ChevronRight,
  Smartphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OnboardingFlowProps {
  onComplete: () => void;
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

const baseSteps = [
  {
    icon: Sparkles,
    title: 'Welcome to FinTrack+!',
    description: 'Your personal finance companion. Let\'s take a quick tour to help you get started.',
    color: 'bg-primary',
  },
  {
    icon: PlusCircle,
    title: 'Track Your Transactions',
    description: 'Tap the + button at the bottom to add income or expenses. Categorize them for better insights.',
    color: 'bg-emerald-500',
  },
  {
    icon: PieChart,
    title: 'View AI Insights',
    description: 'Get smart summaries and spending analysis powered by AI. Understand where your money goes.',
    color: 'bg-violet-500',
  },
  {
    icon: FolderKanban,
    title: 'Organize with Projects',
    description: 'Create projects like "Vacation" or "Home Renovation" to track spending for specific goals.',
    color: 'bg-amber-500',
  },
  {
    icon: Bell,
    title: 'Stay Notified',
    description: 'Get notifications for important updates and transaction summaries.',
    color: 'bg-rose-500',
  },
];

const installStep = {
  icon: Download,
  title: 'Install the App',
  description: 'Add FinTrack+ to your home screen for the best experience — faster access, offline support & full screen.',
  color: 'bg-blue-500',
};

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

export const OnboardingFlow = ({ onComplete, userName }: OnboardingFlowProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [device, setDevice] = useState<DeviceType>('unknown');
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    setDevice(detectDevice());
    setIsInstalled(isInStandaloneMode());
  }, []);

  const steps = [...baseSteps, installStep];
  const totalSteps = steps.length;

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const step = steps[currentStep];
  const Icon = step.icon;
  const isLastStep = currentStep === totalSteps - 1;
  const isFirstStep = currentStep === 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <div className="w-full max-w-md">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {steps.map((_, index) => (
            <motion.div
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentStep 
                  ? 'w-8 bg-primary' 
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
            <p className="text-muted-foreground mb-4 leading-relaxed">
              {isLastStep && isInstalled
                ? "You're already using FinTrack+ as an installed app. You're all set!"
                : step.description}
            </p>

            {/* Install instructions on last step */}
            {isLastStep && !isInstalled && (
              <InstallInstructions device={device} />
            )}

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
                {isLastStep ? (
                  <>
                    Get Started
                    <Check className="w-4 h-4 ml-2" />
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>

            {/* Skip */}
            {!isLastStep && (
              <button
                onClick={handleSkip}
                className="mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Skip tour
              </button>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
