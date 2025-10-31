import React from 'react';
import { Link } from 'react-router-dom';
import { Upload, Camera, Award, Clock, Shield, ArrowRight, Star } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';

const HomePage = () => {
  const services = [
    {
      icon: <Camera className="w-8 h-8" />,
      title: "Professional Printing",
      description: "High-quality photo prints on premium paper with vibrant colors and exceptional detail."
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: "Fast Delivery",
      description: "Quick turnaround time with reliable shipping directly to your doorstep."
    },
    {
      icon: <Award className="w-8 h-8" />,
      title: "Premium Quality",
      description: "We use only the finest photo paper and state-of-the-art printing technology."
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Secure & Safe",
      description: "Your photos are handled with care and all data is securely encrypted."
    }
  ];

  const formats = [
    { size: "10x15 cm", popular: true },
    { size: "13x18 cm", popular: false },
    { size: "15x21 cm", popular: false },
    { size: "20x30 cm", popular: true }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-gray-50 to-gray-100 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="inline-block">
                <span className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold uppercase tracking-wide">
                  Professional Photo Printing
                </span>
              </div>
              <h1 className="text-6xl md:text-7xl font-bold text-gray-900 leading-tight">
                Print Your
                <br />
                <span className="text-blue-600">Memories</span>
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Transform your digital photos into beautiful prints. Professional quality, premium paper, delivered to your door.
              </p>
              <div className="flex gap-4">
                <Link to="/upload">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white gap-2 text-lg px-8 py-6 shadow-lg">
                    <Upload size={22} />
                    Start Printing
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="border-2 border-gray-300 hover:border-blue-600 hover:text-blue-600 text-lg px-8 py-6">
                  View Gallery
                </Button>
              </div>
              <div className="flex items-center gap-8 pt-4">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-2 border-white"></div>
                    ))}
                  </div>
                  <div className="text-sm">
                    <div className="font-semibold text-gray-900">10,000+</div>
                    <div className="text-gray-500">Happy Customers</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-yellow-400">
                  {[1, 2, 3, 4, 5].map(i => <Star key={i} size={20} fill="currentColor" />)}
                  <span className="ml-2 text-gray-900 font-semibold">5.0 Rating</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="relative z-10">
                <img 
                  src="https://images.unsplash.com/photo-1606857521015-7f9fcf423740?w=700&h=700&fit=crop" 
                  alt="Photo prints" 
                  className="rounded-2xl shadow-2xl"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 w-64 h-64 bg-blue-200 rounded-2xl -z-10"></div>
              <div className="absolute -top-6 -left-6 w-48 h-48 bg-yellow-200 rounded-2xl -z-10"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-gray-900 mb-4">Why Choose Us</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Experience the difference with our professional photo printing services
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {services.map((service, index) => (
              <Card key={index} className="p-8 text-center hover:shadow-xl transition-all border-2 border-transparent hover:border-blue-200 group">
                <div className="bg-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                  {service.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">{service.title}</h3>
                <p className="text-gray-600 leading-relaxed">{service.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Available Formats */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-gray-900 mb-4">Available Formats</h2>
            <p className="text-xl text-gray-600">Choose from our range of professional print sizes</p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {formats.map((format, index) => (
              <Card key={index} className="p-8 text-center hover:shadow-xl transition-all relative overflow-hidden group border-2 border-transparent hover:border-blue-600">
                {format.popular && (
                  <div className="absolute top-4 right-4 bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-xs font-bold uppercase">
                    Popular
                  </div>
                )}
                <div className="text-4xl font-bold text-blue-600 mb-2">{format.size}</div>
                <div className="text-gray-600 mb-4">Standard Size</div>
                <div className="w-full h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg mb-4 group-hover:from-blue-50 group-hover:to-blue-100 transition-all"></div>
                <div className="text-sm text-gray-500">Glossy or Matte finish</div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">Simple steps to get your photos printed</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {['Upload Photos', 'Choose Format', 'Enter Details', 'Receive Prints'].map((step, index) => (
              <div key={index} className="text-center relative">
                <div className="bg-blue-600 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold shadow-lg">
                  {index + 1}
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">{step}</h3>
                <p className="text-gray-600">Lorem ipsum dolor sit amet consectetur adipiscing elit.</p>
                {index < 3 && (
                  <ArrowRight className="hidden md:block absolute top-8 -right-4 text-gray-300" size={24} />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-5xl font-bold mb-6">Ready to Print Your Photos?</h2>
          <p className="text-xl mb-8 opacity-90">
            Upload your photos now and receive beautiful prints delivered to your door
          </p>
          <Link to="/upload">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 gap-2 text-lg px-8 py-6 shadow-xl">
              <Upload size={22} />
              Get Started Now
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-2xl font-bold mb-4">PHOTOLIA</h3>
              <p className="text-gray-400">Professional photo printing services with premium quality and fast delivery.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/" className="hover:text-white">Home</Link></li>
                <li><Link to="/services" className="hover:text-white">Services</Link></li>
                <li><Link to="/gallery" className="hover:text-white">Gallery</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/faq" className="hover:text-white">FAQ</Link></li>
                <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
                <li><Link to="/terms" className="hover:text-white">Terms</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-gray-400">
                <li>066/21-66-21</li>
                <li>info@photolia.com</li>
                <li>Mon - Fri: 09:00 - 18:00</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Photolia. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;