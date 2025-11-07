import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Upload, Camera, Award, Clock, Shield, ArrowRight, Star } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const HomePage = () => {
  const [contactInfo, setContactInfo] = useState({
    phone: '+381 65 46 000 46',
    email: 'kontakt@fotoexpres.rs'
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API}/settings`);
      if (response.data.settings) {
        setContactInfo({
          phone: response.data.settings.contactPhone || '+381 65 46 000 46',
          email: response.data.settings.contactEmail || 'kontakt@fotoexpres.rs'
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };
  const services = [
    {
      icon: <Camera className="w-8 h-8" />,
      title: "Profesionalna Štampa",
      description: "Visokokvalitetna štampa fotografija na premium papiru sa živim bojama i izuzetnim detaljima."
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: "Brza Dostava",
      description: "Brzo vreme obrade sa pouzdanom dostavom direktno na vašu adresu."
    },
    {
      icon: <Award className="w-8 h-8" />,
      title: "Premium Kvalitet",
      description: "Koristimo samo najkvalitetniji foto papir i najsavremeniju tehnologiju štampe."
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Sigurno i Bezbedno",
      description: "Vaše fotografije se paželjivo obrađuju i svi podaci su bezbedno šifrovani."
    }
  ];

  const formats = [
    { size: "9x13 cm", popular: false },
    { size: "10x15 cm", popular: true },
    { size: "13x18 cm", popular: false },
    { size: "15x21 cm", popular: false },
    { size: "20x30 cm", popular: false },
    { size: "30x45 cm", popular: true }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-orange-50 to-orange-100 py-12 md:py-24">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex flex-col md:grid md:grid-cols-2 gap-8 md:gap-16 items-center">
            <div className="space-y-4 md:space-y-8 text-center md:text-left">
              <div className="inline-block">
                <span className="bg-orange-100 text-orange-700 px-3 md:px-4 py-1 md:py-2 rounded-full text-xs md:text-sm font-semibold uppercase tracking-wide">
                  Profesionalna Štampa Fotografija
                </span>
              </div>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight">
                Odštampajte
                <br />
                <span className="text-orange-600">Uspomene</span>
              </h1>
              <p className="text-base md:text-xl text-gray-600 leading-relaxed">
                Pretvorite vaše digitalne fotografije u prelepe štampane slike. Profesionalan kvalitet, premium papir, dostava na vašu adresu.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                <Link to="/upload" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white gap-2 text-base md:text-lg px-6 md:px-8 py-4 md:py-6 shadow-lg">
                    <Upload size={20} className="md:w-[22px] md:h-[22px]" />
                    Počni Štampu
                  </Button>
                </Link>
                <Link to="/prices" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto border-2 border-gray-300 hover:border-orange-600 hover:text-orange-600 text-base md:text-lg px-6 md:px-8 py-4 md:py-6">
                    Pogledaj Cenovnik
                  </Button>
                </Link>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-8 pt-4">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 border-2 border-white"></div>
                    ))}
                  </div>
                  <div className="text-xs md:text-sm">
                    <div className="font-semibold text-gray-900">10,000+</div>
                    <div className="text-gray-500">Zadovoljnih Kupaca</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-yellow-400">
                  {[1, 2, 3, 4, 5].map(i => <Star key={i} size={16} className="md:w-[20px] md:h-[20px]" fill="currentColor" />)}
                  <span className="ml-2 text-gray-900 font-semibold text-sm md:text-base">5.0</span>
                </div>
              </div>
            </div>
            <div className="relative w-full">
              <div className="relative z-10">
                <img 
                  src="https://customer-assets.emergentagent.com/job_swift-image-portal/artifacts/1ogmpeji_8%20copy.jpg" 
                  alt="Štampane fotografije" 
                  className="rounded-xl md:rounded-2xl shadow-2xl w-full h-auto"
                />
              </div>
              <div className="absolute -bottom-4 -right-4 md:-bottom-6 md:-right-6 w-48 h-48 md:w-64 md:h-64 bg-orange-200 rounded-xl md:rounded-2xl -z-10"></div>
              <div className="absolute -top-4 -left-4 md:-top-6 md:-left-6 w-32 h-32 md:w-48 md:h-48 bg-yellow-200 rounded-xl md:rounded-2xl -z-10"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-12 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-8 md:mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-2 md:mb-4">Zašto izabrati nas</h2>
            <p className="text-base md:text-xl text-gray-600 max-w-2xl mx-auto">
              Iskusite razliku sa našim profesionalnim uslugama štampe fotografija
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {services.map((service, index) => (
              <Card key={index} className="p-6 md:p-8 text-center hover:shadow-xl transition-all border-2 border-transparent hover:border-orange-200 group">
                <div className="bg-orange-50 w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6 text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-all">
                  {React.cloneElement(service.icon, { className: 'w-6 h-6 md:w-8 md:h-8' })}
                </div>
                <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3 text-gray-900">{service.title}</h3>
                <p className="text-sm md:text-base text-gray-600 leading-relaxed">{service.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Available Formats */}
      <section className="py-12 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-8 md:mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-2 md:mb-4">Dostupni Formati</h2>
            <p className="text-base md:text-xl text-gray-600">Izaberite iz našeg asortimana profesionalnih veličina</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 md:gap-4">
            {formats.map((format, index) => (
              <Link to="/upload" key={index}>
                <Card className="p-4 md:p-6 text-center hover:shadow-xl transition-all relative overflow-hidden group border-2 border-transparent hover:border-orange-600 cursor-pointer">
                  {format.popular && (
                    <div className="absolute top-1 right-1 md:top-2 md:right-2 bg-yellow-400 text-gray-900 px-1.5 py-0.5 md:px-2 md:py-1 rounded-full text-xs font-bold uppercase">
                      Top
                    </div>
                  )}
                  <div className="text-2xl md:text-3xl font-bold text-orange-600 mb-1 md:mb-2">{format.size}</div>
                  <div className="text-xs md:text-sm text-gray-600 mb-1 md:mb-2">Standardna Veličina</div>
                  <div className="text-xs text-gray-500">Sjajni ili Mat završetak</div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-8 md:mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-2 md:mb-4">Kako funkcioniše</h2>
            <p className="text-base md:text-xl text-gray-600">Jednostavni koraci do štampanih fotografija</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {['Pošaljite fotografije', 'Izaberite format', 'Unesite podatke', 'Dobijete fotografije'].map((step, index) => (
              <div key={index} className="text-center relative">
                <div className="bg-orange-600 text-white w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 text-xl md:text-2xl font-bold shadow-lg">
                  {index + 1}
                </div>
                <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3 text-gray-900">{step}</h3>
                <p className="text-sm md:text-base text-gray-600">Jednostavan proces koji vam omogućava da brzo dobijete vaše fotografije.</p>
                {index < 3 && (
                  <ArrowRight className="hidden md:block absolute top-8 -right-4 text-gray-300" size={24} />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-24 bg-orange-600 text-white">
        <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 md:mb-6">Spremni da Odštampate Vaše Fotografije?</h2>
          <p className="text-base md:text-xl mb-6 md:mb-8 opacity-90">
            Pošaljite vaše fotografije sada i primite prelepe otiske dostavljene na vašu adresu
          </p>
          <Link to="/upload">
            <Button size="lg" className="w-full sm:w-auto bg-white text-orange-600 hover:bg-gray-100 gap-2 text-base md:text-lg px-6 md:px-8 py-4 md:py-6 shadow-xl">
              <Upload size={20} className="md:w-[22px] md:h-[22px]" />
              Započni Odmah
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-6 md:mb-8">
            <div>
              <img 
                src="https://customer-assets.emergentagent.com/job_swift-image-portal/artifacts/i8bseb70_Logo_Fotoexpres.png" 
                alt="Fotoexpres Logo" 
                className="h-8 md:h-10 w-auto mb-3 md:mb-4"
              />
              <p className="text-sm md:text-base text-gray-400">Profesionalne usluge štampe fotografija sa premium kvalitetom i brzom dostavom.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-3 md:mb-4 text-sm md:text-base">Brzi Linkovi</h4>
              <ul className="space-y-2 text-sm md:text-base text-gray-400">
                <li><Link to="/" className="hover:text-white">Početna</Link></li>
                <li><Link to="/prices" className="hover:text-white">Cenovnik</Link></li>
                <li><Link to="/upload" className="hover:text-white">Pošalji Fotografije</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 md:mb-4 text-sm md:text-base">Podrška</h4>
              <ul className="space-y-2 text-sm md:text-base text-gray-400">
                <li><Link to="/faq" className="hover:text-white">FAQ</Link></li>
                <li><a href="tel:+381654600046" className="hover:text-white">Kontakt</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 md:mb-4 text-sm md:text-base">Kontakt</h4>
              <ul className="space-y-2 text-sm md:text-base text-gray-400">
                <li>{contactInfo.phone}</li>
                <li>{contactInfo.email}</li>
                <li>Pon - Pet: 09:00 - 18:00</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 md:pt-8 text-center">
            <p className="text-sm md:text-base text-gray-400 mb-4">&copy; 2025 Fotoexpres. Sva prava zadržana.</p>
            {/* Admin Login Button */}
            <div className="mt-4">
              <Link to="/admin">
                <button className="text-xs text-gray-500 hover:text-gray-400 transition-colors opacity-50 hover:opacity-100">
                  Admin
                </button>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;