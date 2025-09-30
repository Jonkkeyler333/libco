import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import './dashboard.css'; // Importamos los nuevos estilos
import { AuthProvider, useAuth } from './context/AuthContext';
import { OrderProvider } from './context/OrderContext';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import CreateOrderPage from './pages/CreateOrderPage';

// Componente para rutas protegidas que requieren autenticación
const ProtectedRoute = ({ element }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando...</p>
      </div>
    );
  }

  return isAuthenticated ? element : <Navigate to="/login" replace />;
};

function AppContent() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <AuthPage />} />
        <Route path="/" element={<ProtectedRoute element={<Dashboard />} />} />
        <Route path="/crear-pedido" element={<ProtectedRoute element={<CreateOrderPage />} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <OrderProvider>
        <AppContent />
      </OrderProvider>
    </AuthProvider>
  );
}

export default App
