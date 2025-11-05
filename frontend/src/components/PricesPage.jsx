import React from 'react';
import { Check } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Link } from 'react-router-dom';

const PricesPage = () => {
  const prices = [
    {
      format: '10x15 cm',
      price: '25',
      description: 'Standardni format, idealan za albume',
      features: ['Premium foto papir', 'Sjajni ili mat završetak', 'Brza izrada', 'Trajnost 100+ godina']
    },
    {
      format: '13x18 cm',
      price: '40',
      description: 'Popularni format za okvire',
      features: ['Premium foto papir', 'Sjajni ili mat završetak', 'Brza izrada', 'Trajnost 100+ godina'],
      popular: true
    },
    {
      format: '15x21 cm',
      price: '60',
      description: 'A5 format za zidne slike',
      features: ['Premium foto papir', 'Sjajni ili mat završetak', 'Brza izrada', 'Trajnost 100+ godina']
    },
    {
      format: '20x30 cm',
      price: '120',
      description: 'Veliki format za posebne fotografije',
      features: ['Premium foto papir', 'Sjajni ili mat završetak', 'Brza izrada', 'Trajnost 100+ godina'],
      popular: true
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Cenovnik</h1>
          <p className="text-xl text-gray-600">Transparentne cene bez skrivenih troškova</p>
        </div>

        {/* Prices Grid */}
        <div className="grid md:grid-cols-4 gap-8 mb-16">
          {prices.map((price, index) => (
            <Card key={index} className={`p-8 text-center hover:shadow-xl transition-all relative ${
              price.popular ? 'border-2 border-blue-600 shadow-lg scale-105' : 'border-2 border-gray-200'
            }`}>
              {price.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-bold uppercase">
                    Popularno
                  </span>
                </div>
              )}
              <div className="text-3xl font-bold text-blue-600 mb-2">{price.format}</div>
              <div className="text-gray-600 mb-6">{price.description}</div>
              <div className="mb-6">
                <span className="text-5xl font-bold text-gray-900">{price.price}</span>
                <span className="text-gray-600 ml-2">RSD</span>
                <div className="text-sm text-gray-500 mt-1">po fotografiji</div>
              </div>
              <ul className="space-y-3 mb-8 text-left">
                {price.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-gray-700">
                    <Check size={18} className="text-green-600 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>

        {/* Delivery Info */}
        <Card className="p-10 bg-white border-2 border-gray-200 mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Dostava</h2>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">300 RSD</div>
              <div className="text-gray-600">Standardna dostava</div>
              <div className="text-sm text-gray-500 mt-2">3-5 radnih dana</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-600 mb-2">BESPLATNO</div>
              <div className="text-gray-600">Za porudžbine preko</div>
              <div className="text-sm text-gray-500 mt-2">5000 RSD</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-purple-600 mb-2">500 RSD</div>
              <div className="text-gray-600">Brza dostava</div>
              <div className="text-sm text-gray-500 mt-2">1-2 radna dana</div>
            </div>
          </div>
        </Card>

        {/* Payment Methods */}
        <Card className="p-10 bg-white border-2 border-gray-200 mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Način Plaćanja</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900 mb-2">Plaćanje Pouzećem</div>
              <p className="text-gray-600">Plaćate kuriru prilikom preuzimanja paketa</p>
            </div>
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900 mb-2">Unapred (Uskoro)</div>
              <p className="text-gray-600">Platite karticom pre slanja</p>
            </div>
          </div>
        </Card>

        {/* Additional Info */}
        <Card className="p-10 bg-blue-50 border-2 border-blue-200">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Popusti za Veće Porudžbine</h2>
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">10%</div>
              <div className="text-gray-700">50+ fotografija</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">15%</div>
              <div className="text-gray-700">100+ fotografija</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">20%</div>
              <div className="text-gray-700">200+ fotografija</div>
            </div>
          </div>
        </Card>

        {/* CTA */}
        <div className="text-center mt-16">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">Spremni za Poručivanje?</h3>
          <p className="text-xl text-gray-600 mb-8">Pošaljite nam vaše fotografije već danas</p>
          <Link to="/upload">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg">
              Pošalji Fotografije
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PricesPage;