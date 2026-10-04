import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = '550px'
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-content"
        style={{ maxWidth }}
        onClick={e => e.stopPropagation()}
      >
        <div className="card-header" style={{ alignItems: 'flex-start' }}>
          <div>
            <h3 style={{ margin: 0 }}>{title}</h3>
            {subtitle && <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="btn-icon"
            aria-label="Close dialog"
            style={{ marginTop: -4, marginRight: -4 }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="card-body" style={{ overflowY: 'auto' }}>
          {children}
        </div>

        {footer && <div className="card-footer">{footer}</div>}
      </div>
    </div>
  );
};
