import { motion, useScroll, useSpring, useTransform, useMotionValueEvent } from "framer-motion";
import { useState } from "react";

export const ScrollProgress = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
  const [percent, setPercent] = useState(0);

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setPercent(Math.round(v * 100));
  });

  // Hide when at the very top
  if (percent === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] h-1 bg-muted/40">
      <motion.div
        className="h-full bg-primary origin-left"
        style={{ scaleX }}
      />
      <span className="absolute right-2 top-1 text-[10px] font-medium text-muted-foreground leading-none">
        {percent}%
      </span>
    </div>
  );
};
