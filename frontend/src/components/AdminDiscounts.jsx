import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Percent, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from '../hooks/use-toast';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminDiscounts = () => {
  const navigate = useNavigate();
  const [discounts, setDiscounts] = useState({
    '50': 5,
    '100': 10,
    '200': 15
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin');
      return;
    }
    fetchDiscounts();
  }, [navigate]);

  const fetchDiscounts = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API}/admin/discounts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setDiscounts(response.data.discounts);
    } catch (error) {
      toast({
        title: "Greška",
        description: "Nije moguće učitati popuste",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(`${API}/admin/discounts`, 
        { discounts },
        { headers: { 'Authorization': `Bearer ${token}` }}
      );
      
      toast({
        title: "Uspešno sačuvano",
        description: "Popusti su ažurirani"
      });
    } catch (error) {
      toast({
        title: "Greška",
        description: "Nije moguće sačuvati popuste",
        variant: "destructive"
      });
    }
  };

  const updateDiscount = (quantity, value) => {
    setDiscounts({
      ...discounts,
      [quantity]: parseInt(value) || 0
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
          <Link to="/logovanje/dashboard">
            <Button variant="outline" className="mb-4 gap-2">
              <ArrowLeft size={18} />
              Nazad na Dashboard
            </Button>
          </Link>
          <h1 className="text-4xl font-bold text-gray-900">Popusti na Količinu</h1>
          <p className="text-gray-600 mt-2">Postavite automatske popuste za veće količine fotografija</p>
        </div>

        {/* Info Card */}
        <Card className="p-6 mb-6 bg-blue-50 border-2 border-blue-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Kako funkcioniše?</h3>
              <p className="text-sm text-blue-800">
                Popusti se automatski primenjuju kada kupac poruči određeni broj fotografija. 
                Na primer, ako postavite 10% popust za 100 fotografija, kupac će automatski dobiti 10% popusta na celokupnu porudžbinu kada uploaduje 100 ili više fotografija.
              </p>
            </div>
          </div>
        </Card>

        {/* Discount Settings */}
        <Card className="p-8">
          <div className="space-y-8">
            {/* 50 Photos Discount */}
            <div className="flex items-center gap-6 p-6 bg-orange-50 rounded-lg border-2 border-orange-200">
              <div className="bg-orange-600 text-white p-4 rounded-lg">
                <Percent size={32} />
              </div>
              <div className="flex-1">
                <Label className="text-lg font-semibold text-gray-900 mb-2 block">
                  Popust za 50+ fotografija
                </Label>
                <p className="text-sm text-gray-600 mb-3">
                  Kupci koji uploaduju 50 ili više fotografija dobijaju ovaj popust
                </p>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={discounts['50']}
                    onChange={(e) => updateDiscount('50', e.target.value)}
                    className="w-32 text-lg font-semibold"
                  />
                  <span className="text-xl font-bold text-orange-600">% popusta</span>
                </div>
              </div>
            </div>

            {/* 100 Photos Discount */}
            <div className="flex items-center gap-6 p-6 bg-green-50 rounded-lg border-2 border-green-200">
              <div className="bg-green-600 text-white p-4 rounded-lg">
                <Percent size={32} />
              </div>
              <div className="flex-1">
                <Label className="text-lg font-semibold text-gray-900 mb-2 block">
                  Popust za 100+ fotografija
                </Label>
                <p className="text-sm text-gray-600 mb-3">
                  Kupci koji uploaduju 100 ili više fotografija dobijaju ovaj popust
                </p>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={discounts['100']}
                    onChange={(e) => updateDiscount('100', e.target.value)}
                    className="w-32 text-lg font-semibold"
                  />
                  <span className="text-xl font-bold text-green-600">% popusta</span>
                </div>
              </div>
            </div>

            {/* 200 Photos Discount */}
            <div className="flex items-center gap-6 p-6 bg-blue-50 rounded-lg border-2 border-blue-200">
              <div className="bg-blue-600 text-white p-4 rounded-lg">
                <Percent size={32} />
              </div>
              <div className="flex-1">
                <Label className="text-lg font-semibold text-gray-900 mb-2 block">
                  Popust za 200+ fotografija
                </Label>
                <p className="text-sm text-gray-600 mb-3">
                  Kupci koji uploaduju 200 ili više fotografija dobijaju ovaj popust
                </p>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={discounts['200']}
                    onChange={(e) => updateDiscount('200', e.target.value)}
                    className="w-32 text-lg font-semibold"
                  />
                  <span className="text-xl font-bold text-blue-600">% popusta</span>
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end mt-8 pt-6 border-t-2">
            <Button
              onClick={handleSave}
              size="lg"
              className="bg-orange-600 hover:bg-orange-700 text-white gap-2 px-8"
            >
              <Save size={20} />
              Sačuvaj Popuste
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDiscounts;
