import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PromoBanner = () => {
  const [banner, setBanner] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBanner();
  }, []);

  const fetchBanner = async () => {
    try {
      const response = await axios.get(`${API}/promo-banner`);
      if (response.data.success && response.data.banner) {
        setBanner(response.data.banner);
      }
    } catch (error) {
      console.error('Error fetching promo banner:', error);
    } finally {
      setLoading(false);
    }
  };

  // Don't show if loading, no banner, or banner is disabled
  if (loading || !banner || !banner.isActive) {
    return null;
  }

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return '';
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    if (imageUrl.startsWith('/uploads/')) {
      return `${BACKEND_URL}/api${imageUrl}`;
    }
    return `${BACKEND_URL}${imageUrl}`;
  };

  const BannerContent = () => (
    <div className="relative w-full overflow-hidden rounded-lg shadow-lg">
      {/* Desktop Banner */}
      <div className="hidden lg:block">
        {banner.desktopImage && (
          <img
            src={getImageUrl(banner.desktopImage)}
            alt="Promo Banner"
            className="w-full h-auto object-cover"
            style={{ maxHeight: '400px' }}
          />
        )}
      </div>

      {/* Tablet Banner */}
      <div className="hidden md:block lg:hidden">
        {banner.tabletImage ? (
          <img
            src={getImageUrl(banner.tabletImage)}
            alt="Promo Banner"
            className="w-full h-auto object-cover"
            style={{ maxHeight: '350px' }}
          />
        ) : banner.desktopImage ? (
          <img
            src={getImageUrl(banner.desktopImage)}
            alt="Promo Banner"
            className="w-full h-auto object-cover"
            style={{ maxHeight: '350px' }}
          />
        ) : null}
      </div>

      {/* Mobile Banner */}
      <div className="block md:hidden">
        {banner.mobileImage ? (
          <img
            src={getImageUrl(banner.mobileImage)}
            alt="Promo Banner"
            className="w-full h-auto object-cover"
            style={{ maxHeight: '250px' }}
          />
        ) : banner.tabletImage ? (
          <img
            src={getImageUrl(banner.tabletImage)}
            alt="Promo Banner"
            className="w-full h-auto object-cover"
            style={{ maxHeight: '250px' }}
          />
        ) : banner.desktopImage ? (
          <img
            src={getImageUrl(banner.desktopImage)}
            alt="Promo Banner"
            className="w-full h-auto object-cover"
            style={{ maxHeight: '250px' }}
          />
        ) : null}
      </div>
    </div>
  );

  // If has link, wrap in anchor tag
  if (banner.linkUrl) {
    // Ensure URL has protocol (add https:// if missing)
    let fullUrl = banner.linkUrl;
    if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
      fullUrl = `https://${fullUrl}`;
    }
    
    return (
      <section className="py-6 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <a
            href={fullUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block hover:opacity-90 transition-opacity cursor-pointer"
          >
            <BannerContent />
          </a>
        </div>
      </section>
    );
  }

  // No link, just display banner
  return (
    <section className="py-6 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <BannerContent />
      </div>
    </section>
  );
};

export default PromoBanner;
