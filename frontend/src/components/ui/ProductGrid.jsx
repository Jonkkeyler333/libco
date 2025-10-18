import ProductCard from './ProductCard';

const ProductGrid = ({ title, products, viewAllLink, showBadge, badgeText }) => {
  return (
    <div className="product-section">
      <div className="section-header">
        <div className="section-title">
          {showBadge && (
            <span className={`section-badge ${badgeText?.toLowerCase()}`}>
              {badgeText}
            </span>
          )}
          <h2>{title}</h2>
        </div>
        {viewAllLink && (
          <a href={viewAllLink} className="view-all-link">
            Ver Todo
          </a>
        )}
      </div>
      
      {products.length === 0 ? (
        <div className="no-products">
          <p>No hay productos disponibles</p>
        </div>
      ) : (
        <div className="products-grid">
          {products.map(product => (
            <ProductCard key={product.product_id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductGrid;