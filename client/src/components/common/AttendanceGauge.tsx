import React from 'react';

interface AttendanceGaugeProps {
  percentage: number;
  statusBadge?: 'safe' | 'warning' | 'critical';
  statusText?: string;
  attendedHours?: number;
  applicableTotal?: number;
  size?: number;
  strokeWidth?: number;
  showSubtext?: boolean;
}

export const AttendanceGauge: React.FC<AttendanceGaugeProps> = ({
  percentage,
  statusBadge = 'safe',
  statusText,
  attendedHours,
  applicableTotal,
  size = 150,
  strokeWidth = 11,
  showSubtext = true
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // Bound percentage between 0 and 100
  const validPct = Math.min(100, Math.max(0, percentage || 0));
  const offset = circumference - (validPct / 100) * circumference;

  let strokeColor = '#10b981'; // safe
  if (statusBadge === 'critical' || validPct < 75) {
    strokeColor = '#ef4444';
  } else if (statusBadge === 'warning' || validPct < 85) {
    strokeColor = '#f59e0b';
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.8s ease-in-out' }}
          />
        </svg>

        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center'
          }}
        >
          <span style={{ fontSize: size * 0.22, fontWeight: 700, color: '#0f172a', lineHeight: 1 }}>
            {percentage}%
          </span>
          {statusText && (
            <span
              style={{
                fontSize: size * 0.085,
                fontWeight: 600,
                marginTop: 4,
                padding: '2px 8px',
                borderRadius: 999,
                background: strokeColor + '20',
                color: strokeColor
              }}
            >
              {statusText}
            </span>
          )}
        </div>
      </div>

      {showSubtext && attendedHours !== undefined && applicableTotal !== undefined && (
        <div style={{ marginTop: 8, fontSize: '0.8rem', color: '#64748b', textAlign: 'center' }}>
          <span style={{ fontWeight: 600, color: '#0f172a' }}>{attendedHours}</span> of{' '}
          <span style={{ fontWeight: 600, color: '#0f172a' }}>{applicableTotal}</span> attended hrs
        </div>
      )}
    </div>
  );
};
