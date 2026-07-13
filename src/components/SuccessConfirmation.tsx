import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SuccessConfirmationProps {
  message: string | null;
  onComplete: () => void;
}

export const SuccessConfirmation = ({ message, onComplete }: SuccessConfirmationProps) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onComplete, 1800);
    return () => clearTimeout(timer);
  }, [message, onComplete]);

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
        >
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="bg-card rounded-3xl shadow-2xl px-8 py-7 flex flex-col items-center gap-3 border border-border/50"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 12, stiffness: 220, delay: 0.1 }}
              className="w-16 h-16 rounded-full bg-success/15 flex items-center justify-center"
            >
              <svg viewBox="0 0 24 24" className="w-9 h-9" fill="none">
                <motion.path
                  d="M4 12l5 5L20 6"
                  stroke="hsl(var(--success))"
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.4, delay: 0.25, ease: "easeOut" }}
                />
              </svg>
            </motion.div>
            <span className="text-base font-semibold text-foreground whitespace-nowrap">{message}</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
