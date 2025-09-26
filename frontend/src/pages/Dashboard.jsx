// Dashboard Page - main protected page after login
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Dashboard - LibCo</h1>
        <div className="user-info">
          <span>Bienvenido, {user?.name} {user?.last_name}</span>
          <span className="user-role">({user?.role})</span>
          <button onClick={handleLogout} className="logout-button">
            Cerrar Sesión
          </button>
        </div>
      </header>

      <main className="dashboard-content">
        <div className="dashboard-card">
          <h2>Información del Usuario</h2>
          <div className="user-details">
            <p><strong>Usuario:</strong> {user?.username}</p>
            <p><strong>Email:</strong> {user?.email}</p>
            <p><strong>Nombre completo:</strong> {user?.name} {user?.last_name}</p>
            <p><strong>Rol:</strong> {user?.role}</p>
            <p><strong>Estado:</strong> {user?.is_active ? 'Activo' : 'Inactivo'}</p>
            <p><strong>Registro:</strong> {new Date(user?.created_at).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="dashboard-actions">
          <h2>Acciones Disponibles</h2>
          <div className="action-grid">
            <div className="action-card">
              <h3>Gestión de Libros</h3>
              <p>Administrar inventario y catálogo de libros</p>
              <button disabled>Próximamente</button>
            </div>
            
            <div className="action-card">
              <h3>Pedidos</h3>
              <p>Ver y gestionar pedidos de libros</p>
              <button disabled>Próximamente</button>
            </div>

            {user?.role === 'admin' && (
              <div className="action-card admin-only">
                <h3>Administración</h3>
                <p>Panel de administración y reportes</p>
                <button disabled>Próximamente</button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;