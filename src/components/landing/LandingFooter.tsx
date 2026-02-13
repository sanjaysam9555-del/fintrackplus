import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const FinalCTA = () => {
  const navigate = useNavigate();

  return (
    <section className="py-24 px-4 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-xl mx-auto"
      >
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          Your next wedding deserves{" "}
          <span className="text-primary">better books</span>.
        </h2>
        <p className="text-muted-foreground mb-8">
          Join wedding planners across India who've switched from notebooks and spreadsheets to FinTrack⁺.
        </p>
        <Button
          size="lg"
          className="text-base px-10 rounded-xl gap-2"
          onClick={() => navigate("/auth")}
        >
          Get Started Free <ArrowRight className="w-4 h-4" />
        </Button>
      </motion.div>
    </section>
  );
};

export const LandingFooter = () => (
  <footer className="border-t py-8 px-4">
    <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
      <div className="font-semibold text-foreground">
        FinTrack⁺ <span className="font-normal text-muted-foreground">v2.0</span>
      </div>
      <div className="flex gap-6">
        <span className="hover:text-foreground cursor-pointer transition-colors">Privacy</span>
        <span className="hover:text-foreground cursor-pointer transition-colors">Terms</span>
        <span className="hover:text-foreground cursor-pointer transition-colors">Contact</span>
      </div>
      <div>© {new Date().getFullYear()} FinTrack⁺. All rights reserved.</div>
    </div>
  </footer>
);
