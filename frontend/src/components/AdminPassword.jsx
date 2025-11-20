import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Key, Eye, EyeOff, UserCog } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from '../hooks/use-toast';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminPassword = () => {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState('admin');
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
    viewerNew: false
  });
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [viewerPassword, setViewerPassword] = useState('');
  const [username, setUsername] = useState('');
  const [newUsername, setNewUsername] = useState('');

  useEffect(() => {
    document.title = 'Promena Lozinke | Fotoexpres';
    const token = localStorage.getItem('adminToken');
    const role = localStorage.getItem('adminRole') || 'admin';
    setUserRole(role);
    if (!token) {
      navigate('/logovanje');
      return;
    }
  }, [navigate]);

  const handleSavePassword = async () => {
    if (!passwords.currentPassword || !passwords.newPassword || !passwords.confirmPassword) {
      toast({
        title: "Greška",
        description: "Molimo popunite sva polja",
        variant: "destructive"
      });
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      toast({
        title: "Greška",
        description: "Nova lozinka i potvrda se ne poklapaju",
        variant: "destructive"
      });
      return;
    }

    if (passwords.newPassword.length < 8) {
      toast({
        title: "Greška",
        description: "Lozinka mora imati najmanje 8 karaktera",
        variant: "destructive"
      });
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.post(
        `${API}/admin/change-credentials`,
        {
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword,
          newUsername: newUsername || null
        },
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        toast({
          title: "Uspešno",
          description: "Kredencijali su uspešno promenjeni. Molimo prijavite se ponovo."
        });

        setPasswords({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });

        setTimeout(() => {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminRole');
          navigate('/logovanje');
        }, 2000);
      }
    } catch (error) {
      toast({
        title: "Greška",
        description: error.response?.data?.detail || "Nije moguće promeniti kredencijale",
        variant: "destructive"
      });
    }
  };

  const handleChangeViewerPassword = async () => {
    if (!viewerPassword || viewerPassword.trim() === '') {
      toast({
        title: "Greška",
        description: "Molimo unesite novu lozinku za Menadžer nalog",
        variant: "destructive"
      });
      return;
    }

    if (viewerPassword.length < 8) {
      toast({
        title: "Greška",
        description: "Lozinka mora imati najmanje 8 karaktera",
        variant: "destructive"
      });
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.post(
        `${API}/admin/change-viewer-password`,
        {
          newViewerPassword: viewerPassword
        },
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        toast({
          title: "Uspešno",
          description: "Lozinka za Menadžer nalog je uspešno promenjena."
        });

        setViewerPassword('');
      }
    } catch (error) {
      toast({
        title: "Greška",
        description: error.response?.data?.detail || "Nije moguće promeniti lozinku za Menadžer",
        variant: "destructive"
      });
    }
  };

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
          <h1 className="text-4xl font-bold text-gray-900">Sigurnost i pristup</h1>
          <p className="text-gray-600 mt-2">Promenite korisničko ime i lozinku</p>
        </div>

        {/* Username Section */}
        <Card className="p-8 border-2 border-gray-200 mb-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center">
              <Key className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Korisničko ime</h2>
              <p className="text-gray-600">Promenite korisničko ime za prijavu</p>
            </div>
          </div>

          <div className="max-w-md space-y-4">
            <div>
              <Label className="text-base font-semibold mb-3 block">
                Novo korisničko ime
              </Label>
              <Input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="text-lg border-2"
                placeholder="Unesite novo korisničko ime"
              />
            </div>
            <div>
              <Label className="text-base font-semibold mb-3 block">
                Trenutna lozinka (za potvrdu)
              </Label>
              <Input
                type="password"
                value={passwords.currentPassword}
                onChange={(e) => setPasswords({...passwords, currentPassword: e.target.value})}
                className="text-lg border-2"
                placeholder="Unesite trenutnu lozinku"
              />
            </div>
            <Button
              onClick={handleSavePassword}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
            >
              <Save size={18} />
              Sačuvaj korisničko ime
            </Button>
          </div>
        </Card>

        {/* Password Section */}
        <Card className="p-8 border-2 border-gray-200 mb-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-orange-100 w-12 h-12 rounded-full flex items-center justify-center">
              <Key className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Promena lozinke (Vlasnik)</h2>
              <p className="text-gray-600">Promenite svoju admin lozinku</p>
            </div>
          </div>

          <div className="max-w-md space-y-6">
            <div>
              <Label className="text-base font-semibold mb-3 block">
                Trenutna lozinka
              </Label>
              <div className="relative">
                <Input
                  type={showPasswords.current ? "text" : "password"}
                  value={passwords.currentPassword}
                  onChange={(e) => setPasswords({...passwords, currentPassword: e.target.value})}
                  className="text-lg border-2 pr-12"
                  placeholder="Trenutna lozinka"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  {showPasswords.current ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div>
              <Label className="text-base font-semibold mb-3 block">
                Nova lozinka
              </Label>
              <div className="relative">
                <Input
                  type={showPasswords.new ? "text" : "password"}
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})}
                  className="text-lg border-2 pr-12"
                  placeholder="Nova lozinka (min 8 karaktera)"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  {showPasswords.new ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div>
              <Label className="text-base font-semibold mb-3 block">
                Potvrda nove lozinke
              </Label>
              <div className="relative">
                <Input
                  type={showPasswords.confirm ? "text" : "password"}
                  value={passwords.confirmPassword}
                  onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})}
                  className="text-lg border-2 pr-12"
                  placeholder="Potvrdite novu lozinku"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  {showPasswords.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <Button
              onClick={handleSavePassword}
              className="bg-orange-600 hover:bg-orange-700 text-white gap-2 w-full"
            >
              <Save size={18} />
              Sačuvaj novu lozinku
            </Button>
          </div>
        </Card>

        {/* Viewer Password Section - Only for Admin */}
        {userRole === 'admin' && (
          <Card className="p-8 border-2 border-green-200 bg-green-50">
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-green-600 w-12 h-12 rounded-full flex items-center justify-center">
                <UserCog className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Promena lozinke - Menadžer nalog</h2>
                <p className="text-gray-600">Promenite lozinku za Menadžer (Viewer) nalog</p>
              </div>
            </div>

            <div className="max-w-md space-y-4">
              <div>
                <Label className="text-base font-semibold mb-3 block">
                  Nova lozinka za Menadžer
                </Label>
                <div className="relative">
                  <Input
                    type={showPasswords.viewerNew ? "text" : "password"}
                    value={viewerPassword}
                    onChange={(e) => setViewerPassword(e.target.value)}
                    className="text-lg border-2 pr-12"
                    placeholder="Nova lozinka za Menadžer (min 8 karaktera)"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({...showPasswords, viewerNew: !showPasswords.viewerNew})}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    {showPasswords.viewerNew ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  ℹ️ Samo admin (Vlasnik) može promeniti lozinku za Menadžer nalog
                </p>
              </div>

              <Button
                onClick={handleChangeViewerPassword}
                className="bg-green-600 hover:bg-green-700 text-white gap-2"
              >
                <Save size={18} />
                Sačuvaj Menadžer lozinku
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminPassword;