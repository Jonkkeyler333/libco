import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { orderService } from '../services/orderService';
import '../styles/OrderHistory.css';

const OrderHistoryPage = () => {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    total_orders: 0,
    page: 1,
    page_size: 10,
    total_pages: 0,
    has_next: false,
    has_previous: false
  });

  const loadOrders = async (page = 1) => {
    if (!user || !token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await orderService.getUserOrders(user.user_id, page, 10, token);
      setOrders(response.orders);
      setPagination({
        total_orders: response.total_orders,
        page: response.page,
        page_size: response.page_size,
        total_pages: response.total_pages,
        has_next: response.has_next,
        has_previous: response.has_previous
      });
      setCurrentPage(page);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [user, token]);

  const handlePageChange = (newPage) => {
    loadOrders(newPage);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const formatPrice = (price) => {
    return `$${price.toFixed(2)}`;
  };

  const handleOrder = async (orderId) => {
    const headers = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(`${API_URL}/api/orders/${orderId}/document`, {
      method: 'GET',
      headers
    });
    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orden-${orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } else {
      throw new Error('Error al descargar el PDF');
    }
    alert('El pdf de la orden se ha descargado correctamente.');
  };

  const getStatusDisplay = (status) => {
    const statusMap = {
      'draft': 'En Revisión 🔜',
      'check': 'Revisado ✔️', 
      'completed': 'Confirmado ✅',
      'canceled': 'Cancelado ❌'
    };
    return statusMap[status] || status;
  };

  const getStatusClass = (status) => {
    const statusClasses = {
      'completed': 'status-completed',
      'check': 'status-review',
      'draft': 'status-review',
      'canceled': 'status-canceled'
    };
    return statusClasses[status] || 'status-default';
  };

  if (loading && currentPage === 1) {
    return (
      <div className="order-history-page">
        <div className="loading">
          <p>🎉 Cargando tu historial de pedidos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="order-history-page">
      <div className="order-history-header">
        <div className="flex items-center mb-3">
          <button 
            onClick={() => navigate('/')}
            className="back-button"
          >
            <span style={{marginRight: '8px'}}>←</span> Volver al Dashboard
          </button>
        </div>
        <h1>📦 Historial de Pedidos</h1>
        <p className="subtitle" style={{color: '#2d3748'}}>Revisa tus pedidos anteriores</p>
        <p>Aqui encontraras tus pedidos cancelados o confirmados</p>
      </div>

      {error && (
        <div className="error-message">
          <p>Error: {error}</p>
          <button onClick={() => loadOrders(currentPage)} className="retry-button">
            Reintentar
          </button>
        </div>
      )}

      {!error && (
        <>
          {orders.filter(order => order.status === 'completed' || order.status === 'canceled').length === 0 ? (
            <div className="no-orders">
              <p>📋 No tienes pedidos por aca aún 🫢</p>
              <button 
                className="create-order-button"
                onClick={() => navigate('/crear-pedido')}
              >
                🛒 Crear mi primer pedido
              </button>
            </div>
          ) : (
            <>
              <div className="orders-list">
                {orders.filter(order => order.status === 'completed' || order.status === 'canceled').map((order) => (
                  <div key={order.order_id} className="order-card">
                    <div className="order-header">
                      <div className="order-id">
                        <h3>ORD-{order.order_id.toString().padStart(3, '0')}</h3>
                        <p className="order-date">
                          Realizado el {formatDate(order.created_at)}
                        </p>
                      </div>
                      <div className="order-status">
                        <span className={`status-badge ${getStatusClass(order.status)}`}>
                          {getStatusDisplay(order.status)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="order-details">
                      <div className="order-info">
                        <p className="items-count">{order.items_count} artículos</p>
                        <p className="order-total">{formatPrice(order.total)}</p>
                      </div>
                      {order.status === 'canceled' && (
                        <div className="order-cancellation">
                          <p>🛑 Pedido Cancelado</p>
                        </div>
                      )}
                      <div className="order-actions">
                        <button className="view-details-button"
                        onClick={() => handleOrder(order.order_id)}>
                          📄 Ver Orden de Pedido
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {pagination.total_pages > 1 && (
                <div className="pagination">
                  <button 
                    className="pagination-button"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={!pagination.has_previous || loading}
                  >
                    ← Anterior
                  </button>
                  
                  <span className="pagination-info">
                    Página {currentPage} de {pagination.total_pages}
                    {` (${pagination.total_orders} pedidos en total)`}
                  </span>
                  
                  <button 
                    className="pagination-button"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!pagination.has_next || loading}
                  >
                    Siguiente →
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default OrderHistoryPage;