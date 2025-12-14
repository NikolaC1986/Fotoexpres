import React from 'react';
import { Upload } from 'lucide-react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const ProductImageUploader = ({ 
  imageUrl, 
  previewUrl,
  onUrlChange,
  onFileChange,
  showPendingIndicator = false,
  mode = 'add' // 'add' or 'edit'
}) => {
  const getImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return url;
    }
    // Add /api prefix for backend routes
    if (url.startsWith('/uploads/')) {
      return `${BACKEND_URL}/api${url}`;
    }
    return `${BACKEND_URL}${url}`;
  };

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (file && onFileChange) {
      onFileChange(file);
    }
  };

  return (
    <div>
      <Label className="text-sm font-bold mb-2 block">
        Fotografija Proizvoda {mode === 'add' && '* (Upload ili URL)'}
      </Label>
      
      {/* Preview Image */}
      {previewUrl && (
        <div className="mb-3">
          <img 
            src={previewUrl.startsWith('data:') ? previewUrl : getImageUrl(previewUrl)} 
            alt="Preview"
            className="w-48 h-48 object-contain rounded border-2 bg-gray-100"
          />
          {showPendingIndicator && (
            <p className="text-xs text-orange-600 mt-2 font-semibold">
              ⚠️ Nova fotografija izabrana - klikni "Sačuvaj" da uploduješ
            </p>
          )}
        </div>
      )}

      {/* File Upload Button */}
      <div className="mb-3">
        <input
          type="file"
          id={`productImageUpload-${mode}`}
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
        />
        <Button
          type="button"
          onClick={() => document.getElementById(`productImageUpload-${mode}`).click()}
          variant="outline"
          className="w-full border-2 gap-2"
        >
          <Upload size={18} />
          {previewUrl ? 'Promeni Fotografiju' : 'Upload Fotografiju'}
        </Button>
        {mode === 'edit' && (
          <p className="text-xs text-gray-500 mt-1">
            Izaberi fajl - preview će se prikazati odmah
          </p>
        )}
      </div>

      {/* OR separator */}
      <div className="flex items-center gap-2 my-3">
        <div className="flex-1 border-t border-gray-300"></div>
        <span className="text-xs text-gray-500">ILI</span>
        <div className="flex-1 border-t border-gray-300"></div>
      </div>

      {/* URL Input */}
      <div>
        <Label htmlFor={`imageUrl-${mode}`} className="text-sm mb-2 block">
          URL Fotografije
        </Label>
        <Input
          id={`imageUrl-${mode}`}
          value={imageUrl || ''}
          onChange={(e) => onUrlChange && onUrlChange(e.target.value)}
          placeholder="https://images.unsplash.com/..."
          className="w-full"
        />
        <p className="text-xs text-gray-500 mt-1">
          Unesi URL fotografije ili uploadu fajl iznad
        </p>
      </div>
    </div>
  );
};

export default ProductImageUploader;
