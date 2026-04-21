import { motion } from 'framer-motion';
import { PageLoader } from '@/components/ui/skeleton-loader';

interface PageTransitionProps {
  isLoading: boolean;
}

export const PageTransition = ({ isLoading }: PageTransitionProps) => {
  if (!isLoading) return null;

  return (
    <motion.div
      className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <PageLoader />
    </motion.div>
  );
};
