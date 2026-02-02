import { motion } from 'framer-motion';
import appIcon from '@/assets/app-icon.png';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  return (
    <motion.div
      className="fixed inset-0 z-[100] bg-background flex items-center justify-center"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      onAnimationComplete={(definition) => {
        // Only call onComplete when the exit animation finishes
      }}
    >
      <motion.div
        className="flex flex-col items-center gap-4"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ 
          duration: 0.5, 
          ease: [0.34, 1.56, 0.64, 1] // Spring-like bounce
        }}
        onAnimationComplete={() => {
          // After the logo animates in, wait a moment then trigger complete
          setTimeout(onComplete, 1500);
        }}
      >
        {/* Logo with pulse animation */}
        <motion.div
          className="relative"
          animate={{ 
            scale: [1, 1.05, 1],
          }}
          transition={{ 
            duration: 1.5, 
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        >
          <motion.img
            src={appIcon}
            alt="FinTrack+"
            className="w-24 h-24 rounded-3xl shadow-2xl"
            initial={{ rotate: -10 }}
            animate={{ rotate: 0 }}
            transition={{ duration: 0.5 }}
          />
          {/* Glow effect */}
          <motion.div
            className="absolute inset-0 rounded-3xl bg-primary/20 blur-xl -z-10"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </motion.div>
        
        {/* App name */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            FinTrack<sup className="text-[0.5em] ml-0.5 text-primary">+</sup>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Smart Finance Management
          </p>
        </motion.div>
        
        {/* Loading indicator */}
        <motion.div
          className="flex gap-1.5 mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-primary"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.2,
                ease: 'easeInOut',
              }}
            />
          ))}
        </motion.div>
      </motion.div>
    </motion.div>
  );
};
