import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ProductsPage = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Helper function to construct full image URL
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return '';
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    return `${BACKEND_URL}${imageUrl}`;
  };

  useEffect(() => {
    document.title = 'Proizvodi | Fotoexpres';
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API}/products`);
      if (response.data.success) {
        setProducts(response.data.products);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-orange-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Učitavanje proizvoda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Personalizovani Proizvodi
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Kreirajte jedinstvene uspomene sa našim proizvodima. Uploadujte vaše fotografije, 
            a mi ćemo kreirati dizajn i poslati vam ga na odobrenje pre štampe.
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {products.map((product) => (
            <Card key={product.id} className="overflow-hidden hover:shadow-2xl transition-all duration-300 border-2 border-gray-200">
              {/* Product Image */}
              <div className="h-64 bg-gray-100 overflow-hidden flex items-center justify-center">
                <img 
                  src={getImageUrl(product.imageUrl)} 
                  alt={product.name}
                  className="w-full h-full object-contain hover:scale-110 transition-transform duration-300 p-4"
                />
              </div>

              {/* Product Info */}
              <div className="p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{product.name}</h3>
                <p className="text-gray-600 mb-4 line-clamp-3">{product.description}</p>

                {/* Variants Info - Show only active variants */}
                {(() => {
                  const activeVariants = product.variants.filter(v => v.available !== false);
                  return (
                    <div className="mb-4">
                      <p className="text-sm text-gray-500 mb-2">
                        {activeVariants.length} {activeVariants.length === 1 ? 'opcija' : 'opcije'}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {activeVariants.slice(0, 2).map((variant) => (
                          <span key={variant.id} className="text-xs bg-gray-100 px-3 py-1 rounded-full text-gray-700">
                            {variant.name}
                          </span>
                        ))}
                        {activeVariants.length > 2 && (
                          <span className="text-xs bg-gray-100 px-3 py-1 rounded-full text-gray-700">
                            +{activeVariants.length - 2} još
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Price Range - Only from active variants */}
                {(() => {
                  const activeVariants = product.variants.filter(v => v.available !== false);
                  const minPrice = activeVariants.length > 0 
                    ? Math.min(...activeVariants.map(v => v.price))
                    : 0;
                  return (
                    <div className="mb-6">
                      <p className="text-sm text-gray-500">Od</p>
                      <p className="text-3xl font-bold text-orange-600">
                        {minPrice} RSD
                      </p>
                    </div>
                  );
                })()}

                {/* CTA Button */}
                {product.isExternalProduct ? (
                  <a 
                    href={product.externalLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white gap-2">
                      Posetite Sajt
                      <ArrowRight size={18} />
                    </Button>
                  </a>
                ) : (
                  <Button 
                    onClick={() => navigate(`/upload?product=${product.id}`)}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white gap-2"
                  >
                    Naruči sada
                    <ArrowRight size={18} />
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>

        {/* Info Section */}
        <Card className="p-8 bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Kako funkcioniše naručivanje?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <div className="bg-orange-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold mb-3">
                1
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Izaberite proizvod</h3>
              <p className="text-gray-600 text-sm">
                Odaberite proizvod koji želite i uploadujte vaše fotografije
              </p>
            </div>
            <div>
              <div className="bg-orange-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold mb-3">
                2
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Naš tim kreira dizajn</h3>
              <p className="text-gray-600 text-sm">
                Profesionalno kreiramo dizajn i šaljemo vam na odobrenje
              </p>
            </div>
            <div>
              <div className="bg-orange-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold mb-3">
                3
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Štampamo i dostavljamo</h3>
              <p className="text-gray-600 text-sm">
                Nakon vašeg odobrenja, štampamo i dostavljamo proizvod
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ProductsPage;
