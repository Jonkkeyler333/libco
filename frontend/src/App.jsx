import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import './dashboard.css'; // Importamos los estilos del dashboard
import './cleanStyles.css'; // Importamos los estilos limpios
import { AuthProvider, useAuth } from './context/AuthContext';
import { OrderProvider } from './context/OrderContext';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import CreateOrderPage from './pages/CreateOrderPage';
import InventoryPage from './pages/InventoryPage';
import OrderHistoryPage from './pages/OrderHistoryPage';

// Ruta protegida que requiere autenticación
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

// Ruta que requiere rol de cliente
const ClientRoute = ({ element }) => {
  const { isAuthenticated, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando...</p>
      </div>
    );
  }

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si es admin, redirigir al dashboard
  if (isAdmin()) {
    return <Navigate to="/" replace />;
  }

  return element;
};

// Ruta que requiere rol de administrador
const AdminRoute = ({ element }) => {
  const { isAuthenticated, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando...</p>
      </div>
    );
  }

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si no es admin, redirigir al dashboard
  if (!isAdmin()) {
    return <Navigate to="/" replace />;
  }

  return element;
};

function AppContent() {
  const { isAuthenticated, loading, isAdmin } = useAuth();

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
        {/* Rutas públicas */}
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <AuthPage />} />
        
        {/* Ruta principal accesible para todos los usuarios autenticados */}
        <Route path="/" element={<ProtectedRoute element={<Dashboard />} />} />
        
        {/* Rutas solo para clientes */}
        <Route path="/crear-pedido" element={<ClientRoute element={<CreateOrderPage />} />} />
        <Route path="/historial" element={<ClientRoute element={<OrderHistoryPage />} />} />
        <Route path="/mis-pedidos" element={<ClientRoute element={<OrderHistoryPage />} />} />
        
        {/* Rutas solo para administradores */}
        <Route path="/inventario" element={<AdminRoute element={<InventoryPage/>} />} />
        <Route path="/reportes" element={<AdminRoute element={<Dashboard />} />} />
        <Route path="/usuarios" element={<AdminRoute element={<Dashboard />} />} />
        
        {/* Ruta de fallback */}
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
