import React from 'react';
import { Edit, Trash2, Power, PowerOff } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Label } from '../ui/label';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const ProductCard = ({ 
  product, 
  onEdit, 
  onDelete, 
  onToggleAvailability 
}) => {
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
    <Card className={`p-6 ${!product.available ? 'opacity-60 border-red-300' : 'border-2'}`}>
      {/* Product Image */}
      <div className="mb-4">
        <img 
          src={getImageUrl(product.imageUrl)} 
          alt={product.name}
          className="w-full h-48 object-contain rounded bg-gray-100 border-2"
        />
      </div>

      {/* Product Info */}
      <div className="mb-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-bold text-gray-900">{product.name}</h3>
          {!product.available && (
            <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
              Neaktivan
            </span>
          )}
        </div>
        <p className="text-sm text-gray-600">{product.description}</p>
      </div>

      {/* Variants */}
      <div className="space-y-2 mb-4">
        <Label className="text-sm font-bold">Varijante:</Label>
        {product.variants.map((variant) => (
          <div key={variant.id} className="flex items-center gap-2 bg-gray-50 p-2 rounded">
            <div className="flex-1">
              <p className="text-sm font-semibold">{variant.name}</p>
              <p className="text-xs text-gray-600">{variant.price} RSD</p>
            </div>
            {!variant.available && (
              <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                Neaktivno
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() => onEdit(product)}
          className="flex-1 bg-blue-500 hover:bg-blue-600"
        >
          <Edit size={16} className="mr-2" />
          Izmeni
        </Button>
        <Button
          size="sm"
          onClick={() => onToggleAvailability(product.id, product.available)}
          className={product.available ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}
        >
          {product.available ? <PowerOff size={16} /> : <Power size={16} />}
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => onDelete(product.id)}
        >
          <Trash2 size={16} />
        </Button>
      </div>
    </Card>
  );
};

export default ProductCard;
