import React from 'react';
import { useOrder } from '../../context/OrderContext';
import { useNavigate } from 'react-router-dom';
import '../../styles/OrderValidation.css';

const OrderValidation = ({ orderId }) => {
  const { isValidating, validationResult, error, clearError } = useOrder();
  const navigate = useNavigate();

  // Debug logs
  console.log('OrderValidation - orderId:', orderId);
  console.log('OrderValidation - isValidating:', isValidating);
  console.log('OrderValidation - validationResult:', validationResult);
  console.log('OrderValidation - error:', error);

  if (!isValidating && !validationResult && !error) {
    console.log('OrderValidation - returning null, no content to show');
    return null;
  }

  return (
    <div className="validation-overlay">
      <div className={`validation-container ${error ? 'error' : validationResult?.status === 'validated' || validationResult?.status === 'check' ? 'success' : 'warning'}`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            {isValidating ? 'Procesando' : 'Estado del Pedido'}
          </h3>
          {!isValidating && (
            <span className={`text-xs px-2 py-1 rounded-full ${
              validationResult?.status === 'validated' || validationResult?.status === 'check' 
                ? 'bg-green-100 text-green-800' 
                : error ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
            }`}>
              {validationResult?.status === 'validated' || validationResult?.status === 'check' 
                ? 'Confirmado' 
                : error ? 'Error' : 'Pendiente'}
            </span>
          )}
        </div>
        
        {isValidating ? (
          <div className="flex items-center space-x-3 py-4">
            <div className="loading-spinner"></div>
            <div>
              <p className="text-gray-700">Verificando disponibilidad...</p>
              <p className="text-xs text-gray-500">Este proceso tardará unos segundos</p>
            </div>
          </div>
        ) : error ? (
          <div className="py-3">
            <div className="border-b pb-3 mb-3">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-red-600 text-sm">⚠️</span>
                  </div>
                  <div>
                    <h4 className="text-red-800 font-semibold">Error de Validación</h4>
                    <p className="text-sm text-gray-600">Tu pedido fue creado pero hay problemas de stock</p>
                  </div>
                </div>
                <button 
                  className="close-error-btn text-gray-400 hover:text-gray-600"
                  onClick={() => {
                    clearError();
                    navigate('/crear-pedido');
                  }}
                  aria-label="Cerrar"
                >
                  ✕
                </button>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded p-3 mb-3">
                <p className="text-red-800 text-sm font-medium mb-2">Detalles del problema:</p>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <p className="text-blue-800 text-sm">
                  <strong>¿Qué significa esto?</strong>
                  <br />
                  Tu pedido con el ID #{orderId} está en estado <span className="bg-gray-200 px-1 rounded font-mono text-xs">"draft"</span> 
                  y puedes editarlo desde tus pedidos para ajustar las cantidades.
                </p>
              </div>
            </div>
            
            <div className="validation-actions">
              <button 
                className="edit-button"
                onClick={() => {
                  clearError();
                  navigate('/crear-pedido');
                }}
              >
                Crear nuevo pedido
              </button>
              <button 
                className="confirm-button"
                onClick={() => {
                  clearError();
                  navigate('/mis-pedidos');
                }}
              >
                Editar pedido
              </button>
            </div>
          </div>
        ) : validationResult ? (
          <div className="py-3">
            <div className="border-b pb-3 mb-3">
              <div className="flex items-center mb-3">
                <div className="success-icon">
                  <span>✅</span>
                </div>
                <div>
                  <h4 className="text-green-800 font-semibold">¡Pedido Validado!</h4>
                  <p className="text-sm text-gray-600">Tu pedido #{orderId} ha sido procesado correctamente</p>
                </div>
              </div>
              
              {validationResult.status === 'validated' || validationResult.status === 'check' ? (
                <div className="bg-green-50 border border-green-200 rounded p-3 mb-3">
                  <p className="text-green-800 text-sm">
                    Todos los productos están disponibles. Tu pedido está listo para ser confirmado.
                  </p>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-3">
                  <p className="text-yellow-800 text-sm">
                    Tu pedido fue creado pero requiere revisión de disponibilidad.
                  </p>
                </div>
              )}
              
              {validationResult.messages && validationResult.messages.length > 0 && (
                <div className="bg-gray-50 p-3 rounded text-sm my-2">
                  <p className="font-medium text-gray-700 mb-1">Detalles adicionales:</p>
                  <ul className="list-disc pl-5 space-y-1 text-gray-600">
                    {validationResult.messages.map((msg, idx) => (
                      <li key={idx}>{msg}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            <div className="validation-actions">
              <button 
                className="edit-button"
                onClick={() => navigate('/crear-pedido')}
              >
                Continuar comprando
              </button>
              <button 
                className="confirm-button"
                onClick={() => navigate('/mis-pedidos')}
              >
                Ver mis pedidos
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default OrderValidation;