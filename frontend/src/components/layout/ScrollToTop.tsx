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
    }, 800);

    return () => clearTimeout(timer);
  }, [pathname, search]);

  if (!loading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[99999] h-1 bg-[#d83526] pointer-events-none shadow-md">
      <div className="h-full bg-secondary w-full animate-pulse" />
    </div>
  );
}
