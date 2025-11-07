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
import AdminDiscounts from './components/AdminDiscounts';
import AdminPromotion from './components/AdminPromotion';
import { Toaster } from './components/ui/toaster';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('adminToken');
  return token ? children : <Navigate to="/logovanje" />;
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
          <Route path="/logovanje" element={<AdminLogin />} />
          <Route 
            path="/logovanje/dashboard" 
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/logovanje/prices" 
            element={
              <ProtectedRoute>
                <AdminPrices />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/logovanje/settings" 
            element={
              <ProtectedRoute>
                <AdminSettings />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/logovanje/discounts" 
            element={
              <ProtectedRoute>
                <AdminDiscounts />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/logovanje/promotion" 
            element={
              <ProtectedRoute>
                <AdminPromotion />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/logovanje/password" 
            element={
              <ProtectedRoute>
                <AdminPassword />
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