import React, { useEffect, useState } from 'react';
import { getInventory } from '../services/inventoryService';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';

const InventoryPage = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ sku: '', title: '', product_id: '' });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchInventory({}); // Mostrar todo el inventario por defecto
  }, []);

  const fetchInventory = async (filters = filter) => {
    setLoading(true);
    try {
      const data = await getInventory(filters);
      setInventory(data);
    } catch (error) {
      setInventory([]);
    }
    setLoading(false);
  };

  const handleChange = (e) => {
    setFilter({ ...filter, [e.target.name]: e.target.value });
  };

  const handleFilter = (e) => {
    e.preventDefault();
    fetchInventory(filter);
  };

  const handleClearFilters = () => {
    setFilter({ sku: '', title: '', product_id: '' });
    fetchInventory({});
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <Header />
        <div className="dashboard-container">
          <h2 className="text-2xl font-bold mb-4">Inventario de Productos</h2>
          <button
            type="button"
            className="bg-blue-500 text-white px-4 py-1 rounded mb-4"
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
          </button>
          {showFilters && (
            <form className="mb-4 flex flex-wrap items-center gap-4" onSubmit={handleFilter}>
              <div className="flex flex-1 gap-4">
                <input name="sku" value={filter.sku} onChange={handleChange} placeholder="SKU" className="border px-4 py-2 text-lg rounded w-48" />
                <input name="title" value={filter.title} onChange={handleChange} placeholder="Título" className="border px-4 py-2 text-lg rounded w-64" />
                <input name="product_id" value={filter.product_id} onChange={handleChange} placeholder="ID Producto" className="border px-4 py-2 text-lg rounded w-40" />
              </div>
              <div className="flex gap-2 ml-auto">
                <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded text-lg">Filtrar</button>
                <button type="button" onClick={handleClearFilters} className="bg-gray-300 text-gray-800 px-6 py-2 rounded text-lg">Limpiar filtros</button>
              </div>
            </form>
          )}
          {loading ? (
            <div className="loading-container">Cargando...</div>
          ) : (
            <table className="min-w-full border products-table">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-4 py-2">ID</th>
                  <th className="border px-4 py-2">SKU</th>
                  <th className="border px-4 py-2">Título</th>
                  <th className="border px-4 py-2">Autor</th>
                  <th className="border px-4 py-2">Precio</th>
                  <th className="border px-4 py-2">Cantidad</th>
                  <th className="border px-4 py-2">Reservado</th>
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
                      <td className="border px-4 py-2">{item.product_id}</td>
                      <td className="border px-4 py-2">{item.sku}</td>
                      <td className="border px-4 py-2">{item.title}</td>
                      <td className="border px-4 py-2">{item.author || '-'}</td>
                      <td className="border px-4 py-2">${item.price ? item.price.toFixed(2) : '-'}</td>
                      <td className="border px-4 py-2">{item.quantity}</td>
                      <td className="border px-4 py-2">{item.reserved}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
};

export default InventoryPage;
