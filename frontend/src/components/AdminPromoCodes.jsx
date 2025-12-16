import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Tag, TrendingUp } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from '../hooks/use-toast';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminPromoCodes = () => {
  const navigate = useNavigate();
  const [promoCodes, setPromoCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCode, setNewCode] = useState({
    code: '',
    discountPercent: ''
  });

  useEffect(() => {
    document.title = 'Promo Kodovi | Admin Panel';
    fetchPromoCodes();
  }, []);

  const fetchPromoCodes = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API}/admin/promo-codes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setPromoCodes(response.data.codes);
      }
    } catch (error) {
      console.error('Error fetching promo codes:', error);
      toast({
        title: "Greška",
        description: "Nije moguće učitati promo kodove",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddCode = async () => {
    try {
      const code = newCode.code.toUpperCase().trim();
      const discount = parseInt(newCode.discountPercent);

      // Validation
      if (!code || code.length !== 5) {
        toast({
          title: "Greška",
          description: "Promo kod mora imati tačno 5 karaktera",
          variant: "destructive"
        });
        return;
      }

      if (!/^[A-Z0-9]+$/.test(code)) {
        toast({
          title: "Greška",
          description: "Promo kod može sadržati samo slova i brojeve",
          variant: "destructive"
        });
        return;
      }

      if (!discount || discount < 1 || discount > 100) {
        toast({
          title: "Greška",
          description: "Popust mora biti između 1% i 100%",
          variant: "destructive"
        });
        return;
      }

      const token = localStorage.getItem('adminToken');
      const response = await axios.post(
        `${API}/admin/promo-codes`,
        {
          code: code,
          discountPercent: discount
        },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast({
          title: "Uspešno!",
          description: response.data.message
        });
        setShowAddModal(false);
        setNewCode({ code: '', discountPercent: '' });
        fetchPromoCodes();
      }
    } catch (error) {
      console.error('Error adding promo code:', error);
      toast({
        title: "Greška",
        description: error.response?.data?.detail || "Nije moguće kreirati promo kod",
        variant: "destructive"
      });
    }
  };

  const handleDeleteCode = async (code) => {
    if (!window.confirm(`Da li ste sigurni da želite da obrišete promo kod ${code}?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.delete(
        `${API}/admin/promo-codes/${code}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast({
          title: "Uspešno!",
          description: response.data.message
        });
        fetchPromoCodes();
      }
    } catch (error) {
      console.error('Error deleting promo code:', error);
      toast({
        title: "Greška",
        description: "Nije moguće obrisati promo kod",
        variant: "destructive"
      });
    }
  };

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewCode(prev => ({ ...prev, code }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Učitavanje...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/logovanje/dashboard')}
              className="gap-2"
            >
              <ArrowLeft size={20} />
              Nazad
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Promo Kodovi</h1>
          </div>
          <Button
            onClick={() => setShowAddModal(true)}
            className="bg-orange-600 hover:bg-orange-700 gap-2"
          >
            <Plus size={18} />
            Dodaj Kod
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Ukupno Kodova</p>
                <p className="text-3xl font-bold text-gray-900">{promoCodes.length}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Tag className="text-blue-600" size={24} />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Ukupno Korišćenja</p>
                <p className="text-3xl font-bold text-gray-900">
                  {promoCodes.reduce((sum, code) => sum + code.timesUsed, 0)}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <TrendingUp className="text-green-600" size={24} />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Prosečan Popust</p>
                <p className="text-3xl font-bold text-gray-900">
                  {promoCodes.length > 0
                    ? Math.round(promoCodes.reduce((sum, code) => sum + code.discountPercent, 0) / promoCodes.length)
                    : 0}%
                </p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <span className="text-orange-600 text-2xl font-bold">%</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Promo Codes List */}
        {promoCodes.length === 0 ? (
          <Card className="p-12 text-center">
            <Tag className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Nema Promo Kodova</h3>
            <p className="text-gray-500 mb-6">Dodajte prvi promo kod da biste omogućili popuste</p>
            <Button
              onClick={() => setShowAddModal(true)}
              className="bg-orange-600 hover:bg-orange-700 gap-2"
            >
              <Plus size={18} />
              Dodaj Prvi Kod
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {promoCodes.map((code) => (
              <Card key={code.code} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="bg-orange-100 px-4 py-2 rounded-lg">
                    <p className="text-2xl font-bold text-orange-600 tracking-wider">{code.code}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteCode(code.code)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 size={18} />
                  </Button>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Popust:</span>
                    <span className="text-lg font-bold text-green-600">{code.discountPercent}%</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Korišćeno:</span>
                    <span className="text-lg font-semibold text-gray-900">{code.timesUsed}x</span>
                  </div>

                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      Kreirano: {new Date(code.createdAt).toLocaleDateString('sr-RS')}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add Code Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Dodaj Novi Promo Kod</h2>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setNewCode({ code: '', discountPercent: '' });
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="code" className="mb-2 block">Promo Kod (5 karaktera)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="code"
                      value={newCode.code}
                      onChange={(e) => {
                        const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
                        setNewCode(prev => ({ ...prev, code: value }));
                      }}
                      placeholder="ABCD1"
                      maxLength={5}
                      className="flex-1 text-lg font-bold tracking-wider"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={generateRandomCode}
                      className="whitespace-nowrap"
                    >
                      Generiši
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Samo slova (A-Z) i brojevi (0-9)
                  </p>
                </div>

                <div>
                  <Label htmlFor="discount" className="mb-2 block">Procenat Popusta (%)</Label>
                  <Input
                    id="discount"
                    type="number"
                    value={newCode.discountPercent}
                    onChange={(e) => {
                      const value = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                      setNewCode(prev => ({ ...prev, discountPercent: value.toString() }));
                    }}
                    placeholder="10"
                    min="1"
                    max="100"
                    className="text-lg"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Između 1% i 100%
                  </p>
                </div>

                {newCode.code && newCode.discountPercent && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-800 mb-1 font-semibold">Pregled:</p>
                    <p className="text-lg">
                      Kod <span className="font-bold text-orange-600">{newCode.code}</span> daje{' '}
                      <span className="font-bold text-green-600">{newCode.discountPercent}%</span> popusta
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddModal(false);
                    setNewCode({ code: '', discountPercent: '' });
                  }}
                  className="flex-1"
                >
                  Otkaži
                </Button>
                <Button
                  onClick={handleAddCode}
                  disabled={!newCode.code || newCode.code.length !== 5 || !newCode.discountPercent}
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                >
                  Kreiraj Kod
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminPromoCodes;
