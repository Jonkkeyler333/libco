import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useOrder } from '../context/OrderContext';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { OrderValidation } from '../components/ui';
import { productService } from '../services/productService';
import '../styles/CreateOrder.css';

const CreateOrderPage = () => {
  const { user } = useAuth();
  const { 
    currentOrder, 
    addToCart, 
    removeFromCart, 
    updateQuantity, 
    clearCart, 
    submitOrder, 
    isLoading,
    isValidating,
    validationResult,
    error: contextError,
    clearError
  } = useOrder();
  
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [submittedOrderId, setSubmittedOrderId] = useState(null);

  useEffect(() => {
    clearError();
  }, []);

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

  useEffect(() => {
    if (currentOrder && currentOrder.items) {
      setCartItems(currentOrder.items);
    }
  }, [currentOrder]);

  const filteredProducts = products.filter(product =>
    product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.author && product.author.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleAddToCart = (product, quantity = 1) => {
    addToCart(product, quantity);
  };

  const handleRemoveFromCart = (productId) => {
    removeFromCart(productId);
  };

  const handleQuantityChange = (productId, newQuantity) => {
    updateQuantity(productId, newQuantity);
  };

  const handleSubmitOrder = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const result = await submitOrder(token);
      console.log('CreateOrderPage - submitOrder result:', result);
      
      if (result && result.order && result.order.order_id) {
        console.log('CreateOrderPage - Setting submittedOrderId to:', result.order.order_id);
        setSubmittedOrderId(result.order.order_id);
      } else {
        console.log('CreateOrderPage - No order_id found in result');
      }
      
    } catch (err) {
      console.error('Error creating order:', err);
      console.log('CreateOrderPage - Current submittedOrderId after error:', submittedOrderId);
    }
  };


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
        
        {/* Error de carga de productos */}
        {error && (
          <div className="error-message">
            <span>{error}</span>
            <button 
              className="close-error-btn"
              onClick={() => setError(null)}
              aria-label="Cerrar error"
            >
              ✕
            </button>
          </div>
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
                    disabled={isLoading || isValidating}
                  >
                    Limpiar Carrito
                  </button>
                  <button
                    className="submit-order-btn"
                    onClick={handleSubmitOrder}
                    disabled={cartItems.length === 0 || isLoading || isValidating}
                  >
                    {isLoading ? 'Procesando...' : 'Realizar Pedido'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
        {(isValidating || validationResult || contextError) && submittedOrderId && (
          <OrderValidation orderId={submittedOrderId} />
        )}
      </main>
    </div>
  );
};

export default CreateOrderPage;