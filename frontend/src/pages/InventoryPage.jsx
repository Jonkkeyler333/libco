import React, { useEffect, useState, useRef } from 'react';
import { getInventory } from '../services/inventoryService';
import Sidebar from '../components/layout/Sidebar';
import '../styles/Inventory.css';

const InventoryPage = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchField, setSearchField] = useState('title'); // 'title' or 'isbn'
  const debounceRef = useRef(null);

  useEffect(() => {
    fetchInventory({}); // Mostrar todo el inventario por defecto

    return () => {
      // limpiar cualquier timeout pendiente al desmontar
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const fetchInventory = async (filters = {}) => {
    setLoading(true);
    try {
      const data = await getInventory(filters);
      setInventory(data);
    } catch (error) {
      setInventory([]);
    }
    setLoading(false);
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <header className="main-header">
          <div className="page-title">
            <h1>Inventario</h1>
          </div>
        </header>
        <div className="create-inventory-container">
          {/* Busqueda por titulo */}
          <div className="search-container">
            <div className="select-search">
              <select
                value={searchField}
                onChange={(e) => setSearchField(e.target.value)}
                className="select"
                aria-label="Campo de búsqueda"
              >
                <option value="title">Título</option>
                <option value="isbn">ISBN</option>
              </select>    
              <input
                type="text"
                placeholder={searchField === 'title' ? 'Buscar por título...' : 'Buscar por ISBN...'}
                value={searchQuery}
                onChange={(e) => {
                  const value = e.target.value;
                  setSearchQuery(value);

                  if (debounceRef.current) {
                    clearTimeout(debounceRef.current);
                  }

                  debounceRef.current = setTimeout(() => {
                    const filters = {};
                    if (value) filters[searchField] = value;
                    fetchInventory(filters);
                  }, 300);
                }}
                className="search-input"
              />

              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    fetchInventory({});
                  }}
                  className="search-clear"
                  aria-label="Limpiar búsqueda"
                >
                  Limpiar
                </button>
              )}                  
            </div>            
          </div>

          {/* Inventario */}
          <div className="page-title">
            <h1>Libros</h1>
          </div>
          <div className="books-section">
            {loading ? (
              <div className="loading-container">Cargando...</div>
            ) : (
              <table className="books-table">
                <thead>
                  <tr>
                    <th>Título</th>
                    <th>Autor</th>
                    <th>ISBN</th>
                    <th>Precio</th>
                    <th>Cantidad</th>
                    <th>Reservado</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="no-products">No hay productos disponibles</td>
                    </tr>
                  ) : (
                    inventory.map(item => (
                      <tr key={item.product_id}>
                        <td className="td-title">{item.title}</td>
                        <td>{item.author || '-'}</td>
                        <td>{item.isbn || '-'}</td>
                        <td>${item.price ? item.price.toFixed(2) : '-'}</td>
                        <td>
                          <span className={`stock-badge ${item.quantity < 20 ? 'low' :item.quantity < 50 ? 'medium' :'high'}`}>
                            {item.quantity}
                          </span>
                        </td>
                        <td>
                          <span className="reserved-badge">
                            {item.reserved}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default InventoryPage;
