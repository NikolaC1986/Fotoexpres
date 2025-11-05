import React from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './components/HomePage';
import UploadPage from './components/UploadPage';
import PricesPage from './components/PricesPage';
import FAQPage from './components/FAQPage';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import AdminPrices from './components/AdminPrices';
import AdminSettings from './components/AdminSettings';
import { Toaster } from './components/ui/toaster';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('adminToken');
  return token ? children : <Navigate to="/admin" />;
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          {/* Public Routes with Navbar */}
          <Route path="/" element={<><Navbar /><HomePage /></>} />
          <Route path="/upload" element={<><Navbar /><UploadPage /></>} />
          <Route path="/prices" element={<><Navbar /><PricesPage /></>} />
          <Route path="/faq" element={<><Navbar /><FAQPage /></>} />
          
          {/* Admin Routes without Navbar */}
          <Route path="/admin" element={<AdminLogin />} />
          <Route 
            path="/admin/dashboard" 
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/prices" 
            element={
              <ProtectedRoute>
                <AdminPrices />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/settings" 
            element={
              <ProtectedRoute>
                <AdminSettings />
              </ProtectedRoute>
            } 
          />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </div>
  );
}

export default App;