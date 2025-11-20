import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_URL_inv = `${API_BASE_URL}/api/inventory/`;
const API_URL_pro = `${API_BASE_URL}/api/products/`;

export const getInventory = async (filter = filter) => {
  const param = new URLSearchParams(filter).toString();
  const url = param ? `${API_URL_inv}?${param}` : API_URL_inv;
  const token = localStorage.getItem('auth_token');
  const response = await axios.get(url, {
    withCredentials: true,
    headers: {
      Authorization: token ? `Bearer ${token}` : undefined,
    },
  });
  return response.data;
};

export const adjustInventory = async (updates = []) => {
  const url = `${API_URL_inv}/adjust-many`;
  const token = localStorage.getItem('auth_token');
  const response = await axios.put(url, updates, {
    withCredentials: true,
    headers: {
      Authorization: token ? `Bearer ${token}` : undefined,
      'Content-Type': 'application/json',
    },
  });
  return response.data;
};

// export const addBook2Inventory = async (book = []) => {
//   const url = `${API_URL}/add-new-book`;
//   const token = localStorage.getItem('auth_token');
//   const response = await axios.post(url, book, {
//     withCredentials: true,
//     headers: {
//       Authorization: token ? `Bearer ${token}` : undefined,
//       'Content-Type': 'application/json',
//     },
//   });
//   return response.data;
// };

export const addBook2Inventory = async (book = {}) => {
  // 1. Validación básica
  if (!book || typeof book !== 'object') {
    throw new Error('book debe ser un objeto');
  }

  // 2. Obtener token
  const token = localStorage.getItem('auth_token');
  if (!token) {
    throw new Error('No estás autenticado. Inicia sesión.');
  }

  // 3. Configuración de Axios
  const config = {
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  };

  try {
    console.log('Datos del libro a enviar:', book); // Debug

    // Primero, crear el producto
    const productData = { ...book };
    delete productData.quantity; // Removemos la cantidad ya que va en el inventario

    console.log('Enviando datos del producto:', productData); // Debug
    const productResponse = await axios.post(`${API_URL_pro}/create`, productData, config);
    console.log('Respuesta del producto:', productResponse.data); // Debug
    const product = productResponse.data;

    // Luego, actualizar el inventario
    const inventoryData = {
      product_id: product.product_id,
      quantity: book.quantity || 0
    };

    console.log('Enviando datos de inventario:', inventoryData); // Debug
    const inventoryResponse = await axios.post(`${API_URL_inv}/add-inventory`, inventoryData, config);
    console.log('Respuesta del inventario:', inventoryResponse.data); // Debug
    return inventoryResponse.data;

  } catch (err) {
    console.error('Error completo:', err); // Debug

    if (err.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
      throw new Error('Sesión expirada. Vuelve a iniciar sesión.');
    }

    let errorMessage = 'Error al conectar con el servidor';
    
    if (err.response?.data) {
      if (typeof err.response.data === 'object') {
        errorMessage = err.response.data.detail || err.response.data.message || JSON.stringify(err.response.data);
      } else {
        errorMessage = err.response.data;
      }
    } else if (err.message) {
      errorMessage = err.message;
    }

    console.error('Mensaje de error formateado:', errorMessage); // Debug
    throw new Error(errorMessage);
  }
};