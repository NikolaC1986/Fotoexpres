import React from 'react';
import { Link } from 'react-router-dom';
import { Upload, Camera, Award, Clock, Shield, ArrowRight, Star } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';

const HomePage = () => {
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
      description: "Vaše fotografije se pažljivo obrađuju i svi podaci su bezbedno šifrovani."
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
                  Profesionalna Štampa Fotografija
                </span>
              </div>
              <h1 className="text-6xl md:text-7xl font-bold text-gray-900 leading-tight">
                Odštampajte
                <br />
                <span className="text-blue-600">Uspomene</span>
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Pretvorite vaše digitalne fotografije u prelepe štampane slike. Profesionalan kvalitet, premium papir, dostava na vašu adresu.
              </p>
              <div className="flex gap-4">
                <Link to="/upload">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white gap-2 text-lg px-8 py-6 shadow-lg">
                    <Upload size={22} />
                    Počni Štampu
                  </Button>
                </Link>
                <Link to="/prices">
                  <Button size="lg" variant="outline" className="border-2 border-gray-300 hover:border-blue-600 hover:text-blue-600 text-lg px-8 py-6">
                    Pogledaj Cenovnik
                  </Button>
                </Link>
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
                    <div className="text-gray-500">Zadovoljnih Kupaca</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-yellow-400">
                  {[1, 2, 3, 4, 5].map(i => <Star key={i} size={20} fill="currentColor" />)}
                  <span className="ml-2 text-gray-900 font-semibold">5.0 Ocena</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="relative z-10">
                <img 
                  src="https://images.unsplash.com/photo-1606857521015-7f9fcf423740?w=700&h=700&fit=crop" 
                  alt="Štampane fotografije" 
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
            <h2 className="text-5xl font-bold text-gray-900 mb-4">Zašto Izabrati Nas</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Iskusite razliku sa našim profesionalnim uslugama štampe fotografija
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
            <h2 className="text-5xl font-bold text-gray-900 mb-4">Dostupni Formati</h2>
            <p className="text-xl text-gray-600">Izaberite iz našeg asortimana profesionalnih veličina</p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {formats.map((format, index) => (
              <Card key={index} className="p-8 text-center hover:shadow-xl transition-all relative overflow-hidden group border-2 border-transparent hover:border-blue-600">
                {format.popular && (
                  <div className="absolute top-4 right-4 bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-xs font-bold uppercase">
                    Popularno
                  </div>
                )}
                <div className="text-4xl font-bold text-blue-600 mb-2">{format.size}</div>
                <div className="text-gray-600 mb-4">Standardna Veličina</div>
                <div className="w-full h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg mb-4 group-hover:from-blue-50 group-hover:to-blue-100 transition-all"></div>
                <div className="text-sm text-gray-500">Sjajni ili Mat završetak</div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-gray-900 mb-4">Kako Funkcioniše</h2>
            <p className="text-xl text-gray-600">Jednostavni koraci do štampanih fotografija</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {['Pošaljite Fotografije', 'Izaberite Format', 'Unesite Podatke', 'Primite Fotografije'].map((step, index) => (
              <div key={index} className="text-center relative">
                <div className="bg-blue-600 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold shadow-lg">
                  {index + 1}
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">{step}</h3>
                <p className="text-gray-600">Jednostavan proces koji vam omogućava da brzo dobijete vaše fotografije.</p>
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
          <h2 className="text-5xl font-bold mb-6">Spremni da Odštampate Vaše Fotografije?</h2>
          <p className="text-xl mb-8 opacity-90">
            Pošaljite vaše fotografije sada i primite prelepe otiske dostavljene na vašu adresu
          </p>
          <Link to="/upload">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 gap-2 text-lg px-8 py-6 shadow-xl">
              <Upload size={22} />
              Započni Odmah
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
              <p className="text-gray-400">Profesionalne usluge štampe fotografija sa premium kvalitetom i brzom dostavom.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Brzi Linkovi</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/" className="hover:text-white">Početna</Link></li>
                <li><Link to="/prices" className="hover:text-white">Cenovnik</Link></li>
                <li><Link to="/upload" className="hover:text-white">Pošalji Fotografije</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Podrška</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/faq" className="hover:text-white">FAQ</Link></li>
                <li><a href="tel:066-21-66-21" className="hover:text-white">Kontakt</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Kontakt</h4>
              <ul className="space-y-2 text-gray-400">
                <li>066/21-66-21</li>
                <li>info@photolia.rs</li>
                <li>Pon - Pet: 09:00 - 18:00</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Photolia. Sva prava zadržana.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;