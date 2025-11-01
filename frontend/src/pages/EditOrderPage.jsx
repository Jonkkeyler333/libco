import { useState, useEffect, use } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useParams} from 'react-router-dom';
import { useOrder } from '../context/OrderContext';
import { orderService } from '../services/orderService';
import { productService } from '../services/productService';
import { OrderValidation } from '../components/ui';
import '../styles/EditOrder.css';

const EditOrderPage = () => {
    const { user, token } = useAuth();
    const { addOrderItem,editOrderItem,deleteOrderItem,getOrderDetails,validationResult,isValidating,error: contextError } = useOrder();
    const {id} = useParams();
    const navigate = useNavigate();
    const [error, setError] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [order_items, setOrderItems] = useState (null);
    const [order, setOrder] = useState (null);

    useEffect(() => {
        console.log("EditOrderPage mounted");
        console.log("Order ID:", id);
        const fetchOrderDetails = async () => {
            try {
                const orderData = await getOrderDetails(id,token);
                setOrderItems(orderData);
            } catch (error) {
                console.error("Error fetching order details:", error);
            }
        };
        const fetchOrder = async () => {
            try {
                const orderData = await orderService.getOrderById(id, token);
                setOrder(orderData);
            } catch (error) {
                console.error("Error fetching order:", error);
            }
        };
        fetchOrder();
        fetchOrderDetails();
    },[]);

    // solo se llama una vez al montar el componente
    useEffect(() => {
        const loadProducts = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('auth_token');
                const productsData = await productService.getAllProducts(token);
                setProducts(productsData || []);
            } catch (err) {
                console.error('Error loading products:', err);
                // setError('Error al cargar los productos. Por favor intente nuevamente.');
            } finally {
                setLoading(false);
            }
        };
        loadProducts();
        console.log("Products loaded:", products);
    },[]); 

    const handleAddItem = async (productId) => {
        try {
            setLoading(true);
            await addOrderItem(id,{"product_id":productId,"quantity":1},token);
            alert("Producto agregado al pedido:", productId);
            try {
                const orderData = await getOrderDetails(id,token);
                setOrderItems(orderData);
            } catch (error) {
                console.error("Error fetching order details:", error);
            }
            setLoading(false);
        } catch (error) {
            setError(error.message || 'Error desconocido');
        }
    }
    const handleEditItem = async (orderItemId, quantity) => {
        try {
            setLoading(true);
            await editOrderItem(id, orderItemId, quantity, token);
            const updatedOrderData = await getOrderDetails(id, token);
            setOrderItems(updatedOrderData);
            alert("Producto editado exitosamente, item ID:", orderItemId);
            setLoading(false);
        } catch (error) {
            const errorMessage = error.message || error.toString() || 'Error desconocido';
            setError(errorMessage);
            setLoading(false);
        }
    }
    const handleDeleteItem = async (orderId,itemId) => {
        try {
            setLoading(true);
            await deleteOrderItem(orderId, itemId, token);
            const updatedOrderData = await getOrderDetails(orderId, token);
            setOrderItems(updatedOrderData);
            alert("Producto eliminado exitosamente, item ID:", itemId);
            setLoading(false);
        } catch (error) {
            const errorMessage = error.message || error.toString() || 'Error desconocido';
            setError(errorMessage);
            setLoading(false);
        }
    }

    const handleValidateOrder = async () => {
        try {
            setLoading(true);
            const validationResponse = await orderService.validateOrder(id, token);
            setOrder(validationResponse);
            alert(`¡Orden validada exitosamente! Estado: ${validationResponse.status}`);
            navigate('/mis-pedidos');
        } catch (error) {
            console.error("Error al validar la orden:", error);
            const errorMessage = error.message || error.toString() || 'Error desconocido';
            setError(errorMessage);
            alert(`Error al validar la orden: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
        <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando productos...</p>
        </div>);
    }

    return (
      <div className="edit-order-container">
        <div className="edit-order-header">
          <button 
            onClick={() => navigate('/')}
            className="back-button"
          >
            <span>←</span> Volver al Dashboard
          </button>
          <h1>Editar Pedido</h1>
          <p>Personaliza tu pedido con ID #{id}</p>
        </div>

        {/* Sección de Productos Disponibles */}
        <div className="products-section">
          <h2>Libros Disponibles</h2>
          <div className="products-table">
            <table>
              <thead>
                <tr>
                  <th>Portada</th>
                  <th>Título</th>
                  <th>Autor</th>
                  <th>Precio</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="no-products">
                      📚 No hay productos disponibles
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product.product_id}>
                      <td>
                        <img
                          src={product.front_page_url || product.image_url} 
                          alt={product.title}
                          style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                        /> 
                      </td>
                      <td>{product.title}</td>
                      <td>{product.author}</td>
                      <td>${((product.price ?? 0)).toFixed(2)}</td>
                      <td>
                        <button
                          onClick={() => handleAddItem(product.product_id)}
                          className="add-to-cart-btn"
                          disabled={loading}
                        >
                          + Agregar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sección de Detalles del Pedido */}
        <div className="order-details-section">
          <h2>Detalles del Pedido</h2>
          {order_items ? (
            <div>
              <div className="order-info-grid">
                <div className="order-info-item">
                  <span className="order-info-label">ID del Pedido</span>
                  <span className="order-info-value">#{id}</span>
                </div>
                <div className="order-info-item">
                  <span className="order-info-label">Estado</span>
                  <span className={`order-status ${order.status}`}>{order.status}</span>
                </div>
                <div className="order-info-item">
                  <span className="order-info-label">Total</span>
                  <span className="order-info-value">${order.total.toFixed(2)}</span>
                </div>
                <div className="order-info-item">
                  <span className="order-info-label">Fecha</span>
                  <span className="order-info-value">{new Date(order.created_at).toLocaleDateString('es-ES')}</span>
                </div>
              </div>

              <div className="order-items-list">
                <h3>Items del Pedido</h3>
                {order_items.length === 0 ? (
                  <p className="empty-order-message">🛒 No hay items en este pedido</p>
                ) : (
                  <ul>
                    {order_items.map((item) => (
                      <li key={item.product_id} className="order-item">
                        <div className="item-info">
                          <span className="item-title">{item.product_title}</span>
                          <div className="item-details">
                            <span className="item-detail-badge">
                              📦 Cantidad: <strong>{item.quantity}</strong>
                            </span>
                            <span className="item-detail-badge">
                              💵 Precio: <strong>${item.unit_price.toFixed(2)}</strong>
                            </span>
                            <span className="item-detail-badge">
                              💰 Subtotal: <strong>${item.sub_total.toFixed(2)}</strong>
                            </span>
                          </div>
                        </div>
                        <div className="item-actions">
                          <button 
                            onClick={() => handleEditItem(item.product_id, item.quantity + 1)} 
                            disabled={loading}
                            className="item-btn item-btn-plus"
                            title="Aumentar cantidad"
                          >
                            +
                          </button>
                          <button 
                            onClick={() => handleEditItem(item.product_id, item.quantity - 1)} 
                            disabled={loading || item.quantity === 1}
                            className="item-btn item-btn-minus"
                            title="Disminuir cantidad"
                          >
                            −
                          </button>
                          <button 
                            onClick={() => handleDeleteItem(id, item.product_id)} 
                            disabled={loading}
                            className="item-btn item-btn-delete"
                            title="Eliminar item"
                          >
                            🗑️ Eliminar
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Cargando detalles del pedido...</p>
            </div>
          )}

          {/* Sección de Validación */}
          {order_items && order_items.length > 0 && (
            <div className="validation-section">
              <h2>¿Ya terminaste de editar?</h2>
              <p>Vamos a validar tu orden para asegurar disponibilidad de stock 🧐</p>
              <button 
                onClick={handleValidateOrder} 
                disabled={loading}
                className="validate-button"
              >
                ✓ Validar Orden
              </button>
            </div>
          )}
        </div>

        {/* Mensaje de Error */}
        {error && (
          <div className="error-message">
            <p>⚠️ Error: {String(error)}</p>
            <button onClick={() => window.location.reload()} className="retry-button">
              🔄 Reintentar
            </button>
          </div>
        )}

        {/* Modal de Validación */}
        {(isValidating || validationResult || contextError) && id && (
          <OrderValidation orderId={id} />
        )}
      </div>
    )
};

export default EditOrderPage;