import { useEffect, useState } from 'react';
import { useLocation } from 'react-router';

export default function ScrollToTop() {
  const { pathname, search } = useLocation();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(true);
    setProgress(30);

    const timer1 = setTimeout(() => setProgress(75), 100);
    const timer2 = setTimeout(() => setProgress(100), 300);
    const timer3 = setTimeout(() => {
      setLoading(false);
      setProgress(0);
    }, 450);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [pathname, search]);

  if (!loading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[99999] h-[2px] bg-transparent pointer-events-none overflow-hidden">
      <div 
        className="h-full bg-secondary/80 shadow-[0_0_8px_rgba(217,119,6,0.6)] transition-all duration-300 ease-out origin-left"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
