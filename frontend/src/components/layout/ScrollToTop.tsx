import { useEffect, useState } from 'react';
import { useLocation } from 'react-router';

export default function ScrollToTop() {
  const { pathname, search } = useLocation();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(true);

    const timer = setTimeout(() => {
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [pathname, search]);

  if (!loading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-secondary overflow-hidden pointer-events-none animate-pulse">
      <div className="h-full bg-primary/90 w-full animate-in fade-in slide-in-from-left duration-300" />
    </div>
  );
}
