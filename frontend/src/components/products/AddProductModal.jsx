import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { toast } from '../../hooks/use-toast';
import ProductImageUploader from './ProductImageUploader';
import ProductVariantEditor from './ProductVariantEditor';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AddProductModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    description: '',
    imageUrl: '',
    minPhotos: 1,
    maxPhotos: 1,
    allowCustomText: false,
    requiresPhotoUpload: false,
    isFeatured: false,
    isExternalProduct: false,
    externalLink: '',
    variants: [
      { name: 'Opcija 1', description: 'Opis opcije', price: 0, available: true }
    ]
  });
  
  const [uploadedFile, setUploadedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleVariantChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map((v, idx) => 
        idx === index ? { ...v, [field]: value } : v
      )
    }));
  };

  const addVariant = () => {
    const newVariant = {
      name: `Opcija ${formData.variants.length + 1}`,
      description: 'Opis opcije',
      price: 0,
      available: true
    };
    setFormData(prev => ({
      ...prev,
      variants: [...prev.variants, newVariant]
    }));
  };

  const removeVariant = (index) => {
    if (formData.variants.length <= 1) {
      toast({
        title: "Greška",
        description: "Proizvod mora imati bar jednu varijantu",
        variant: "destructive"
      });
      return;
    }
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.filter((_, idx) => idx !== index)
    }));
  };

  const handleFileChange = (file) => {
    setUploadedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUrlChange = (url) => {
    setFormData(prev => ({ ...prev, imageUrl: url }));
    setPreviewUrl(url);
    setUploadedFile(null);
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.name || !formData.type || !formData.description) {
      toast({
        title: "Greška",
        description: "Morate popuniti ime, tip i opis proizvoda",
        variant: "destructive"
      });
      return;
    }

    if (!formData.imageUrl && !uploadedFile) {
      toast({
        title: "Greška",
        description: "Morate dodati fotografiju proizvoda (URL ili upload)",
        variant: "destructive"
      });
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      let imageUrlToUse = formData.imageUrl;

      // Upload file if exists
      if (uploadedFile) {
        const formDataUpload = new FormData();
        formDataUpload.append('image', uploadedFile);

        const uploadResponse = await axios.post(
          `${API}/admin/products/upload-image`,
          formDataUpload,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );

        if (uploadResponse.data.success) {
          imageUrlToUse = uploadResponse.data.imageUrl;
        }
      }

      await axios.post(
        `${API}/admin/products`,
        {
          ...formData,
          imageUrl: imageUrlToUse
        },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      toast({
        title: "Uspešno!",
        description: "Novi proizvod je dodat",
      });
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error adding product:', error);
      const errorMessage = error.response?.data?.detail || error.message || "Nije moguće dodati proizvod";
      toast({
        title: "Greška",
        description: typeof errorMessage === 'string' ? errorMessage : "Došlo je do greške prilikom dodavanja proizvoda",
        variant: "destructive"
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="max-w-3xl w-full max-h-[90vh] overflow-y-auto p-8 bg-white">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Dodaj Novi Proizvod</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Product Name */}
          <div>
            <Label htmlFor="addProductName" className="text-sm font-bold mb-2 block">
              Naziv Proizvoda *
            </Label>
            <Input
              id="addProductName"
              value={formData.name}
              onChange={(e) => handleFormChange('name', e.target.value)}
              placeholder="Npr: Premium Album"
              className="w-full"
            />
          </div>

          {/* Product Type */}
          <div>
            <Label htmlFor="addProductType" className="text-sm font-bold mb-2 block">
              Tip Proizvoda * (lowercase, bez razmaka)
            </Label>
            <Input
              id="addProductType"
              value={formData.type}
              onChange={(e) => handleFormChange('type', e.target.value.toLowerCase().replace(/\s/g, ''))}
              placeholder="Npr: premium_album"
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">Mora biti jedinstveno. Npr: album, mug, keychain, calendar, magnet</p>
          </div>

          {/* Product Description */}
          <div>
            <Label htmlFor="addProductDescription" className="text-sm font-bold mb-2 block">
              Opis Proizvoda *
            </Label>
            <Textarea
              id="addProductDescription"
              value={formData.description}
              onChange={(e) => handleFormChange('description', e.target.value)}
              placeholder="Detaljan opis proizvoda koji će videti kupci..."
              rows={3}
              className="w-full"
            />
          </div>

          {/* Image Upload */}
          <ProductImageUploader
            imageUrl={formData.imageUrl}
            previewUrl={previewUrl}
            onUrlChange={handleUrlChange}
            onFileChange={handleFileChange}
            mode="add"
          />

          {/* Min/Max Photos */}
          <div>
            <Label className="text-sm font-bold mb-2 block">
              Da li proizvod zahteva fotografije od korisnika?
            </Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="minPhotos" className="text-xs font-semibold mb-1 block text-gray-600">
                  Min Fotografija
                </Label>
                <Input
                  id="minPhotos"
                  type="number"
                  value={formData.minPhotos}
                  onChange={(e) => handleFormChange('minPhotos', parseInt(e.target.value) || 1)}
                  className="w-full"
                />
              </div>
              <div>
                <Label htmlFor="maxPhotos" className="text-xs font-semibold mb-1 block text-gray-600">
                  Max Fotografija
                </Label>
                <Input
                  id="maxPhotos"
                  type="number"
                  value={formData.maxPhotos}
                  onChange={(e) => handleFormChange('maxPhotos', parseInt(e.target.value) || 1)}
                  className="w-full"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              💡 Postavi na 1-1 ako proizvod <strong>ne zahteva</strong> fotografije (npr. privezak bez štampe). 
              Ako zahteva fotografije (npr. šolja sa slikom), postavi min/max prema potrebi.
            </p>
          </div>

          {/* Allow Custom Text */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="allowCustomText"
              checked={formData.allowCustomText}
              onChange={(e) => handleFormChange('allowCustomText', e.target.checked)}
              className="w-4 h-4"
            />
            <Label htmlFor="allowCustomText" className="text-sm">
              Dozvoli korisnicima da dodaju custom tekst
            </Label>
          </div>

          {/* Requires Photo Upload */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="requiresPhotoUpload"
                checked={formData.requiresPhotoUpload}
                onChange={(e) => handleFormChange('requiresPhotoUpload', e.target.checked)}
                className="w-4 h-4 mt-1"
              />
              <div className="flex-1">
                <Label htmlFor="requiresPhotoUpload" className="text-sm font-bold block mb-1">
                  📸 Proizvod zahteva upload fotografije od korisnika
                </Label>
                <p className="text-xs text-gray-600">
                  Označite ovo ako korisnik mora da uploada fotografiju ZA ovaj proizvod 
                  (npr. šolja sa slikom, privezak sa fotografijom, magnet sa fotografijom).
                  <br/>
                  <strong>NE označavajte</strong> za albume gde se štampaju korisničke fotografije.
                </p>
              </div>
            </div>
          </div>

          {/* Featured Product */}
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="isFeatured"
                checked={formData.isFeatured}
                onChange={(e) => handleFormChange('isFeatured', e.target.checked)}
                className="w-4 h-4 mt-1"
              />
              <div className="flex-1">
                <Label htmlFor="isFeatured" className="text-sm font-bold block mb-1">
                  ⭐ Istakni proizvod na početnoj strani (Izdvajamo iz ponude)
                </Label>
                <p className="text-xs text-gray-600">
                  Označite ovo ako želite da ovaj proizvod bude prikazan kao <strong>"Izdvajamo iz ponude"</strong> na početnoj strani.
                  <br/>
                  <em>Napomena: Samo jedan proizvod može biti istaknut istovremeno.</em>
                </p>
              </div>
            </div>
          </div>

          {/* External Product */}
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="isExternalProduct"
                checked={formData.isExternalProduct}
                onChange={(e) => handleFormChange('isExternalProduct', e.target.checked)}
                className="w-4 h-4 mt-1"
              />
              <div className="flex-1">
                <Label htmlFor="isExternalProduct" className="text-sm font-bold block mb-1">
                  🔗 Eksterni Proizvod (vodi ka eksternom sajtu)
                </Label>
                <p className="text-xs text-gray-600">
                  Označite ovo ako proizvod vodi ka <strong>eksternom linku</strong> (drugom sajtu) umesto na upload stranicu.
                  <br/>
                  <em>Korisno za promociju drugih servisa ili sajtova.</em>
                </p>
              </div>
            </div>

            {formData.isExternalProduct && (
              <div className="mt-4">
                <Label htmlFor="externalLink" className="text-sm font-bold mb-2 block">
                  🌐 Eksterni Link (URL)
                </Label>
                <Input
                  id="externalLink"
                  type="url"
                  value={formData.externalLink}
                  onChange={(e) => handleFormChange('externalLink', e.target.value)}
                  placeholder="https://vas-drugi-sajt.com"
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-2">
                  💡 Link će se otvoriti u novom tabu kada korisnik klikne "Naruči Sada"
                </p>
              </div>
            )}
          </div>

          {/* Variants */}
          <ProductVariantEditor
            variants={formData.variants}
            onVariantChange={handleVariantChange}
            onAddVariant={addVariant}
            onRemoveVariant={removeVariant}
            mode="add"
          />

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              Otkaži
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Plus size={18} className="mr-2" />
              Dodaj Proizvod
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AddProductModal;
