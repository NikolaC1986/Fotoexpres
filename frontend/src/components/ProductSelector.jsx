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
        // Filter only ACTIVE products with at least one ACTIVE variant
        const activeProducts = response.data.products
          .filter(product => product.available !== false)
          .map(product => ({
            ...product,
            variants: product.variants.filter(v => v.available !== false)
          }))
          .filter(product => product.variants.length > 0); // Only products with active variants
        
        setProducts(activeProducts);
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
      requiresPhotos: product.type === 'mug' || product.type === 'keychain' || product.type === 'calendar' || product.type === 'magnet' // Proizvodi koji zahtevaju fotografije
    };
    
    setSelectedProducts([...selectedProducts, newProduct]);
    
    // Scroll to selected products section
    setTimeout(() => {
      const selectedSection = document.querySelector('.border-purple-200');
      if (selectedSection) {
        selectedSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
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
              <Card key={index} className="p-6 border-2 border-teal-200 bg-teal-50">
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
                    <div className="text-2xl font-bold text-teal-600">
                      {productTotal} RSD
                    </div>
                  </div>
                </div>

                {/* Product Photos Upload (for mug and keychain) */}
                {product.requiresPhotos && (
                  <div className="mb-4 p-4 bg-orange-50 border-2 border-orange-300 rounded-lg">
                    <Label className="text-sm font-bold mb-2 block text-orange-900 flex items-center gap-2">
                      <Info size={16} />
                      Fotografije za ovaj proizvod * (Obavezno)
                    </Label>
                    <p className="text-xs text-gray-600 mb-3">
                      Uploadujte fotografije koje želite na ovom proizvodu (maksimalno {originalProduct?.maxPhotos || 3})
                    </p>
                    
                    {/* Upload Button */}
                    <div className="mb-3">
                      <input
                        type="file"
                        id={`productPhoto-${index}`}
                        accept="image/*"
                        multiple
                        onChange={(e) => handleProductPhotoUpload(index, e.target.files)}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        onClick={() => document.getElementById(`productPhoto-${index}`).click()}
                        variant="outline"
                        size="sm"
                        className="border-2 border-orange-400 hover:bg-orange-100"
                      >
                        <Plus size={16} className="mr-2" />
                        Dodaj Fotografije
                      </Button>
                    </div>

                    {/* Preview uploaded photos */}
                    {product.productPhotos && product.productPhotos.length > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {product.productPhotos.map((photo) => (
                          <div key={photo.id} className="relative group">
                            <img 
                              src={photo.preview} 
                              alt={photo.name}
                              className="w-full h-24 object-cover rounded border-2 border-gray-300"
                            />
                            <button
                              type="button"
                              onClick={() => removeProductPhoto(index, photo.id)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {(!product.productPhotos || product.productPhotos.length === 0) && (
                      <p className="text-xs text-red-600 font-semibold">
                        ⚠️ Morate dodati bar jednu fotografiju za ovaj proizvod!
                      </p>
                    )}
                  </div>
                )}

                {/* Custom Text (if allowed) */}
                {allowCustomText && (
                  <div className="mb-4">
                    <Label htmlFor={`customText-${index}`} className="text-sm font-semibold mb-2 block">
                      Vaš Tekst ili Napomena (Opciono)
                    </Label>
                    <Textarea 
                      id={`customText-${index}`}
                      value={product.customText}
                      onChange={(e) => updateProductText(index, e.target.value)}
                      placeholder="Npr: 'Srećan rođendan!' ili posebne napomene..."
                      rows={3}
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
          <Card className="p-4 bg-gradient-to-r from-teal-50 to-cyan-50 border-2 border-teal-300">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-gray-900">Ukupno proizvodi:</span>
              <span className="text-2xl font-bold text-teal-600">{getTotalProductsPrice()} RSD</span>
            </div>
          </Card>
        </div>
      )}

      {/* Available Products - Always Visible */}
      <Card className="p-6 border-2 border-purple-300 bg-purple-50">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Package size={24} className="text-purple-600" />
          Dostupni Proizvodi
        </h3>

        {products.length === 0 ? (
          <p className="text-center text-gray-500 py-8">Trenutno nema dostupnih proizvoda</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => {
              const getImageUrl = (imageUrl) => {
                if (!imageUrl) return '';
                if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
                  return imageUrl;
                }
                // Add /api prefix for backend routes
                if (imageUrl.startsWith('/uploads/')) {
                  return `${BACKEND_URL}/api${imageUrl}`;
                }
                return `${BACKEND_URL}${imageUrl}`;
              };

              return (
                <Card key={product.id} className="p-4 hover:shadow-xl transition-all duration-300 bg-white border-2 hover:border-purple-400">
                  <div className="h-40 bg-gray-100 rounded mb-3 overflow-hidden flex items-center justify-center">
                    <img 
                      src={getImageUrl(product.imageUrl)} 
                      alt={product.name}
                      className="w-full h-full object-contain p-2"
                    />
                  </div>
                  <h4 className="font-bold text-gray-900 mb-2 text-lg">{product.name}</h4>
                  <p className="text-xs text-gray-600 mb-4 line-clamp-2">{product.description}</p>
                  
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-gray-700 block mb-2">
                      Izaberite opciju:
                    </Label>
                    {product.variants.map((variant) => (
                      <Button
                        key={variant.id}
                        onClick={() => addProductToOrder(product, variant)}
                        size="sm"
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold py-3"
                      >
                        {variant.name} - {variant.price} RSD
                      </Button>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};

export default ProductSelector;
