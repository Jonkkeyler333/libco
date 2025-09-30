// Product Card component for LibCo
import { useState } from 'react';
import { useOrder } from '../../context/OrderContext';

const ProductCard = ({ product }) => {
  const { addToCart } = useOrder();
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  
  const handleAddToCart = () => {
    setIsAdding(true);
    setTimeout(() => {
      addToCart(product, quantity);
      setIsAdding(false);
      setQuantity(1);
    }, 300);
  };
  
  const incrementQuantity = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setQuantity(prev => Math.min(prev + 1, 99));
  };
  
  const decrementQuantity = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setQuantity(prev => Math.max(prev - 1, 1));
  };
  
  return (
    <div className="product-card">
      <div className="product-image-container">
        <img 
          src={product.front_page_url || product.image_url} 
          alt={product.title} 
          className="product-image"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/libco_logo.png';
          }}
        />
        {product.on_sale && (
          <span className="product-badge sale">OFERTA</span>
        )}
        {product.is_popular && (
          <span className="product-badge popular">POPULAR</span>
        )}
      </div>
      
      <div className="product-info">
        <h3 className="product-title" title={product.title || 'Sin título'}>
          {product.title || 'Sin título'}
        </h3>
        <p className="product-author">
          {product.author || product.publisher || 'Autor desconocido'}
        </p>
        <p className="product-price">
          ${typeof product.price === 'number' ? product.price.toFixed(2) : '0.00'}
        </p>
        
        <div className="product-actions">
          <div className="quantity-selector">
            <button 
              className="quantity-btn dec" 
              onClick={decrementQuantity}
              disabled={quantity <= 1}
            >
              -
            </button>
            <span className="quantity">{quantity}</span>
            <button 
              className="quantity-btn inc" 
              onClick={incrementQuantity}
            >
              +
            </button>
          </div>
          
          <button 
            className={`add-to-cart ${isAdding ? 'adding' : ''}`}
            onClick={handleAddToCart}
            disabled={isAdding}
          >
            {isAdding ? 'Agregando...' : 'Agregar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;