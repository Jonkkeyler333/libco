// Order service for LibCo
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const orderService = {
  // Create new order
  async createOrder(orderData, token) {
    try {
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers,
        body: JSON.stringify(orderData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al crear el pedido');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  },
  
  // Get user's orders with pagination
  async getUserOrders(userId, page = 1, pageSize = 10, token) {
    try {
      const headers = {};
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const url = new URL(`${API_URL}/api/users/${userId}/orders`);
      url.searchParams.append('page', page.toString());
      url.searchParams.append('page_size', pageSize.toString());
      
      const response = await fetch(url, {
        headers
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al obtener pedidos');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error getting user orders:', error);
      throw error;
    }
  },
  
  // Validate order (check inventory)
  async validateOrder(orderId, token) {
    try {
      const headers = {};
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${API_URL}/api/orders/${orderId}/validate`, {
        method: 'POST',
        headers
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al validar el pedido');
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error validating order ${orderId}:`, error);
      throw error;
    }
  },
  
  // Confirm order
  async confirmOrder(orderId, token) {
    try {
      const headers = {};
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${API_URL}/api/orders/${orderId}/confirm`, {
        method: 'POST',
        headers
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al confirmar el pedido');
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error confirming order ${orderId}:`, error);
      throw error;
    }
  },
  
  // Cancel order
  async cancelOrder(orderId, token) {
    try {
      const headers = {};
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${API_URL}/api/orders/${orderId}/cancel`, {
        method: 'DELETE',
        headers
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al cancelar el pedido');
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error canceling order ${orderId}:`, error);
      throw error;
    }
  }
};