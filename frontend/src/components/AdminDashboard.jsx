import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Package, CheckCircle, Clock, LogOut, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { toast } from '../hooks/use-toast';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0 });

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin');
      return;
    }
    fetchOrders();
  }, [navigate]);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API}/admin/orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setOrders(response.data.orders);
      setStats(response.data.stats);
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('adminToken');
        navigate('/admin');
      }
      toast({
        title: "Greška",
        description: "Nije moguće učitati porudžbine",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (orderNumber, zipFilePath) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API}/admin/orders/${orderNumber}/download`, {
        headers: { 'Authorization': `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `order-${orderNumber}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast({
        title: "Preuzimanje uspešno",
        description: `Porudžbina ${orderNumber} je preuzeta`
      });
    } catch (error) {
      toast({
        title: "Greška",
        description: "Nije moguće preuzeti ZIP fajl",
        variant: "destructive"
      });
    }
  };

  const handleStatusUpdate = async (orderNumber, newStatus) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(`${API}/admin/orders/${orderNumber}/status`, 
        { status: newStatus },
        { headers: { 'Authorization': `Bearer ${token}` }}
      );
      
      toast({
        title: "Status ažuriran",
        description: `Porudžbina ${orderNumber} je označena kao ${newStatus}`
      });
      fetchOrders();
    } catch (error) {
      toast({
        title: "Greška",
        description: "Nije moguće ažurirati status",
        variant: "destructive"
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Učitavanje...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Admin Panel</h1>
            <p className="text-gray-600 mt-2">Upravljanje porudžbinama fotografija</p>
          </div>
          <Button 
            onClick={handleLogout}
            variant="outline" 
            className="gap-2 border-2"
          >
            <LogOut size={18} />
            Odjavi Se
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 border-2 border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 mb-1">Ukupno Porudžbina</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Package className="w-12 h-12 text-blue-600" />
            </div>
          </Card>
          <Card className="p-6 border-2 border-yellow-200 bg-yellow-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 mb-1">Na Čekanju</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="w-12 h-12 text-yellow-600" />
            </div>
          </Card>
          <Card className="p-6 border-2 border-green-200 bg-green-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 mb-1">Završeno</p>
                <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
          </Card>
        </div>

        {/* Orders Table */}
        <Card className="p-6 border-2 border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Porudžbine</h2>
            <Button onClick={fetchOrders} variant="outline" className="gap-2">
              <RefreshCw size={18} />
              Osveži
            </Button>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Nema porudžbina</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Broj Porudžbine</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Kupac</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Kontakt</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Fotografija</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Status</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Akcije</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.orderNumber} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-4 px-4 font-mono font-semibold text-blue-600">{order.orderNumber}</td>
                      <td className="py-4 px-4">
                        <div>
                          <div className="font-semibold">{order.contactInfo.fullName}</div>
                          <div className="text-sm text-gray-500">{order.contactInfo.address}</div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm">
                          <div>{order.contactInfo.email}</div>
                          <div className="text-gray-500">{order.contactInfo.phone}</div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-semibold text-gray-900">{order.totalPhotos}</span>
                        <span className="text-gray-500 text-sm ml-1">kom</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          order.status === 'completed' ? 'bg-green-100 text-green-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {order.status === 'pending' ? 'Na Čekanju' : 
                           order.status === 'completed' ? 'Završeno' : 'Obrađuje se'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex gap-2">
                          <Button 
                            size="sm"
                            onClick={() => handleDownload(order.orderNumber, order.zipFilePath)}
                            className="bg-blue-600 hover:bg-blue-700 text-white gap-1"
                          >
                            <Download size={16} />
                            Preuzmi
                          </Button>
                          {order.status === 'pending' && (
                            <Button 
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusUpdate(order.orderNumber, 'completed')}
                              className="gap-1 border-2"
                            >
                              <CheckCircle size={16} />
                              Završi
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;