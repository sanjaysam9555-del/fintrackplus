import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getAppUrl } from "@/lib/domainUtils";
import appIcon from "@/assets/app-icon.png";

export const FinalCTA = () => {
  const navigate = useNavigate();

  return (
    <section className="py-20 md:py-24 px-4 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-xl mx-auto"
      >
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          Your next event deserves{" "}
          <span className="text-primary dark:text-foreground">better books</span>.
        </h2>
        <p className="text-muted-foreground mb-2">
          Join event planners across India who've switched from notebooks and spreadsheets to FinTrack⁺.
        </p>
        <p className="text-sm text-muted-foreground/80 italic mb-8">
          Your next event is around the corner — start tracking smarter today.
        </p>
        <Button
          size="lg"
          className="text-base px-10 rounded-xl gap-2 bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/25"
          onClick={() => { const url = getAppUrl(); url.startsWith('http') ? window.location.href = url : navigate(url); }}
        >
          Get Started <ArrowRight className="w-4 h-4" />
        </Button>
        <p className="mt-3 text-xs text-muted-foreground">
          ₹499/month · Credit card required
        </p>
      </motion.div>
    </section>
  );
};

export const LandingFooter = () => (
  <footer className="border-t py-10 px-4">
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-6">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-[25%] shrink-0 overflow-hidden">
            <img src={appIcon} alt="FinTrack⁺" className="w-full h-full object-cover scale-[1.3]" />
          </div>
          <span className="text-lg font-bold text-foreground tracking-tight">
            FinTrack<sup className="text-primary dark:text-foreground text-xs">⁺</sup>
          </span>
          <span className="text-xs text-muted-foreground ml-1">v2.0</span>
        </div>

        {/* Links */}
        <div className="flex gap-6 text-sm">
          <a href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">Privacy</a>
          <a href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">Terms</a>
          <a href="mailto:support@fintrackplus.in" className="text-muted-foreground hover:text-foreground transition-colors">Contact</a>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t border-border/50 text-xs text-muted-foreground">
        <div>© {new Date().getFullYear()} FinTrack⁺. All rights reserved.</div>
        <div className="flex items-center gap-1.5">
          <span>🇮🇳</span>
          <span>Made with ❤️ in India</span>
        </div>
      </div>
    </div>
  </footer>
);
