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
        <Package className="w-8 h-8 text-purple-600 mx-auto mb-2 animate-pulse" />
        <p className="text-sm text-gray-600">Učitavanje proizvoda...</p>
      </div>
    );
  }

  return (
    <Card className="p-4 bg-white border-2 border-purple-300">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <ShoppingCart size={20} className="text-purple-600" />
        Dostupni Proizvodi
      </h3>

      {products.length === 0 ? (
        <p className="text-center text-gray-500 py-4 text-sm">Trenutno nema dostupnih proizvoda</p>
      ) : (
        <div className="space-y-4">
          {products.map((product) => (
            <div key={product.id} className="border-b pb-3 last:border-b-0">
              <h4 className="font-semibold text-gray-900 mb-2 text-sm">{product.name}</h4>
              <div className="space-y-1">
                {product.variants.map((variant) => (
                  <Button
                    key={variant.id}
                    onClick={() => handleAddProduct(product, variant)}
                    size="sm"
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs justify-between"
                  >
                    <span>{variant.name}</span>
                    <span className="font-bold">{variant.price} RSD</span>
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default CompactProductSelector;
