import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: string;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = '560px'
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
    <div className="drawer-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="drawer-content"
        style={{ maxWidth: width }}
        onClick={e => e.stopPropagation()}
      >
        <div className="card-header" style={{ padding: '16px 20px', position: 'sticky', top: 0, zIndex: 10, background: '#fff' }}>
          <div>
            <h3 style={{ margin: 0 }}>{title}</h3>
            {subtitle && <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>{subtitle}</p>}
          </div>
          <button onClick={onClose} className="btn-icon" aria-label="Close drawer">
            <X size={18} />
          </button>
        </div>

        <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
          {children}
        </div>

        {footer && (
          <div
            className="card-footer"
            style={{ position: 'sticky', bottom: 0, zIndex: 10, background: '#fff', borderTop: '1px solid #e2e8f0' }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
