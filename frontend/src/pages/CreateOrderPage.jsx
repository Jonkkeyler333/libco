import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useOrder } from '../context/OrderContext';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { productService } from '../services/productService';
import { orderService } from '../services/orderService';
import '../styles/CreateOrder.css';

const CreateOrderPage = () => {
  const { user } = useAuth();
  const { currentOrder, addToCart, removeFromCart, updateQuantity, clearCart, submitOrder } = useOrder();
  
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [orderError, setOrderError] = useState(null);

  // Cargar productos cuando el componente se monta
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('auth_token');
        const productsData = await productService.getAllProducts(token);
        setProducts(productsData || []);
      } catch (err) {
        console.error('Error loading products:', err);
        setError('Error al cargar los productos. Por favor intente nuevamente.');
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  // Sincronizar con el estado del carrito desde el contexto
  useEffect(() => {
    if (currentOrder && currentOrder.items) {
      setCartItems(currentOrder.items);
    }
  }, [currentOrder]);

  // Filtrar productos basados en el término de búsqueda
  const filteredProducts = products.filter(product =>
    product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.author && product.author.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Manejar cambios en la búsqueda
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Manejar la adición de un producto al carrito
  const handleAddToCart = (product, quantity = 1) => {
    addToCart(product, quantity);
  };

  // Manejar la eliminación de un producto del carrito
  const handleRemoveFromCart = (productId) => {
    removeFromCart(productId);
  };

  // Manejar la actualización de la cantidad de un producto en el carrito
  const handleQuantityChange = (productId, newQuantity) => {
    updateQuantity(productId, newQuantity);
  };

  // Manejar el envío del pedido
  const handleSubmitOrder = async () => {
    try {
      setOrderSubmitting(true);
      setOrderError(null);
      
      // Obtener el token de autenticación
      const token = localStorage.getItem('auth_token');
      
      // Usar directamente el método submitOrder del contexto
      const result = await submitOrder(token);
      
      // Guardar el resultado exitoso
      setOrderSuccess(result);
      
    } catch (error) {
      console.error('Error creating order:', error);
      setOrderError(error.message || 'Error al crear el pedido');
    } finally {
      setOrderSubmitting(false);
    }
  };

  // Si la página está cargando
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando productos...</p>
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
        
        <div className="create-order-container">
          <div className="page-title">
            <h1>Crear Pedido</h1>
          </div>
          
          {/* Búsqueda de productos */}
          <div className="search-container">
            <input
              type="text"
              placeholder="Buscar libros para agregar al pedido..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="search-input"
            />
          </div>
          
          {/* Lista de productos disponibles */}
          <div className="products-section">
            <h2>Libros Disponibles</h2>
            <div className="products-table">
              <table>
                <thead>
                  <tr>
                    <th>Título</th>
                    <th>Autor</th>
                    <th>Precio</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="no-products">
                        No hay productos disponibles
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((product) => (
                      <tr key={product.product_id}>
                        <td>{product.title}</td>
                        <td>{product.author}</td>
                        <td>${product.price.toFixed(2)}</td>
                        <td>
                          <button
                            onClick={() => handleAddToCart(product, 1)}
                            className="add-to-cart-btn"
                          >
                            Agregar
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Resumen del pedido */}
          <div className="order-summary">
            <h2>Resumen del Pedido</h2>
            
            {cartItems.length === 0 ? (
              <p>No hay artículos en el carrito</p>
            ) : (
              <>
                <div className="cart-items">
                  <table>
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>Cantidad</th>
                        <th>Precio Unit.</th>
                        <th>Subtotal</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cartItems.map((item) => {
                        const product = products.find(p => p.product_id === item.product_id);
                        return (
                          <tr key={item.product_id}>
                            <td>{product ? product.title : `Producto #${item.product_id}`}</td>
                            <td>
                              <div className="quantity-controls">
                                <button
                                  onClick={() => handleQuantityChange(item.product_id, item.quantity - 1)}
                                  disabled={item.quantity <= 1}
                                >
                                  -
                                </button>
                                <span>{item.quantity}</span>
                                <button
                                  onClick={() => handleQuantityChange(item.product_id, item.quantity + 1)}
                                >
                                  +
                                </button>
                              </div>
                            </td>
                            <td>${item.unit_price.toFixed(2)}</td>
                            <td>${item.sub_total.toFixed(2)}</td>
                            <td>
                              <button
                                onClick={() => handleRemoveFromCart(item.product_id)}
                                className="remove-btn"
                              >
                                Eliminar
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan="3" className="total-label">Total:</td>
                        <td className="total-value">${currentOrder.total.toFixed(2)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                
                <div className="order-actions">
                  <button
                    className="clear-cart-btn"
                    onClick={clearCart}
                    disabled={orderSubmitting}
                  >
                    Limpiar Carrito
                  </button>
                  <button
                    className="submit-order-btn"
                    onClick={handleSubmitOrder}
                    disabled={cartItems.length === 0 || orderSubmitting}
                  >
                    {orderSubmitting ? 'Procesando...' : 'Realizar Pedido'}
                  </button>
                </div>
              </>
            )}
            
            {/* Mensaje de éxito o error */}
            {orderSuccess && (
              <div className="order-success">
                <h3>¡Pedido realizado con éxito!</h3>
                <p>Número de pedido: {orderSuccess.order_id}</p>
                <p>Estado: {orderSuccess.status}</p>
                <p>Total: ${orderSuccess.total.toFixed(2)}</p>
                <p>{orderSuccess.message}</p>
                <p>Siguiente paso: {orderSuccess.next_step}</p>
              </div>
            )}
            
            {orderError && (
              <div className="order-error">
                <h3>Error al procesar el pedido</h3>
                <p>{orderError}</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default CreateOrderPage;