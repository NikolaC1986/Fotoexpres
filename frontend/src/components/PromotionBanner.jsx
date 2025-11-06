import React, { useState, useEffect } from 'react';
import { X, Tag, Calendar, Sparkles } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PromotionBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [promotion, setPromotion] = useState(null);

  useEffect(() => {
    // Check if user has closed the banner in this session
    const hasClosed = sessionStorage.getItem('promotionBannerClosed');
    
    if (!hasClosed) {
      fetchPromotion();
    }
  }, []);

  const fetchPromotion = async () => {
    try {
      const response = await axios.get(`${API}/promotion`);
      const promo = response.data.promotion;
      
      if (promo && promo.isActive) {
        // Check if promotion is still valid
        if (promo.validUntil) {
          const validUntil = new Date(promo.validUntil);
          const now = new Date();
          
          if (validUntil > now) {
            setPromotion(promo);
            setIsVisible(true);
          }
        } else {
          // No expiry date, show it
          setPromotion(promo);
          setIsVisible(true);
        }
      }
    } catch (error) {
      console.error('Error fetching promotion:', error);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    sessionStorage.setItem('promotionBannerClosed', 'true');
  };

  if (!isVisible || !promotion) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-orange-600 via-red-600 to-orange-600 text-white relative overflow-hidden animate-slideDown">
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-repeat" style={{
          backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
          backgroundSize: '20px 20px'
        }}></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 py-3 md:py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Left side - Icon and Message */}
          <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
            {/* Discount Badge */}
            <div className="bg-white text-orange-600 px-3 md:px-4 py-1 md:py-2 rounded-full font-bold text-lg md:text-2xl flex-shrink-0 shadow-lg flex items-center gap-2 animate-pulse">
              <Sparkles size={20} className="hidden md:block" />
              <span>{promotion.discountPercent}% OFF</span>
            </div>

            {/* Message */}
            <div className="flex-1 min-w-0">
              <p className="text-sm md:text-lg font-bold truncate md:whitespace-normal">
                {promotion.message}
              </p>
              <div className="flex items-center gap-3 md:gap-4 text-xs md:text-sm mt-1 opacity-90">
                <span className="flex items-center gap-1">
                  <Tag size={14} />
                  {promotion.format === 'all' ? 'Svi formati' : `${promotion.format} cm`}
                </span>
                {promotion.validUntil && (
                  <span className="hidden md:flex items-center gap-1">
                    <Calendar size={14} />
                    Do: {new Date(promotion.validUntil).toLocaleDateString('sr-RS', {
                      day: 'numeric',
                      month: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right side - CTA and Close */}
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
            {/* CTA Button - Desktop */}
            <a 
              href="/upload" 
              className="hidden md:block bg-white text-orange-600 px-4 md:px-6 py-2 rounded-full font-bold hover:bg-orange-50 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Iskoristi Sada!
            </a>

            {/* Close Button */}
            <button
              onClick={handleClose}
              className="bg-white/20 hover:bg-white/30 text-white rounded-full p-1.5 md:p-2 transition-all"
              aria-label="Zatvori"
            >
              <X size={18} className="md:w-5 md:h-5" />
            </button>
          </div>
        </div>

        {/* Mobile CTA - Full Width */}
        <div className="md:hidden mt-3">
          <a 
            href="/upload" 
            className="block text-center bg-white text-orange-600 px-4 py-2 rounded-full font-bold hover:bg-orange-50 transition-all shadow-lg"
          >
            Iskoristi Popust! 🎉
          </a>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideDown {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .animate-slideDown {
          animation: slideDown 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};

export default PromotionBanner;
