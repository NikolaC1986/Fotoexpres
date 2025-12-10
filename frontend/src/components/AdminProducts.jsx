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
  const [editingProduct, setEditingProduct] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    variants: []
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

  const updateVariantPrice = async (productId, variantId, newPrice) => {
    try {
      const token = localStorage.getItem('adminToken');
      const product = products.find(p => p.id === productId);
      const updatedVariants = product.variants.map(v => 
        v.id === variantId ? { ...v, price: parseFloat(newPrice) } : v
      );
      
      await axios.put(
        `${API}/admin/products/${productId}`,
        { variants: updatedVariants },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      toast({
        title: "Uspešno!",
        description: "Cena je ažurirana",
      });
      
      fetchProducts();
    } catch (error) {
      toast({
        title: "Greška",
        description: "Nije moguće ažurirati cenu",
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
      </div>
    </div>
  );
};

export default AdminProducts;
