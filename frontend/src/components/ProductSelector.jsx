import React, { useState, useEffect } from 'react';
import { Plus, Minus, Package, X, Info } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ProductSelector = ({ onProductsChange, totalPhotosUploaded }) => {
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddProduct, setShowAddProduct] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    // Notify parent component when selected products change
    onProductsChange(selectedProducts);
  }, [selectedProducts, onProductsChange]);

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

  const addProductToOrder = (product, variant) => {
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
      productPhotos: [], // Photos specifically for this product
      requiresPhotos: product.type === 'mug' || product.type === 'keychain' // Šolja i Privezak zahtevaju fotografije
    };
    
    setSelectedProducts([...selectedProducts, newProduct]);
    setShowAddProduct(false);
  };

  const removeProduct = (index) => {
    setSelectedProducts(selectedProducts.filter((_, i) => i !== index));
  };

  const updateProductQuantity = (index, increment) => {
    const updated = [...selectedProducts];
    updated[index].quantity = Math.max(1, updated[index].quantity + increment);
    setSelectedProducts(updated);
  };

  const updateProductText = (index, text) => {
    const updated = [...selectedProducts];
    updated[index].customText = text;
    setSelectedProducts(updated);
  };

  const updateProductPhotoCount = (index, count) => {
    const updated = [...selectedProducts];
    updated[index].dedicatedPhotoCount = Math.max(0, Math.min(totalPhotosUploaded, count));
    setSelectedProducts(updated);
  };

  const handleProductPhotoUpload = (index, files) => {
    const updated = [...selectedProducts];
    const product = updated[index];
    const originalProduct = products.find(p => p.id === product.productId);
    
    // Convert FileList to Array and create photo objects
    const newPhotos = Array.from(files).map((file, fileIndex) => ({
      id: Date.now() + fileIndex,
      file: file,
      preview: URL.createObjectURL(file),
      name: file.name
    }));
    
    // Limit photos based on product type
    const maxPhotos = originalProduct?.maxPhotos || 3;
    const currentPhotos = product.productPhotos || [];
    const totalPhotos = currentPhotos.length + newPhotos.length;
    
    if (totalPhotos > maxPhotos) {
      alert(`Možete dodati maksimalno ${maxPhotos} fotografija za ovaj proizvod.`);
      return;
    }
    
    updated[index].productPhotos = [...currentPhotos, ...newPhotos];
    setSelectedProducts(updated);
  };

  const removeProductPhoto = (productIndex, photoId) => {
    const updated = [...selectedProducts];
    updated[productIndex].productPhotos = updated[productIndex].productPhotos.filter(p => p.id !== photoId);
    setSelectedProducts(updated);
  };

  const getTotalProductsPrice = () => {
    return selectedProducts.reduce((sum, product) => sum + (product.price * product.quantity), 0);
  };

  if (loading) {
    return <div className="text-center py-4"><Package className="w-8 h-8 text-orange-600 mx-auto mb-2 animate-pulse" /><p>Učitavanje proizvoda...</p></div>;
  }

  return (
    <div>
      {/* Selected Products */}
      {selectedProducts.length > 0 && (
        <div className="mb-6 space-y-4">
          {selectedProducts.map((product, index) => {
            const originalProduct = products.find(p => p.id === product.productId);
            const allowCustomText = originalProduct?.allowCustomText || false;
            const productTotal = product.price * product.quantity;
            
            return (
              <Card key={index} className="p-6 border-2 border-purple-200 bg-purple-50">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-gray-900">{product.productName}</h4>
                    <p className="text-sm text-gray-600">{product.variantName}</p>
                  </div>
                  <button
                    onClick={() => removeProduct(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  {/* Quantity */}
                  <div>
                    <Label className="text-sm font-semibold mb-2 block">Količina</Label>
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="border-2"
                        onClick={() => updateProductQuantity(index, -1)}
                        disabled={product.quantity <= 1}
                      >
                        <Minus size={16} />
                      </Button>
                      <span className="w-12 text-center font-bold">{product.quantity}</span>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="border-2"
                        onClick={() => updateProductQuantity(index, 1)}
                      >
                        <Plus size={16} />
                      </Button>
                    </div>
                  </div>

                  {/* Price */}
                  <div>
                    <Label className="text-sm font-semibold mb-2 block">Cena</Label>
                    <div className="text-2xl font-bold text-purple-600">
                      {productTotal} RSD
                    </div>
                  </div>
                </div>

                {/* Custom Text (if allowed) */}
                {allowCustomText && (
                  <div className="mb-4">
                    <Label htmlFor={`customText-${index}`} className="text-sm font-semibold mb-2 block">
                      Vaš Tekst (Opciono)
                    </Label>
                    <Textarea 
                      id={`customText-${index}`}
                      value={product.customText}
                      onChange={(e) => updateProductText(index, e.target.value)}
                      placeholder="Unesite tekst koji želite na proizvodu..."
                      rows={2}
                      className="border-2"
                    />
                  </div>
                )}

                {/* Dedicated Photo Count (for albums/mugs) */}
                {originalProduct && originalProduct.minPhotos > 1 && totalPhotosUploaded > 0 && (
                  <div className="bg-blue-50 border border-blue-200 p-3 rounded">
                    <Label className="text-sm font-semibold mb-2 block flex items-center gap-2">
                      <Info size={16} className="text-blue-600" />
                      Broj Fotografija za ovaj proizvod
                    </Label>
                    <Input 
                      type="number"
                      value={product.dedicatedPhotoCount}
                      onChange={(e) => updateProductPhotoCount(index, parseInt(e.target.value) || 0)}
                      min="0"
                      max={totalPhotosUploaded}
                      className="border-2"
                    />
                    <p className="text-xs text-gray-600 mt-2">
                      Ukupno uploadovanih fotografija: {totalPhotosUploaded}
                    </p>
                  </div>
                )}
              </Card>
            );
          })}

          {/* Total Products Price */}
          <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-gray-900">Ukupno proizvodi:</span>
              <span className="text-2xl font-bold text-purple-600">{getTotalProductsPrice()} RSD</span>
            </div>
          </Card>
        </div>
      )}

      {/* Add Product Button/Section */}
      {!showAddProduct && (
        <Button 
          onClick={() => setShowAddProduct(true)}
          variant="outline"
          className="w-full border-2 border-dashed border-purple-400 hover:bg-purple-50 gap-2"
        >
          <Plus size={18} />
          Dodaj Proizvod (Album, Šolja, Privezak)
        </Button>
      )}

      {/* Product Selection */}
      {showAddProduct && (
        <Card className="p-6 border-2 border-purple-300 bg-purple-50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-900">Izaberite Proizvod</h3>
            <button onClick={() => setShowAddProduct(false)}>
              <X size={20} className="text-gray-500 hover:text-gray-700" />
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {products.map((product) => (
              <Card key={product.id} className="p-4 hover:shadow-lg transition-shadow bg-white">
                <div className="h-32 bg-gray-200 rounded mb-3 overflow-hidden">
                  <img 
                    src={product.imageUrl} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h4 className="font-bold text-gray-900 mb-2">{product.name}</h4>
                <p className="text-xs text-gray-600 mb-3 line-clamp-2">{product.description}</p>
                
                <div className="space-y-2">
                  {product.variants.map((variant) => (
                    <Button
                      key={variant.id}
                      onClick={() => addProductToOrder(product, variant)}
                      size="sm"
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs"
                    >
                      {variant.name} - {variant.price} RSD
                    </Button>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default ProductSelector;
