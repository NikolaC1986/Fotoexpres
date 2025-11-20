import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, Save, LogOut, ArrowLeft, Phone, Mail, Image, Clock } from 'lucide-react';
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
    deliveryPrice: 400,
    contactPhone: '+381 65 46 000 46',
    contactEmail: 'kontakt@fotoexpres.rs',
    workingHours: 'Pon-Pet: 08:00-17:00, Sub: 09:00-14:00',
    heroImageUrl: '/images/hero-default.jpg'
  });
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    document.title = 'Podešavanja | Fotoexpres';
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/logovanje');
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

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Greška",
        description: "Molimo izaberite sliku (JPG, PNG, itd.)",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Greška",
        description: "Slika je prevelika. Maksimalna veličina je 5MB",
        variant: "destructive"
      });
      return;
    }

    try {
      setUploadingImage(true);
      const token = localStorage.getItem('adminToken');
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(`${API}/admin/upload-hero-image`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        const imageUrl = `${BACKEND_URL}${response.data.imageUrl}`;
        setSettings({...settings, heroImageUrl: imageUrl});
        toast({
          title: "Slika uploadovana",
          description: "Slika je uspešno uploadovana. Kliknite 'Sačuvaj' da primenite izmene."
        });
      }
    } catch (error) {
      toast({
        title: "Greška",
        description: "Nije moguće uploadovati sliku",
        variant: "destructive"
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await axios.put(
        `${API}/admin/settings`,
        { settings },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast({
          title: "Sačuvano",
          description: "Podešavanja su uspešno sačuvana"
        });
      }
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
    localStorage.removeItem('adminRole');
    navigate('/logovanje');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-6">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <Button variant="outline" onClick={() => navigate('/logovanje/dashboard')} className="mb-4 gap-2">
              <ArrowLeft size={18} />
              Nazad na Dashboard
            </Button>
            <h1 className="text-4xl font-bold text-gray-900">Podešavanja</h1>
            <p className="text-gray-600 mt-2">Upravljanje osnovnim podešavanjima sajta</p>
          </div>
          <Button onClick={handleLogout} variant="outline" className="gap-2">
            <LogOut size={18} />
            Odjavi se
          </Button>
        </div>

        {/* Delivery Settings */}
        <Card className="p-8 border-2 border-gray-200 mb-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center">
              <Truck className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Dostava</h2>
              <p className="text-gray-600">Podešavanja za besplatnu dostavu i cenu dostave</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
            <div>
              <Label className="text-base font-semibold mb-3 block">
                Limit za besplatnu dostavu (RSD)
              </Label>
              <Input
                type="number"
                value={settings.freeDeliveryLimit}
                onChange={(e) => setSettings({...settings, freeDeliveryLimit: parseInt(e.target.value)})}
                className="text-lg border-2"
              />
              <p className="text-sm text-gray-500 mt-2">
                Porudžbine iznad ovog iznosa imaju besplatnu dostavu
              </p>
            </div>

            <div>
              <Label className="text-base font-semibold mb-3 block">
                Cena dostave (RSD)
              </Label>
              <Input
                type="number"
                value={settings.deliveryPrice}
                onChange={(e) => setSettings({...settings, deliveryPrice: parseInt(e.target.value)})}
                className="text-lg border-2"
              />
              <p className="text-sm text-gray-500 mt-2">
                Cena dostave za porudžbine ispod limita
              </p>
            </div>
          </div>
        </Card>

        {/* Contact Settings */}
        <Card className="p-8 border-2 border-gray-200 mb-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center">
              <Phone className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Kontakt Informacije</h2>
              <p className="text-gray-600">Telefon i email za kontakt</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
            <div>
              <Label className="text-base font-semibold mb-3 block">
                Kontakt telefon
              </Label>
              <Input
                type="text"
                value={settings.contactPhone}
                onChange={(e) => setSettings({...settings, contactPhone: e.target.value})}
                className="text-lg border-2"
                placeholder="+381 XX XXX XXXX"
              />
            </div>

            <div>
              <Label className="text-base font-semibold mb-3 block">
                Kontakt email
              </Label>
              <Input
                type="email"
                value={settings.contactEmail}
                onChange={(e) => setSettings({...settings, contactEmail: e.target.value})}
                className="text-lg border-2"
                placeholder="kontakt@example.com"
              />
            </div>
          </div>
        </Card>

        {/* Working Hours Settings */}
        <Card className="p-8 border-2 border-gray-200 mb-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Radno Vreme</h2>
              <p className="text-gray-600">Prikazivaće se na headeru, footeru i FAQ stranici</p>
            </div>
          </div>

          <div className="max-w-3xl">
            <Label className="text-base font-semibold mb-3 block">
              Radno vreme
            </Label>
            <Input
              type="text"
              value={settings.workingHours || ''}
              onChange={(e) => setSettings({...settings, workingHours: e.target.value})}
              className="text-lg border-2"
              placeholder="Pon-Pet: 08:00-17:00, Sub: 09:00-14:00"
            />
            <p className="text-sm text-gray-500 mt-2">
              Primer: "Pon-Pet: 08:00-17:00, Sub: 09:00-14:00" ili "Radimo 24/7"
            </p>
          </div>
        </Card>

        {/* Hero Image Settings */}
        <Card className="p-8 border-2 border-gray-200 mb-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-orange-100 w-12 h-12 rounded-full flex items-center justify-center">
              <Image className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Hero Slika</h2>
              <p className="text-gray-600">Slika na početnoj stranici</p>
            </div>
          </div>

          <div className="max-w-3xl">
            <div className="mb-4">
              <img 
                src={settings.heroImageUrl || '/images/hero-default.jpg'} 
                alt="Hero" 
                className="w-full h-64 object-cover rounded-lg border-2 border-gray-300"
              />
            </div>

            <div>
              <Label className="text-base font-semibold mb-3 block">
                Upload nova slika
              </Label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-orange-50 file:text-orange-700
                  hover:file:bg-orange-100
                  cursor-pointer"
                disabled={uploadingImage}
              />
              <p className="text-sm text-gray-500 mt-2">
                Maksimalna veličina: 5MB. Preporučene dimenzije: 1920x800px
              </p>
            </div>
          </div>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <Button
            onClick={handleSaveSettings}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2 px-8 text-lg"
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