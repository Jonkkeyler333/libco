const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const orderService = {
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
  
  async validateOrder(orderId, token) {
    try {
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${API_URL}/api/orders/${orderId}/validate`, {
        method: 'POST',
        headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 409 && errorData.error_code === 'INSUFFICIENT_STOCK') {
          let stockMessage = typeof errorData.detail === 'string' ? errorData.detail : (errorData.detail && errorData.detail.message) || 'Stock insuficiente';
          if (errorData.available_stock) {
            const stockInfo = Object.values(errorData.available_stock);
            const stockDetails = stockInfo.map(item =>
              `${item.product_title}: disponible ${item.available_quantity}, solicitado ${item.requested_quantity}`
            ).join('; ');
            stockMessage = `Stock insuficiente. ${stockDetails}`;
          }
          const error = new Error(stockMessage);
          error.code = 'INSUFFICIENT_STOCK';
          error.stockInfo = errorData.available_stock || null;
          error.raw = errorData;
          throw error;
        }
        let detailMessage = 'Error al validar el pedido';
        if (typeof errorData.detail === 'string') {
          detailMessage = errorData.detail;
        } else if (errorData.detail && typeof errorData.detail === 'object') {
          // Si detail es un objeto, intentar extraer el mensaje
          if (errorData.detail.detail && typeof errorData.detail.detail === 'string') {
            detailMessage = errorData.detail.detail;
          } else if (errorData.detail.message && typeof errorData.detail.message === 'string') {
            detailMessage = errorData.detail.message;
          } else {
            // Si no podemos extraer nada útil, usar el error_code si existe
            detailMessage = errorData.error_code ? `Error: ${errorData.error_code}` : 'Error al validar el pedido';
          }
        } else if (errorData.message && typeof errorData.message === 'string') {
          detailMessage = errorData.message;
        }
        
        const error = new Error(detailMessage);
        error.raw = errorData;
        throw error;
      }
      return await response.json();
    } catch (error) {
      console.error(`Error validating order ${orderId}:`, error);
      throw error;
    }
  },
  
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
    try{
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
    } 
    catch (error) {
      console.error(`Error canceling order ${orderId}:`, error);
      throw error;
    }
  },
  
  // Get order details (items)
  async getOrderDetails(orderId, token) {
    try{
      const headers = {};
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await fetch(`${API_URL}/api/order/item/${orderId}`, {
        headers
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al obtener detalles del pedido');
      }
      return await response.json();
    } 
    catch (error){
      console.error(`Error getting order details ${orderId}:`, error);
      throw error;
    }
  }
};