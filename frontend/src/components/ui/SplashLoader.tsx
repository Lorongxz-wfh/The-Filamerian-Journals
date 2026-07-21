import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router';

const SplashLoader: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const isDashboard = location.pathname.startsWith('/dashboard') || location.pathname === '/login';

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center"
        >
          <div className="flex flex-col items-center gap-6">
            <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-widest text-primary font-serif text-center">
              The Filamerian {isDashboard ? 'Dashboard' : 'Journals'}
            </h1>
            <div className="h-0.5 w-32 bg-primary/10 overflow-hidden relative">
              <motion.div 
                className="absolute top-0 left-0 h-full bg-secondary"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 0.6, ease: 'easeInOut' }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashLoader;
