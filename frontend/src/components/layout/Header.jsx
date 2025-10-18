import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useOrder } from '../../context/OrderContext';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const { currentOrder, getCartItemsCount } = useOrder();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { user ,isAdmin } = useAuth();
  const navigate = useNavigate();
  const cartItemsCount = getCartItemsCount();
  
  return (
    <header className="main-header">
      <div className="header-content">
        <h1>Panel Principal</h1>
        {!isAdmin() && (
          <div className="header-actions">
          <div className="cart-container">
            <button 
              className="cart-button"
              onClick={() => setIsCartOpen(!isCartOpen)}
              aria-label="Ver carrito"
            >
              <span className="cart-icon">🛒</span>
              {cartItemsCount > 0 && (
                <span className="cart-badge">{cartItemsCount}</span>
              )}
              <span className="cart-label">Carrito</span>
            </button>
            
            {isCartOpen && (
              <div className="cart-dropdown">
                <div className="cart-header">
                  <h3>Mi Carrito</h3>
                  <button 
                    className="close-cart"
                    onClick={() => setIsCartOpen(false)}
                  >
                    ✖
                  </button>
                </div>
                
                <div className="cart-items">
                  {currentOrder.items.length === 0 ? (<p className="empty-cart">Tu carrito está vacío</p>) : (
                    <ul>
                      {currentOrder.items.map((item) => (
                        <li key={item.product_id} className="cart-item">
                          <div className="item-details">
                            <div className="item-name">Producto #{item.product_id}</div>
                            <div className="item-price">
                              {item.quantity} x ${item.unit_price.toFixed(2)}
                            </div>
                          </div>
                          <div className="item-subtotal">
                            ${item.sub_total.toFixed(2)}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                
                <div className="cart-footer">
                  <div className="cart-total">
                    <span>Total:</span>
                    <span>${currentOrder.total.toFixed(2)}</span>
                  </div>
                  
                  <div className="cart-actions">
                    <button 
                      className="view-cart-button"
                      onClick={() => navigate("/crear-pedido")}
                      disabled={currentOrder.items.length === 0}
                    >
                      Ver Detalle
                    </button>
                    {/* <button 
                      className="checkout-button"
                      onClick={() => navigate("")}
                      disabled={currentOrder.items.length === 0}
                    >
                      Procesar Pedido
                    </button> */}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        )}
      </div>
    </header>
  );
};

export default Header;