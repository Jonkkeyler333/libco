import React, { createContext, useContext, useReducer } from 'react';

// Order Context
const OrderContext = createContext();

// Order reducer
const orderReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_TO_CART':
      const existingItemIndex = state.currentOrder.items.findIndex(
        item => item.product_id === action.payload.product_id
      );

      let updatedItems;
      if (existingItemIndex >= 0) {
        updatedItems = state.currentOrder.items.map((item, index) =>
          index === existingItemIndex
            ? { ...item, quantity: item.quantity + action.payload.quantity }
            : item
        );
      } else {
        updatedItems = [...state.currentOrder.items, action.payload];
      }

      const newTotal = updatedItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);

      return {
        ...state,
        currentOrder: {
          ...state.currentOrder,
          items: updatedItems,
          total: newTotal
        }
      };

    case 'REMOVE_FROM_CART':
      const filteredItems = state.currentOrder.items.filter(
        item => item.product_id !== action.payload
      );
      const updatedTotal = filteredItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);

      return {
        ...state,
        currentOrder: {
          ...state.currentOrder,
          items: filteredItems,
          total: updatedTotal
        }
      };

    case 'UPDATE_QUANTITY':
      const updatedCartItems = state.currentOrder.items.map(item =>
        item.product_id === action.payload.product_id
          ? { ...item, quantity: action.payload.quantity }
          : item
      );
      const recalculatedTotal = updatedCartItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);

      return {
        ...state,
        currentOrder: {
          ...state.currentOrder,
          items: updatedCartItems,
          total: recalculatedTotal
        }
      };

    case 'CLEAR_CART':
      return {
        ...state,
        currentOrder: {
          items: [],
          total: 0,
          status: 'draft'
        }
      };

    case 'SET_ORDERS':
      return {
        ...state,
        orders: action.payload
      };

    case 'ADD_ORDER':
      return {
        ...state,
        orders: [...state.orders, action.payload],
        currentOrder: {
          items: [],
          total: 0,
          status: 'draft'
        }
      };

    case 'UPDATE_ORDER_STATUS':
      return {
        ...state,
        orders: state.orders.map(order =>
          order.order_id === action.payload.order_id
            ? { ...order, status: action.payload.status }
            : order
        )
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
        isValidating: false
      };
    
    case 'START_VALIDATION':
      return {
        ...state,
        isValidating: true,
        validationResult: null
      };
      
    case 'VALIDATION_COMPLETE':
      return {
        ...state,
        isValidating: false,
        validationResult: action.payload
      };

    default:
      return state;
  }
};

// Initial state
const initialOrderState = {
  currentOrder: {
    items: [],
    total: 0,
    status: 'draft'
  },
  orders: [],
  isLoading: false,
  isValidating: false,
  validationResult: null,
  error: null
};

// Order Provider
export const OrderProvider = ({ children }) => {
  const [state, dispatch] = useReducer(orderReducer, initialOrderState);

  const addToCart = (product, quantity = 1) => {
    const orderItem = {
      product_id: product.product_id,
      quantity: quantity,
      unit_price: product.price,
      sub_total: product.price * quantity
    };
    dispatch({ type: 'ADD_TO_CART', payload: orderItem });
  };

  const removeFromCart = (productId) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: productId });
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      dispatch({ type: 'UPDATE_QUANTITY', payload: { product_id: productId, quantity } });
    }
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const submitOrder = async (token) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      // Import dynamically to avoid circular dependency
      const { orderService } = await import('../services/orderService');
      
      // Formatear los datos según lo esperado por la API
      const orderData = {
        items: state.currentOrder.items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity
        }))
      };
      
      const newOrder = await orderService.createOrder(orderData, token);
      dispatch({ type: 'ADD_ORDER', payload: newOrder });
      
      // Iniciamos el proceso de validación automáticamente
      dispatch({ type: 'START_VALIDATION' });
      const validatedOrder = await validateOrder(newOrder.order_id, token);
      dispatch({ type: 'VALIDATION_COMPLETE', payload: validatedOrder });
      
      return { order: newOrder, validation: validatedOrder };
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const validateOrder = async (orderId, token) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      // Import dynamically to avoid circular dependency
      const { orderService } = await import('../services/orderService');
      
      // Simulación de procesamiento (5 segundos)
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const validatedOrder = await orderService.validateOrder(orderId, token);
      dispatch({ type: 'UPDATE_ORDER_STATUS', payload: { 
        order_id: orderId, 
        status: validatedOrder.status 
      }});
      return validatedOrder;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }


  const fetchOrders = async (token) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      // Import dynamically to avoid circular dependency
      const { orderService } = await import('../services/orderService');
      
      const orders = await orderService.getUserOrders(token);
      dispatch({ type: 'SET_ORDERS', payload: orders });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const cancelOrder = async (orderId, token) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      // Import dynamically to avoid circular dependency
      const { orderService } = await import('../services/orderService');
      
      await orderService.cancelOrder(orderId, token);
      dispatch({ type: 'UPDATE_ORDER_STATUS', payload: { order_id: orderId, status: 'cancelled' } });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const getCartItemsCount = () => {
    return state.currentOrder.items.reduce((total, item) => total + item.quantity, 0);
  };

  const value = {
    ...state,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    submitOrder,
    validateOrder,
    fetchOrders,
    cancelOrder,
    getCartItemsCount
  };

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
};

// Custom hook
export const useOrder = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrder debe ser usado dentro de OrderProvider');
  }
  return context;
};