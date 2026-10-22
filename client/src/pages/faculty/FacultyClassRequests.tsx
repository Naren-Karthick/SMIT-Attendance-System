import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useAutoSyncListener } from '../../context/SyncContext';
import { safeApiFetch } from '../../utils/api';
import { StatusBadge } from '../../components/common/StatusBadge';
import { EvidenceViewer } from '../../components/common/EvidenceViewer';
import { Drawer } from '../../components/common/Drawer';
import { Modal } from '../../components/common/Modal';
import { EmptyState } from '../../components/common/EmptyState';
import confetti from 'canvas-confetti';
import {
  FileCheck,
  CalendarCheck,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  Calendar,
  Clock,
  Send,
  ShieldCheck,
  Sparkles,
  Download
} from 'lucide-react';

interface FacultyClassRequestsProps {
  initialTab?: 'od' | 'leave';
  onNavigate?: (page: string) => void;
}

export const FacultyClassRequests: React.FC<FacultyClassRequestsProps> = ({ initialTab = 'od', onNavigate }) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'od' | 'leave'>(initialTab);
  const [statusFilter, setStatusFilter] = useState<'PENDING_CLASS_IN_CHARGE' | 'PENDING_HOD' | 'APPROVED' | 'REJECTED_BY_IN_CHARGE' | 'ALL'>('PENDING_CLASS_IN_CHARGE');
  const [search, setSearch] = useState('');

  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClassInCharge, setIsClassInCharge] = useState(true);

  // Drawer / Inspection
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);

  // Evidence Preview Modal / Lightbox (OD Evidence Viewer Requirement)
  const [evidenceModalRequest, setEvidenceModalRequest] = useState<any | null>(null);

  // Confirmation Modal for Stage 1 endorsement
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    action: 'APPROVE' | 'REJECT';
    request: any;
    remarks: string;
  }>({
    isOpen: false,
    action: 'APPROVE',
    request: null,
    remarks: ''
  });
  const [processing, setProcessing] = useState(false);

  const fetchClassRequests = useCallback(async () => {
    try {
      const endpoint = activeTab === 'od' ? '/api/od/all' : '/api/leave/all';
      let url = `${endpoint}?scope=class_in_charge`;
      if (statusFilter !== 'ALL') url += `&status=${statusFilter}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;

      const data = await safeApiFetch<{ requests: any[]; isClassInCharge?: boolean }>(url);
      setRequests(data.requests || []);
      if (data.isClassInCharge !== undefined) {
        setIsClassInCharge(data.isClassInCharge);
      }
    } catch (err) {
      console.warn('Failed to load class requests:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, statusFilter, search]);

  useEffect(() => {
    fetchClassRequests();
  }, [fetchClassRequests]);

  useAutoSyncListener(fetchClassRequests);

  const handleActionClick = (action: 'APPROVE' | 'REJECT', req: any) => {
    setConfirmModal({
      isOpen: true,
      action,
      request: req,
      remarks: action === 'APPROVE' ? 'Verified student attendance & verified documentation. Recommended to HOD.' : ''
    });
  };

  const handleConfirmAction = async () => {
    const { action, request, remarks } = confirmModal;
    if (!request) return;

    if (action === 'REJECT' && !remarks.trim()) {
      showToast('Please provide a mandatory reason for rejecting this request.', 'error');
      return;
    }

    setProcessing(true);
    try {
      const endpoint = activeTab === 'od'
        ? `/api/od/${request.id}/in-charge-review`
        : `/api/leave/${request.id}/in-charge-review`;

      const data = await safeApiFetch<{ message?: string; status?: string }>(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          action,
          remarks: remarks.trim()
        })
      });

      showToast(data.message || (action === 'APPROVE' ? 'Endorsed and forwarded to HOD.' : 'Request rejected.'), 'success');
      if (action === 'APPROVE') {
        try {
          confetti({ particleCount: 40, spread: 45 });
        } catch (e) {}
      }

      setConfirmModal({ isOpen: false, action: 'APPROVE', request: null, remarks: '' });
      setSelectedRequest(null);
      fetchClassRequests();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span className="badge" style={{ background: '#059669', color: '#fff', fontSize: '0.75rem' }}>
            Stage 1 Review Portal
          </span>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Class In-Charge Authority</span>
        </div>
        <h1 style={{ margin: 0 }}>Class Leave & OD Requests</h1>
        <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: 4 }}>
          Review, verify evidence, and endorse student OD & Leave applications before escalating to the Head of Department.
        </p>
      </div>

      {!isClassInCharge && (
        <div className="card" style={{ padding: 24, marginBottom: 20, background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e' }}>
          <strong>Notice:</strong> You are not currently assigned as a Class In-Charge for any batch or section. Please contact the HOD to assign you to a class section.
        </div>
      )}

      {/* Tabs (OD vs Leave) */}
      <div className="tab-list">
        <button
          className={`tab-btn ${activeTab === 'od' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('od');
            setSelectedRequest(null);
          }}
        >
          <FileCheck size={16} />
          <span>Class On-Duty (OD)</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'leave' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('leave');
            setSelectedRequest(null);
          }}
        >
          <CalendarCheck size={16} />
          <span>Class Leave Requests</span>
        </button>
      </div>

      {/* Filter Strip */}
      <div
        className="card"
        style={{
          padding: '14px 20px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12
        }}
      >
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { key: 'PENDING_CLASS_IN_CHARGE', label: 'Awaiting My Review' },
            { key: 'PENDING_HOD', label: 'Escalated to HOD' },
            { key: 'APPROVED', label: 'HOD Approved' },
            { key: 'REJECTED_BY_IN_CHARGE', label: 'Rejected by Me' },
            { key: 'ALL', label: 'All Requests' }
          ].map(st => (
            <button
              key={st.key}
              onClick={() => setStatusFilter(st.key as any)}
              className="btn btn-sm"
              style={{
                background: statusFilter === st.key ? '#059669' : '#f1f5f9',
                color: statusFilter === st.key ? '#fff' : '#475569',
                borderColor: statusFilter === st.key ? '#059669' : '#cbd5e1',
                fontWeight: 600
              }}
            >
              {st.label}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', width: 240 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            className="form-control"
            style={{ paddingLeft: 30, padding: '6px 12px 6px 30px', fontSize: '0.825rem' }}
            placeholder="Search student or event..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Requests Data Table */}
      <div className="card">
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>Loading class applications...</div>
        ) : requests.length === 0 ? (
          <EmptyState
            title="No Class Requests"
            description="There are currently no student requests matching your selected filter."
          />
        ) : (
          <>
            <div className="desktop-approvals-table table-container" style={{ border: 'none', borderRadius: 0 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Request ID</th>
                    <th>Student Info</th>
                    <th>{activeTab === 'od' ? 'Event & Venue' : 'Leave Type & Reason'}</th>
                    <th>Dates & Coverage</th>
                    <th>Evidence</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map(req => {
                    const hasEvidence = !!(req.evidence_url || req.document_url);
                    const isPendingMyReview = req.status === 'PENDING_CLASS_IN_CHARGE';

                    return (
                      <tr key={req.id}>
                        <td style={{ fontWeight: 700, fontFamily: 'monospace', color: '#1e3a8a', whiteSpace: 'nowrap' }}>
                          {req.request_number}
                        </td>
                        <td>
                          <strong style={{ color: '#0f172a' }}>{req.student_name}</strong>
                          <div style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace' }}>
                            {req.register_number} • Year {req.year_level} (Sem {req.semester})
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                            {activeTab === 'od' ? req.event_name : req.leave_type}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            {activeTab === 'od' ? `${req.od_type} • ${req.venue}` : req.reason}
                          </div>
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <div style={{ fontSize: '0.825rem', fontWeight: 600 }}>
                            {req.from_date} {req.to_date !== req.from_date ? `to ${req.to_date}` : ''}
                          </div>
                          {activeTab === 'od' && (
                            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                              Periods {req.from_period}–{req.to_period}
                            </div>
                          )}
                        </td>
                        <td>
                          {hasEvidence ? (
                            <button
                              type="button"
                              onClick={() => setEvidenceModalRequest(req)}
                              className="btn btn-outline btn-sm"
                              style={{ color: '#059669', borderColor: '#86efac', padding: '3px 8px', fontSize: '0.72rem' }}
                            >
                              <Eye size={12} />
                              <span>View Evidence</span>
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>None attached</span>
                          )}
                        </td>
                        <td>
                          <StatusBadge status={req.status} size="sm" />
                        </td>
                        <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <button
                            onClick={() => setSelectedRequest(req)}
                            className="btn btn-outline btn-sm"
                            style={{ marginRight: 6 }}
                          >
                            <Eye size={13} />
                            <span>Inspect</span>
                          </button>

                          {isPendingMyReview && (
                            <>
                              <button
                                onClick={() => handleActionClick('APPROVE', req)}
                                className="btn btn-success btn-sm"
                                style={{ marginRight: 6 }}
                                title="Approve & forward to HOD"
                              >
                                <CheckCircle2 size={13} />
                                <span>Endorse to HOD</span>
                              </button>
                              <button
                                onClick={() => handleActionClick('REJECT', req)}
                                className="btn btn-danger btn-sm"
                                title="Reject as Class In-Charge"
                              >
                                <XCircle size={13} />
                                <span>Reject</span>
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Touch-Friendly Card View */}
            <div className="mobile-approvals-cards">
              {requests.map(req => {
                const hasEvidence = !!(req.evidence_url || req.document_url);
                const isPendingMyReview = req.status === 'PENDING_CLASS_IN_CHARGE';

                return (
                  <div
                    key={req.id}
                    className="card"
                    style={{
                      padding: 14,
                      borderRadius: 14,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                      border: '1px solid #e2e8f0'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, fontFamily: 'monospace', color: '#1e3a8a' }}>
                          {req.request_number}
                        </span>
                        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginTop: 2 }}>
                          {req.student_name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace' }}>
                          {req.register_number} • Year {req.year_level}
                        </div>
                      </div>
                      <StatusBadge status={req.status} size="sm" />
                    </div>

                    <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: 8, margin: '8px 0', border: '1px solid #f1f5f9' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#0f172a' }}>
                        {activeTab === 'od' ? req.event_name : req.leave_type}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: 2 }}>
                        {activeTab === 'od' ? `${req.od_type} • ${req.venue}` : req.reason}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6, fontSize: '0.75rem', color: '#64748b', flexWrap: 'wrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Calendar size={13} color="#2563eb" />
                          <strong>{req.from_date}</strong> {req.to_date !== req.from_date ? `to ${req.to_date}` : ''}
                        </span>
                        {activeTab === 'od' && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Clock size={13} color="#2563eb" />
                            <span>Periods {req.from_period}–{req.to_period}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {hasEvidence && (
                      <div style={{ marginBottom: 10 }}>
                        <button
                          type="button"
                          onClick={() => setEvidenceModalRequest(req)}
                          className="btn btn-outline btn-sm"
                          style={{ width: '100%', justifyContent: 'center', color: '#059669', borderColor: '#86efac' }}
                        >
                          <Eye size={13} />
                          <span>View Evidence Proof</span>
                        </button>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 8, marginTop: 8, paddingTop: 10, borderTop: '1px solid #f1f5f9' }}>
                      <button
                        onClick={() => setSelectedRequest(req)}
                        className="btn btn-outline btn-sm"
                        style={{ flex: 1, minHeight: 38, justifyContent: 'center' }}
                      >
                        <Eye size={14} />
                        <span>Inspect</span>
                      </button>

                      {isPendingMyReview && (
                        <>
                          <button
                            onClick={() => handleActionClick('APPROVE', req)}
                            className="btn btn-success btn-sm"
                            style={{ flex: 1.3, minHeight: 38, justifyContent: 'center' }}
                          >
                            <CheckCircle2 size={14} />
                            <span>Endorse</span>
                          </button>
                          <button
                            onClick={() => handleActionClick('REJECT', req)}
                            className="btn btn-danger btn-sm"
                            style={{ flex: 1, minHeight: 38, justifyContent: 'center' }}
                          >
                            <XCircle size={14} />
                            <span>Reject</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Drawer for Detailed Inspection */}
      <Drawer
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        title={selectedRequest?.request_number || 'Application Detail'}
        subtitle={`${selectedRequest?.student_name} (${selectedRequest?.register_number})`}
        footer={
          selectedRequest?.status === 'PENDING_CLASS_IN_CHARGE' ? (
            <div style={{ display: 'flex', gap: 10, width: '100%', justifyContent: 'flex-end' }}>
              <button
                onClick={() => handleActionClick('REJECT', selectedRequest)}
                className="btn btn-danger"
              >
                <XCircle size={15} />
                <span>Reject</span>
              </button>
              <button
                onClick={() => handleActionClick('APPROVE', selectedRequest)}
                className="btn btn-success"
              >
                <CheckCircle2 size={15} />
                <span>Endorse to HOD</span>
              </button>
            </div>
          ) : undefined
        }
      >
        {selectedRequest && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ padding: 14, background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a' }}>
                    {selectedRequest.student_name}
                  </h4>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    Reg No: <strong style={{ color: '#0f172a' }}>{selectedRequest.register_number}</strong> • Year {selectedRequest.year_level}
                  </div>
                </div>
                <StatusBadge status={selectedRequest.status} />
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                {activeTab === 'od' ? 'Event & Organization' : 'Leave Purpose'}
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginTop: 2 }}>
                {activeTab === 'od' ? selectedRequest.event_name : selectedRequest.leave_type}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: 2 }}>
                {activeTab === 'od' ? `${selectedRequest.od_type} • ${selectedRequest.venue}` : selectedRequest.reason}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, background: '#f8fafc', padding: 14, borderRadius: 8 }}>
              <div>
                <div style={{ fontSize: '0.725rem', color: '#64748b', fontWeight: 600 }}>SCHEDULE DATES</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  {selectedRequest.from_date} to {selectedRequest.to_date}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.725rem', color: '#64748b', fontWeight: 600 }}>PERIODS COVERED</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  {selectedRequest.from_period ? `Periods ${selectedRequest.from_period}–${selectedRequest.to_period}` : 'Full Day'}
                </div>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Student Statement / Reason
              </div>
              <p style={{ fontSize: '0.875rem', color: '#334155', marginTop: 4, lineHeight: 1.5 }}>
                {selectedRequest.description || selectedRequest.reason}
              </p>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>
                Supporting Certificate / Verification Evidence
              </div>
              <EvidenceViewer
                evidenceUrl={selectedRequest.evidence_url || selectedRequest.document_url}
                evidenceName={selectedRequest.evidence_name || selectedRequest.document_name}
                evidenceType={selectedRequest.evidence_type || selectedRequest.document_type}
                evidenceSize={selectedRequest.evidence_size || selectedRequest.document_size}
              />
            </div>
          </div>
        )}
      </Drawer>

      {/* Dedicated Evidence Viewer Lightbox / Modal */}
      <Modal
        isOpen={!!evidenceModalRequest}
        onClose={() => setEvidenceModalRequest(null)}
        title={`Verification Proof: ${evidenceModalRequest?.request_number || ''}`}
        subtitle={`${evidenceModalRequest?.student_name} (${evidenceModalRequest?.register_number})`}
      >
        {evidenceModalRequest && (
          <div>
            <div style={{ marginBottom: 14, fontSize: '0.85rem', color: '#475569' }}>
              <strong>Event / Subject:</strong> {evidenceModalRequest.event_name || evidenceModalRequest.leave_type} ({evidenceModalRequest.from_date} to {evidenceModalRequest.to_date})
            </div>
            <EvidenceViewer
              evidenceUrl={evidenceModalRequest.evidence_url || evidenceModalRequest.document_url}
              evidenceName={evidenceModalRequest.evidence_name || evidenceModalRequest.document_name}
              evidenceType={evidenceModalRequest.evidence_type || evidenceModalRequest.document_type}
              evidenceSize={evidenceModalRequest.evidence_size || evidenceModalRequest.document_size}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <button
                type="button"
                onClick={() => setEvidenceModalRequest(null)}
                className="btn btn-outline"
              >
                Close Preview
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        title={confirmModal.action === 'APPROVE' ? 'Endorse Request to HOD' : 'Reject Request'}
      >
        <div>
          <p style={{ fontSize: '0.875rem', color: '#334155', marginBottom: 16 }}>
            {confirmModal.action === 'APPROVE'
              ? `As Class In-Charge, you are recommending ${confirmModal.request?.student_name}'s request (${confirmModal.request?.request_number}) to the Head of Department for final sign-off.`
              : `Are you sure you want to reject this request? The request will not be forwarded to the HOD.`}
          </p>

          <div className="form-group">
            <label className={`form-label ${confirmModal.action === 'REJECT' ? 'required' : ''}`}>
              Class In-Charge Recommendation / Review Remarks
            </label>
            <textarea
              className="form-control"
              rows={3}
              placeholder="Enter remarks..."
              value={confirmModal.remarks}
              onChange={e => setConfirmModal({ ...confirmModal, remarks: e.target.value })}
              required={confirmModal.action === 'REJECT'}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
            <button
              type="button"
              onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
              className="btn btn-outline"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={processing}
              onClick={handleConfirmAction}
              className={confirmModal.action === 'APPROVE' ? 'btn btn-success' : 'btn btn-danger'}
            >
              {processing ? 'Processing...' : (confirmModal.action === 'APPROVE' ? 'Endorse & Forward to HOD' : 'Confirm Rejection')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
