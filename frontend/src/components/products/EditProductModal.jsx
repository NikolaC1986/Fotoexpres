import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
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

const EditProductModal = ({ isOpen, product, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    imageUrl: '',
    previewImageUrl: '',
    pendingUpload: null,
    requiresPhotoUpload: false,
    isFeatured: false,
    isExternalProduct: false,
    externalLink: '',
    variants: []
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description,
        imageUrl: product.imageUrl || '',
        previewImageUrl: product.imageUrl || '',
        pendingUpload: null,
        requiresPhotoUpload: product.requiresPhotoUpload || false,
        isFeatured: product.isFeatured || false,
        isExternalProduct: product.isExternalProduct || false,
        externalLink: product.externalLink || '',
        variants: product.variants.map(v => ({ ...v }))
      });
    }
  }, [product]);

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

  const toggleVariantAvailability = (index) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map((v, idx) => 
        idx === index ? { ...v, available: !v.available } : v
      )
    }));
  };

  const addVariant = () => {
    const newVariant = {
      id: `new_${Date.now()}`,
      name: `Nova opcija ${formData.variants.length + 1}`,
      description: 'Opis nove opcije',
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
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({
        ...prev,
        previewImageUrl: reader.result,
        pendingUpload: file
      }));
    };
    reader.readAsDataURL(file);
    
    toast({
      title: "Fotografija izabrana",
      description: "Preview je prikazan. Klikni 'Sačuvaj' da uploduješ.",
    });
  };

  const handleUrlChange = (url) => {
    setFormData(prev => ({
      ...prev,
      imageUrl: url,
      previewImageUrl: url,
      pendingUpload: null
    }));
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      let finalImageUrl = product.imageUrl;
      
      // Upload pending file if exists
      if (formData.pendingUpload) {
        toast({
          title: "Uploadovanje...",
          description: "Uploadujem fotografiju na server...",
        });
        
        const formDataUpload = new FormData();
        formDataUpload.append('image', formData.pendingUpload);
        
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
          finalImageUrl = uploadResponse.data.imageUrl;
        }
      } else if (formData.imageUrl && !formData.imageUrl.startsWith('data:')) {
        finalImageUrl = formData.imageUrl;
      }
      
      await axios.put(
        `${API}/admin/products/${product.id}`,
        {
          name: formData.name,
          description: formData.description,
          imageUrl: finalImageUrl,
          requiresPhotoUpload: formData.requiresPhotoUpload,
          isFeatured: formData.isFeatured,
          isExternalProduct: formData.isExternalProduct,
          externalLink: formData.externalLink,
          variants: formData.variants
        },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      toast({
        title: "Uspešno!",
        description: "Proizvod je ažuriran",
      });
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating product:', error);
      const errorMessage = error.response?.data?.detail || error.message || "Nije moguće ažurirati proizvod";
      toast({
        title: "Greška",
        description: typeof errorMessage === 'string' ? errorMessage : "Došlo je do greške prilikom ažuriranja",
        variant: "destructive"
      });
    }
  };

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="max-w-3xl w-full max-h-[90vh] overflow-y-auto p-8 bg-white">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Izmeni Proizvod</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Product Name */}
          <div>
            <Label htmlFor="productName" className="text-sm font-bold mb-2 block">
              Naziv Proizvoda
            </Label>
            <Input
              id="productName"
              value={formData.name}
              onChange={(e) => handleFormChange('name', e.target.value)}
              className="w-full"
            />
          </div>

          {/* Product Description */}
          <div>
            <Label htmlFor="productDescription" className="text-sm font-bold mb-2 block">
              Opis Proizvoda
            </Label>
            <Textarea
              id="productDescription"
              value={formData.description}
              onChange={(e) => handleFormChange('description', e.target.value)}
              rows={3}
              className="w-full"
            />
          </div>

          {/* Image Upload */}
          <ProductImageUploader
            imageUrl={formData.imageUrl}
            previewUrl={formData.previewImageUrl}
            onUrlChange={handleUrlChange}
            onFileChange={handleFileChange}
            showPendingIndicator={!!formData.pendingUpload}
            mode="edit"
          />

          {/* Requires Photo Upload */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="editRequiresPhotoUpload"
                checked={formData.requiresPhotoUpload}
                onChange={(e) => handleFormChange('requiresPhotoUpload', e.target.checked)}
                className="w-4 h-4 mt-1"
              />
              <div className="flex-1">
                <Label htmlFor="editRequiresPhotoUpload" className="text-sm font-bold block mb-1">
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
                id="editIsFeatured"
                checked={formData.isFeatured}
                onChange={(e) => handleFormChange('isFeatured', e.target.checked)}
                className="w-4 h-4 mt-1"
              />
              <div className="flex-1">
                <Label htmlFor="editIsFeatured" className="text-sm font-bold block mb-1">
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
                id="editIsExternalProduct"
                checked={formData.isExternalProduct}
                onChange={(e) => handleFormChange('isExternalProduct', e.target.checked)}
                className="w-4 h-4 mt-1"
              />
              <div className="flex-1">
                <Label htmlFor="editIsExternalProduct" className="text-sm font-bold block mb-1">
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
                <Label htmlFor="editExternalLink" className="text-sm font-bold mb-2 block">
                  🌐 Eksterni Link (URL)
                </Label>
                <Input
                  id="editExternalLink"
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
            onToggleAvailability={toggleVariantAvailability}
            mode="edit"
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
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Sačuvaj Izmene
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default EditProductModal;
