import React, { useState, useEffect } from 'react';
import { HelpCircle, Package, CreditCard, Truck, MapPin, Globe } from 'lucide-react';
import { Card } from './ui/card';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const FAQPage = () => {
  const [freeDeliveryLimit, setFreeDeliveryLimit] = useState(5000);
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
        setFreeDeliveryLimit(response.data.settings.freeDeliveryLimit || 5000);
        setContactInfo({
          phone: response.data.settings.contactPhone || '+381 65 46 000 46',
          email: response.data.settings.contactEmail || 'kontakt@fotoexpres.rs'
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const faqs = [
    {
      icon: <Package className="w-6 h-6" />,
      question: "Da li je moguće dodati fotografije na prethodnu porudžbinu?",
      answer: "Ne, na prethodno izvršenu porudžbinu nije moguće dodavati fotografije, ali možete napraviti dodatnu porudžbinu u toku istog ili sledećeg dana, ostavljajući iste kontakt podatke. Mi ćemo spojiti porudžbine i korigovati cenu."
    },
    {
      icon: <CreditCard className="w-6 h-6" />,
      question: "Koje su cene fotografija?",
      answer: "Cene fotografija možete pronaći na našem sajtu u odeljku 'Cenovnik' ili klikom na link ispod. Cene se kreću od 12 RSD za format 9x13 cm do 250 RSD za format 30x45 cm."
    },
    {
      icon: <MapPin className="w-6 h-6" />,
      question: "Da li se fotografije mogu lično preuzeti u radnji?",
      answer: "Nažalost, lično preuzimanje fotografija nije moguće. Moguća je samo dostava na vašu kućnu adresu."
    },
    {
      icon: <Truck className="w-6 h-6" />,
      question: "Koja je cena dostave?",
      answer: `Dostava se naplaćuje 400 dinara za porudžbine ispod ${freeDeliveryLimit} dinara. Za porudžbine veće od ${freeDeliveryLimit} dinara, dostava je besplatna.`
    },
    {
      icon: <Truck className="w-6 h-6" />,
      question: "Koji je rok dostave?",
      answer: "Rok dostave je od 2 do 7 radnih dana, ali ćete svakako biti kontaktirani pre same dostave."
    },
    {
      icon: <MapPin className="w-6 h-6" />,
      question: "Da li je moguća dostava na području Kosova i Metohije?",
      answer: "Da, vršimo dostavu na području Kosova i Metohije putem kurirske službe PostExpress, sa produženim vremenom isporuke."
    },
    {
      icon: <Globe className="w-6 h-6" />,
      question: "Da li je moguća dostava u inostranstvo?",
      answer: "Nažalost, ne vršimo dostavu u inostranstvo, već samo na teritoriji Srbije."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-5xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="bg-orange-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <HelpCircle className="w-10 h-10 text-orange-600" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Često postavljena pitanja</h1>
          <p className="text-xl text-gray-600">Pronađite odgovore na najvažnija pitanja o našim uslugama</p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-6 mb-16">
          {faqs.map((faq, index) => (
            <Card key={index} className="p-8 hover:shadow-xl transition-all border-2 border-gray-200">
              <div className="flex gap-6">
                <div className="flex-shrink-0">
                  <div className="bg-orange-100 w-12 h-12 rounded-full flex items-center justify-center text-orange-600">
                    {faq.icon}
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{faq.question}</h3>
                  <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Quick Links */}
        <Card className="p-10 bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Niste pronašli odgovor?</h2>
          <p className="text-xl text-gray-700 mb-8">
            Kontaktirajte nas telefonom ili pošaljite vašu porudžbinu
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button size="lg" className="bg-orange-600 hover:bg-orange-700 text-white px-8">
              <a href={`tel:${contactInfo.phone.replace(/\s/g, '')}`}>Pozovite nas</a>
            </Button>
            <Link to="/prices">
              <Button size="lg" variant="outline" className="border-2 border-orange-600 text-orange-600 hover:bg-orange-50 px-8">
                Pogledaj Cenovnik
              </Button>
            </Link>
            <Link to="/upload">
              <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white px-8">
                Pošalji Fotografije
              </Button>
            </Link>
          </div>
        </Card>

        {/* Contact Info */}
        <div className="mt-12 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Kontakt informacije</h3>
          <div className="text-gray-700 space-y-2">
            <p className="text-lg">
              <strong>Telefon:</strong> {contactInfo.phone}
            </p>
            <p className="text-lg">
              <strong>Radno vreme:</strong> Ponedeljak - Petak, 09:00 - 18:00
            </p>
            <p className="text-lg">
              <strong>Email:</strong> {contactInfo.email}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQPage;