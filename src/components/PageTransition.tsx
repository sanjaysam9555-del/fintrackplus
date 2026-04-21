import { motion } from 'framer-motion';

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
      <motion.div
        className="flex flex-col items-center gap-3"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <motion.img
          src={appIcon}
          alt="Loading"
          className="w-12 h-12 rounded-full overflow-hidden"
          animate={{ 
            rotate: [0, 5, -5, 0],
            scale: [1, 1.05, 1],
          }}
          transition={{ 
            duration: 0.8, 
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
        <motion.div
          className="flex gap-1"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-primary"
              animate={{
                y: [0, -4, 0],
              }}
              transition={{
                duration: 0.5,
                repeat: Infinity,
                delay: i * 0.1,
                ease: 'easeInOut',
              }}
            />
          ))}
        </motion.div>
      </motion.div>
    </motion.div>
  );
};
