import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Save, LogOut, ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from '../hooks/use-toast';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminPrices = () => {
  const navigate = useNavigate();
  const [prices, setPrices] = useState({
    '9x13': 12,
    '10x15': 18,
    '13x18': 25,
    '15x21': 50,
    '20x30': 150,
    '30x45': 250
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = 'Cenovnik | Fotoexpres';
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/logovanje');
      return;
    }
    fetchPrices();
  }, [navigate]);

  const fetchPrices = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API}/admin/prices`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.data.prices) {
        setPrices(response.data.prices);
      }
    } catch (error) {
      console.error('Error fetching prices:', error);
      // Use default prices if fetch fails
    }
  };

  const handlePriceChange = (format, value) => {
    setPrices({
      ...prices,
      [format]: parseFloat(value) || 0
    });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(`${API}/admin/prices`, 
        { prices },
        { headers: { 'Authorization': `Bearer ${token}` }}
      );
      
      toast({
        title: "Cene ažurirane",
        description: "Sve cene su uspešno sačuvane"
      });
    } catch (error) {
      toast({
        title: "Greška",
        description: "Nije moguće sačuvati cene",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/logovanje');
  };

  const formatLabels = {
    '9x13': '9x13 cm',
    '10x15': '10x15 cm',
    '13x18': '13x18 cm',
    '15x21': '15x21 cm',
    '20x30': '20x30 cm',
    '30x45': '30x45 cm'
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Button 
              onClick={() => navigate('/logovanje/dashboard')}
              variant="outline" 
              className="gap-2 border-2"
            >
              <ArrowLeft size={18} />
              Nazad
            </Button>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Upravljanje Cenama</h1>
              <p className="text-gray-600 mt-2">Podesite cene za svaki format fotografije</p>
            </div>
          </div>
          <Button 
            onClick={handleLogout}
            variant="outline" 
            className="gap-2 border-2"
          >
            <LogOut size={18} />
            Odjavi Se
          </Button>
        </div>

        {/* Prices Grid */}
        <Card className="p-8 border-2 border-gray-200">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-orange-100 w-12 h-12 rounded-full flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Cene po Formatu</h2>
              <p className="text-gray-600">Cene su u dinarima (RSD) po fotografiji</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {Object.keys(prices).map((format) => (
              <div key={format} className="p-6 bg-gray-50 rounded-lg border-2 border-gray-200 hover:border-orange-300 transition-all">
                <Label htmlFor={format} className="text-base font-semibold mb-3 block">
                  Format {formatLabels[format]}
                </Label>
                <div className="flex items-center gap-3">
                  <Input
                    id={format}
                    type="number"
                    value={prices[format]}
                    onChange={(e) => handlePriceChange(format, e.target.value)}
                    className="text-xl font-bold border-2"
                    min="0"
                    step="1"
                  />
                  <span className="text-lg font-semibold text-gray-600">RSD</span>
                </div>
              </div>
            ))}
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-6 border-t-2">
            <Button 
              onClick={handleSave}
              disabled={loading}
              size="lg"
              className="bg-orange-600 hover:bg-orange-700 text-white gap-2 px-8"
            >
              <Save size={20} />
              {loading ? 'Čuvanje...' : 'Sačuvaj Cene'}
            </Button>
          </div>
        </Card>

        {/* Info Card */}
        <Card className="p-6 mt-6 bg-blue-50 border-2 border-blue-200">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Napomena</h3>
          <ul className="text-gray-700 space-y-2 text-sm">
            <li>• Cene će biti odmah vidljive kupcima nakon čuvanja</li>
            <li>• Cene su u dinarima (RSD) i odnose se na jednu fotografiju</li>
            <li>• Porudžbine koje su već napravljene zadržavaju stare cene</li>
          </ul>
        </Card>
      </div>
    </div>
  );
};

export default AdminPrices;
