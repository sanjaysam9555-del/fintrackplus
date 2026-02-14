import { motion, useScroll, useSpring } from "framer-motion";

export const ScrollProgress = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  return (
    <motion.div
      className="fixed top-[56px] left-0 right-0 z-50 h-[2px] bg-primary origin-left"
      style={{ scaleX }}
    />
  );
};
