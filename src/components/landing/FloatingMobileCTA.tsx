import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getAppUrl } from "@/lib/domainUtils";

export const FloatingMobileCTA = () => {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 500);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 24 }}
          className="fixed bottom-6 inset-x-0 z-50 flex justify-center pointer-events-none"
        >
          <button
            className="pointer-events-auto relative flex items-center gap-2 text-sm font-semibold px-6 py-3 rounded-full text-primary-foreground bg-gradient-to-r from-primary to-primary/80 backdrop-blur-md shadow-[0_8px_32px_rgba(25,102,205,0.3)] hover:shadow-[0_8px_40px_rgba(25,102,205,0.4)] transition-shadow"
            onClick={() => { const url = getAppUrl(); if (url.startsWith('http')) { window.location.href = url; } else { navigate(url); } }}
          >
            {/* Pulsing ring */}
            <span className="absolute inset-0 rounded-full border-2 border-primary/40 animate-ping opacity-30" />
            <Sparkles className="w-4 h-4" />
            Get Started
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
