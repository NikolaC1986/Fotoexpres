import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Bell, AlertCircle, Calendar } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from '../hooks/use-toast';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminPromotion = () => {
  const navigate = useNavigate();
  const [promotion, setPromotion] = useState({
    isActive: false,
    format: 'all',
    discountPercent: 10,
    validUntil: '2025-12-31T23:59',
    message: '10% popusta na sve porudžbine!'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin');
      return;
    }
    fetchPromotion();
  }, [navigate]);

  const fetchPromotion = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API}/admin/promotion`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setPromotion(response.data.promotion);
    } catch (error) {
      toast({
        title: "Greška",
        description: "Nije moguće učitati promociju",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(`${API}/admin/promotion`, 
        { promotion },
        { headers: { 'Authorization': `Bearer ${token}` }}
      );
      
      toast({
        title: "Uspešno sačuvano",
        description: "Promocija je ažurirana"
      });
    } catch (error) {
      toast({
        title: "Greška",
        description: "Nije moguće sačuvati promociju",
        variant: "destructive"
      });
    }
  };

  const updatePromotion = (field, value) => {
    setPromotion({
      ...promotion,
      [field]: value
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Učitavanje...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <Link to="/admin/dashboard">
            <Button variant="outline" className="mb-4 gap-2">
              <ArrowLeft size={18} />
              Nazad na Dashboard
            </Button>
          </Link>
          <h1 className="text-4xl font-bold text-gray-900">Pop-up Promocija</h1>
          <p className="text-gray-600 mt-2">Kreirajte i upravljajte pop-up promocijama na sajtu</p>
        </div>

        {/* Info Card */}
        <Card className="p-6 mb-6 bg-blue-50 border-2 border-blue-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Kako funkcioniše?</h3>
              <p className="text-sm text-blue-800">
                Pop-up notifikacija će se prikazati korisnicima kada posete sajt. Možete postaviti popust na određeni format ili sve formate, 
                definisati do kada traje akcija, i napisati poruku koja će se prikazati. Akciju možete aktivirati ili deaktivirati u bilo kom trenutku.
              </p>
            </div>
          </div>
        </Card>

        {/* Promotion Settings */}
        <Card className="p-8">
          <div className="space-y-6">
            {/* Active Toggle */}
            <div className="flex items-center justify-between p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border-2 border-purple-300">
              <div className="flex items-center gap-4">
                <Bell className="w-8 h-8 text-purple-600" />
                <div>
                  <Label className="text-lg font-semibold text-gray-900 block mb-1">
                    Status Promocije
                  </Label>
                  <p className="text-sm text-gray-600">
                    {promotion.isActive ? 'Pop-up je trenutno AKTIVAN i prikazuje se korisnicima' : 'Pop-up je trenutno NEAKTIVAN'}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => updatePromotion('isActive', !promotion.isActive)}
                className={`px-8 py-6 text-lg font-semibold ${
                  promotion.isActive 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {promotion.isActive ? 'Deaktiviraj' : 'Aktiviraj'}
              </Button>
            </div>

            {/* Format Selection */}
            <div>
              <Label className="text-base font-semibold mb-3 block">1. Izaberite Format</Label>
              <Select 
                value={promotion.format} 
                onValueChange={(value) => updatePromotion('format', value)}
              >
                <SelectTrigger className="w-full text-lg border-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Svi Formati</SelectItem>
                  <SelectItem value="9x13">9x13 cm</SelectItem>
                  <SelectItem value="10x15">10x15 cm</SelectItem>
                  <SelectItem value="13x18">13x18 cm</SelectItem>
                  <SelectItem value="15x21">15x21 cm</SelectItem>
                  <SelectItem value="20x30">20x30 cm</SelectItem>
                  <SelectItem value="30x45">30x45 cm</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Discount Percent */}
            <div>
              <Label className="text-base font-semibold mb-3 block">2. Količina Popusta (%)</Label>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={promotion.discountPercent}
                  onChange={(e) => updatePromotion('discountPercent', parseInt(e.target.value) || 0)}
                  className="text-2xl font-bold text-center w-40 border-2"
                />
                <span className="text-2xl font-bold text-orange-600">% popusta</span>
              </div>
            </div>

            {/* Valid Until Date */}
            <div>
              <Label className="text-base font-semibold mb-3 block">3. Akcija Važi Do</Label>
              <div className="flex items-center gap-3">
                <Calendar className="w-6 h-6 text-gray-500" />
                <Input
                  type="datetime-local"
                  value={promotion.validUntil}
                  onChange={(e) => updatePromotion('validUntil', e.target.value)}
                  className="text-lg border-2"
                />
              </div>
            </div>

            {/* Message */}
            <div>
              <Label className="text-base font-semibold mb-3 block">4. Poruka za Akciju</Label>
              <Textarea
                value={promotion.message}
                onChange={(e) => updatePromotion('message', e.target.value)}
                placeholder="Unesite poruku koja će se prikazati korisnicima..."
                rows={3}
                className="text-lg border-2"
                maxLength={150}
              />
              <p className="text-sm text-gray-500 mt-2">
                {promotion.message.length}/150 karaktera
              </p>
            </div>

            {/* Preview */}
            {promotion.isActive && (
              <div className="mt-8 p-6 bg-gradient-to-r from-orange-100 to-red-100 rounded-lg border-2 border-orange-300">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Bell size={20} />
                  Pregled Notification Trake:
                </h3>
                <div className="bg-gradient-to-r from-orange-600 via-red-600 to-orange-600 text-white rounded-lg shadow-lg overflow-hidden">
                  <div className="px-6 py-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="bg-white text-orange-600 px-4 py-2 rounded-full font-bold text-xl">
                          {promotion.discountPercent}% OFF
                        </div>
                        <div className="flex-1">
                          <p className="text-lg font-bold">
                            {promotion.message || 'Unesite poruku...'}
                          </p>
                          <div className="flex items-center gap-4 text-sm mt-1 opacity-90">
                            <span>📌 {promotion.format === 'all' ? 'Svi formati' : `${promotion.format} cm`}</span>
                            {promotion.validUntil && (
                              <span>
                                📅 Do: {new Date(promotion.validUntil).toLocaleDateString('sr-RS', {
                                  day: 'numeric',
                                  month: 'numeric',
                                  year: 'numeric'
                                })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button className="bg-white text-orange-600 px-6 py-2 rounded-full font-bold">
                        Iskoristi Sada!
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="flex justify-end mt-8 pt-6 border-t-2">
            <Button
              onClick={handleSave}
              size="lg"
              className="bg-orange-600 hover:bg-orange-700 text-white gap-2 px-8"
            >
              <Save size={20} />
              Sačuvaj Promociju
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminPromotion;
