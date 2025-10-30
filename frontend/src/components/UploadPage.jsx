import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X, Plus, Minus, Image as ImageIcon } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from './ui/use-toast';

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

  const handleSubmit = (e) => {
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

    // Mock order submission
    const orderNumber = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
    toast({
      title: "Order submitted!",
      description: `Your order #${orderNumber} has been received. We'll contact you soon.`
    });

    // Store in localStorage for mock
    localStorage.setItem('lastOrder', JSON.stringify({ orderNumber, photos, contactInfo }));
    
    setTimeout(() => {
      navigate('/');
    }, 2000);
  };

  const totalPhotos = photos.reduce((sum, photo) => sum + photo.quantity, 0);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Upload Your Photos</h1>
          <p className="text-gray-600">Select your photos, choose formats and quantities, then provide delivery details.</p>
        </div>

        {/* Upload Area */}
        <Card className="p-8 mb-8 border-2 border-dashed border-gray-300 hover:border-[#FFB8BA] transition-all">
          <label className="cursor-pointer block">
            <input 
              type="file" 
              multiple 
              accept="image/*" 
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="text-center py-12">
              <div className="bg-[#FFB8BA] w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Click to upload photos</h3>
              <p className="text-gray-500">or drag and drop your images here</p>
              <p className="text-sm text-gray-400 mt-2">Supports: JPG, PNG, HEIC</p>
            </div>
          </label>
        </Card>

        {/* Photos Grid */}
        {photos.length > 0 && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Your Photos ({photos.length})</h2>
              <div className="bg-[#FFB8BA] px-6 py-3 rounded-lg">
                <span className="text-gray-900 font-semibold">Total prints: {totalPhotos}</span>
              </div>
            </div>

            <div className="grid gap-6">
              {photos.map(photo => (
                <Card key={photo.id} className="p-6 hover:shadow-xl transition-shadow">
                  <div className="grid md:grid-cols-5 gap-6 items-center">
                    {/* Photo Preview */}
                    <div className="relative group">
                      <img 
                        src={photo.preview} 
                        alt="Preview" 
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => removePhoto(photo.id)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    {/* Format Selection */}
                    <div>
                      <Label className="text-sm font-semibold mb-2 block">Format</Label>
                      <Select value={photo.format} onValueChange={(value) => updatePhoto(photo.id, 'format', value)}>
                        <SelectTrigger>
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

                    {/* Quantity */}
                    <div>
                      <Label className="text-sm font-semibold mb-2 block">Quantity</Label>
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateQuantity(photo.id, -1)}
                          disabled={photo.quantity <= 1}
                        >
                          <Minus size={16} />
                        </Button>
                        <span className="w-12 text-center font-semibold">{photo.quantity}</span>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateQuantity(photo.id, 1)}
                        >
                          <Plus size={16} />
                        </Button>
                      </div>
                    </div>

                    {/* Paper Finish */}
                    <div>
                      <Label className="text-sm font-semibold mb-2 block">Paper Finish</Label>
                      <Select value={photo.finish} onValueChange={(value) => updatePhoto(photo.id, 'finish', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="glossy">Glossy</SelectItem>
                          <SelectItem value="matte">Matte</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Photo Info */}
                    <div className="text-sm text-gray-600">
                      <p className="font-semibold">{photo.file.name}</p>
                      <p className="text-xs text-gray-400">{(photo.file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Contact Form */}
        {photos.length > 0 && (
          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-6">Delivery Information</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input 
                    id="fullName"
                    value={contactInfo.fullName}
                    onChange={(e) => setContactInfo({...contactInfo, fullName: e.target.value})}
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input 
                    id="email"
                    type="email"
                    value={contactInfo.email}
                    onChange={(e) => setContactInfo({...contactInfo, email: e.target.value})}
                    placeholder="john@example.com"
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input 
                    id="phone"
                    value={contactInfo.phone}
                    onChange={(e) => setContactInfo({...contactInfo, phone: e.target.value})}
                    placeholder="+381 66 123 4567"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="address">Delivery Address *</Label>
                  <Input 
                    id="address"
                    value={contactInfo.address}
                    onChange={(e) => setContactInfo({...contactInfo, address: e.target.value})}
                    placeholder="Street, City, Postal Code"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <Textarea 
                  id="notes"
                  value={contactInfo.notes}
                  onChange={(e) => setContactInfo({...contactInfo, notes: e.target.value})}
                  placeholder="Any special instructions or notes..."
                  rows={4}
                />
              </div>

              <div className="flex justify-end gap-4 pt-6 border-t">
                <Button type="button" variant="outline" onClick={() => navigate('/')}>
                  Cancel
                </Button>
                <Button type="submit" size="lg" className="bg-[#FFB8BA] hover:bg-[#FF9B9D] text-gray-900 gap-2">
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