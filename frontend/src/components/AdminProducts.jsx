import React, { useState, useEffect } from 'react';
import { Package, Plus, Edit, Trash2, Power, PowerOff, Upload, X } from 'lucide-react';
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
    variants: [
      { name: 'Opcija 1', description: 'Dimenzije: 10x15cm', price: 0, available: true },
      { name: 'Opcija 2', description: 'Dimenzije: 20x30cm', price: 0, available: true }
    ]
  });

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
      variants: product.variants.map(v => ({ ...v })) // Deep copy
    });
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingProduct(null);
    setEditFormData({ name: '', description: '', variants: [] });
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
      variants: [
        { name: 'Opcija 1', description: 'Dimenzije: 10x15cm', price: 0, available: true },
        { name: 'Opcija 2', description: 'Dimenzije: 20x30cm', price: 0, available: true }
      ]
    });
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

  const addNewProduct = async () => {
    // Validation
    if (!addFormData.name || !addFormData.type || !addFormData.description || !addFormData.imageUrl) {
      toast({
        title: "Greška",
        description: "Morate popuniti sva obavezna polja",
        variant: "destructive"
      });
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(
        `${API}/admin/products`,
        addFormData,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      toast({
        title: "Uspešno!",
        description: "Novi proizvod je dodat",
      });
      
      closeAddModal();
      fetchProducts();
    } catch (error) {
      toast({
        title: "Greška",
        description: "Nije moguće dodati proizvod",
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
        <div className="flex justify-between items-center mb-8">
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

        {/* Products Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <Card key={product.id} className={`p-6 ${!product.available ? 'opacity-60 border-red-300' : 'border-2'}`}>
              {/* Product Image */}
              <div className="relative group mb-4">
                <img 
                  src={product.imageUrl} 
                  alt={product.name}
                  className="w-full h-48 object-cover rounded"
                />
                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
                  <Button
                    size="sm"
                    onClick={() => {
                      const newUrl = prompt('Unesite novi URL fotografije:', product.imageUrl);
                      if (newUrl && newUrl !== product.imageUrl) {
                        updateProductImage(product.id, newUrl);
                      }
                    }}
                    className="bg-white text-gray-900 hover:bg-gray-200"
                  >
                    <Upload size={16} className="mr-2" />
                    Promeni Sliku
                  </Button>
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

                {/* Image URL */}
                <div>
                  <Label htmlFor="addImageUrl" className="text-sm font-bold mb-2 block">
                    URL Fotografije *
                  </Label>
                  <Input
                    id="addImageUrl"
                    value={addFormData.imageUrl}
                    onChange={(e) => handleAddFormChange('imageUrl', e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full"
                  />
                  {addFormData.imageUrl && (
                    <img src={addFormData.imageUrl} alt="Preview" className="mt-2 w-32 h-32 object-cover rounded" />
                  )}
                </div>

                {/* Min/Max Photos */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="minPhotos" className="text-sm font-bold mb-2 block">
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
                    <Label htmlFor="maxPhotos" className="text-sm font-bold mb-2 block">
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

                {/* Variants */}
                <div>
                  <Label className="text-lg font-bold mb-4 block">Varijante (Opcije)</Label>
                  <div className="space-y-4">
                    {addFormData.variants.map((variant, index) => (
                      <Card key={index} className="p-4 bg-gray-50">
                        <h4 className="font-bold text-gray-900 mb-3">Opcija {index + 1}</h4>
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
