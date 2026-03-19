import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const GoogleAnalytics = () => {
  const location = useLocation();

  useEffect(() => {
    if (typeof window.gtag !== 'function') return;
    
    window.gtag('config', 'AW-17058967836', {
      page_path: location.pathname,
    });
  }, [location.pathname]);

  return null;
};

export default GoogleAnalytics;
