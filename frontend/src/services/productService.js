// Product service for LibCo
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const productService = {
  async getAllProducts(token) {
    try {
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${API_URL}/api/products`, {
        headers
      });
      
      if (!response.ok) {
        throw new Error('Error al obtener productos');
      }
      
      const data = await response.json();
      return Array.isArray(data) ? data : (data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  },
  
  async getProductById(productId, token) {
    try {
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${API_URL}/api/products/${productId}`, {
        headers
      });
      
      if (!response.ok) {
        throw new Error(`Error al obtener producto con ID: ${productId}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error fetching product ${productId}:`, error);
      throw error;
    }
  },
  
  // Search products by title or description
  async searchProducts(query, token) {
    try {
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${API_URL}/api/products/search?query=${encodeURIComponent(query)}`, {
        headers
      });
      
      if (!response.ok) {
        throw new Error('Error en la búsqueda de productos');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error searching products:', error);
      throw error;
    }
  },
  
  // Get featured products (random selection for now)
  async getFeaturedProducts(limit = 5, token) {
    try {
      const allProducts = await this.getAllProducts(token);
      // For demo purposes, just return random products
      const shuffled = [...allProducts].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, limit);
    } catch (error) {
      console.error('Error fetching featured products:', error);
      throw error;
    }
  },
  
  // Get latest products (random selection for now)
  async getLatestProducts(limit = 5, token) {
    try {
      const allProducts = await this.getAllProducts(token);
      // For demo purposes, just return random products in different order
      const shuffled = [...allProducts].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, limit);
    } catch (error) {
      console.error('Error fetching latest products:', error);
      throw error;
    }
  }
};