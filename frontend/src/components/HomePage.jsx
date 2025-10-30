import React from 'react';
import { Link } from 'react-router-dom';
import { Upload, Mail, FileText, Printer, Truck } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';

const HomePage = () => {
  const steps = [
    {
      icon: <Mail className="w-12 h-12" />,
      title: "STEP 1",
      description: "Select photos from your computer, mobile or tablet and upload them via email."
    },
    {
      icon: <FileText className="w-12 h-12" />,
      title: "STEP 2",
      description: "Enter your details for delivery and choose how we should send photos. You can arrange the track list."
    },
    {
      icon: <Printer className="w-12 h-12" />,
      title: "STEP 3",
      description: "We will print your photos in top quality using high-quality photo paper and send them to your home address."
    },
    {
      icon: <Truck className="w-12 h-12" />,
      title: "STEP 4",
      description: "Photo payment is reliable, the courier will bring your order upon delivery."
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#FFB8BA] to-[#FFC8CA] py-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="camera-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                <circle cx="50" cy="50" r="30" fill="none" stroke="white" strokeWidth="2"/>
                <circle cx="50" cy="50" r="15" fill="white"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#camera-pattern)"/>
          </svg>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
                ONLINE PHOTO
                <br />
                <span className="text-white">PRINTING</span>
              </h1>
              <p className="text-gray-800 text-lg leading-relaxed">
                Your best photos and memories are not safe on your phone, CD, hard drive or hard disks because all these media are prone to damage. Old memories, photos, everything, all can last many years without you having to worry.
              </p>
              <p className="text-gray-800 text-lg leading-relaxed">
                Preserve your best memories as a photo and keep it in the album that you can browse for many years through life. Our goal is to make both happy and forget about the problem and forever enjoy using your memories.
              </p>
              <Link to="/upload">
                <Button size="lg" className="bg-gray-900 hover:bg-gray-800 text-white gap-2 text-lg px-8 py-6 transform hover:scale-105 transition-all shadow-lg">
                  <Upload size={20} />
                  Send Us Photos to Print
                </Button>
              </Link>
            </div>
            <div className="relative">
              <div className="bg-white p-8 rounded-2xl shadow-2xl transform hover:scale-105 transition-transform">
                <img 
                  src="https://images.unsplash.com/photo-1452421822248-d4c2b47f0c81?w=600&h=600&fit=crop" 
                  alt="Photo printing" 
                  className="rounded-lg w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Video Section */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Video tutorial for <span className="text-[#FF6B6B]">photo printing</span>
          </h2>
          <p className="text-gray-600 mb-8 max-w-3xl mx-auto">
            If you need help with sending photos, watch our video that explains how to send us photos through our website. To see everything in detail, enlarge the video via the entire screen.
          </p>
          <div className="aspect-video bg-gradient-to-br from-[#FFB8BA] to-[#FFC8CA] rounded-2xl shadow-xl flex items-center justify-center">
            <div className="text-white text-center">
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-6 inline-block mb-4">
                <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
              <p className="text-2xl font-semibold">Video Tutorial</p>
            </div>
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <Card key={index} className="bg-gray-800 border-none p-6 text-center hover:bg-gray-750 transition-all transform hover:scale-105">
                <div className="text-[#FFB8BA] mb-4 flex justify-center">
                  {step.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 text-[#FFB8BA]">{step.title}</h3>
                <p className="text-gray-300 text-sm leading-relaxed">{step.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <div className="absolute -left-4 top-0 w-full h-full bg-[#FF6B6B] rounded-2xl"></div>
              <img 
                src="https://images.unsplash.com/photo-1606857521015-7f9fcf423740?w=600&h=400&fit=crop" 
                alt="Photo prints" 
                className="rounded-2xl shadow-2xl relative z-10 transform hover:scale-105 transition-transform"
              />
            </div>
            <div className="space-y-6">
              <h2 className="text-4xl font-bold">
                About <span className="border-b-4 border-[#FF6B6B]">us</span>
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Photo Print DOO is an online photo printing service where you can make your best memories in one place, on excellent quality paper and at promotional prices without leaving your warm home.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Our services are designed for those of you who are important today because everyone is happening only once in life. Our goal is to help you in a few clicks to forget about the problem and forever enjoy using your memories.
              </p>
              <p className="text-gray-700 leading-relaxed">
                You will never have to think about whether your precious images are in oblivion if you accidentally get to the computer or phone you keep them on. Create and note the memories and everything else leave us.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-gray-400">© 2025 Izrada Fotografija. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;