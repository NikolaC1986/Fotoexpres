import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Link as LinkIcon, Save, Eye, EyeOff } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from '../hooks/use-toast';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminPromoBanner = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState({
    isActive: false,
    desktopImage: '',
    tabletImage: '',
    mobileImage: '',
    linkUrl: '',
    desktopPreview: '',
    tabletPreview: '',
    mobilePreview: '',
    desktopFile: null,
    tabletFile: null,
    mobileFile: null
  });

  useEffect(() => {
    document.title = 'Reklamni Baner | Admin Panel';
    fetchBanner();
  }, []);

  const fetchBanner = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API}/admin/promo-banner`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data.success && response.data.banner) {
        const bannerData = response.data.banner;
        setBanner({
          isActive: bannerData.isActive || false,
          desktopImage: bannerData.desktopImage || '',
          tabletImage: bannerData.tabletImage || '',
          mobileImage: bannerData.mobileImage || '',
          linkUrl: bannerData.linkUrl || '',
          desktopPreview: bannerData.desktopImage || '',
          tabletPreview: bannerData.tabletImage || '',
          mobilePreview: bannerData.mobileImage || '',
          desktopFile: null,
          tabletFile: null,
          mobileFile: null
        });
      }
    } catch (error) {
      console.error('Error fetching banner:', error);
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return '';
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://') || imageUrl.startsWith('data:')) {
      return imageUrl;
    }
    if (imageUrl.startsWith('/uploads/')) {
      return `${BACKEND_URL}/api${imageUrl}`;
    }
    return `${BACKEND_URL}${imageUrl}`;
  };

  const handleFileChange = (type, file) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setBanner(prev => ({
        ...prev,
        [`${type}Preview`]: reader.result,
        [`${type}File`]: file
      }));
    };
    reader.readAsDataURL(file);

    toast({
      title: "Fotografija izabrana",
      description: `${type === 'desktop' ? 'Desktop' : type === 'tablet' ? 'Tablet' : 'Mobilni'} baner je spreman za upload`
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('adminToken');
      
      // Upload images if new files are selected
      let desktopImageUrl = banner.desktopImage;
      let tabletImageUrl = banner.tabletImage;
      let mobileImageUrl = banner.mobileImage;

      // Upload desktop image
      if (banner.desktopFile) {
        const formData = new FormData();
        formData.append('image', banner.desktopFile);
        
        const uploadResponse = await axios.post(
          `${API}/admin/promo-banner/upload-image`,
          formData,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );
        
        if (uploadResponse.data.success) {
          desktopImageUrl = uploadResponse.data.imageUrl;
        }
      }

      // Upload tablet image
      if (banner.tabletFile) {
        const formData = new FormData();
        formData.append('image', banner.tabletFile);
        
        const uploadResponse = await axios.post(
          `${API}/admin/promo-banner/upload-image`,
          formData,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );
        
        if (uploadResponse.data.success) {
          tabletImageUrl = uploadResponse.data.imageUrl;
        }
      }

      // Upload mobile image
      if (banner.mobileFile) {
        const formData = new FormData();
        formData.append('image', banner.mobileFile);
        
        const uploadResponse = await axios.post(
          `${API}/admin/promo-banner/upload-image`,
          formData,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );
        
        if (uploadResponse.data.success) {
          mobileImageUrl = uploadResponse.data.imageUrl;
        }
      }

      // Save banner configuration
      await axios.put(
        `${API}/admin/promo-banner`,
        {
          isActive: banner.isActive,
          desktopImage: desktopImageUrl,
          tabletImage: tabletImageUrl,
          mobileImage: mobileImageUrl,
          linkUrl: banner.linkUrl
        },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      toast({
        title: "Uspešno!",
        description: "Reklamni baner je ažuriran"
      });

      // Refresh data
      fetchBanner();
    } catch (error) {
      console.error('Error saving banner:', error);
      toast({
        title: "Greška",
        description: "Nije moguće sačuvati baner",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
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
            <h1 className="text-2xl font-bold text-gray-900">Reklamni Baner</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setBanner(prev => ({ ...prev, isActive: !prev.isActive }))}
              className={`gap-2 ${banner.isActive ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-500 hover:bg-gray-600'}`}
            >
              {banner.isActive ? <Eye size={18} /> : <EyeOff size={18} />}
              {banner.isActive ? 'Aktivan' : 'Neaktivan'}
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-orange-600 hover:bg-orange-700 gap-2"
            >
              <Save size={18} />
              {saving ? 'Čuvanje...' : 'Sačuvaj'}
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Info Card */}
        <Card className="p-6 mb-6 bg-blue-50 border-blue-200">
          <h3 className="font-bold text-blue-900 mb-2">📐 Preporučene Dimenzije</h3>
          <div className="text-sm text-blue-800 space-y-1">
            <p><strong>Desktop:</strong> 1920 x 400 piksela (široki format)</p>
            <p><strong>Tablet:</strong> 1024 x 350 piksela (srednji format)</p>
            <p><strong>Mobilni:</strong> 430 x 250 piksela (kompaktan format)</p>
          </div>
        </Card>

        {/* Link URL */}
        <Card className="p-6 mb-6">
          <Label className="text-lg font-bold mb-4 block flex items-center gap-2">
            <LinkIcon size={20} />
            Link URL (Opciono)
          </Label>
          <Input
            value={banner.linkUrl}
            onChange={(e) => setBanner(prev => ({ ...prev, linkUrl: e.target.value }))}
            placeholder="https://example.com/promocija ili www.google.com"
            className="w-full"
          />
          <p className="text-sm text-gray-500 mt-2">
            💡 <strong>Savet:</strong> Možete uneti URL sa ili bez protokola. Primeri:
          </p>
          <ul className="text-sm text-gray-500 mt-1 ml-4 list-disc">
            <li>https://www.example.com/promocija</li>
            <li>www.example.com (automatski će biti dodato https://)</li>
          </ul>
        </Card>

        {/* Desktop Banner */}
        <Card className="p-6 mb-6">
          <Label className="text-lg font-bold mb-4 block">🖥️ Desktop Baner (1920x400px)</Label>
          
          {banner.desktopPreview && (
            <div className="mb-4">
              <img
                src={banner.desktopPreview.startsWith('data:') ? banner.desktopPreview : getImageUrl(banner.desktopPreview)}
                alt="Desktop Preview"
                className="w-full h-auto rounded-lg border-2 border-gray-200"
                style={{ maxHeight: '400px', objectFit: 'cover' }}
              />
            </div>
          )}

          <input
            type="file"
            id="desktopImageUpload"
            accept="image/*"
            onChange={(e) => handleFileChange('desktop', e.target.files[0])}
            className="hidden"
          />
          <Button
            type="button"
            onClick={() => document.getElementById('desktopImageUpload').click()}
            variant="outline"
            className="w-full border-2 gap-2"
          >
            <Upload size={18} />
            {banner.desktopPreview ? 'Promeni Desktop Baner' : 'Upload Desktop Baner'}
          </Button>
        </Card>

        {/* Tablet Banner */}
        <Card className="p-6 mb-6">
          <Label className="text-lg font-bold mb-4 block">📱 Tablet Baner (1024x350px)</Label>
          
          {banner.tabletPreview && (
            <div className="mb-4">
              <img
                src={banner.tabletPreview.startsWith('data:') ? banner.tabletPreview : getImageUrl(banner.tabletPreview)}
                alt="Tablet Preview"
                className="w-full h-auto rounded-lg border-2 border-gray-200"
                style={{ maxHeight: '350px', objectFit: 'cover' }}
              />
            </div>
          )}

          <input
            type="file"
            id="tabletImageUpload"
            accept="image/*"
            onChange={(e) => handleFileChange('tablet', e.target.files[0])}
            className="hidden"
          />
          <Button
            type="button"
            onClick={() => document.getElementById('tabletImageUpload').click()}
            variant="outline"
            className="w-full border-2 gap-2"
          >
            <Upload size={18} />
            {banner.tabletPreview ? 'Promeni Tablet Baner' : 'Upload Tablet Baner'}
          </Button>
          <p className="text-sm text-gray-500 mt-2">
            Opciono: Ako nije postavljen, koristiće se desktop verzija
          </p>
        </Card>

        {/* Mobile Banner */}
        <Card className="p-6 mb-6">
          <Label className="text-lg font-bold mb-4 block">📱 Mobilni Baner (430x250px)</Label>
          
          {banner.mobilePreview && (
            <div className="mb-4">
              <img
                src={banner.mobilePreview.startsWith('data:') ? banner.mobilePreview : getImageUrl(banner.mobilePreview)}
                alt="Mobile Preview"
                className="w-full h-auto rounded-lg border-2 border-gray-200"
                style={{ maxHeight: '250px', objectFit: 'cover' }}
              />
            </div>
          )}

          <input
            type="file"
            id="mobileImageUpload"
            accept="image/*"
            onChange={(e) => handleFileChange('mobile', e.target.files[0])}
            className="hidden"
          />
          <Button
            type="button"
            onClick={() => document.getElementById('mobileImageUpload').click()}
            variant="outline"
            className="w-full border-2 gap-2"
          >
            <Upload size={18} />
            {banner.mobilePreview ? 'Promeni Mobilni Baner' : 'Upload Mobilni Baner'}
          </Button>
          <p className="text-sm text-gray-500 mt-2">
            Opciono: Ako nije postavljen, koristiće se tablet ili desktop verzija
          </p>
        </Card>
      </div>
    </div>
  );
};

export default AdminPromoBanner;
