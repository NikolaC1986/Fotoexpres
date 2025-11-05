import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { toast } from '../hooks/use-toast';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminLogin = () => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/admin/login`, credentials);
      
      if (response.data.success) {
        localStorage.setItem('adminToken', response.data.token);
        toast({
          title: "Prijava uspešna",
          description: "Dobrodošli u admin panel"
        });
        navigate('/admin/dashboard');
      }
    } catch (error) {
      toast({
        title: "Greška pri prijavi",
        description: error.response?.data?.detail || "Pogrešno korisničko ime ili lozinka",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center py-12 px-6">
      <Card className="w-full max-w-md p-10 shadow-2xl">
        <div className="text-center mb-8">
          <div className="bg-orange-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-10 h-10 text-orange-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Prijava</h1>
          <p className="text-gray-600">Prijavite se da upravljate porudžbinama</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="username" className="text-base font-semibold">Korisničko Ime</Label>
            <div className="relative mt-2">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                id="username"
                type="text"
                value={credentials.username}
                onChange={(e) => setCredentials({...credentials, username: e.target.value})}
                placeholder="admin"
                className="pl-10 border-2"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="password" className="text-base font-semibold">Lozinka</Label>
            <div className="relative mt-2">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                id="password"
                type="password"
                value={credentials.password}
                onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                placeholder="••••••••"
                className="pl-10 border-2"
                required
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-orange-600 hover:bg-orange-700 text-white py-6 text-lg font-semibold"
            disabled={loading}
          >
            {loading ? 'Prijavljivanje...' : 'Prijavi Se'}
          </Button>
        </form>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-700">
            <strong>Napomena:</strong> Korisničko ime: <code className="bg-white px-2 py-1 rounded">admin</code><br />
            Lozinka: <code className="bg-white px-2 py-1 rounded">admin123</code>
          </p>
        </div>
      </Card>
    </div>
  );
};

export default AdminLogin;