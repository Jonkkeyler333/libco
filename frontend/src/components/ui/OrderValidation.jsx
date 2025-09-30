import React from 'react';
import { useOrder } from '../../context/OrderContext';

const OrderValidation = ({ orderId }) => {
  const { isValidating, validationResult, error } = useOrder();

  if (!isValidating && !validationResult && !error) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
      <div className="bg-white p-5 rounded-lg shadow-lg max-w-md w-full" style={{maxWidth: "400px"}}>
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
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-blue-600"></div>
            <div>
              <p className="text-gray-700">Verificando disponibilidad...</p>
              <p className="text-xs text-gray-500">Este proceso tardará unos segundos</p>
            </div>
          </div>
        ) : validationResult ? (
          <div className="py-3">
            <div className="border-b pb-3 mb-3">
              {validationResult.status === 'validated' || validationResult.status === 'check' ? (
                <p className="text-gray-700 mb-1">
                  <strong>¡Listo!</strong> Tu pedido con ID #{orderId} ha sido validado correctamente.
                </p>
              ) : (
                <p className="text-gray-700 mb-1">
                  <strong>Atención:</strong> Tu pedido fue creado pero hay algunos problemas de disponibilidad.
                </p>
              )}
              {validationResult.messages && validationResult.messages.length > 0 && (
                <div className="bg-gray-50 p-3 rounded text-sm my-2">
                  <p className="font-medium text-gray-700 mb-1">Detalles:</p>
                  <ul className="list-disc pl-5 space-y-1 text-gray-600">
                    {validationResult.messages.map((msg, idx) => (
                      <li key={idx}>{msg}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-2">
              <button 
                className="px-3 py-1.5 bg-gray-100 text-gray-800 text-sm rounded hover:bg-gray-200 transition"
                onClick={() => window.location.href = '/'}
              >
                Continuar comprando
              </button>
              <button 
                className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition"
                onClick={() => window.location.href = '/orders'}
              >
                Ver mis pedidos
              </button>
            </div>
          </div>
        ) : error ? (
          <div className="py-3">
            <div className="border-b pb-3 mb-3">
              <p className="text-gray-700 mb-1">
                <strong className="text-red-600">Error:</strong> {error}
              </p>
            </div>
            
            <div className="flex justify-end">
              <button 
                className="px-3 py-1.5 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition"
                onClick={() => window.location.href = '/'}
              >
                Volver al inicio
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default OrderValidation;