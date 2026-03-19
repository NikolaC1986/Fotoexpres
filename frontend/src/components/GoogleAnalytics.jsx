import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '../utils/gtag';

const PAGE_TITLES = {
  '/': 'Početna',
  '/upload': 'Naruči',
  '/prices': 'Cene',
  '/proizvodi': 'Proizvodi',
  '/faq': 'FAQ',
  '/logovanje': 'Admin Login',
};

const GoogleAnalytics = () => {
  const location = useLocation();

  useEffect(() => {
    const title = PAGE_TITLES[location.pathname] || document.title;
    trackPageView(location.pathname, title);
  }, [location.pathname]);

  return null;
};

export default GoogleAnalytics;
