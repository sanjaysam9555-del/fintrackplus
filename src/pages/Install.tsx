import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Share, 
  Plus, 
  ChevronRight, 
  Smartphone, 
  Check, 
  Download,
  ExternalLink,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { appPath } from '@/lib/domainUtils';

type DeviceType = 'ios' | 'android' | 'desktop' | 'unknown';

const detectDevice = (): DeviceType => {
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (/iphone|ipad|ipod/.test(userAgent)) {
    return 'ios';
  }
  if (/android/.test(userAgent)) {
    return 'android';
  }
  if (/windows|macintosh|linux/.test(userAgent) && !/mobile/.test(userAgent)) {
    return 'desktop';
  }
  return 'unknown';
};

// iOS Safari exposes a non-standard `standalone` property on navigator.
interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean;
}

const isInStandaloneMode = (): boolean => {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as NavigatorWithStandalone).standalone === true
  );
};

interface StepProps {
  number: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  isLast?: boolean;
}

const Step = ({ number, title, description, icon, isLast = false }: StepProps) => (
  <motion.div 
    className="flex gap-4"
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: number * 0.15 }}
  >
    <div className="flex flex-col items-center">
      <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
        {number}
      </div>
      {!isLast && <div className="w-0.5 h-full bg-border my-2 min-h-[40px]" />}
    </div>
    <div className="flex-1 pb-6">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <h3 className="font-semibold text-foreground">{title}</h3>
      </div>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  </motion.div>
);

const IOSInstructions = () => (
  <div className="space-y-2">
    <Step
      number={1}
      title="Tap the Share button"
      description="Look for the share icon at the bottom of Safari (square with an arrow pointing up)"
      icon={<Share size={18} className="text-primary" />}
    />
    <Step
      number={2}
      title="Scroll and find 'Add to Home Screen'"
      description="Scroll down in the share menu until you see 'Add to Home Screen' option"
      icon={<Plus size={18} className="text-primary" />}
    />
    <Step
      number={3}
      title="Tap 'Add'"
      description="Confirm by tapping 'Add' in the top right corner. The app will now appear on your home screen!"
      icon={<Check size={18} className="text-primary" />}
      isLast
    />
  </div>
);

const AndroidInstructions = () => (
  <div className="space-y-2">
    <Step
      number={1}
      title="Open browser menu"
      description="Tap the three dots (⋮) in the top right corner of Chrome"
      icon={<ChevronRight size={18} className="text-primary" />}
    />
    <Step
      number={2}
      title="Select 'Add to Home screen'"
      description="Find and tap 'Add to Home screen' or 'Install app' option"
      icon={<Download size={18} className="text-primary" />}
    />
    <Step
      number={3}
      title="Confirm installation"
      description="Tap 'Add' or 'Install' to add the app to your home screen"
      icon={<Check size={18} className="text-primary" />}
      isLast
    />
  </div>
);

const DesktopInstructions = () => (
  <div className="space-y-2">
    <Step
      number={1}
      title="Look for the install icon"
      description="In Chrome, look for a '+' or install icon in the address bar (right side)"
      icon={<Download size={18} className="text-primary" />}
    />
    <Step
      number={2}
      title="Click 'Install'"
      description="Click the install button and confirm the installation"
      icon={<Check size={18} className="text-primary" />}
      isLast
    />
  </div>
);

const AlreadyInstalled = () => (
  <motion.div 
    className="text-center py-8"
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
  >
    <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
      <Check size={40} className="text-success" />
    </div>
    <h2 className="text-xl font-bold mb-2">Already Installed!</h2>
    <p className="text-muted-foreground">
      You're already using FinTrack<sup className="text-[0.5em]">+</sup> as an installed app. Enjoy!
    </p>
  </motion.div>
);

export const InstallPage = () => {
  const [device, setDevice] = useState<DeviceType>('unknown');
  const [isInstalled, setIsInstalled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setDevice(detectDevice());
    setIsInstalled(isInStandaloneMode());
  }, []);

  const deviceLabels: Record<DeviceType, string> = {
    ios: 'iPhone/iPad',
    android: 'Android',
    desktop: 'Desktop',
    unknown: 'Your Device'
  };

  const renderInstructions = () => {
    if (isInstalled) {
      return <AlreadyInstalled />;
    }

    switch (device) {
      case 'ios':
        return <IOSInstructions />;
      case 'android':
        return <AndroidInstructions />;
      case 'desktop':
        return <DesktopInstructions />;
      default:
        return <IOSInstructions />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4">
      <div className="max-w-md mx-auto pt-safe">
        {/* Back button */}
        <motion.button
          onClick={() => navigate(appPath('/'))}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <ArrowLeft size={20} />
          <span>Back to App</span>
        </motion.button>

        {/* Header */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="relative inline-block mb-4">
            <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl" />
            <img 
              src="/app-icon-192.png" 
              alt="FinTrack+" 
              className="w-20 h-20 rounded-2xl shadow-lg relative z-10"
            />
          </div>
          <h1 className="text-2xl font-bold mb-2">Install FinTrack<sup className="text-[0.6em] ml-0.5">+</sup></h1>
          <p className="text-muted-foreground text-sm">
            Add to your home screen for the best experience
          </p>
        </motion.div>

        {/* Device detection badge */}
        {!isInstalled && (
          <motion.div 
            className="flex items-center justify-center gap-2 mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Smartphone size={16} className="text-primary" />
            <span className="text-sm text-muted-foreground">
              Detected: <span className="font-medium text-foreground">{deviceLabels[device]}</span>
            </span>
          </motion.div>
        )}

        {/* Instructions card */}
        <motion.div 
          className="bg-card/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-border/50"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {!isInstalled && (
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <ExternalLink size={18} className="text-primary" />
              How to Install
            </h2>
          )}
          {renderInstructions()}
        </motion.div>

        {/* Benefits section */}
        {!isInstalled && (
          <motion.div 
            className="mt-6 space-y-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <h3 className="font-semibold text-center text-sm text-muted-foreground uppercase tracking-wide">
              Why Install?
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { title: 'Faster Access', desc: 'Open instantly from home screen' },
                { title: 'Works Offline', desc: 'Use even without internet' },
                { title: 'Full Screen', desc: 'No browser UI distractions' },
                { title: 'Push Alerts', desc: 'Get spending notifications' },
              ].map((benefit, i) => (
                <motion.div
                  key={benefit.title}
                  className="bg-card/60 rounded-xl p-3 text-center"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                >
                  <p className="font-medium text-sm">{benefit.title}</p>
                  <p className="text-xs text-muted-foreground">{benefit.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* CTA for installed users */}
        {isInstalled && (
          <motion.div 
            className="mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Button 
              onClick={() => navigate(appPath('/'))} 
              className="w-full h-12 rounded-xl"
            >
              Continue to App
              <ChevronRight size={18} />
            </Button>
          </motion.div>
        )}

        {/* Footer */}
        <motion.p 
          className="text-center text-xs text-muted-foreground/60 mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          An App by Saffron Events
        </motion.p>
      </div>
    </div>
  );
};