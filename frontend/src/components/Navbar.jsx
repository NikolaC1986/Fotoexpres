import React from 'react';
import { Link } from 'react-router-dom';
import { Upload, Phone } from 'lucide-react';
import { Button } from './ui/button';
import PromotionBanner from './PromotionBanner';

const Navbar = () => {
  return (
    <>
      {/* Promotion Banner - Above everything */}
      <PromotionBanner />
      
      <div className="bg-gray-900 text-white py-3 px-6">
        {/* Desktop Layout */}
        <div className="hidden md:flex max-w-7xl mx-auto justify-between items-center text-sm">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Phone size={16} />
              <span>+381 65 46 000 46</span>
            </div>
            <span className="text-gray-400">Pon - Pet: 09:00 - 18:00</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-400">Besplatna dostava za porudžbine preko 5000 RSD</span>
          </div>
        </div>
        
        {/* Mobile Layout - Stacked */}
        <div className="md:hidden flex flex-col gap-2 text-xs text-center">
          <div className="flex items-center justify-center gap-2">
            <Phone size={14} />
            <span>+381 65 46 000 46</span>
          </div>
          <div className="text-gray-400">Pon - Pet: 09:00 - 18:00</div>
          <div className="text-gray-400">Besplatna dostava preko 5000 RSD</div>
        </div>
      </div>
      
      <nav className="bg-white shadow-md sticky top-0 z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-2 md:py-3">
          {/* Mobile Layout - 2 rows */}
          <div className="md:hidden">
            {/* First Row - Logo */}
            <div className="flex justify-center mb-2">
              <Link to="/" className="flex items-center">
                <div className="bg-orange-600 px-2 py-1 rounded-lg">
                  <img 
                    src="https://customer-assets.emergentagent.com/job_swift-image-portal/artifacts/i8bseb70_Logo_Fotoexpres.png" 
                    alt="Fotoexpres Logo" 
                    className="h-8 w-auto"
                  />
                </div>
              </Link>
            </div>
            {/* Second Row - Actions */}
            <div className="flex items-center justify-center gap-3">
              <Link to="/upload">
                <Button className="bg-orange-600 hover:bg-orange-700 text-white gap-2 font-medium text-sm px-6 py-2">
                  <Upload size={16} />
                  Pošalji Fotografije
                </Button>
              </Link>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden md:flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="bg-orange-600 px-3 py-1 rounded-lg">
                <img 
                  src="https://customer-assets.emergentagent.com/job_swift-image-portal/artifacts/i8bseb70_Logo_Fotoexpres.png" 
                  alt="Fotoexpres Logo" 
                  className="h-10 w-auto"
                />
              </div>
            </Link>

            <div className="flex items-center gap-8 text-gray-700 font-medium text-sm uppercase tracking-wide">
              <Link to="/" className="hover:text-orange-600 transition-colors">Početna</Link>
              <Link to="/prices" className="hover:text-orange-600 transition-colors">Cenovnik</Link>
              <Link to="/faq" className="hover:text-orange-600 transition-colors">FAQ</Link>
            </div>

            <div className="flex items-center gap-2">
              <Link to="/upload">
                <Button className="bg-orange-600 hover:bg-orange-700 text-white gap-2 font-medium text-sm px-4 py-2">
                  <Upload size={18} />
                  Pošalji Fotografije
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;