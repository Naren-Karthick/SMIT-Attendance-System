import React from 'react';
import { CheckCircle2, XCircle, Clock, AlertTriangle, ShieldCheck, FileCheck } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const s = (status || '').toUpperCase();

  const getStyleAndIcon = () => {
    switch (s) {
      case 'PRESENT':
        return { className: 'badge-present', icon: <CheckCircle2 size={12} />, label: 'Present' };
      case 'ABSENT':
        return { className: 'badge-absent', icon: <XCircle size={12} />, label: 'Absent' };
      case 'OD':
        return { className: 'badge-od', icon: <FileCheck size={12} />, label: 'On-Duty (OD)' };
      case 'PERMISSION':
        return { className: 'badge-permission', icon: <Clock size={12} />, label: 'Permission' };
      case 'LEAVE':
        return { className: 'badge-leave', icon: <Clock size={12} />, label: 'Leave' };
      case 'SAFE':
        return { className: 'badge-safe', icon: <ShieldCheck size={12} />, label: 'Safe (>=85%)' };
      case 'WARNING':
        return { className: 'badge-warning', icon: <AlertTriangle size={12} />, label: 'Warning (75-84%)' };
      case 'CRITICAL':
        return { className: 'badge-critical', icon: <XCircle size={12} />, label: 'Critical (<75%)' };
      case 'APPROVED':
        return { className: 'badge-approved', icon: <CheckCircle2 size={12} />, label: 'Approved' };
      case 'PENDING':
        return { className: 'badge-pending', icon: <Clock size={12} />, label: 'Pending HOD' };
      case 'REJECTED':
        return { className: 'badge-rejected', icon: <XCircle size={12} />, label: 'Rejected' };
      case 'CLARIFICATION_REQUESTED':
        return { className: 'badge-warning', icon: <AlertTriangle size={12} />, label: 'Clarification Needed' };
      default:
        return { className: 'badge-present', icon: null, label: status };
    }
  };

  const { className, icon, label } = getStyleAndIcon();
  const fontSize = size === 'sm' ? '0.7rem' : '0.75rem';
  const padding = size === 'sm' ? '2px 6px' : '3px 8px';

  return (
    <span className={`badge ${className}`} style={{ fontSize, padding }}>
      {icon}
      <span>{label}</span>
    </span>
  );
};
