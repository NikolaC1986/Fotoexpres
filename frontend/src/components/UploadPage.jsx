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
      title: "Photos uploaded",
      description: `${files.length} photo(s) added successfully`
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
        title: "No photos",
        description: "Please upload at least one photo",
        variant: "destructive"
      });
      return;
    }

    if (!contactInfo.fullName || !contactInfo.email || !contactInfo.phone || !contactInfo.address) {
      toast({
        title: "Missing information",
        description: "Please fill in all contact details",
        variant: "destructive"
      });
      return;
    }

    try {
      toast({
        title: "Submitting order...",
        description: "Please wait while we process your order"
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
        title: "Order submitted!",
        description: `Your order #${orderNumber} has been received. We'll contact you soon.`
      });

      setTimeout(() => {
        navigate('/');
      }, 2000);
      
    } catch (error) {
      console.error('Order submission error:', error);
      toast({
        title: "Order failed",
        description: error.response?.data?.detail || "Failed to submit order. Please try again.",
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
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Upload Your Photos</h1>
          <p className="text-xl text-gray-600">Select your photos, choose formats and quantities, then provide delivery details.</p>
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
              <h3 className="text-2xl font-bold mb-3 text-gray-900">Click to upload photos</h3>
              <p className="text-gray-500 text-lg">or drag and drop your images here</p>
              <p className="text-sm text-gray-400 mt-4">Supports: JPG, PNG, HEIC (Max 10MB per file)</p>
            </div>
          </label>
        </Card>

        {/* Photos Grid */}
        {photos.length > 0 && (
          <div className="mb-12">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Your Photos ({photos.length})</h2>
              <div className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold">
                Total prints: {totalPhotos}
              </div>
            </div>

            <div className="grid gap-6">
              {photos.map(photo => (
                <Card key={photo.id} className="p-6 hover:shadow-xl transition-shadow bg-white border-2 border-gray-200">
                  <div className="grid md:grid-cols-6 gap-6 items-center">
                    <div className="relative group">
                      <img 
                        src={photo.preview} 
                        alt="Preview" 
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
                      <Label className="text-sm font-semibold mb-2 block text-gray-700">Quantity</Label>
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
                      <Label className="text-sm font-semibold mb-2 block text-gray-700">Paper Finish</Label>
                      <Select value={photo.finish} onValueChange={(value) => updatePhoto(photo.id, 'finish', value)}>
                        <SelectTrigger className="border-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="glossy">Glossy</SelectItem>
                          <SelectItem value="matte">Matte</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="md:col-span-2">
                      <p className="font-semibold text-gray-900">{photo.file.name}</p>
                      <p className="text-sm text-gray-500">{(photo.file.size / 1024 / 1024).toFixed(2)} MB</p>
                      <div className="flex items-center gap-2 mt-2 text-green-600">
                        <CheckCircle size={16} />
                        <span className="text-sm font-medium">Ready to print</span>
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
            <h2 className="text-3xl font-bold mb-8 text-gray-900">Delivery Information</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="fullName" className="text-base font-semibold">Full Name *</Label>
                  <Input 
                    id="fullName"
                    value={contactInfo.fullName}
                    onChange={(e) => setContactInfo({...contactInfo, fullName: e.target.value})}
                    placeholder="John Doe"
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
                    placeholder="john@example.com"
                    className="mt-2 border-2"
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="phone" className="text-base font-semibold">Phone Number *</Label>
                  <Input 
                    id="phone"
                    value={contactInfo.phone}
                    onChange={(e) => setContactInfo({...contactInfo, phone: e.target.value})}
                    placeholder="+381 66 123 4567"
                    className="mt-2 border-2"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="address" className="text-base font-semibold">Delivery Address *</Label>
                  <Input 
                    id="address"
                    value={contactInfo.address}
                    onChange={(e) => setContactInfo({...contactInfo, address: e.target.value})}
                    placeholder="Street, City, Postal Code"
                    className="mt-2 border-2"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes" className="text-base font-semibold">Additional Notes (Optional)</Label>
                <Textarea 
                  id="notes"
                  value={contactInfo.notes}
                  onChange={(e) => setContactInfo({...contactInfo, notes: e.target.value})}
                  placeholder="Any special instructions or notes..."
                  rows={4}
                  className="mt-2 border-2"
                />
              </div>

              <div className="flex justify-end gap-4 pt-6 border-t-2">
                <Button type="button" variant="outline" size="lg" onClick={() => navigate('/')} className="border-2">
                  Cancel
                </Button>
                <Button type="submit" size="lg" className="bg-blue-600 hover:bg-blue-700 text-white gap-2 px-8">
                  <ImageIcon size={20} />
                  Submit Order ({totalPhotos} prints)
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