import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  PlusCircle, 
  PieChart, 
  Bell, 
  FolderKanban,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OnboardingFlowProps {
  onComplete: () => void;
  userName?: string;
}

const steps = [
  {
    icon: Sparkles,
    title: 'Welcome to FinTrack Pro!',
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
    description: 'Get notifications for important updates and transaction summaries. You\'re all set!',
    color: 'bg-rose-500',
  },
];

export const OnboardingFlow = ({ onComplete, userName }: OnboardingFlowProps) => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
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
  const isLastStep = currentStep === steps.length - 1;
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
            <p className="text-muted-foreground mb-8 leading-relaxed">
              {step.description}
            </p>

            {/* Actions */}
            <div className="flex gap-3">
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
