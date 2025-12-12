import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Plus, Edit, Trash2, Power, PowerOff, Upload, X, ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { toast } from '../hooks/use-toast';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminProducts = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    variants: []
  });
  const [addFormData, setAddFormData] = useState({
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
  const [uploadedImageFile, setUploadedImageFile] = useState(null);
  const [uploadedImagePreview, setUploadedImagePreview] = useState('');

  useEffect(() => {
    document.title = 'Proizvodi | Admin Panel';
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API}/admin/products`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.data.success) {
        setProducts(response.data.products);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Greška",
        description: "Nije moguće učitati proizvode",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleProductAvailability = async (productId, currentStatus) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(
        `${API}/admin/products/${productId}`,
        { available: !currentStatus },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      toast({
        title: "Uspešno!",
        description: `Proizvod je ${!currentStatus ? 'aktiviran' : 'deaktiviran'}`,
      });
      
      fetchProducts();
    } catch (error) {
      toast({
        title: "Greška",
        description: "Nije moguće promeniti status proizvoda",
        variant: "destructive"
      });
    }
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setEditFormData({
      name: product.name,
      description: product.description,
      requiresPhotoUpload: product.requiresPhotoUpload || false,
      isFeatured: product.isFeatured || false,
      isExternalProduct: product.isExternalProduct || false,
      externalLink: product.externalLink || '',
      variants: product.variants.map(v => ({ ...v })) // Deep copy
    });
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingProduct(null);
    setEditFormData({ name: '', description: '', requiresPhotoUpload: false, isFeatured: false, isExternalProduct: false, externalLink: '', variants: [] });
  };

  const handleEditFormChange = (field, value) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleVariantChange = (variantIndex, field, value) => {
    setEditFormData(prev => ({
      ...prev,
      variants: prev.variants.map((v, idx) => 
        idx === variantIndex ? { ...v, [field]: value } : v
      )
    }));
  };

  const toggleVariantAvailability = (variantIndex) => {
    setEditFormData(prev => ({
      ...prev,
      variants: prev.variants.map((v, idx) => 
        idx === variantIndex ? { ...v, available: !v.available } : v
      )
    }));
  };

  const addNewVariant = () => {
    const newVariant = {
      id: `new_${Date.now()}`,
      name: `Nova opcija ${editFormData.variants.length + 1}`,
      description: 'Opis nove opcije',
      price: 0,
      available: true
    };
    
    setEditFormData(prev => ({
      ...prev,
      variants: [...prev.variants, newVariant]
    }));
  };

  const removeVariant = (variantIndex) => {
    if (editFormData.variants.length <= 1) {
      toast({
        title: "Greška",
        description: "Proizvod mora imati bar jednu varijantu",
        variant: "destructive"
      });
      return;
    }

    setEditFormData(prev => ({
      ...prev,
      variants: prev.variants.filter((_, idx) => idx !== variantIndex)
    }));
  };

  const saveProductEdits = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(
        `${API}/admin/products/${editingProduct.id}`,
        {
          name: editFormData.name,
          description: editFormData.description,
          requiresPhotoUpload: editFormData.requiresPhotoUpload,
          isFeatured: editFormData.isFeatured,
          isExternalProduct: editFormData.isExternalProduct,
          externalLink: editFormData.externalLink,
          variants: editFormData.variants
        },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      toast({
        title: "Uspešno!",
        description: "Proizvod je ažuriran",
      });
      
      closeEditModal();
      fetchProducts();
    } catch (error) {
      toast({
        title: "Greška",
        description: "Nije moguće ažurirati proizvod",
        variant: "destructive"
      });
    }
  };

  const openAddModal = () => {
    setAddFormData({
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
    setUploadedImageFile(null);
    setUploadedImagePreview('');
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
  };

  const handleAddFormChange = (field, value) => {
    setAddFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddVariantChange = (variantIndex, field, value) => {
    setAddFormData(prev => ({
      ...prev,
      variants: prev.variants.map((v, idx) => 
        idx === variantIndex ? { ...v, [field]: value } : v
      )
    }));
  };

  const addNewVariantToAddForm = () => {
    const newVariant = {
      name: `Opcija ${addFormData.variants.length + 1}`,
      description: 'Opis opcije',
      price: 0,
      available: true
    };
    
    setAddFormData(prev => ({
      ...prev,
      variants: [...prev.variants, newVariant]
    }));
  };

  const removeVariantFromAddForm = (variantIndex) => {
    if (addFormData.variants.length <= 1) {
      toast({
        title: "Greška",
        description: "Proizvod mora imati bar jednu varijantu",
        variant: "destructive"
      });
      return;
    }

    setAddFormData(prev => ({
      ...prev,
      variants: prev.variants.filter((_, idx) => idx !== variantIndex)
    }));
  };

  const handleImageFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const addNewProduct = async () => {
    // Validation
    if (!addFormData.name || !addFormData.type || !addFormData.description) {
      toast({
        title: "Greška",
        description: "Morate popuniti ime, tip i opis proizvoda",
        variant: "destructive"
      });
      return;
    }

    // Check if user provided image (either URL or file upload)
    if (!addFormData.imageUrl && !uploadedImageFile) {
      toast({
        title: "Greška",
        description: "Morate dodati fotografiju proizvoda (URL ili upload)",
        variant: "destructive"
      });
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      let imageUrlToUse = addFormData.imageUrl;

      // If user uploaded a file, upload it to backend first
      if (uploadedImageFile) {
        const formData = new FormData();
        formData.append('image', uploadedImageFile);

        const uploadResponse = await axios.post(
          `${API}/admin/products/upload-image`,
          formData,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );

        if (uploadResponse.data.success) {
          // Use only the relative path (will be constructed with BACKEND_URL when displaying)
          imageUrlToUse = uploadResponse.data.imageUrl;
        }
      }

      await axios.post(
        `${API}/admin/products`,
        {
          ...addFormData,
          imageUrl: imageUrlToUse
        },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      toast({
        title: "Uspešno!",
        description: "Novi proizvod je dodat",
      });
      
      closeAddModal();
      fetchProducts();
    } catch (error) {
      console.error('Error adding product:', error);
      toast({
        title: "Greška",
        description: error.response?.data?.detail || "Nije moguće dodati proizvod",
        variant: "destructive"
      });
    }
  };

  const handleProductImageUpload = async (productId, e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const token = localStorage.getItem('adminToken');
      
      // Upload image to backend
      const formData = new FormData();
      formData.append('image', file);

      toast({
        title: "Uploadovanje...",
        description: "Molimo sačekajte dok se fotografija uploaduje",
      });

      const uploadResponse = await axios.post(
        `${API}/admin/products/upload-image`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (uploadResponse.data.success) {
        const imageUrl = uploadResponse.data.imageUrl; // Store only relative path
        
        // Update product with new image URL
        await axios.put(
          `${API}/admin/products/${productId}`,
          { imageUrl },
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        
        toast({
          title: "Uspešno!",
          description: "Fotografija je uspešno promenjena",
        });
        
        fetchProducts();
      }
    } catch (error) {
      console.error('Error uploading product image:', error);
      toast({
        title: "Greška",
        description: error.response?.data?.detail || "Nije moguće uploadovati fotografiju",
        variant: "destructive"
      });
    }
  };

  const updateProductImage = async (productId, imageUrl) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(
        `${API}/admin/products/${productId}`,
        { imageUrl },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      toast({
        title: "Uspešno!",
        description: "Fotografija je ažurirana",
      });
      
      fetchProducts();
    } catch (error) {
      toast({
        title: "Greška",
        description: "Nije moguće ažurirati fotografiju",
        variant: "destructive"
      });
    }
  };

  const deleteProduct = async (productId) => {
    if (!window.confirm('Da li ste sigurni da želite da obrišete ovaj proizvod?')) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`${API}/admin/products/${productId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      toast({
        title: "Uspešno!",
        description: "Proizvod je obrisan",
      });
      
      fetchProducts();
    } catch (error) {
      toast({
        title: "Greška",
        description: "Nije moguće obrisati proizvod",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Package className="w-16 h-16 text-orange-600 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <Button
            onClick={() => navigate('/admin/dashboard')}
            variant="outline"
            className="mb-4 gap-2"
          >
            <ArrowLeft size={18} />
            Nazad na Dashboard
          </Button>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Upravljanje Proizvodima</h1>
              <p className="text-gray-600 mt-2">Dodajte, izmenite ili deaktivirajte proizvode</p>
            </div>
            <Button
              onClick={openAddModal}
              className="bg-green-600 hover:bg-green-700 gap-2"
            >
              <Plus size={18} />
              Dodaj Novi Proizvod
            </Button>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <Card key={product.id} className={`p-6 ${!product.available ? 'opacity-60 border-red-300' : 'border-2'}`}>
              {/* Product Image */}
              <div className="relative group mb-4">
                <img 
                  src={product.imageUrl} 
                  alt={product.name}
                  className="w-full h-48 object-contain rounded bg-gray-100"
                />
                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleProductImageUpload(product.id, e)}
                    />
                    <Button
                      size="sm"
                      type="button"
                      className="bg-white text-gray-900 hover:bg-gray-200 pointer-events-none"
                    >
                      <Upload size={16} className="mr-2" />
                      Promeni Sliku
                    </Button>
                  </label>
                </div>
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
                  onClick={() => openEditModal(product)}
                  className="flex-1 bg-blue-500 hover:bg-blue-600"
                >
                  <Edit size={16} className="mr-2" />
                  Izmeni
                </Button>
                <Button
                  size="sm"
                  onClick={() => toggleProductAvailability(product.id, product.available)}
                  className={product.available ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}
                >
                  {product.available ? <PowerOff size={16} /> : <Power size={16} />}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => deleteProduct(product.id)}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {products.length === 0 && (
          <Card className="p-12 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Nema proizvoda</h3>
            <p className="text-gray-600">Dodajte prvi proizvod da biste počeli</p>
          </Card>
        )}

        {/* Add New Product Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="max-w-3xl w-full max-h-[90vh] overflow-y-auto p-8 bg-white">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Dodaj Novi Proizvod</h2>
                <button onClick={closeAddModal} className="text-gray-500 hover:text-gray-700">
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
                    value={addFormData.name}
                    onChange={(e) => handleAddFormChange('name', e.target.value)}
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
                    value={addFormData.type}
                    onChange={(e) => handleAddFormChange('type', e.target.value.toLowerCase().replace(/\s/g, ''))}
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
                    value={addFormData.description}
                    onChange={(e) => handleAddFormChange('description', e.target.value)}
                    placeholder="Detaljan opis proizvoda koji će videti kupci..."
                    rows={3}
                    className="w-full"
                  />
                </div>

                {/* Image Upload or URL */}
                <div>
                  <Label className="text-sm font-bold mb-2 block">
                    Fotografija Proizvoda * (Upload ili URL)
                  </Label>
                  
                  {/* File Upload */}
                  <div className="mb-3">
                    <input
                      type="file"
                      id="productImageUpload"
                      accept="image/*"
                      onChange={handleImageFileUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      onClick={() => document.getElementById('productImageUpload').click()}
                      variant="outline"
                      className="w-full border-2 gap-2"
                    >
                      <Upload size={18} />
                      {uploadedImageFile ? 'Promeni Fotografiju' : 'Upload Fotografiju'}
                    </Button>
                  </div>

                  {/* OR separator */}
                  <div className="flex items-center gap-2 my-3">
                    <div className="flex-1 border-t border-gray-300"></div>
                    <span className="text-xs text-gray-500">ILI</span>
                    <div className="flex-1 border-t border-gray-300"></div>
                  </div>

                  {/* URL Input */}
                  <Input
                    id="addImageUrl"
                    value={addFormData.imageUrl}
                    onChange={(e) => handleAddFormChange('imageUrl', e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full"
                    disabled={!!uploadedImageFile}
                  />
                  
                  {/* Preview */}
                  {(uploadedImagePreview || addFormData.imageUrl) && (
                    <div className="mt-3">
                      <img 
                        src={uploadedImagePreview || addFormData.imageUrl} 
                        alt="Preview" 
                        className="w-32 h-32 object-contain rounded border-2 bg-gray-100" 
                      />
                      {uploadedImageFile && (
                        <p className="text-xs text-green-600 mt-1">✓ Fotografija uploadovana</p>
                      )}
                    </div>
                  )}
                </div>

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
                        value={addFormData.minPhotos}
                        onChange={(e) => handleAddFormChange('minPhotos', parseInt(e.target.value) || 1)}
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
                        value={addFormData.maxPhotos}
                        onChange={(e) => handleAddFormChange('maxPhotos', parseInt(e.target.value) || 1)}
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
                    checked={addFormData.allowCustomText}
                    onChange={(e) => handleAddFormChange('allowCustomText', e.target.checked)}
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
                      checked={addFormData.requiresPhotoUpload}
                      onChange={(e) => handleAddFormChange('requiresPhotoUpload', e.target.checked)}
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
                      checked={addFormData.isFeatured}
                      onChange={(e) => handleAddFormChange('isFeatured', e.target.checked)}
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
                      checked={addFormData.isExternalProduct}
                      onChange={(e) => handleAddFormChange('isExternalProduct', e.target.checked)}
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

                  {/* External Link Input - only if isExternalProduct is checked */}
                  {addFormData.isExternalProduct && (
                    <div className="mt-4">
                      <Label htmlFor="externalLink" className="text-sm font-bold mb-2 block">
                        🌐 Eksterni Link (URL)
                      </Label>
                      <Input
                        id="externalLink"
                        type="url"
                        value={addFormData.externalLink}
                        onChange={(e) => handleAddFormChange('externalLink', e.target.value)}
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
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <Label className="text-lg font-bold">Varijante (Opcije)</Label>
                    <Button
                      type="button"
                      size="sm"
                      onClick={addNewVariantToAddForm}
                      className="bg-green-600 hover:bg-green-700 gap-2"
                    >
                      <Plus size={16} />
                      Dodaj Opciju
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {addFormData.variants.map((variant, index) => (
                      <Card key={index} className="p-4 bg-gray-50">
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-bold text-gray-900">Opcija {index + 1}</h4>
                          {addFormData.variants.length > 1 && (
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              onClick={() => removeVariantFromAddForm(index)}
                            >
                              <Trash2 size={14} />
                            </Button>
                          )}
                        </div>
                        <div className="space-y-3">
                          {/* Variant Name */}
                          <div>
                            <Label className="text-xs font-semibold mb-1 block">Naziv Opcije</Label>
                            <Input
                              value={variant.name}
                              onChange={(e) => handleAddVariantChange(index, 'name', e.target.value)}
                              placeholder="Npr: Mali format"
                              className="w-full"
                            />
                          </div>

                          {/* Variant Description */}
                          <div>
                            <Label className="text-xs font-semibold mb-1 block">Opis (Dimenzije)</Label>
                            <Input
                              value={variant.description}
                              onChange={(e) => handleAddVariantChange(index, 'description', e.target.value)}
                              placeholder="Npr: Dimenzije: 10x15cm"
                              className="w-full"
                            />
                          </div>

                          {/* Variant Price */}
                          <div>
                            <Label className="text-xs font-semibold mb-1 block">Cena (RSD)</Label>
                            <Input
                              type="number"
                              value={variant.price}
                              onChange={(e) => handleAddVariantChange(index, 'price', parseFloat(e.target.value) || 0)}
                              placeholder="0"
                              className="w-full"
                            />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    onClick={closeAddModal}
                    variant="outline"
                    className="flex-1"
                  >
                    Otkaži
                  </Button>
                  <Button
                    onClick={addNewProduct}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <Plus size={18} className="mr-2" />
                    Dodaj Proizvod
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && editingProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="max-w-3xl w-full max-h-[90vh] overflow-y-auto p-8 bg-white">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Izmeni Proizvod</h2>
                <button onClick={closeEditModal} className="text-gray-500 hover:text-gray-700">
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
                    value={editFormData.name}
                    onChange={(e) => handleEditFormChange('name', e.target.value)}
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
                    value={editFormData.description}
                    onChange={(e) => handleEditFormChange('description', e.target.value)}
                    rows={3}
                    className="w-full"
                  />
                </div>

                {/* Requires Photo Upload */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="editRequiresPhotoUpload"
                      checked={editFormData.requiresPhotoUpload}
                      onChange={(e) => handleEditFormChange('requiresPhotoUpload', e.target.checked)}
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
                      checked={editFormData.isFeatured}
                      onChange={(e) => handleEditFormChange('isFeatured', e.target.checked)}
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
                      checked={editFormData.isExternalProduct}
                      onChange={(e) => handleEditFormChange('isExternalProduct', e.target.checked)}
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

                  {/* External Link Input */}
                  {editFormData.isExternalProduct && (
                    <div className="mt-4">
                      <Label htmlFor="editExternalLink" className="text-sm font-bold mb-2 block">
                        🌐 Eksterni Link (URL)
                      </Label>
                      <Input
                        id="editExternalLink"
                        type="url"
                        value={editFormData.externalLink}
                        onChange={(e) => handleEditFormChange('externalLink', e.target.value)}
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
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <Label className="text-lg font-bold">Varijante</Label>
                    <Button
                      size="sm"
                      onClick={addNewVariant}
                      className="bg-green-600 hover:bg-green-700 gap-2"
                    >
                      <Plus size={16} />
                      Dodaj Novu Opciju
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {editFormData.variants.map((variant, index) => (
                      <Card key={variant.id} className="p-4 bg-gray-50">
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-bold text-gray-900">Varijanta {index + 1}</h4>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => toggleVariantAvailability(index)}
                              className={variant.available ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}
                            >
                              {variant.available ? (
                                <>
                                  <Power size={14} className="mr-1" />
                                  Aktivna
                                </>
                              ) : (
                                <>
                                  <PowerOff size={14} className="mr-1" />
                                  Neaktivna
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => removeVariant(index)}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-3">
                          {/* Variant Name */}
                          <div>
                            <Label className="text-xs font-semibold mb-1 block">Naziv Varijante</Label>
                            <Input
                              value={variant.name}
                              onChange={(e) => handleVariantChange(index, 'name', e.target.value)}
                              className="w-full"
                            />
                          </div>

                          {/* Variant Description */}
                          <div>
                            <Label className="text-xs font-semibold mb-1 block">Opis Varijante</Label>
                            <Input
                              value={variant.description}
                              onChange={(e) => handleVariantChange(index, 'description', e.target.value)}
                              className="w-full"
                            />
                          </div>

                          {/* Variant Price */}
                          <div>
                            <Label className="text-xs font-semibold mb-1 block">Cena (RSD)</Label>
                            <Input
                              type="number"
                              value={variant.price}
                              onChange={(e) => handleVariantChange(index, 'price', parseFloat(e.target.value) || 0)}
                              className="w-full"
                            />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    onClick={closeEditModal}
                    variant="outline"
                    className="flex-1"
                  >
                    Otkaži
                  </Button>
                  <Button
                    onClick={saveProductEdits}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    Sačuvaj Izmene
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProducts;
