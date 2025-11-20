import axios from 'axios';
import { orderService } from './orderService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_URL = `${API_BASE_URL}/api/orders`;

/**
 * Obtiene todos los pedidos realizados y confirmados
 * @param {number} page - Número de página (default: 1)
 * @param {number} pageSize - Cantidad de pedidos por página (default: 10)
 * @returns {Promise} Lista de pedidos con detalles
 */
export const getAllOrders = async (page = 1, pageSize = 10) => {
  try {
    const response = await axios.get(`${API_URL}/orders/external`, {
      params: {
        page,
        page_size: pageSize
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al obtener pedidos:', error);
    throw error;
  }
};

/**
 * Obtiene los detalles de un pedido específico
 * @param {number} orderId - ID del pedido
 * @returns {Promise} Detalles del pedido
 */
export const getOrderDetails = async (orderId) => {
  try {
    const token = localStorage.getItem('auth_token');
    return await orderService.getOrderById(orderId, token);
  } catch (error) {
    console.error(`Error al obtener detalles del pedido ${orderId}:`, error);
    throw error;
  }
};

export default {
  getAllOrders,
  getOrderDetails
};
