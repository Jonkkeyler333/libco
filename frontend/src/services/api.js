// API configuration and base services
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const apiClient = {
  baseURL: API_URL,
  // Add authentication headers, interceptors, etc.
};

// Export service modules
export * from './authService';
export * from './productService';
export * from './orderService';