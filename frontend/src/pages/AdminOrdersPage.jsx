import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllOrders, getOrderDetails } from '../services/adminOrdersService.js';
import '../styles/adminOrders.css';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [externalOrders, setExternalOrders] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
    fetchExternalOrders();
  }, [currentPage]);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllOrders(currentPage, pageSize);
      setOrders(data);
      setHasNextPage(data.length === pageSize);
    } catch (err) {
      console.error('Error al cargar pedidos:', err);
      setError('Error al cargar los pedidos. Intente de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  };
  //este fetch nunca servira ya que el otro querido grupo de desarrolladores no fue capaz de implementar su api en su aplicativo
  const fetchExternalOrders = async () => {
    try {
      const response = await fetch('http://10.6.101.152:5173/pedidos/completados/');
      if (!response.ok) {
        console.log('Error al obtener pedidos externos:', response.statusText);
        setExternalOrders([]);        
        return;
      }
    }catch (err) {
      console.error('Error al cargar pedidos externos:', err);
      setExternalOrders([]);   
    }
  };

  const handleViewDetails = async (orderId) => {
    try {
      const orderFromList = orders.find(o => o.order_id === orderId);
      if (orderFromList) {
        setSelectedOrder(orderFromList);
        setShowDetailModal(true);
      } else {
        const orderData = await getOrderDetails(orderId);
        setSelectedOrder(orderData);
        setShowDetailModal(true);
      }
    } catch (err) {
      console.error('Error al obtener detalles del pedido:', err);
      alert('Error al obtener detalles del pedido');
    }
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedOrder(null);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value);
  };

  if (loading && orders.length === 0) {
    return <div className="admin-orders-loading">Cargando pedidos...</div>;
  }

  return (
    <div className="admin-orders-container">
      <div className="admin-orders-header">
        <div className="header-top">
          <h1>Gestión de Pedidos</h1>
          <button 
            className="btn-back-to-dashboard"
            onClick={() => navigate('/')}
            title="Volver al panel principal"
          >
            ← Panel Principal
          </button>
        </div>
        <p className="subtitle">Visualiza y gestiona todos los pedidos realizados</p>
      </div>

      {error && (
        <div className="admin-orders-error">
          <p>{error}</p>
          <button onClick={fetchOrders}>Reintentar</button>
        </div>
      )}

      {orders.length === 0 && !error ? (
        <div className="admin-orders-empty">
          <p>No hay pedidos disponibles</p>
        </div>
      ) : (
        <>
          <div className="admin-orders-table-wrapper">
            <table className="admin-orders-table">
              <thead>
                <tr>
                  <th>Orden ID</th>
                  <th>Estado</th>
                  <th>Total</th>
                  <th>Cantidad de Items</th>
                  <th>Fecha</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.order_id}>
                    <td className="order-id">{order.order_id}</td>
                    <td>
                      <span className={`status-badge status-${order.status}`}>
                        {order.status === 'completed' ? 'Completed' : 
                         order.status === 'check' ? 'Check' : 
                         order.status === 'draft' ? 'Draft' :
                         order.status === 'canceled' ? 'Canceled' : order.status}
                      </span>
                    </td>
                    <td className="price">{formatCurrency(order.total)}</td>
                    <td className="center">{order.items_count}</td>
                    <td className="date">{formatDate(order.created_at)}</td>
                    <td className="actions">
                      <button 
                        className="btn-details"
                        onClick={() => handleViewDetails(order.order_id)}
                        title="Ver detalles"
                      >
                        Ver Detalles
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="admin-orders-pagination">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
              className="pagination-btn"
            >
              ← Anterior
            </button>
            <span className="page-info">Página {currentPage}</span>
            <button 
              disabled={!hasNextPage || orders.length < pageSize}
              onClick={() => setCurrentPage(currentPage + 1)}
              className="pagination-btn"
            >
              Siguiente →
            </button>
          </div>
        </>
      )}
      {externalOrders.length === 0 ? (<div className="admin-orders-empty">
          <p>No hay pedidos disponibles de la otra empresa</p>
        </div>) : (<h1>Si hay pedidos</h1>)}  
      {/* Modal de Detalles */}
      {showDetailModal && selectedOrder && (
        <div className="modal-overlay" onClick={closeDetailModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Detalles de la Orden #{selectedOrder.order_id}</h2>
              <button className="close-btn" onClick={closeDetailModal}>×</button>
            </div>

            <div className="modal-body">
              <div className="order-info-grid">
                <div className="info-item">
                  <label>Orden ID:</label>
                  <span>{selectedOrder.order_id}</span>
                </div>
                <div className="info-item">
                  <label>Estado:</label>
                  <span className={`status-badge status-${selectedOrder.status}`}>
                    {selectedOrder.status === 'completed' ? 'Completed' : 
                     selectedOrder.status === 'check' ? 'Check' : 
                     selectedOrder.status === 'draft' ? 'Draft' :
                     selectedOrder.status === 'canceled' ? 'Canceled' : selectedOrder.status}
                  </span>
                </div>
                <div className="info-item">
                  <label>Total:</label>
                  <span className="total-price">{formatCurrency(selectedOrder.total)}</span>
                </div>
                <div className="info-item">
                  <label>Fecha:</label>
                  <span>{formatDate(selectedOrder.created_at)}</span>
                </div>
              </div>

              <div className="items-section">
                <h3>Libros Vendidos</h3>
                {selectedOrder.items && selectedOrder.items.length > 0 ? (
                  <>
                    <div className="items-table-wrapper">
                      <table className="items-table">
                        <thead>
                          <tr>
                            <th>Libro</th>
                            <th>Cantidad</th>
                            <th>Precio Unitario</th>
                            <th>Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedOrder.items.map((item) => (
                            <tr key={item.order_item_id}>
                              <td className="product-name">{item.product_title}</td>
                              <td className="center">{item.quantity}</td>
                              <td>{formatCurrency(item.unit_price)}</td>
                              <td className="subtotal">{formatCurrency(item.sub_total)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="items-summary">
                      <div className="summary-item">
                        <span>Total de Items:</span>
                        <strong>{selectedOrder.items_count}</strong>
                      </div>
                      <div className="summary-item total">
                        <span>Monto Total:</span>
                        <strong>{formatCurrency(selectedOrder.total)}</strong>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="no-items-message">
                    <p>No hay libros registrados en esta orden</p>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-close" onClick={closeDetailModal}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
