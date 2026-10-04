import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { EmptyState } from '../../components/common/EmptyState';
import { CalendarCheck, Calendar, Clock, Send } from 'lucide-react';

interface StudentLeaveRequestsProps {
  onNavigate: (page: string) => void;
}

export const StudentLeaveRequests: React.FC<StudentLeaveRequestsProps> = ({ onNavigate }) => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaves = async () => {
      try {
        const token = localStorage.getItem('smit_token');
        const res = await fetch('/api/leave/my-requests', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setRequests(data.requests);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaves();
  }, []);

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0 }}>Leave Application History</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: 4 }}>
            Track medical and casual leave approvals and departmental remarks
          </p>
        </div>

        <button onClick={() => onNavigate('student-apply-leave')} className="btn btn-primary">
          <CalendarCheck size={15} />
          <span>Apply For Leave</span>
        </button>
      </div>

      {loading ? (
        <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>Loading leave records...</div>
      ) : requests.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="No Leave Records"
          description="You have zero recorded leaves for this semester."
          actionText="Apply for Leave"
          onAction={() => onNavigate('student-apply-leave')}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {requests.map(req => (
            <div key={req.id} className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e3a8a', fontFamily: 'monospace' }}>
                      {req.request_number}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>•</span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>{req.leave_type}</span>
                  </div>

                  <h3 style={{ margin: 0, fontSize: '1rem' }}>{req.reason}</h3>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 6 }}>
                    Dates: <strong style={{ color: '#0f172a' }}>{req.from_date}</strong> to <strong style={{ color: '#0f172a' }}>{req.to_date}</strong>
                  </div>
                </div>

                <StatusBadge status={req.status} />
              </div>

              {req.hod_remarks && (
                <div
                  style={{
                    marginTop: 14,
                    padding: '8px 12px',
                    borderRadius: 6,
                    background: req.status === 'APPROVED' ? '#f0fdf4' : '#fef2f2',
                    border: `1px solid ${req.status === 'APPROVED' ? '#bbf7d0' : '#fecaca'}`,
                    fontSize: '0.8rem',
                    color: req.status === 'APPROVED' ? '#166534' : '#991b1b'
                  }}
                >
                  <strong>HOD Remarks:</strong> {req.hod_remarks}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
