import React from 'react';
import { X, Plus, Minus, Upload, Info } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';

const SelectedProductsList = ({ 
  products, 
  onRemove, 
  onUpdateQuantity, 
  onUpdateText, 
  onPhotoUpload, 
  onRemovePhoto,
  availableProducts
}) => {
  if (products.length === 0) {
    return null;
  }

  const getTotalPrice = () => {
    return products.reduce((sum, product) => sum + (product.price * product.quantity), 0);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
        🛒 Vaši Proizvodi ({products.length})
      </h3>
      
      {products.map((product, index) => {
        const originalProduct = availableProducts.find(p => p.id === product.productId);
        const productTotal = product.price * product.quantity;
        
        return (
          <Card key={index} className="p-6 border-2 border-purple-200 bg-purple-50">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h4 className="text-lg font-bold text-gray-900">{product.productName}</h4>
                <p className="text-sm text-gray-600">{product.variantName}</p>
              </div>
              <button
                onClick={() => onRemove(index)}
                className="text-red-500 hover:text-red-700 p-1"
                title="Ukloni proizvod"
              >
                <X size={24} />
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
                    onClick={() => onUpdateQuantity(index, -1)}
                    disabled={product.quantity <= 1}
                  >
                    <Minus size={16} />
                  </Button>
                  <span className="w-12 text-center font-bold">{product.quantity}</span>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="border-2"
                    onClick={() => onUpdateQuantity(index, 1)}
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

            {/* Product Photos Upload (if required) */}
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
                    onChange={(e) => onPhotoUpload(index, e.target.files)}
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
                          onClick={() => onRemovePhoto(index, photo.id)}
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
            {product.allowCustomText && (
              <div className="mb-4">
                <Label htmlFor={`customText-${index}`} className="text-sm font-semibold mb-2 block">
                  ✍️ Vaš Tekst ili Napomena (Opciono)
                </Label>
                <Textarea 
                  id={`customText-${index}`}
                  value={product.customText}
                  onChange={(e) => onUpdateText(index, e.target.value)}
                  placeholder="Npr: 'Srećan rođendan!' ili posebne napomene..."
                  rows={3}
                  className="border-2"
                />
              </div>
            )}
          </Card>
        );
      })}

      {/* Total Products Price */}
      <Card className="p-4 bg-gradient-to-r from-purple-100 to-pink-100 border-2 border-purple-300">
        <div className="flex justify-between items-center">
          <span className="text-lg font-bold text-gray-900">Ukupno proizvodi:</span>
          <span className="text-2xl font-bold text-purple-600">{getTotalPrice()} RSD</span>
        </div>
      </Card>
    </div>
  );
};

export default SelectedProductsList;
