import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Reset scroll to the top on client-side route changes — but not when the URL
// carries a hash (then we let the target section be scrolled into view instead).
export default function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (!window.location.hash) window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
