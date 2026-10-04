import React from 'react';
import { Sparkles, AlertCircle } from 'lucide-react';

interface SegmentedStatusPickerProps {
  currentStatus: 'PRESENT' | 'ABSENT' | 'OD' | 'PERMISSION' | 'LEAVE' | 'UNMARKED';
  autoApplied?: boolean;
  autoReason?: string | null;
  onChange: (newStatus: 'PRESENT' | 'ABSENT' | 'OD' | 'PERMISSION' | 'LEAVE') => void;
  disabled?: boolean;
}

export const SegmentedStatusPicker: React.FC<SegmentedStatusPickerProps> = ({
  currentStatus,
  autoApplied,
  autoReason,
  onChange,
  disabled = false
}) => {
  const statuses: Array<{ key: 'PRESENT' | 'ABSENT' | 'OD' | 'PERMISSION' | 'LEAVE'; label: string; short: string }> = [
    { key: 'PRESENT', label: 'Present', short: 'P' },
    { key: 'ABSENT', label: 'Absent', short: 'A' },
    { key: 'OD', label: 'On-Duty', short: 'OD' },
    { key: 'PERMISSION', label: 'Perm', short: 'PERM' },
    { key: 'LEAVE', label: 'Leave', short: 'LV' }
  ];

  const handleSelect = (key: 'PRESENT' | 'ABSENT' | 'OD' | 'PERMISSION' | 'LEAVE') => {
    if (disabled) return;

    if (autoApplied && currentStatus !== key) {
      const confirmOverride = window.confirm(
        `This student has an approved request: "${autoReason || 'Approved On-Duty/Leave'}". Are you sure you want to manually change this status to ${key}?`
      );
      if (!confirmOverride) return;
    }

    onChange(key);
  };

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 4 }}>
      <div className="segmented-status">
        {statuses.map(s => {
          const isSelected = currentStatus === s.key;
          let activeClass = '';
          if (isSelected) {
            if (s.key === 'PRESENT') activeClass = 'selected-P';
            else if (s.key === 'ABSENT') activeClass = 'selected-A';
            else if (s.key === 'OD') activeClass = 'selected-OD';
            else if (s.key === 'PERMISSION') activeClass = 'selected-PERM';
            else if (s.key === 'LEAVE') activeClass = 'selected-L';
          }

          return (
            <button
              key={s.key}
              type="button"
              disabled={disabled}
              className={`segmented-btn ${activeClass}`}
              onClick={() => handleSelect(s.key)}
              title={`${s.label} (${s.short})`}
            >
              {s.short}
            </button>
          );
        })}
      </div>

      {autoApplied && (
        <div
          style={{
            fontSize: '0.6875rem',
            color: '#4f46e5',
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            fontWeight: 500
          }}
          title={autoReason || 'Automatically applied from approved request'}
        >
          <Sparkles size={11} color="#6366f1" />
          <span>Auto-Applied: {currentStatus}</span>
        </div>
      )}
    </div>
  );
};
