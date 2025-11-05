import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X, Plus, Minus, Image as ImageIcon, CheckCircle } from 'lucide-react';
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

const UploadPage = () => {
  const navigate = useNavigate();
  const [photos, setPhotos] = useState([]);
  const [contactInfo, setContactInfo] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    notes: ''
  });

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const newPhotos = files.map((file, index) => ({
      id: Date.now() + index,
      file: file,
      preview: URL.createObjectURL(file),
      format: '10x15',
      quantity: 1,
      finish: 'glossy'
    }));
    setPhotos([...photos, ...newPhotos]);
    toast({
      title: "Fotografije dodate",
      description: `${files.length} fotografija uspešno dodato`
    });
  };

  const removePhoto = (id) => {
    setPhotos(photos.filter(photo => photo.id !== id));
  };

  const updatePhoto = (id, field, value) => {
    setPhotos(photos.map(photo => 
      photo.id === id ? { ...photo, [field]: value } : photo
    ));
  };

  const updateQuantity = (id, increment) => {
    setPhotos(photos.map(photo => {
      if (photo.id === id) {
        const newQuantity = Math.max(1, photo.quantity + increment);
        return { ...photo, quantity: newQuantity };
      }
      return photo;
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (photos.length === 0) {
      toast({
        title: "Nema fotografija",
        description: "Molimo vas da dodate barem jednu fotografiju",
        variant: "destructive"
      });
      return;
    }

    if (!contactInfo.fullName || !contactInfo.email || !contactInfo.phone || !contactInfo.address) {
      toast({
        title: "Nedostaju informacije",
        description: "Molimo vas da popunite sva obavezna polja",
        variant: "destructive"
      });
      return;
    }

    try {
      toast({
        title: "Slanje porudžbine...",
        description: "Molimo sačekajte dok obrađujemo vašu porudžbinu"
      });

      const formData = new FormData();
      photos.forEach(photo => {
        formData.append('photos', photo.file);
      });

      const orderDetails = {
        contactInfo,
        photoSettings: photos.map(p => ({
          fileName: p.file.name,
          format: p.format,
          quantity: p.quantity,
          finish: p.finish
        }))
      };
      formData.append('order_details', JSON.stringify(orderDetails));

      const response = await axios.post(`${API}/orders/create`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const { orderNumber } = response.data;
      
      toast({
        title: "Porudžbina poslata!",
        description: `Vaša porudžbina #${orderNumber} je primljena. Uskoro ćemo vas kontaktirati.`
      });

      setTimeout(() => {
        navigate('/');
      }, 2000);
      
    } catch (error) {
      console.error('Greška pri slanju porudžbine:', error);
      toast({
        title: "Porudžbina neuspešna",
        description: error.response?.data?.detail || "Nije moguće poslati porudžbinu. Molimo pokušajte ponovo.",
        variant: "destructive"
      });
    }
  };

  const totalPhotos = photos.reduce((sum, photo) => sum + photo.quantity, 0);

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Pošaljite Vaše Fotografije</h1>
          <p className="text-xl text-gray-600">Izaberite fotografije, formate i količinu, zatim unesite podatke za dostavu.</p>
        </div>

        {/* Upload Area */}
        <Card className="p-12 mb-12 border-2 border-dashed border-gray-300 hover:border-blue-500 transition-all bg-white">
          <label className="cursor-pointer block">
            <input 
              type="file" 
              multiple 
              accept="image/*" 
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="text-center py-16">
              <div className="bg-blue-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                <Upload className="w-12 h-12 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">Kliknite za slanje fotografija</h3>
              <p className="text-gray-500 text-lg">ili prevucite vaše slike ovde</p>
              <p className="text-sm text-gray-400 mt-4">Podržani formati: JPG, PNG, HEIC (Maksimalno 10MB po fajlu)</p>
            </div>
          </label>
        </Card>

        {/* Photos Grid */}
        {photos.length > 0 && (
          <div className="mb-12">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Vaše Fotografije ({photos.length})</h2>
              <div className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold">
                Ukupno: {totalPhotos} komada
              </div>
            </div>

            <div className="grid gap-6">
              {photos.map(photo => (
                <Card key={photo.id} className="p-6 hover:shadow-xl transition-shadow bg-white border-2 border-gray-200">
                  <div className="grid md:grid-cols-6 gap-6 items-center">
                    <div className="relative group">
                      <img 
                        src={photo.preview} 
                        alt="Pregled" 
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => removePhoto(photo.id)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    <div>
                      <Label className="text-sm font-semibold mb-2 block text-gray-700">Format</Label>
                      <Select value={photo.format} onValueChange={(value) => updatePhoto(photo.id, 'format', value)}>
                        <SelectTrigger className="border-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10x15">10x15 cm</SelectItem>
                          <SelectItem value="13x18">13x18 cm</SelectItem>
                          <SelectItem value="15x21">15x21 cm</SelectItem>
                          <SelectItem value="20x30">20x30 cm</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-sm font-semibold mb-2 block text-gray-700">Količina</Label>
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="border-2"
                          onClick={() => updateQuantity(photo.id, -1)}
                          disabled={photo.quantity <= 1}
                        >
                          <Minus size={16} />
                        </Button>
                        <span className="w-12 text-center font-bold text-lg">{photo.quantity}</span>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="border-2"
                          onClick={() => updateQuantity(photo.id, 1)}
                        >
                          <Plus size={16} />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-semibold mb-2 block text-gray-700">Završetak Papira</Label>
                      <Select value={photo.finish} onValueChange={(value) => updatePhoto(photo.id, 'finish', value)}>
                        <SelectTrigger className="border-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="glossy">Sjajni</SelectItem>
                          <SelectItem value="matte">Mat</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="md:col-span-2">
                      <p className="font-semibold text-gray-900">{photo.file.name}</p>
                      <p className="text-sm text-gray-500">{(photo.file.size / 1024 / 1024).toFixed(2)} MB</p>
                      <div className="flex items-center gap-2 mt-2 text-green-600">
                        <CheckCircle size={16} />
                        <span className="text-sm font-medium">Spremno za štampu</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Contact Form */}
        {photos.length > 0 && (
          <Card className="p-10 bg-white border-2 border-gray-200">
            <h2 className="text-3xl font-bold mb-8 text-gray-900">Informacije za Dostavu</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="fullName" className="text-base font-semibold">Ime i Prezime *</Label>
                  <Input 
                    id="fullName"
                    value={contactInfo.fullName}
                    onChange={(e) => setContactInfo({...contactInfo, fullName: e.target.value})}
                    placeholder="Petar Petrović"
                    className="mt-2 border-2"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-base font-semibold">Email *</Label>
                  <Input 
                    id="email"
                    type="email"
                    value={contactInfo.email}
                    onChange={(e) => setContactInfo({...contactInfo, email: e.target.value})}
                    placeholder="petar@primer.com"
                    className="mt-2 border-2"
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="phone" className="text-base font-semibold">Broj Telefona *</Label>
                  <Input 
                    id="phone"
                    value={contactInfo.phone}
                    onChange={(e) => setContactInfo({...contactInfo, phone: e.target.value})}
                    placeholder="066 123 4567"
                    className="mt-2 border-2"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="address" className="text-base font-semibold">Adresa za Dostavu *</Label>
                  <Input 
                    id="address"
                    value={contactInfo.address}
                    onChange={(e) => setContactInfo({...contactInfo, address: e.target.value})}
                    placeholder="Ulica, Grad, Poštanski Broj"
                    className="mt-2 border-2"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes" className="text-base font-semibold">Dodatne Napomene (Opciono)</Label>
                <Textarea 
                  id="notes"
                  value={contactInfo.notes}
                  onChange={(e) => setContactInfo({...contactInfo, notes: e.target.value})}
                  placeholder="Bilo kakve posebne napomene ili instrukcije..."
                  rows={4}
                  className="mt-2 border-2"
                />
              </div>

              <div className="flex justify-end gap-4 pt-6 border-t-2">
                <Button type="button" variant="outline" size="lg" onClick={() => navigate('/')} className="border-2">
                  Otkaži
                </Button>
                <Button type="submit" size="lg" className="bg-blue-600 hover:bg-blue-700 text-white gap-2 px-8">
                  <ImageIcon size={20} />
                  Pošalji Porudžbinu ({totalPhotos} komada)
                </Button>
              </div>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
};

export default UploadPage;