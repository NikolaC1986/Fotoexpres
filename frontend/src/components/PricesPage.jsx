import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Link } from 'react-router-dom';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PricesPage = () => {
  const [priceMap, setPriceMap] = useState({
    '9x13': 12,
    '10x15': 18,
    '13x18': 25,
    '15x21': 50,
    '20x30': 150,
    '30x45': 250
  });
  const [freeDeliveryLimit, setFreeDeliveryLimit] = useState(5000);
  const [deliveryPrice, setDeliveryPrice] = useState(400);
  const [quantityDiscounts, setQuantityDiscounts] = useState({ '50': 5, '100': 10, '200': 15 });

  useEffect(() => {
    fetchPrices();
    fetchSettings();
    fetchDiscounts();
  }, []);

  const fetchPrices = async () => {
    try {
      const response = await axios.get(`${API}/prices`);
      if (response.data.prices) {
        setPriceMap(response.data.prices);
      }
    } catch (error) {
      console.error('Error fetching prices:', error);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API}/settings`);
      if (response.data.settings) {
        setFreeDeliveryLimit(response.data.settings.freeDeliveryLimit || 5000);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const fetchDiscounts = async () => {
    try {
      const response = await axios.get(`${API}/discounts`);
      if (response.data.discounts) {
        setQuantityDiscounts(response.data.discounts);
      }
    } catch (error) {
      console.error('Error fetching discounts:', error);
    }
  };

  const prices = [
    {
      format: '9x13 cm',
      price: priceMap['9x13'],
      description: 'Mali format, idealan za male albume',
      features: ['Premium foto papir', 'Sjajni ili mat završetak', 'Brza izrada', 'Trajnost 100+ godina']
    },
    {
      format: '10x15 cm',
      price: priceMap['10x15'],
      description: 'Standardni format, idealan za albume',
      features: ['Premium foto papir', 'Sjajni ili mat završetak', 'Brza izrada', 'Trajnost 100+ godina'],
      popular: true
    },
    {
      format: '13x18 cm',
      price: priceMap['13x18'],
      description: 'Popularni format za okvire',
      features: ['Premium foto papir', 'Sjajni ili mat završetak', 'Brza izrada', 'Trajnost 100+ godina'],
      popular: true
    },
    {
      format: '15x21 cm',
      price: priceMap['15x21'],
      description: 'A5 format za zidne slike',
      features: ['Premium foto papir', 'Sjajni ili mat završetak', 'Brza izrada', 'Trajnost 100+ godina']
    },
    {
      format: '20x30 cm',
      price: priceMap['20x30'],
      description: 'Veliki format za posebne fotografije',
      features: ['Premium foto papir', 'Sjajni ili mat završetak', 'Brza izrada', 'Trajnost 100+ godina']
    },
    {
      format: '30x45 cm',
      price: priceMap['30x45'],
      description: 'Extra veliki format za poster',
      features: ['Premium foto papir', 'Sjajni ili mat završetak', 'Brza izrada', 'Trajnost 100+ godina']
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
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {prices.map((price, index) => (
            <Card key={index} className={`p-8 text-center hover:shadow-xl transition-all relative ${
              price.popular ? 'border-2 border-orange-600 shadow-lg scale-105' : 'border-2 border-gray-200'
            }`}>
              {price.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-orange-600 text-white px-4 py-1 rounded-full text-sm font-bold uppercase">
                    Popularno
                  </span>
                </div>
              )}
              <div className="text-3xl font-bold text-orange-600 mb-2">{price.format}</div>
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
              <div className="text-4xl font-bold text-orange-600 mb-2">400 RSD</div>
              <div className="text-gray-600">Standardna dostava</div>
              <div className="text-sm text-gray-500 mt-2">2-7 radnih dana</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-600 mb-2">BESPLATNO</div>
              <div className="text-gray-600">Za porudžbine preko</div>
              <div className="text-sm text-gray-500 mt-2">{freeDeliveryLimit} RSD</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-purple-600 mb-2">2-7</div>
              <div className="text-gray-600">Radnih dana</div>
              <div className="text-sm text-gray-500 mt-2">Rok dostave</div>
            </div>
          </div>
        </Card>

        {/* Payment Methods */}
        <Card className="p-10 bg-white border-2 border-gray-200 mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Način plaćanja</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900 mb-2">Plaćanje pouzećem</div>
              <p className="text-gray-600">Plaćate kuriru prilikom preuzimanja paketa</p>
            </div>
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900 mb-2">Unapred (uskoro)</div>
              <p className="text-gray-600">Platite karticom pre slanja</p>
            </div>
          </div>
        </Card>

        {/* Additional Info */}
        <Card className="p-10 bg-orange-50 border-2 border-orange-200">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Popusti za veće porudžbine</h2>
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-orange-600 mb-2">{quantityDiscounts['50']}%</div>
              <div className="text-gray-700">50+ fotografija</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-600 mb-2">{quantityDiscounts['100']}%</div>
              <div className="text-gray-700">100+ fotografija</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-600 mb-2">{quantityDiscounts['200']}%</div>
              <div className="text-gray-700">200+ fotografija</div>
            </div>
          </div>
        </Card>

        {/* CTA */}
        <div className="text-center mt-16">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">Spremni za poručivanje?</h3>
          <p className="text-xl text-gray-600 mb-8">Pošaljite nam vaše fotografije već danas</p>
          <Link to="/upload">
            <Button size="lg" className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-6 text-lg">
              Pošalji Fotografije
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PricesPage;