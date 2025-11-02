import React, { useEffect, useState, useRef } from 'react';
import { getInventory, adjustInventory, addBook2Inventory } from '../services/inventoryService';
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
  const [showAddBook, setShowAddBook] = useState(false);
  const [newBook, setNewBook] = useState({
    sku: '',
    title: '',
    author: '',
    isbn: '',
    price: 0.0,
    quantity: 0,
    format: 'paperback',
    edition: '1st',
    language: 'es',
    publisher: '',
    publication_year: 0,
    currency: 'COP',
    description: '',
    pages: 0,
    weight: 0.0,
    dimensions: ''
  });  
  const [addingBook, setAddingBook] = useState(false);

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
            <button
              onClick={() => setShowAddBook(true)}
              className="btn-update"
              aria-label="Agregar nuevo libro"
            >
              Agregar libro
            </button>
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

        {/* Modal para agregar nuevo libro */}
        {showAddBook && (
          <div className="modal-overlay">
            <div className="modal" role="dialog" aria-modal="true">
              <h3>Agregar nuevo libro</h3>
              <div className="modal-content">
                <form className="add-book-form" onSubmit={async (e) => {
                  e.preventDefault();
                  setAddingBook(true);
                  try {
                    // Validar y convertir campos numéricos
                    const bookToSubmit = {
                      ...newBook,
                      price: parseFloat(newBook.price) || 0,
                      quantity: parseInt(newBook.quantity, 10) || 0,
                      pages: parseInt(newBook.pages, 10) || 0,
                      publication_year: parseInt(newBook.publication_year, 10) || 0,
                      weight: parseFloat(newBook.weight) || 0
                    };
                    console.log('Enviando libro:', bookToSubmit);
                    await addBook2Inventory(bookToSubmit);
                    await fetchInventory({});
                    setShowAddBook(false);
                    setNewBook({
                      sku: '',
                      title: '',
                      author: '',
                      isbn: '',
                      price: 0.0,
                      quantity: 0,
                      format: 'paperback',
                      edition: '1st',
                      language: 'es',
                      publisher: '',
                      publication_year: 0,
                      currency: 'COP',
                      description: '',
                      pages: 0,
                      weight: 0.0,
                      dimensions: ''
                    });
                  } catch (err) {
                    console.error('Error al agregar el libro:', err);
                    alert(`Error al agregar el libro: ${err.message || 'Error desconocido'}`);
                  } finally {
                    setAddingBook(false);
                  }
                }}>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="title">Título</label>
                      <input
                        type="text"
                        id="title"
                        required
                        value={newBook.title}
                        onChange={e => setNewBook(prev => ({ ...prev, title: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="author">Autor</label>
                      <input
                        type="text"
                        id="author"
                        required
                        value={newBook.author}
                        onChange={e => setNewBook(prev => ({ ...prev, author: e.target.value }))}
                      />
                    </div>
                  </div>                 

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="isbn">ISBN</label>
                      <input
                        type="text"
                        id="isbn"
                        required
                        value={newBook.isbn}
                        onChange={e => setNewBook(prev => ({ ...prev, isbn: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="sku">SKU</label>
                      <input
                        type="text"
                        id="sku"
                        required
                        value={newBook.sku}
                        onChange={e => setNewBook(prev => ({ ...prev, sku: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="edition">Edición</label>
                      <input
                        type="text"
                        id="edition"
                        value={newBook.edition}
                        onChange={e => setNewBook(prev => ({ ...prev, edition: e.target.value }))}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="publisher">Editorial</label>
                      <input
                        type="text"
                        id="publisher"
                        required
                        value={newBook.publisher}
                        onChange={e => setNewBook(prev => ({ ...prev, publisher: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="price">Precio</label>
                      <input
                        type="number"
                        id="price"
                        required
                        min="0"
                        step="0.01"
                        value={newBook.price}
                        onChange={e => setNewBook(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="quantity">Cantidad inicial</label>
                      <input
                        type="number"
                        id="quantity"
                        required
                        min="0"
                        value={newBook.quantity}
                        onChange={e => setNewBook(prev => ({ ...prev, quantity: parseInt(e.target.value, 10) }))}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="pages">Cantidad de paginas</label>
                      <input
                        type="number"
                        id="pages"
                        required
                        min="0"
                        value={newBook.pages}
                        onChange={e => setNewBook(prev => ({ ...prev, pages: parseInt(e.target.value) }))}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="publication_year">Año de publicación</label>
                      <input
                        type="number"
                        id="publication_year"
                        required
                        min="0"
                        value={newBook.publication_year}
                        onChange={e => setNewBook(prev => ({ ...prev, publication_year: parseInt(e.target.value, 10) }))}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="weight">Peso</label>
                      <input
                        type="number"
                        id="weight"
                        value={newBook.weight}
                        onChange={e => setNewBook(prev => ({ ...prev, weight: parseFloat(e.target.value) }))}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="dimensions">Dimensiones</label>
                      <input
                        type="text"
                        id="dimensions"
                        required
                        value={newBook.dimensions}
                        onChange={e => setNewBook(prev => ({ ...prev, dimensions: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="format">Formato</label>
                      <select
                        id="format"
                        value={newBook.format}
                        onChange={e => setNewBook(prev => ({ ...prev, format: e.target.value }))}
                      >
                        <option value="paperback">Tapa blanda</option>
                        <option value="hardcover">Tapa dura</option>
                        <option value="digital">Digital</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="language">Idioma</label>
                      <select
                        id="language"
                        value={newBook.language}
                        onChange={e => setNewBook(prev => ({ ...prev, language: e.target.value }))}
                      >
                        <option value="es">Español</option>
                        <option value="en">Inglés</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="form-row form-row-full">
                    <div className="form-group">
                      <label htmlFor="description">Descripción</label>
                      <textarea
                        id="description"
                        required
                        value={newBook.description}
                        onChange={e => setNewBook(prev => ({ ...prev, description: e.target.value}))}
                        rows="3"
                        className="form-textarea"
                      />
                    </div>
                  </div>

                  <div className="modal-actions">
                    <button 
                      type="button" 
                      onClick={() => setShowAddBook(false)} 
                      className="btn-cancel"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="btn-confirm"
                      disabled={addingBook}
                    >
                      {addingBook ? 'Agregando...' : 'Agregar libro'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default InventoryPage;
