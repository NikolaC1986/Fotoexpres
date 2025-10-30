import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Upload, LogIn } from 'lucide-react';
import { Button } from './ui/button';

const Navbar = () => {
  return (
    <>
      <div className="bg-gray-900 text-white py-2 px-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center text-sm">
          <div className="flex items-center gap-4">
            <span>📱 Now available: Mobile app</span>
          </div>
          <div className="flex items-center gap-6">
            <span>📞 066/21-66-21</span>
            <span>🕐 09:00 - 18:00</span>
          </div>
        </div>
      </div>
      
      <nav className="bg-[#FFB8BA] shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="bg-gray-900 p-2 rounded-lg transform group-hover:scale-105 transition-transform">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" fill="#FFB8BA"/>
                  <circle cx="12" cy="13" r="4" fill="#FFB8BA"/>
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-900 font-bold text-xl tracking-tight">IZRADA</span>
                <span className="text-gray-900 font-bold text-xl tracking-tight">FOTOGRAFIJA</span>
              </div>
            </Link>

            <div className="hidden md:flex items-center gap-8 text-gray-900 font-medium">
              <Link to="/" className="hover:text-gray-700 transition-colors">HOME</Link>
              <Link to="/prices" className="hover:text-gray-700 transition-colors">PRICES</Link>
              <Link to="/faq" className="hover:text-gray-700 transition-colors">FAQ</Link>
              <Link to="/contact" className="hover:text-gray-700 transition-colors">CONTACT</Link>
            </div>

            <div className="flex items-center gap-3">
              <Link to="/upload">
                <Button className="bg-gray-900 hover:bg-gray-800 text-white gap-2">
                  <Upload size={18} />
                  Upload Photos
                </Button>
              </Link>
              <Button variant="outline" className="border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white gap-2">
                <LogIn size={18} />
                Sign In
              </Button>
              <Button variant="outline" className="border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white gap-2">
                <ShoppingCart size={18} />
                Cart
              </Button>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;