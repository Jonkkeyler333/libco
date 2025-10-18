// Dashboard Page for LibCo
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useOrder } from '../context/OrderContext';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import StatsCard from '../components/ui/StatsCard';
import ProductGrid from '../components/ui/ProductGrid';
import { productService } from '../services/productService';

const Dashboard = () => {
  const { user ,isAdmin } = useAuth();
  const { getCartItemsCount } = useOrder();
  const [popularProducts, setPopularProducts] = useState([]);
  const [latestProducts, setLatestProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        
        // Get the JWT token from localStorage
        const token = localStorage.getItem('auth_token');
        
        // Obtener productos reales de la API
        const productsData = await productService.getAllProducts(token);
        console.log('Productos cargados de API:', productsData);
        
        // Verificar si tenemos productos
        if (productsData && productsData.length > 0) {
          // Marcar algunos productos como populares (simulado)
          const popular = productsData.slice(0, Math.min(4, productsData.length)).map(p => ({
            ...p, 
            is_popular: true
          }));
          setPopularProducts(popular);
          
          // Marcar algunos productos como ofertas (simulado)
          const discounted = [...productsData]
            .sort(() => 0.5 - Math.random())
            .slice(0, Math.min(4, productsData.length))
            .map(p => ({
              ...p, 
              on_sale: true
            }));
          setLatestProducts(discounted);
        } else {
          // fallback a datos de muestra si la API no devuelve productos
          const mockBooks = [
            { product_id: 1, title: 'El Manifiesto Comunista', author: 'Karl Marx y Friedrich Engels', price: 9.99, front_page_url: '/libco_logo.png' },
            { product_id: 2, title: 'Así habló Zaratustra', author: 'Friedrich Nietzsche', price: 16.99, front_page_url: '/libco_logo.png' },
            { product_id: 3, title: 'El Capital', author: 'Karl Marx', price: 24.99, front_page_url: '/libco_logo.png' },
            { product_id: 4, title: 'El segundo sexo', author: 'Simone de Beauvoir', price: 22.99, front_page_url: '/libco_logo.png' },
          ];
          
          setPopularProducts(mockBooks.slice(0, 3).map(p => ({ ...p, is_popular: true })));
          setLatestProducts(mockBooks.slice(1, 4).map(p => ({ ...p, on_sale: true })));
          console.warn('Usando datos de muestra porque la API no devolvió productos');
        }
      } catch (err) {
        console.error('Error loading dashboard data:', err);
        setError('Error al cargar los datos. Por favor intente nuevamente.');
      } finally {
        setLoading(false);
      }
    };
    
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando el panel...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <Sidebar />
      
      <main className="main-content">
        <Header />
        
        {error && (
          <div className="error-message">{error}</div>
        )}
       
        {!isAdmin() && (
          <div className="dashboard-container">
            <div className="welcome-section">
              <h2>¡Bienvenido de vuelta!</h2>
              <p className="user-name" title={`${user?.name || ''} ${user?.last_name || ''}`}>
                {user?.name || ''} {user?.last_name || ''}
              </p>
              <p>Descubre nuevos libros y continúa tu viaje literario</p>
            </div>
          <div className="stats-grid">
            <StatsCard 
              title="Pedidos realizados" 
              value="3" 
              icon="📦" 
              color="primary"
            />
            <StatsCard 
              title="Libros Disponibles" 
              value="25" 
              subtitle="En nuestro catálogo" 
              icon="📚" 
              color="secondary"
            />
            <StatsCard 
              title="Ofertas Especiales" 
              value="4" 
              subtitle="Últimas unidades" 
              icon="🔥" 
              color="accent"
            />
          </div>
          
          <ProductGrid 
            title="Más Populares" 
            products={popularProducts} 
            viewAllLink="#" 
            showBadge={true}
            badgeText="Destacados"
          />
          
          <ProductGrid 
            title="Últimas Unidades" 
            products={latestProducts} 
            viewAllLink="#" 
            showBadge={true}
            badgeText="OFERTA"
          />
        </div>
        )}

        {isAdmin() && (
          <div className="dashboard-container">
            <div className="welcome-section">
              <h2>Administra tu librería 👨🏽‍💻</h2>
              <p className="user-name" title={`${user?.name || ''} ${user?.last_name || ''}`}>
                Bienvenido admin : {user?.name || ''} {user?.last_name || ''}
              </p>
            </div>
        </div>
        )}
        
       
      </main>
    </div>
  );
};

export default Dashboard;