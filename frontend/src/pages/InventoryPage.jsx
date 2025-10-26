import React, { useEffect, useState, useRef } from 'react';
import { getInventory, adjustInventory } from '../services/inventoryService';
import Sidebar from '../components/layout/Sidebar';
import '../styles/Inventory.css';

const InventoryPage = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchField, setSearchField] = useState('title'); // 'title' or 'isbn'
  const debounceRef = useRef(null);
  const [adjustments, setAdjustments] = useState({}); // product_id -> amount to add (>=0)
  const [showConfirm, setShowConfirm] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);


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

  const handleQuantityChange = (id, value) => {
    // Convertir a número y validar
    const quantity = parseInt(value, 10);
    if (quantity < 0) return;

    setAdjustments(prev => ({
      ...prev,
      [id]: quantity, // Evita negativos
    }));
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
              {/*Buscador*/}
              
            </div>                         
            {/* Switch y botón de actualizar */}
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <label className="switch-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={isEditing}
                  onChange={(e) => {
                    setIsEditing(e.target.checked);
                    if (!e.target.checked) {
                      setAdjustments({}); // Limpiar ajustes al desactivar
                    }
                  }}
                  className="switch-input"
                />
                <span className="switch-text">Modo edición</span>
              </label>
              
              {isEditing && Object.values(adjustments).some(v => v && v > 0) && (
                <button
                  onClick={() => setShowConfirm(true)}
                  className="btn-update"
                  aria-label="Actualizar inventario"
                >
                  Actualizar
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
                    {isEditing && <th>Ajuste</th>}
                  </tr>
                </thead>
                <tbody>
                  {inventory.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="no-products">No hay productos disponibles</td>
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
                        
                        {isEditing && <td style={{ minWidth: 140 }}>
                          <input
                            type="text"                            
                            className="quantity-input"
                            placeholder='0'
                            value={adjustments[item.product_id] || ''}
                            onChange={(e) => handleQuantityChange(item.product_id, e.target.value)}
                            onBlur={(e) => {
                              // Si el campo está vacío al perder el foco, establecer a 0
                              if (e.target.value === '') {
                                handleQuantityChange(item.product_id, '0');
                              }
                            }}
                          />
                        </td>}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
        {/* Modal de confirmación de actualización */}
        {showConfirm && (
          <div className="modal-overlay">
            <div className="modal" role="dialog" aria-modal="true">
              <h3>Confirmar actualización</h3>
              <div className="modal-content">
                <table className="confirm-table">
                  <thead>
                    <tr><th>Libro</th><th>Actual</th><th>Ajuste</th><th>Nuevo</th></tr>
                  </thead>
                  <tbody>
                    {Object.entries(adjustments).filter(([,v]) => v && v > 0).map(([pid, adj]) => {
                      const id = Number(pid);
                      const item = inventory.find(i => i.product_id === id);
                      if (!item) return null;
                      const newQty = item.quantity + adj;
                      return (
                        <tr key={pid}>
                          <td>{item.title}</td>
                          <td>{item.quantity}</td>
                          <td>+{adj}</td>
                          <td>{newQty}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="modal-actions">
                <button onClick={() => setShowConfirm(false)} className="btn-cancel">Cancelar</button>
                <button
                  onClick={async () => {
                    setIsUpdating(true);
                    try {
                      const updates = Object.entries(adjustments).filter(([,v]) => v && v > 0).map(([pid, adj]) => {
                        const id = Number(pid);
                        const item = inventory.find(i => i.product_id === id);
                        return { product_id: id, quantity: item.quantity + adj };
                      });
                      if (updates.length === 0) return setShowConfirm(false);
                      await adjustInventory(updates);
                      // refrescar inventario
                      await fetchInventory({});
                      setAdjustments({});
                      setShowConfirm(false);
                    } catch (err) {
                      // manejar error simple
                      alert('Error actualizando inventario');
                    } finally {
                      setIsUpdating(false);
                    }
                  }}
                  className="btn-confirm"
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Actualizando...' : 'Confirmar y actualizar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default InventoryPage;
