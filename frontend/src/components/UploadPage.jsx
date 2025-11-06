import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X, Plus, Minus, Image as ImageIcon, CheckCircle, DollarSign } from 'lucide-react';
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

// Cene po formatima
const PRICE_MAP = {
  '9x13': 12,
  '10x15': 18,
  '13x18': 25,
  '15x21': 50,
  '20x30': 150,
  '30x45': 250
};

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
  const [cropOption, setCropOption] = useState(false);
  const [fillWhiteOption, setFillWhiteOption] = useState(false);
  const [freeDeliveryLimit, setFreeDeliveryLimit] = useState(5000);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Load settings on mount
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API}/settings`);
      if (response.data.settings) {
        setFreeDeliveryLimit(response.data.settings.freeDeliveryLimit);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      // Use default if fetch fails
      setFreeDeliveryLimit(5000);
    }
  };

  // Dinamički izračunaj totalnu cenu
  const totalPrice = useMemo(() => {
    return photos.reduce((sum, photo) => {
      const price = PRICE_MAP[photo.format] || 0;
      return sum + (price * photo.quantity);
    }, 0);
  }, [photos]);

  const totalPhotos = useMemo(() => {
    return photos.reduce((sum, photo) => sum + photo.quantity, 0);
  }, [photos]);

  const deliveryFee = useMemo(() => {
    return totalPrice >= 5000 ? 0 : 400;
  }, [totalPrice]);

  const grandTotal = totalPrice + deliveryFee;

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

  const resetForm = () => {
    setPhotos([]);
    setContactInfo({
      fullName: '',
      email: '',
      phone: '',
      address: '',
      notes: ''
    });
    setCropOption(false);
    setFillWhiteOption(false);
    setUploadProgress(0);
    setIsUploading(false);
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
      setIsUploading(true);
      setUploadProgress(0);

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
        })),
        totalPrice: grandTotal,
        cropOption: cropOption,
        fillWhiteOption: fillWhiteOption
      };
      formData.append('order_details', JSON.stringify(orderDetails));

      const response = await axios.post(`${API}/orders/create`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 300000, // 5 minutes timeout for large uploads
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });

      const { orderNumber } = response.data;
      
      toast({
        title: "Porudžbina poslata!",
        description: `Vaša porudžbina #${orderNumber} je primljena. Uskoro ćemo vas kontaktirati.`,
        duration: 3000
      });

      // Reset form after successful submission
      setTimeout(() => {
        resetForm();
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 1500);
      
    } catch (error) {
      console.error('Greška pri slanju porudžbine:', error);
      setIsUploading(false);
      setUploadProgress(0);
      toast({
        title: "Porudžbina neuspešna",
        description: error.response?.data?.detail || "Nije moguće poslati porudžbinu. Molimo pokušajte ponovo.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Pošaljite Vaše Fotografije</h1>
          <p className="text-xl text-gray-600">Izaberite fotografije, formate i količinu, zatim unesite podatke za dostavu.</p>
        </div>

        {/* Upload Area */}
        <Card className="p-12 mb-12 border-2 border-dashed border-gray-300 hover:border-orange-500 transition-all bg-white">
          <label className="cursor-pointer block">
            <input 
              type="file" 
              multiple 
              accept="image/*" 
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="text-center py-16">
              <div className="bg-orange-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                <Upload className="w-12 h-12 text-orange-600" />
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
              <div className="flex gap-4">
                <div className="bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold">
                  Ukupno: {totalPhotos} komada
                </div>
                <div className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2">
                  <DollarSign size={20} />
                  {totalPrice} RSD
                </div>
              </div>
            </div>

            {/* Bulk Format Selector */}
            <Card className="p-6 mb-6 bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-300">
              <div className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="bg-orange-600 text-white p-3 rounded-lg">
                    <ImageIcon size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Promeni Format za Sve Fotografije</h3>
                    <p className="text-sm text-gray-600">Izaberite format koji želite primeniti na sve fotografije odjednom</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Select onValueChange={(value) => {
                    setPhotos(photos.map(photo => ({ ...photo, format: value })));
                    toast({
                      title: "Format promenjen",
                      description: `Sve fotografije su postavljene na ${value} cm format`
                    });
                  }}>
                    <SelectTrigger className="w-64 border-2 border-orange-400 bg-white">
                      <SelectValue placeholder="Izaberite format za sve" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="9x13">9x13 cm - 12 RSD</SelectItem>
                      <SelectItem value="10x15">10x15 cm - 18 RSD</SelectItem>
                      <SelectItem value="13x18">13x18 cm - 25 RSD</SelectItem>
                      <SelectItem value="15x21">15x21 cm - 50 RSD</SelectItem>
                      <SelectItem value="20x30">20x30 cm - 150 RSD</SelectItem>
                      <SelectItem value="30x45">30x45 cm - 250 RSD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>

            {/* Photo Processing Options */}
            <Card className="p-6 mb-6 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <ImageIcon size={20} className="text-purple-600" />
                Opcije Obrade Fotografija (izaberite jednu)
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="cropOption"
                    checked={cropOption}
                    onChange={(e) => {
                      setCropOption(e.target.checked);
                      if (e.target.checked) {
                        setFillWhiteOption(false);
                      }
                    }}
                    className="mt-1 w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="cropOption" className="cursor-pointer">
                    <div className="font-semibold text-gray-900">Kropovati fotografiju kako bi je prilagodili formatu koji ste odabrali</div>
                    <p className="text-sm text-gray-600">Fotografija će biti isečena da se uklopi u izabrani format bez belih ivica</p>
                  </label>
                </div>
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="fillWhiteOption"
                    checked={fillWhiteOption}
                    onChange={(e) => {
                      setFillWhiteOption(e.target.checked);
                      if (e.target.checked) {
                        setCropOption(false);
                      }
                    }}
                    className="mt-1 w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="fillWhiteOption" className="cursor-pointer">
                    <div className="font-semibold text-gray-900">Popunite belim</div>
                    <p className="text-sm text-gray-600">Fotografija će biti centrirana a prazni prostor popunjen belom bojom</p>
                  </label>
                </div>
              </div>
            </Card>

            <div className="grid gap-6">
              {photos.map(photo => {
                const photoPrice = PRICE_MAP[photo.format] * photo.quantity;
                return (
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
                            <SelectItem value="9x13">9x13 cm - 12 RSD</SelectItem>
                            <SelectItem value="10x15">10x15 cm - 18 RSD</SelectItem>
                            <SelectItem value="13x18">13x18 cm - 25 RSD</SelectItem>
                            <SelectItem value="15x21">15x21 cm - 50 RSD</SelectItem>
                            <SelectItem value="20x30">20x30 cm - 150 RSD</SelectItem>
                            <SelectItem value="30x45">30x45 cm - 250 RSD</SelectItem>
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
                        <Label className="text-sm font-semibold mb-2 block text-gray-700">Tip Papira</Label>
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
                        <div className="flex items-center gap-2 mt-2">
                          <CheckCircle size={16} className="text-green-600" />
                          <span className="text-sm font-medium text-green-600">Spremno za štampu</span>
                        </div>
                        <div className="mt-2 text-lg font-bold text-blue-600">
                          {photoPrice} RSD
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Price Summary */}
            <Card className="p-8 mt-8 bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-300">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Pregled Cene</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-lg">
                  <span className="text-gray-700">Fotografije ({totalPhotos} kom):</span>
                  <span className="font-semibold">{totalPrice} RSD</span>
                </div>
                <div className="flex justify-between items-center text-lg">
                  <span className="text-gray-700">Dostava:</span>
                  <span className="font-semibold">
                    {deliveryFee === 0 ? (
                      <span className="text-green-600">BESPLATNO</span>
                    ) : (
                      `${deliveryFee} RSD`
                    )}
                  </span>
                </div>
                {totalPrice < 5000 && (
                  <p className="text-sm text-gray-600 italic">
                    * Besplatna dostava za porudžbine preko 5000 RSD (još {5000 - totalPrice} RSD)
                  </p>
                )}
                <div className="border-t-2 border-orange-300 pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-gray-900">UKUPNO:</span>
                    <span className="text-3xl font-bold text-orange-600">{grandTotal} RSD</span>
                  </div>
                </div>
              </div>
            </Card>
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
                    placeholder="petar@primer.rs"
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

              {isUploading && (
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-gray-700">Slanje fotografija...</span>
                    <span className="text-sm font-bold text-orange-600">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-orange-500 to-orange-600 h-4 rounded-full transition-all duration-300 ease-out flex items-center justify-center"
                      style={{ width: `${uploadProgress}%` }}
                    >
                      {uploadProgress > 10 && (
                        <span className="text-xs text-white font-semibold">{uploadProgress}%</span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Molimo ne zatvarajte stranicu dok se fotografije šalju
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-4 pt-6 border-t-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="lg" 
                  onClick={() => navigate('/')} 
                  className="border-2"
                  disabled={isUploading}
                >
                  Otkaži
                </Button>
                <Button 
                  type="submit" 
                  size="lg" 
                  className="bg-orange-600 hover:bg-orange-700 text-white gap-2 px-8 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isUploading}
                >
                  <ImageIcon size={20} />
                  {isUploading ? 'Slanje...' : `Pošalji Porudžbinu - ${grandTotal} RSD`}
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