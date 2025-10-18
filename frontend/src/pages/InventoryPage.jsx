import React, { useEffect, useState, useRef } from 'react';
import { getInventory } from '../services/inventoryService';
import Sidebar from '../components/layout/Sidebar';
import '../styles/Inventory.css';

const InventoryPage = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const debounceRef = useRef(null);

  useEffect(() => {
    fetchInventory({}); // Mostrar todo el inventario por defecto
  }, []);

  const fetchInventory = async (filter = filter) => {
    setLoading(true);
    try {
      const data = await getInventory(filter);
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
              <input
                type="text"
                placeholder="Buscar libros..."
                value={searchQuery}
                onChange={(e) => {
                  const value = e.target.value;
                  setSearchQuery(value);
                  
                  // Limpiar timeout anterior si existe
                  if (debounceRef.current) {
                    clearTimeout(debounceRef.current);
                  }
                  
                  // Crear nuevo timeout para buscar
                  debounceRef.current = setTimeout(() => {
                    fetchInventory(value ? { title: value } : {});
                  }, 300);
                }}
                className="search-input"
              />
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
                    <th>Precio</th>
                    <th>Cantidad</th>
                    <th>Reservado</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="no-products">No hay productos disponibles</td>
                    </tr>
                  ) : (
                    inventory.map(item => (
                      <tr key={item.product_id}>
                        <td className="td-title">{item.title}</td>
                        <td>{item.author || '-'}</td>
                        <td>${item.price ? item.price.toFixed(2) : '-'}</td>
                        <td>
                          <span className={`stock-badge ${item.quantity < 20 ? 'low' :item.quantity < 50 ? 'medium' :'high'}`}>
                            {item.quantity}
                          </span>
                        </td>
                        <td>{item.reserved}</td>
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
