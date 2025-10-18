import React from 'react';
import '../../styles/Modal.css';

const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Confirmar', 
  cancelText = 'Cancelar',
  confirmButtonClass = 'confirm-button',
  icon
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h3 className="modal-title">
            {icon && <span className="modal-icon">{icon}</span>}
            {title}
          </h3>
          <button className="modal-close" onClick={onClose} aria-label="Cerrar">
            &times;
          </button>
        </div>
        
        <div className="modal-body">
          <p className="modal-message">{message}</p>
        </div>
        
        <div className="modal-footer">
          <button 
            className="modal-button cancel-button" 
            onClick={onClose}
          >
            {cancelText}
          </button>
          <button 
            className={`modal-button ${confirmButtonClass}`}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;