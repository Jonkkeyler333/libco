import { useState, useEffect } from 'react';
import { orderService } from '../../services/orderService';
import { useAuth } from '../../context/AuthContext';
import '../../styles/OrderDetailsModal.css';

const OrderDetailsModal = ({ orderId, onClose, isOpen }) => {
  const { token } = useAuth();
  const [orderItems, setOrderItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && orderId) {
      loadOrderDetails();
    }
  }, [isOpen, orderId]);

  const loadOrderDetails = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await orderService.getOrderDetails(orderId, token);
      setOrderItems(response);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return `$${price.toFixed(2)}`;
  };

  const calculateTotal = () => {
    return orderItems.reduce((total, item) => total + item.sub_total, 0);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📋 Detalles del Pedido ORD-{orderId?.toString().padStart(3, '0')}</h2>
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          {loading && (
            <div className="loading-details">
              <p>🔄 Cargando detalles del pedido...</p>
            </div>
          )}

          {error && (
            <div className="error-details">
              <p>❌ Error: {error}</p>
              <button onClick={loadOrderDetails} className="retry-button">
                🔄 Reintentar
              </button>
            </div>
          )}

          {!loading && !error && orderItems.length > 0 && (
            <>
              <div className="order-items-list">
                <h3>📚 Productos en el pedido:</h3>
                {orderItems.map((item, index) => (
                  <div key={item.order_item_id || index} className="order-item">
                    <div className="item-info">
                      <h4 className="item-title">{item.product_title}</h4>
                      <p className="item-details">
                        <span className="item-quantity">Cantidad: {item.quantity}</span>
                        <span className="item-price">Precio unitario: {formatPrice(item.unit_price)}</span>
                      </p>
                    </div>
                    <div className="item-subtotal">
                      <strong>{formatPrice(item.sub_total)}</strong>
                    </div>
                  </div>
                ))}
              </div>

              <div className="order-summary">
                <div className="summary-row">
                  <span className="summary-label">📦 Total de productos:</span>
                  <span className="summary-value">{orderItems.length}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">📊 Cantidad total:</span>
                  <span className="summary-value">
                    {orderItems.reduce((total, item) => total + item.quantity, 0)} unidades
                  </span>
                </div>
                <div className="summary-row total-row">
                  <span className="summary-label">💰 Total del pedido:</span>
                  <span className="summary-value total-amount">
                    {formatPrice(calculateTotal())}
                  </span>
                </div>
              </div>
            </>
          )}

          {!loading && !error && orderItems.length === 0 && (
            <div className="no-items">
              <p>📭 Este pedido no tiene productos asociados.</p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="close-modal-button" onClick={onClose}>
            🔙 Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal;