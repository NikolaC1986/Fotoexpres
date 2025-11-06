import React, { useState, useEffect } from 'react';
import { X, Tag, Calendar } from 'lucide-react';
import { Button } from './ui/button';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PromotionPopup = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [promotion, setPromotion] = useState(null);

  useEffect(() => {
    // Check if user has already seen the popup in this session
    const hasSeenPopup = sessionStorage.getItem('hasSeenPromotion');
    
    if (!hasSeenPopup) {
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
            setTimeout(() => setIsVisible(true), 1000); // Show after 1 second
          }
        } else {
          // No expiry date, show it
          setPromotion(promo);
          setTimeout(() => setIsVisible(true), 1000);
        }
      }
    } catch (error) {
      console.error('Error fetching promotion:', error);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    sessionStorage.setItem('hasSeenPromotion', 'true');
  };

  if (!isVisible || !promotion) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 animate-fadeIn"
        onClick={handleClose}
      />
      
      {/* Popup */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-11/12 max-w-md animate-scaleIn">
        <div className="bg-gradient-to-br from-orange-50 via-white to-red-50 rounded-2xl shadow-2xl border-4 border-orange-400 p-6 md:p-8 relative">
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 bg-white rounded-full p-2 shadow-md hover:shadow-lg transition-all"
          >
            <X size={24} />
          </button>

          {/* Content */}
          <div className="text-center">
            {/* Discount Badge */}
            <div className="inline-block bg-gradient-to-r from-orange-600 to-red-600 text-white px-8 py-4 rounded-full mb-6 shadow-lg transform hover:scale-105 transition-transform">
              <div className="flex items-center gap-3">
                <Tag size={32} className="animate-bounce" />
                <span className="text-4xl md:text-5xl font-bold">{promotion.discountPercent}%</span>
              </div>
              <p className="text-sm md:text-base font-semibold mt-1">POPUST</p>
            </div>

            {/* Message */}
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 leading-tight">
              {promotion.message}
            </h2>

            {/* Details */}
            <div className="bg-white rounded-lg p-4 mb-6 border-2 border-orange-200">
              <div className="flex items-center justify-center gap-2 text-gray-700 mb-2">
                <Tag size={18} className="text-orange-600" />
                <span className="font-semibold">
                  Primenjuje se na: {promotion.format === 'all' ? 'Sve formate' : `Format ${promotion.format} cm`}
                </span>
              </div>
              
              {promotion.validUntil && (
                <div className="flex items-center justify-center gap-2 text-gray-600">
                  <Calendar size={18} className="text-orange-600" />
                  <span className="text-sm">
                    Važi do: {new Date(promotion.validUntil).toLocaleDateString('sr-RS', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              )}
            </div>

            {/* CTA Button */}
            <Button
              onClick={handleClose}
              size="lg"
              className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white text-lg font-bold py-6 shadow-lg hover:shadow-xl transition-all"
            >
              Iskoristi Popust Sada! 🎉
            </Button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>
    </>
  );
};

export default PromotionPopup;
