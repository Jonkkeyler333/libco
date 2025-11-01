import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useOrder } from '../context/OrderContext';
import { orderService } from '../services/orderService';
import OrderDetailsModal from '../components/ui/OrderDetailsModal';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import '../styles/OrderHistory.css';

const OrderManagePage = () => {
  const { user, token } = useAuth();
  const { confirmOrder, isLoading, cancelOrder, error: contextError } = useOrder();
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
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // Estados para los modales de confirmación
  const [showConfirmOrderModal, setShowConfirmOrderModal] = useState(false);
  const [showCancelOrderModal, setShowCancelOrderModal] = useState(false);
  const [actionOrderId, setActionOrderId] = useState(null);

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
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatPrice = (price) => {
    return `$${price.toFixed(2)}`;
  };

  const getStatusDisplay = (status) => {
    const statusMap = {
      'draft': 'En Revisión 🔜',
      'check': 'Revisado ✔️', 
      'completed': 'Confirmado',
      'canceled': 'Cancelado'
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

  const handleViewDetails = (orderId) => {
    setSelectedOrderId(orderId);
    setShowDetailsModal(true);
  };

  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedOrderId(null);
  };

  const handleOpenConfirmModal = (orderId) => {
    setActionOrderId(orderId);
    setShowConfirmOrderModal(true);
  };
  
  const handleOpenCancelModal = (orderId) => {
    setActionOrderId(orderId);
    setShowCancelOrderModal(true);
  };

  const handleConfirmOrder = async (orderId) => {
    try {
      setLoading(true);
      await confirmOrder(orderId, token);
      setLoading(false);
      alert('Pedido confirmado exitosamente.');
      loadOrders(currentPage);
    } catch (err) {
      setError(contextError);
      console.error('Error confirming order:', err);
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    try {
      setLoading(true);
      await cancelOrder(orderId, token);
      setLoading(false);
      alert('Pedido cancelado exitosamente.');
      loadOrders(currentPage);
    } catch (err) {
      setError(contextError);
      console.error('Error canceling order:', err);
      setLoading(false);
    }
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
        <h1>📦 Gestión de Pedidos</h1>
        <p className="subtitle" style={{color: '#2d3748'}}>Revisa tus pedios en curso , edita , confirma o cancela</p>
      </div>
      {error && (
        <div className="error-message">
          <p>Error: Tu {error} , debes editar tu pedido ya que hay productos con stock insuficiente para tu pedido 😩    </p>
          <button onClick={() => loadOrders(currentPage)} className="retry-button">
            Reintentar
          </button>
        </div>
      )}
      {!error && (
        <>
          {orders.filter(order => order.status === 'check' || order.status === 'draft').length === 0 ? (
            <div className="no-orders">
              <p>📋 No tienes pedidos registrados aún.</p>
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
                {orders.filter(order => order.status === 'check' || order.status === 'draft').map((order) => (
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
                      <div className="order-actions-grid">
                        <button 
                          className="action-button details-button"
                          onClick={() => handleViewDetails(order.order_id)}
                        >
                          📃 Ver Detalles del Pedido
                        </button>
                        <button className="action-button cancel-button"
                          onClick={() => handleOpenCancelModal(order.order_id)}
                          disabled={isLoading}
                        >
                           {isLoading ? '⏳ Cancelando...' : '❌ Cancelar Pedido'}
                        </button>
                        <button className="action-button edit-button" 
                          onClick={() => navigate(`/editar-pedido/${order.order_id}`)}
                        >
                          📝 Editar Pedido
                        </button>
                        <button className="action-button confirm-button"
                          onClick={() => handleOpenConfirmModal(order.order_id)}
                          disabled={isLoading}
                        >
                          {isLoading ? '⏳ Confirmando...' : '✅ Confirmar Pedido'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Paginación */}
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
      <OrderDetailsModal
        orderId={selectedOrderId}
        isOpen={showDetailsModal}
        onClose={handleCloseDetailsModal}
      />
      <ConfirmationModal
        isOpen={showConfirmOrderModal}
        onClose={() => setShowConfirmOrderModal(false)}
        onConfirm={() => handleConfirmOrder(actionOrderId)}
        title="Confirmar Pedido"
        message="Esta acción confirmará el pedido y no se podrá modificar posteriormente. ¿Estás seguro de que deseas confirmar este pedido?"
        confirmText="Sí, confirmar pedido"
        cancelText="No, volver"
        confirmButtonClass="confirm-button"
        icon="✅"
      />
      <ConfirmationModal
        isOpen={showCancelOrderModal}
        onClose={() => setShowCancelOrderModal(false)}
        onConfirm={() => handleCancelOrder(actionOrderId)}
        title="Cancelar Pedido"
        message="Esta acción cancelará el pedido y liberará el inventario reservado. Esta acción no se puede deshacer. ¿Estás seguro de que deseas cancelar este pedido?"
        confirmText="Sí, cancelar pedido"
        cancelText="No, volver"
        confirmButtonClass="delete-button"
        icon="⚠️"
      />
    </div>
  );
};

export default OrderManagePage;