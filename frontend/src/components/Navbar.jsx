import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Upload, User, Phone } from 'lucide-react';
import { Button } from './ui/button';

const Navbar = () => {
  return (
    <>
      <div className="bg-gray-900 text-white py-3 px-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center text-sm">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Phone size={16} />
              <span>066/21-66-21</span>
            </div>
            <span className="text-gray-400">Mon - Fri: 09:00 - 18:00</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-400">Free shipping on orders over $50</span>
          </div>
        </div>
      </div>
      
      <nav className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="text-3xl font-bold text-gray-900 tracking-tight">
                PHOTOLIA
              </div>
            </Link>

            <div className="hidden md:flex items-center gap-8 text-gray-700 font-medium text-sm uppercase tracking-wide">
              <Link to="/" className="hover:text-blue-600 transition-colors">Home</Link>
              <Link to="/services" className="hover:text-blue-600 transition-colors">Services</Link>
              <Link to="/gallery" className="hover:text-blue-600 transition-colors">Gallery</Link>
              <Link to="/about" className="hover:text-blue-600 transition-colors">About</Link>
              <Link to="/contact" className="hover:text-blue-600 transition-colors">Contact</Link>
            </div>

            <div className="flex items-center gap-2">
              <Link to="/upload">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2 font-medium">
                  <Upload size={18} />
                  Upload Photos
                </Button>
              </Link>
              <Button variant="ghost" size="icon" className="text-gray-700 hover:text-blue-600">
                <User size={20} />
              </Button>
              <Button variant="ghost" size="icon" className="text-gray-700 hover:text-blue-600">
                <ShoppingCart size={20} />
              </Button>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;