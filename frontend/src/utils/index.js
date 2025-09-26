// Utility functions for the LibCo application

// Format currency for Colombian Pesos
export const formatCurrency = (amount, currency = 'COP') => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

// Format dates consistently
export const formatDate = (date) => {
  return new Intl.DateTimeFormat('es-CO').format(new Date(date));
};

// Validate ISBN format
export const validateISBN = (isbn) => {
  const cleanISBN = isbn.replace(/[-\s]/g, '');
  return cleanISBN.length === 10 || cleanISBN.length === 13;
};

// Role-based access helper
export const hasPermission = (userRole, requiredRole) => {
  const roleHierarchy = { 'user': 1, 'admin': 2 };
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
};