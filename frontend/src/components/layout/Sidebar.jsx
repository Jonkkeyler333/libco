import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
  const { user, logout, isAdmin } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  
  const handleLogout = () => {
    logout();
  };
  
  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="logo-container">
          <img src="/libco_logo.png" alt="LibCo Logo" className="sidebar-logo" />
          {!isCollapsed && <h2>BookOrder</h2>}
        </div>
        <button 
          className="collapse-button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? 'Expandir' : 'Colapsar'}
        >
          {isCollapsed ? '→' : '←'}
        </button>
      </div>
      
      <div className="sidebar-content">
        <div className="navigation-section">
          <h3>{!isCollapsed && 'Navegación'}</h3>
          <nav className="sidebar-nav">
            <Link to="/" className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}>
              <span className="nav-icon">📊</span>
              {!isCollapsed && <span className="nav-label">Panel Principal</span>}
            </Link>
            
            {/* Opciones solo para clientes (no admin) */}
            {!isAdmin() && (
              <>
                <Link to="/crear-pedido" className={`nav-item ${location.pathname === '/crear-pedido' ? 'active' : ''}`}>
                  <span className="nav-icon">🛒</span>
                  {!isCollapsed && <span className="nav-label">Crear Pedido</span>}
                </Link>
                <Link to="/mis-pedidos" className={`nav-item ${location.pathname === '/mis-pedidos' ? 'active' : ''}`}>
                  <span className="nav-icon">📦</span>
                  {!isCollapsed && <span className="nav-label">Gestionar mis Pedidos</span>}
                </Link>
                <Link to="/historial" className={`nav-item ${location.pathname === '/historial' ? 'active' : ''}`}>
                  <span className="nav-icon">📜</span>
                  {!isCollapsed && <span className="nav-label">Historial de Pedidos</span>}
                </Link>
              </>
            )}
            
            {/* Opciones solo para administradores */}
            {isAdmin() && (
              <>
                <Link to="/inventario" className={`nav-item ${location.pathname === '/inventario' ? 'active' : ''}`}>
                  <span className="nav-icon">📚</span>
                  {!isCollapsed && <span className="nav-label">Inventario de Productos</span>}
                </Link>
                <Link to="/reportes" className={`nav-item ${location.pathname === '/reportes' ? 'active' : ''}`}>
                  <span className="nav-icon">📊</span>
                  {!isCollapsed && <span className="nav-label">Reportes</span>}
                </Link>
                <Link to="/usuarios" className={`nav-item ${location.pathname === '/usuarios' ? 'active' : ''}`}>
                  <span className="nav-icon">👥</span>
                  {!isCollapsed && <span className="nav-label">Gestión de Usuarios</span>}
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
      
      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="user-avatar">
            {user?.name?.charAt(0) || 'U'}
          </div>
          {!isCollapsed && (
            <div className="user-info">
              <p className="user-name" title={`${user?.name || ''} ${user?.last_name || ''}`}>
                {user?.name || ''} {user?.last_name || ''}
              </p>
              <p className="user-role">{user?.role || 'Usuario'}</p>
            </div>
          )}
        </div>
        <button onClick={handleLogout} className="logout-button">
          <span className="logout-icon">🚪</span>
          {!isCollapsed && <span>Cerrar Sesión</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;