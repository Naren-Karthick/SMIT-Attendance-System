import React from 'react';
import { type LucideIcon, Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  actionText,
  onAction
}) => {
  return (
    <div
      style={{
        padding: '48px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        background: '#ffffff',
        border: '1px dashed #e2e8f0',
        borderRadius: '12px',
        margin: '16px 0'
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 999,
          background: '#f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#64748b',
          marginBottom: 16
        }}
      >
        <Icon size={26} />
      </div>
      <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>{title}</h4>
      {description && (
        <p style={{ fontSize: '0.85rem', color: '#64748b', maxWidth: 420, marginBottom: actionText ? 20 : 0 }}>
          {description}
        </p>
      )}
      {actionText && onAction && (
        <button onClick={onAction} className="btn btn-primary btn-sm">
          {actionText}
        </button>
      )}
    </div>
  );
};
