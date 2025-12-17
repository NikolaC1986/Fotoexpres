import React, { useState, useEffect } from 'react';
import { Package, ShoppingCart } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Label } from '../ui/label';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CompactProductSelector = ({ onAddProduct }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API}/products`);
      if (response.data.success) {
        // Filter only ACTIVE products with at least one ACTIVE variant
        const activeProducts = response.data.products
          .filter(product => product.available !== false)
          .map(product => ({
            ...product,
            variants: product.variants.filter(v => v.available !== false)
          }))
          .filter(product => product.variants.length > 0);
        
        setProducts(activeProducts);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = (product, variant) => {
    const newProduct = {
      productId: product.id,
      productName: product.name,
      productType: product.type,
      variantId: variant.id,
      variantName: variant.name,
      quantity: 1,
      price: variant.price,
      customText: '',
      dedicatedPhotoCount: 0,
      productPhotos: [],
      requiresPhotos: product.requiresPhotoUpload || false,
      allowCustomText: product.allowCustomText || false
    };
    
    onAddProduct(newProduct);
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <Package className="w-8 h-8 text-teal-600 mx-auto mb-2 animate-pulse" />
        <p className="text-sm text-gray-600">Učitavanje proizvoda...</p>
      </div>
    );
  }

  return (
    <Card className="p-4 sm:p-6 bg-gradient-to-br from-teal-50 to-cyan-50 border-2 border-teal-300">
      <div className="mb-4">
        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <ShoppingCart size={20} className="sm:w-6 sm:h-6 text-teal-600" />
          Dostupni Proizvodi
        </h3>
        <p className="text-xs sm:text-sm text-gray-600">
          Možete poručiti proizvode i bez štampe fotografija
        </p>
      </div>

      {products.length === 0 ? (
        <p className="text-center text-gray-500 py-4 text-sm">Trenutno nema dostupnih proizvoda</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {products.map((product) => (
            <Card key={product.id} className="p-3 sm:p-4 bg-white hover:shadow-lg transition-shadow border border-teal-200">
              <h4 className="font-bold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base leading-tight">{product.name}</h4>
              <div className="space-y-1.5 sm:space-y-2">
                {product.variants.map((variant) => (
                  <Button
                    key={variant.id}
                    onClick={() => handleAddProduct(product, variant)}
                    size="sm"
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm justify-between py-2 px-2 sm:px-3"
                  >
                    <span className="truncate text-left flex-1 mr-2">{variant.name}</span>
                    <span className="font-bold whitespace-nowrap">{variant.price} RSD</span>
                  </Button>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </Card>
  );
};

export default CompactProductSelector;
