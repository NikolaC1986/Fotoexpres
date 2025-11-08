import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Key, Eye, EyeOff } from 'lucide-react';
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
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [username, setUsername] = useState('');
  const [newUsername, setNewUsername] = useState('');

  useEffect(() => {
    document.title = 'Promena Lozinke | Fotoexpres';
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/logovanje');
      return;
    }
  }, [navigate]);

  const handleSavePassword = async () => {
    // Validate inputs
    if (!passwords.currentPassword || !passwords.newPassword || !passwords.confirmPassword) {
      toast({
        title: "Greška",
        description: "Molimo popunite sva polja",
        variant: "destructive"
      });
      return;
    }

    // Check if new passwords match
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast({
        title: "Greška",
        description: "Nova lozinka i potvrda se ne poklapaju",
        variant: "destructive"
      });
      return;
    }

    // Check password strength
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

        // Clear form
        setPasswords({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });

        // Logout after 2 seconds
        setTimeout(() => {
          localStorage.removeItem('adminToken');
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

  const handleSaveUsername = async () => {
    if (!newUsername || newUsername.trim() === '') {
      toast({
        title: "Greška",
        description: "Korisničko ime ne može biti prazno",
        variant: "destructive"
      });
      return;
    }

    if (!passwords.currentPassword) {
      toast({
        title: "Greška",
        description: "Morate uneti trenutnu lozinku da biste promenili korisničko ime",
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
          newUsername: newUsername
        },
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setUsername(newUsername);
        
        toast({
          title: "Uspešno",
          description: "Korisničko ime je uspešno promenjeno. Molimo prijavite se ponovo."
        });

        // Logout after 2 seconds
        setTimeout(() => {
          localStorage.removeItem('adminToken');
          navigate('/logovanje');
        }, 2000);
      }
    } catch (error) {
      toast({
        title: "Greška",
        description: error.response?.data?.detail || "Nije moguće promeniti korisničko ime",
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
          <p className="text-gray-600 mt-2">Promenite korisničko ime i lozinku za admin panel</p>
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
              <p className="text-sm text-gray-500 mt-2">
                Potrebna je trenutna lozinka za promenu korisničkog imena
              </p>
            </div>
            <Button
              onClick={handleSaveUsername}
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
              <h2 className="text-2xl font-bold text-gray-900">Promena lozinke</h2>
              <p className="text-gray-600">Promenite lozinku za admin panel</p>
            </div>
          </div>

          <div className="max-w-md space-y-6">
            {/* Current Password */}
            <div>
              <Label className="text-base font-semibold mb-3 block">
                Trenutna lozinka
              </Label>
              <div className="relative">
                <Input
                  type={showPasswords.current ? "text" : "password"}
                  value={passwords.currentPassword}
                  onChange={(e) => setPasswords({...passwords, currentPassword: e.target.value})}
                  className="text-lg border-2 pr-10"
                  placeholder="Unesite trenutnu lozinku"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPasswords.current ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <Label className="text-base font-semibold mb-3 block">
                Nova lozinka
              </Label>
              <div className="relative">
                <Input
                  type={showPasswords.new ? "text" : "password"}
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})}
                  className="text-lg border-2 pr-10"
                  placeholder="Unesite novu lozinku"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPasswords.new ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Lozinka mora imati najmanje 8 karaktera
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <Label className="text-base font-semibold mb-3 block">
                Potvrdite novu lozinku
              </Label>
              <div className="relative">
                <Input
                  type={showPasswords.confirm ? "text" : "password"}
                  value={passwords.confirmPassword}
                  onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})}
                  className="text-lg border-2 pr-10"
                  placeholder="Ponovite novu lozinku"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPasswords.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <Button
              onClick={handleSavePassword}
              size="lg"
              className="w-full bg-orange-600 hover:bg-orange-700 text-white gap-2"
            >
              <Save size={20} />
              Sačuvaj lozinku
            </Button>
          </div>
        </Card>

        {/* Important Notice */}
        <Card className="p-6 bg-red-50 border-2 border-red-200">
          <h3 className="text-lg font-bold text-red-900 mb-3">⚠️ Važno</h3>
          <ul className="text-sm text-red-800 space-y-2 list-disc list-inside">
            <li>Čuvajte korisničko ime i lozinku na sigurnom mestu</li>
            <li>Ne delite pristupne podatke ni sa kim</li>
            <li>Koristite jaku lozinku sa kombinacijom slova, brojeva i specijalnih karaktera</li>
            <li>Redovno menjajte lozinku (preporučeno svakih 3-6 meseci)</li>
            <li>Link za pristup admin panelu je: <code className="bg-white px-2 py-1 rounded">/logovanje</code></li>
          </ul>
        </Card>
      </div>
    </div>
  );
};

export default AdminPassword;
