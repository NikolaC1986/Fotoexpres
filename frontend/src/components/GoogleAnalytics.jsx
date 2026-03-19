import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const GoogleAnalytics = () => {
  const location = useLocation();

  useEffect(() => {
    if (typeof window.gtag !== 'function') return;
    
    // Send pageview to both GA4 and Google Ads on route change
    window.gtag('config', 'G-5JYT6NT52S', {
      page_path: location.pathname,
    });
    window.gtag('config', 'AW-17058967836', {
      page_path: location.pathname,
    });
  }, [location.pathname]);

  return null;
};

export default GoogleAnalytics;
