import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAutoSyncListener } from '../../context/SyncContext';
import { safeApiFetch } from '../../utils/api';
import { StatusBadge } from '../../components/common/StatusBadge';
import { EvidenceViewer } from '../../components/common/EvidenceViewer';
import { Drawer } from '../../components/common/Drawer';
import { EmptyState } from '../../components/common/EmptyState';
import {
  FileCheck,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  Send,
  Sparkles
} from 'lucide-react';

interface StudentODRequestsProps {
  onNavigate: (page: string) => void;
}

export const StudentODRequests: React.FC<StudentODRequestsProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);

  const fetchRequests = useCallback(async () => {
    try {
      const data = await safeApiFetch<{ requests: any[] }>('/api/od/my-requests');
      setRequests(data.requests || []);
    } catch (err) {
      console.warn('Failed to load OD requests:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  useAutoSyncListener(fetchRequests);

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0 }}>On-Duty (OD) Track & History</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: 4 }}>
            Monitor verification lifecycle, HOD reviews, and evidence status
          </p>
        </div>

        <button onClick={() => onNavigate('student-apply-od')} className="btn btn-primary">
          <Send size={15} />
          <span>Apply New OD</span>
        </button>
      </div>

      {loading ? (
        <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>
          Loading your OD applications...
        </div>
      ) : requests.length === 0 ? (
        <EmptyState
          icon={FileCheck}
          title="No OD Requests Found"
          description="You haven't submitted any On-Duty requests for this semester yet."
          actionText="Apply for On-Duty"
          onAction={() => onNavigate('student-apply-od')}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {requests.map(req => {
            const isApproved = req.status === 'APPROVED';
            const isRejected = req.status === 'REJECTED';
            const isPending = req.status === 'PENDING';

            return (
              <div key={req.id} className="card" style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e3a8a', fontFamily: 'monospace' }}>
                        {req.request_number}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>•</span>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>{req.od_type}</span>
                    </div>

                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{req.event_name}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 6, fontSize: '0.8rem', color: '#64748b', flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={14} color="#64748b" />
                        <span>{req.venue}</span>
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Calendar size={14} color="#64748b" />
                        <span>{req.from_date} {req.to_date !== req.from_date ? `to ${req.to_date}` : ''}</span>
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={14} color="#64748b" />
                        <span>Periods {req.from_period} to {req.to_period}</span>
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <StatusBadge status={req.status} />
                    <button
                      onClick={() => setSelectedRequest(req)}
                      className="btn btn-outline btn-sm"
                    >
                      <Eye size={14} />
                      <span>Timeline & Evidence</span>
                    </button>
                  </div>
                </div>

                {/* Status Timeline Bar */}
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                    {/* Step 1: Submitted */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 999,
                          background: '#059669',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.7rem'
                        }}
                      >
                        ✓
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0f172a' }}>Application Submitted</div>
                        <div style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>{req.created_at?.split(' ')[0]}</div>
                      </div>
                    </div>

                    {/* Step 2: Under Review */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 999,
                          background: isApproved || isRejected ? '#059669' : '#f59e0b',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.7rem'
                        }}
                      >
                        {isApproved || isRejected ? '✓' : '...'}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0f172a' }}>Department Review</div>
                        <div style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>
                          {isPending ? 'Under HOD Evaluation' : (req.reviewer_name || 'HOD Dr. S. Anitha')}
                        </div>
                      </div>
                    </div>

                    {/* Step 3: Resolution */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 999,
                          background: isApproved ? '#059669' : (isRejected ? '#dc2626' : '#e2e8f0'),
                          color: isApproved || isRejected ? '#fff' : '#64748b',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.7rem'
                        }}
                      >
                        {isApproved ? '✓' : (isRejected ? '✕' : '3')}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0f172a' }}>
                          {isApproved ? 'Approved & Reconciled' : (isRejected ? 'Rejected' : 'Final Decision')}
                        </div>
                        <div style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>
                          {req.reviewed_at ? req.reviewed_at.split(' ')[0] : 'Pending Decision'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {req.hod_remarks && (
                    <div
                      style={{
                        marginTop: 14,
                        padding: '10px 14px',
                        borderRadius: 8,
                        background: isApproved ? '#f0fdf4' : '#fef2f2',
                        border: `1px solid ${isApproved ? '#bbf7d0' : '#fecaca'}`,
                        fontSize: '0.8rem',
                        color: isApproved ? '#166534' : '#991b1b'
                      }}
                    >
                      <strong>HOD Remark:</strong> {req.hod_remarks}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail & Evidence Drawer */}
      <Drawer
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        title={selectedRequest?.request_number || 'OD Application'}
        subtitle={selectedRequest?.event_name}
      >
        {selectedRequest && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                Event & Activity
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginTop: 2 }}>
                {selectedRequest.event_name}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: 2 }}>
                {selectedRequest.od_type} • {selectedRequest.venue}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, background: '#f8fafc', padding: 14, borderRadius: 8 }}>
              <div>
                <div style={{ fontSize: '0.725rem', color: '#64748b', fontWeight: 600 }}>SCHEDULE DATES</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{selectedRequest.from_date} to {selectedRequest.to_date}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.725rem', color: '#64748b', fontWeight: 600 }}>PERIODS COVERED</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Period {selectedRequest.from_period} to {selectedRequest.to_period}</div>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                Detailed Statement
              </div>
              <p style={{ fontSize: '0.875rem', color: '#334155', marginTop: 4, lineHeight: 1.5 }}>
                {selectedRequest.description}
              </p>
              {selectedRequest.remarks && (
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 6 }}>
                  <em>Note: {selectedRequest.remarks}</em>
                </div>
              )}
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8 }}>
                Supporting Evidence
              </div>
              <EvidenceViewer
                evidenceUrl={selectedRequest.evidence_url}
                evidenceName={selectedRequest.evidence_name}
                evidenceType={selectedRequest.evidence_type}
                evidenceSize={selectedRequest.evidence_size}
              />
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};
