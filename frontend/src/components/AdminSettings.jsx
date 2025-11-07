import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, Save, LogOut, ArrowLeft, DollarSign } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from '../hooks/use-toast';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminSettings = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    freeDeliveryLimit: 5000,
    contactPhone: '+381 65 46 000 46',
    contactEmail: 'kontakt@fotoexpres.rs'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin');
      return;
    }
    fetchSettings();
  }, [navigate]);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API}/admin/settings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.data.settings) {
        setSettings(response.data.settings);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(`${API}/admin/settings`, 
        { settings },
        { headers: { 'Authorization': `Bearer ${token}` }}
      );
      
      toast({
        title: "Podešavanja ažurirana",
        description: "Limit za besplatnu dostavu je uspešno sačuvan"
      });
    } catch (error) {
      toast({
        title: "Greška",
        description: "Nije moguće sačuvati podešavanja",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Button 
              onClick={() => navigate('/admin/dashboard')}
              variant="outline" 
              className="gap-2 border-2"
            >
              <ArrowLeft size={18} />
              Nazad
            </Button>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Podešavanja</h1>
              <p className="text-gray-600 mt-2">Upravljajte opcijama dostave i porudžbina</p>
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

        {/* Delivery Settings */}
        <Card className="p-8 border-2 border-gray-200 mb-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center">
              <Truck className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Besplatna Dostava</h2>
              <p className="text-gray-600">Podesite minimum za besplatnu dostavu</p>
            </div>
          </div>

          <div className="max-w-md">
            <Label htmlFor="freeDeliveryLimit" className="text-base font-semibold mb-3 block">
              Limit za Besplatnu Dostavu
            </Label>
            <div className="flex items-center gap-3">
              <Input
                id="freeDeliveryLimit"
                type="number"
                value={settings.freeDeliveryLimit}
                onChange={(e) => setSettings({...settings, freeDeliveryLimit: parseInt(e.target.value) || 0})}
                className="text-xl font-bold border-2"
                min="0"
                step="100"
              />
              <span className="text-lg font-semibold text-gray-600">RSD</span>
            </div>
            <p className="text-sm text-gray-500 mt-3">
              Porudžbine iznad ovog iznosa imaju besplatnu dostavu. Trenutno: 
              <span className="font-semibold text-gray-900"> {settings.freeDeliveryLimit} RSD</span>
            </p>
          </div>
        </Card>

        {/* Info Card */}
        <Card className="p-6 bg-blue-50 border-2 border-blue-200 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Napomena</h3>
          <ul className="text-gray-700 space-y-2 text-sm">
            <li>• Promena će biti odmah vidljiva kupcima nakon čuvanja</li>
            <li>• Limit se prikazuje na početnoj strani i u korpi</li>
            <li>• Porudžbine ispod limita naplaćuju 400 RSD dostave</li>
          </ul>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button 
            onClick={handleSave}
            disabled={loading}
            size="lg"
            className="bg-orange-600 hover:bg-orange-700 text-white gap-2 px-8"
          >
            <Save size={20} />
            {loading ? 'Čuvanje...' : 'Sačuvaj Podešavanja'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
