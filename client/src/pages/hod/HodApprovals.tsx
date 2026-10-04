import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../context/ToastContext';
import { useAutoSyncListener } from '../../context/SyncContext';
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
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface HodApprovalsProps {
  initialTab?: 'od' | 'leave';
}

export const HodApprovals: React.FC<HodApprovalsProps> = ({ initialTab = 'od' }) => {
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'od' | 'leave'>(initialTab);
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'>('PENDING');
  const [yearFilter, setYearFilter] = useState<string>('');
  const [search, setSearch] = useState('');

  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Drawer / Inspection
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);

  // Confirmation Modal
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    action: 'APPROVE' | 'REJECT' | 'CLARIFY';
    request: any;
    remarks: string;
  }>({
    isOpen: false,
    action: 'APPROVE',
    request: null,
    remarks: ''
  });
  const [processing, setProcessing] = useState(false);

  const fetchQueue = useCallback(async () => {
    try {
      const token = localStorage.getItem('smit_token');
      const endpoint = activeTab === 'od' ? '/api/od/all' : '/api/leave/all';
      let url = `${endpoint}?status=${statusFilter}`;
      if (yearFilter) url += `&year_level=${yearFilter}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, statusFilter, yearFilter, search]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  // Auto-sync requests every 30 seconds
  useAutoSyncListener(fetchQueue);

  const handleActionClick = (action: 'APPROVE' | 'REJECT' | 'CLARIFY', req: any) => {
    setConfirmModal({
      isOpen: true,
      action,
      request: req,
      remarks: action === 'APPROVE' ? 'Approved for institutional event participation.' : ''
    });
  };

  const handleConfirmAction = async () => {
    const { action, request, remarks } = confirmModal;
    if (!request) return;

    if (action === 'REJECT' && !remarks.trim()) {
      showToast('Please provide a mandatory reason for rejection.', 'error');
      return;
    }

    setProcessing(true);
    try {
      const token = localStorage.getItem('smit_token');
      const endpoint = activeTab === 'od'
        ? `/api/od/${request.id}/review`
        : `/api/leave/${request.id}/review`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          action,
          hod_remarks: remarks.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to review request.');

      showToast(data.message || `Request ${action.toLowerCase()}d successfully.`, 'success');
      if (action === 'APPROVE') {
        try {
          confetti({ particleCount: 50, spread: 50 });
        } catch (e) {}
      }

      setConfirmModal({ isOpen: false, action: 'APPROVE', request: null, remarks: '' });
      setSelectedRequest(null);
      fetchQueue();
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
        <h1 style={{ margin: 0 }}>HOD Unified Approval Center</h1>
        <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: 4 }}>
          Evaluate On-Duty (OD) and Leave applications with verified digital evidence and automatic attendance reconciliation
        </p>
      </div>

      {/* Main Tabs (OD vs Leave) */}
      <div className="tab-list">
        <button
          className={`tab-btn ${activeTab === 'od' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('od');
            setSelectedRequest(null);
          }}
        >
          <FileCheck size={16} />
          <span>On-Duty (OD) Requests</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'leave' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('leave');
            setSelectedRequest(null);
          }}
        >
          <CalendarCheck size={16} />
          <span>Leave Requests</span>
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
        {/* Status Pills */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className="btn btn-sm"
              style={{
                background: statusFilter === st ? '#1e3a8a' : '#f1f5f9',
                color: statusFilter === st ? '#fff' : '#475569',
                borderColor: statusFilter === st ? '#1e3a8a' : '#cbd5e1',
                fontWeight: 600
              }}
            >
              {st === 'PENDING' ? 'Pending Review' : (st === 'APPROVED' ? 'Approved' : (st === 'REJECTED' ? 'Rejected' : 'All Requests'))}
            </button>
          ))}
        </div>

        {/* Year Filter & Search */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            className="form-control form-select"
            style={{ width: 140, padding: '6px 28px 6px 10px', fontSize: '0.825rem' }}
            value={yearFilter}
            onChange={e => setYearFilter(e.target.value)}
          >
            <option value="">All Years</option>
            <option value="2">2nd Year (3rd Sem)</option>
            <option value="3">3rd Year (5th Sem)</option>
            <option value="4">4th Year (7th Sem)</option>
          </select>

          <div style={{ position: 'relative', width: 220 }}>
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
      </div>

      {/* Requests Data Table */}
      <div className="card">
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>Loading approval requests...</div>
        ) : requests.length === 0 ? (
          <EmptyState
            title="No Requests Match Filter"
            description="No applications found under the selected category and filter status."
          />
        ) : (
          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Student Info</th>
                  <th>Year / Batch</th>
                  <th>{activeTab === 'od' ? 'Event & Venue' : 'Leave Type & Reason'}</th>
                  <th>Dates & Periods</th>
                  <th>Evidence</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(req => {
                  const hasEvidence = !!(req.evidence_url || req.document_url);

                  return (
                    <tr key={req.id}>
                      <td style={{ fontWeight: 700, fontFamily: 'monospace', color: '#1e3a8a', whiteSpace: 'nowrap' }}>
                        {req.request_number}
                      </td>
                      <td>
                        <strong style={{ color: '#0f172a' }}>{req.student_name}</strong>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace' }}>
                          {req.register_number}
                        </div>
                      </td>
                      <td>
                        <span className="badge" style={{ background: '#f8fafc', color: '#334155' }}>
                          {req.year_level}nd/rd/th Year
                        </span>
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
                          <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <CheckCircle2 size={13} />
                            <span>Attached</span>
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Self-declared</span>
                        )}
                      </td>
                      <td>
                        <StatusBadge status={req.status} size="sm" />
                      </td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <button
                          onClick={() => setSelectedRequest(req)}
                          className="btn btn-primary btn-sm"
                          style={{ marginRight: 6 }}
                        >
                          <Eye size={13} />
                          <span>Inspect</span>
                        </button>

                        {req.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleActionClick('APPROVE', req)}
                              className="btn btn-success btn-sm"
                              style={{ marginRight: 6 }}
                              title="Approve request"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleActionClick('REJECT', req)}
                              className="btn btn-danger btn-sm"
                              title="Reject request"
                            >
                              Reject
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
        )}
      </div>

      {/* Detailed Inspection Drawer (Prominent Evidence Display) */}
      <Drawer
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        title={selectedRequest?.request_number || 'Application Detail'}
        subtitle={`${selectedRequest?.student_name} (${selectedRequest?.register_number})`}
        footer={
          selectedRequest?.status === 'PENDING' ? (
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
                <span>Approve Request</span>
              </button>
            </div>
          ) : undefined
        }
      >
        {selectedRequest && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Student & Event Summary */}
            <div style={{ padding: 14, background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a' }}>
                    {selectedRequest.student_name}
                  </h4>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    Reg No: <strong style={{ color: '#0f172a' }}>{selectedRequest.register_number}</strong> • {selectedRequest.year_level}nd/rd/th Year
                  </div>
                </div>
                <StatusBadge status={selectedRequest.status} />
              </div>
            </div>

            {/* Application Specifics */}
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

            {/* Description */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Student Statement / Reason
              </div>
              <p style={{ fontSize: '0.875rem', color: '#334155', marginTop: 4, lineHeight: 1.5 }}>
                {selectedRequest.description || selectedRequest.reason}
              </p>
              {selectedRequest.remarks && (
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 6 }}>
                  <em>Note: {selectedRequest.remarks}</em>
                </div>
              )}
            </div>

            {/* Prominent Evidence Viewer (Section 25 & 35) */}
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

            {/* HOD Remarks (if already reviewed) */}
            {selectedRequest.hod_remarks && (
              <div style={{ padding: 14, borderRadius: 8, background: '#f0fdf4', border: '1px solid #bbf7d0', fontSize: '0.85rem' }}>
                <strong style={{ color: '#166534' }}>HOD Decision Remarks:</strong>
                <div style={{ marginTop: 4, color: '#1e293b' }}>{selectedRequest.hod_remarks}</div>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* Confirmation Modal before final approval / rejection */}
      <Modal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        title={confirmModal.action === 'APPROVE' ? 'Confirm Approval' : 'Confirm Rejection'}
      >
        <div>
          <p style={{ fontSize: '0.875rem', color: '#334155', marginBottom: 16 }}>
            {confirmModal.action === 'APPROVE'
              ? `Are you sure you want to approve ${confirmModal.request?.student_name}'s request (${confirmModal.request?.request_number})? All matching lecture attendance records for these dates will be automatically reconciled.`
              : `Are you sure you want to reject this request? The student will be notified along with your mandatory remarks.`}
          </p>

          <div className="form-group">
            <label className={`form-label ${confirmModal.action === 'REJECT' ? 'required' : ''}`}>
              HOD Remarks / Official Recommendation
            </label>
            <textarea
              className="form-control"
              rows={3}
              placeholder="Enter remarks for the student..."
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
              {processing ? 'Processing...' : (confirmModal.action === 'APPROVE' ? 'Confirm & Approve' : 'Confirm & Reject')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
