// API service for authentication using fetch
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const apiCall = async (url, options = {}) => {
  const token = localStorage.getItem('auth_token');
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${url}`, config);
    const data = await response.json();
    
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
      }
      throw new Error(data.detail || `Error ${response.status}`);
    }
    
    return data;
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error('Error de conexión con el servidor');
    }
    throw error;
  }
};

export const authService = {
  // Register user
  register: async (userData) => {
    return await apiCall('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  // Login user
  login: async (credentials) => {
    const data = await apiCall('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    const { access_token, user } = data;
    
    // Store token and user data
    localStorage.setItem('auth_token', access_token);
    localStorage.setItem('user_data', JSON.stringify(user));
    
    return data;
  },

  // Get current user
  getMe: async () => {
    return await apiCall('/api/auth/me');
  },

  // Logout user
  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
  },

  // Check if user is logged in
  isAuthenticated: () => {
    return !!localStorage.getItem('auth_token');
  },

  // Get stored user data
  getCurrentUser: () => {
    const userData = localStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
  },

  // Get stored token
  getToken: () => {
    return localStorage.getItem('auth_token');
  },
};

export default authService;