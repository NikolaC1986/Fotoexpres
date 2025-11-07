import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, Save, LogOut, ArrowLeft, Phone, Mail, Image } from 'lucide-react';
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
    heroImageUrl: 'https://customer-assets.emergentagent.com/job_swift-image-portal/artifacts/1ogmpeji_8%20copy.jpg'
  });
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

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

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Greška",
        description: "Molimo izaberite sliku (JPG, PNG, itd.)",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 5MB)
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
        description: "Sve izmene su uspešno sačuvane i prikazuju se na sajtu"
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
              onClick={() => navigate('/logovanje/dashboard')}
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

        {/* Hero Image */}
        <Card className="p-8 border-2 border-gray-200 mb-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center">
              <Image className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Naslovna fotografija</h2>
              <p className="text-gray-600">Promenite glavnu fotografiju na naslovnoj strani</p>
            </div>
          </div>

          <div className="space-y-6 max-w-2xl">
            <div>
              <Label htmlFor="heroImageFile" className="text-base font-semibold mb-3 block">
                Uploaduj novu naslovnu fotografiju
              </Label>
              <div className="flex items-center gap-3">
                <Input
                  id="heroImageFile"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="text-lg border-2"
                  disabled={uploadingImage}
                />
                {uploadingImage && (
                  <span className="text-sm text-gray-500">Uploadujem...</span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Izaberite sliku (JPG, PNG, itd.) - maksimalno 5MB
              </p>
            </div>

            <div className="pt-4 border-t">
              <Label className="text-sm font-semibold text-gray-600 mb-2 block">
                Trenutna URL adresa slike:
              </Label>
              <Input
                type="text"
                value={settings.heroImageUrl}
                onChange={(e) => setSettings({...settings, heroImageUrl: e.target.value})}
                className="text-sm border-2"
                placeholder="https://example.com/image.jpg"
              />
              <p className="text-xs text-gray-500 mt-1">
                Ili unesite eksterni URL (opciono)
              </p>
            </div>
            
            {settings.heroImageUrl && (
              <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
                <p className="text-sm font-semibold text-gray-700 mb-3">Pregled naslovne fotografije:</p>
                <img 
                  src={settings.heroImageUrl} 
                  alt="Hero Preview" 
                  className="w-full max-w-md rounded-lg shadow-lg"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
                <p className="text-xs text-red-500 mt-2" style={{display: 'none'}}>
                  Slika nije mogla biti učitana. Proverite URL.
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Contact Information */}
        <Card className="p-8 border-2 border-gray-200 mb-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center">
              <Phone className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Kontakt informacije</h2>
              <p className="text-gray-600">Podesite telefon i email za kontakt</p>
            </div>
          </div>

          <div className="space-y-6 max-w-2xl">
            <div>
              <Label htmlFor="contactPhone" className="text-base font-semibold mb-3 block">
                Kontakt Telefon
              </Label>
              <div className="flex items-center gap-3">
                <Phone size={20} className="text-gray-400" />
                <Input
                  id="contactPhone"
                  type="text"
                  value={settings.contactPhone}
                  onChange={(e) => setSettings({...settings, contactPhone: e.target.value})}
                  className="text-lg border-2"
                  placeholder="+381 65 46 000 46"
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Ovaj broj će biti prikazan u header-u sajta
              </p>
            </div>

            <div>
              <Label htmlFor="contactEmail" className="text-base font-semibold mb-3 block">
                Kontakt Email
              </Label>
              <div className="flex items-center gap-3">
                <Mail size={20} className="text-gray-400" />
                <Input
                  id="contactEmail"
                  type="email"
                  value={settings.contactEmail}
                  onChange={(e) => setSettings({...settings, contactEmail: e.target.value})}
                  className="text-lg border-2"
                  placeholder="kontakt@fotoexpres.rs"
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Ovaj email će biti prikazan u footer-u sajta
              </p>
            </div>
          </div>
        </Card>

        {/* Delivery Settings */}
        <Card className="p-8 border-2 border-gray-200 mb-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center">
              <Truck className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Podešavanja dostave</h2>
              <p className="text-gray-600">Podesite cenu i limit za besplatnu dostavu</p>
            </div>
          </div>

          <div className="space-y-6 max-w-2xl">
            <div>
              <Label htmlFor="deliveryPrice" className="text-base font-semibold mb-3 block">
                Cena dostave
              </Label>
              <div className="flex items-center gap-3">
                <Input
                  id="deliveryPrice"
                  type="number"
                  value={settings.deliveryPrice}
                  onChange={(e) => setSettings({...settings, deliveryPrice: parseInt(e.target.value) || 0})}
                  className="text-xl font-bold border-2 w-40"
                  min="0"
                  step="50"
                />
                <span className="text-lg font-semibold text-gray-600">RSD</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Ova cena se primenjuje na sve porudžbine ispod limita za besplatnu dostavu
              </p>
            </div>

            <div>
              <Label htmlFor="freeDeliveryLimit" className="text-base font-semibold mb-3 block">
                Limit za besplatnu dostavu
              </Label>
              <div className="flex items-center gap-3">
                <Input
                  id="freeDeliveryLimit"
                  type="number"
                  value={settings.freeDeliveryLimit}
                  onChange={(e) => setSettings({...settings, freeDeliveryLimit: parseInt(e.target.value) || 0})}
                  className="text-xl font-bold border-2 w-40"
                  min="0"
                  step="100"
                />
                <span className="text-lg font-semibold text-gray-600">RSD</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Porudžbine iznad ovog iznosa imaju besplatnu dostavu
              </p>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
              <p className="text-sm text-blue-900">
                <strong>Primer:</strong> Ako postavite cenu dostave na <strong>{settings.deliveryPrice} RSD</strong> i 
                limit na <strong>{settings.freeDeliveryLimit} RSD</strong>, kupci će platiti {settings.deliveryPrice} RSD 
                dostave za porudžbine ispod {settings.freeDeliveryLimit} RSD, dok će porudžbine preko {settings.freeDeliveryLimit} RSD 
                imati besplatnu dostavu.
              </p>
            </div>
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
