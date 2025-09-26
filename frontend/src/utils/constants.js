// Application constants
export const APP_CONFIG = {
  NAME: 'LibCo - Sistema de Gestión de Libros',
  VERSION: '1.0.0',
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
};

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  PRODUCTS: '/products',
  ORDERS: '/orders',
  INVENTORY: '/inventory',
  REPORTS: '/reports',
  AUDIT_LOGS: '/audit-logs',
};

export const BREAKPOINTS = {
  SM: '640px',
  MD: '768px',  
  LG: '1024px',
  XL: '1280px',
};