import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Plus, ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { toast } from '../hooks/use-toast';
import axios from 'axios';
import ProductCard from './products/ProductCard';
import AddProductModal from './products/AddProductModal';
import EditProductModal from './products/EditProductModal';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminProductsNew = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

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

  const handleEdit = (product) => {
    setEditingProduct(product);
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingProduct(null);
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
            onClick={() => navigate('/logovanje/dashboard')}
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
              onClick={() => setShowAddModal(true)}
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
            <ProductCard
              key={product.id}
              product={product}
              onEdit={handleEdit}
              onDelete={deleteProduct}
              onToggleAvailability={toggleProductAvailability}
            />
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

        {/* Modals */}
        <AddProductModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={fetchProducts}
        />

        <EditProductModal
          isOpen={showEditModal}
          product={editingProduct}
          onClose={handleCloseEditModal}
          onSuccess={fetchProducts}
        />
      </div>
    </div>
  );
};

export default AdminProductsNew;
