import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { compressEvidenceFile, parseApiResponse } from '../../utils/fileCompressor';
import confetti from 'canvas-confetti';
import { CalendarCheck, Calendar, Upload, CheckCircle2, ArrowRight, ArrowLeft, X, AlertCircle } from 'lucide-react';

interface StudentApplyLeaveProps {
  onNavigate: (page: string) => void;
}

export const StudentApplyLeave: React.FC<StudentApplyLeaveProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [leaveType, setLeaveType] = useState('Medical Leave');
  const [fromDate, setFromDate] = useState(new Date().toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('');
  const [remarks, setRemarks] = useState('');
  const [documentFile, setDocumentFile] = useState<{
    base64: string;
    name: string;
    type: string;
    size: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  const leaveTypes = [
    'Medical Leave',
    'Sick Leave',
    'Family Emergency',
    'Casual Leave',
    'On-Campus Medical Infirmary',
    'Other Personal Leave'
  ];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      showToast('Document exceeds 8MB limit.', 'error');
      return;
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'pdf' && file.size > 3.5 * 1024 * 1024) {
      showToast('PDF file exceeds 3.5MB cloud limit. Please compress before uploading.', 'error');
      return;
    }

    try {
      const compressed = await compressEvidenceFile(file);
      setDocumentFile({
        base64: compressed.base64,
        name: compressed.name,
        type: compressed.type,
        size: compressed.size
      });
      if (compressed.size < file.size) {
        const savedPercent = Math.round((1 - compressed.size / file.size) * 100);
        showToast(`Document optimized (${Math.round(compressed.size / 1024)} KB, reduced ${savedPercent}%)`, 'info');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to read document', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      showToast('Please state the reason for leave.', 'error');
      return;
    }
    if (new Date(toDate) < new Date(fromDate)) {
      showToast('To date cannot be before From date.', 'error');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('smit_token');
      const res = await fetch('/api/leave/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          leave_type: leaveType,
          from_date: fromDate,
          to_date: toDate,
          reason,
          remarks,
          document_base64: documentFile?.base64,
          document_name: documentFile?.name,
          document_type: documentFile?.type,
          document_size: documentFile?.size
        })
      });

      const data = await parseApiResponse(res);

      setSubmittedId(data.requestId);
      showToast('Leave request submitted successfully!', 'success');
      try {
        confetti({ particleCount: 60, spread: 50 });
      } catch (e) {}
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (submittedId) {
    return (
      <div className="page-wrapper" style={{ maxWidth: 640 }}>
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 999,
              background: '#ecfdf5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              color: '#059669'
            }}
          >
            <CheckCircle2 size={32} />
          </div>

          <h2>Leave Application Logged</h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: 20 }}>
            Your leave request has been sent for departmental review.
          </p>

          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              padding: 16,
              maxWidth: 360,
              margin: '0 auto 24px',
              textAlign: 'left'
            }}
          >
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>REFERENCE ID</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e3a8a', margin: '4px 0' }}>
              {submittedId}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#334155' }}>
              {leaveType} ({fromDate} to {toDate})
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button onClick={() => onNavigate('student-leave-requests')} className="btn btn-primary">
              <span>Track Leave Status</span>
              <ArrowRight size={16} />
            </button>
            <button
              onClick={() => {
                setSubmittedId(null);
                setReason('');
                setDocumentFile(null);
              }}
              className="btn btn-outline"
            >
              Apply Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper" style={{ maxWidth: 680 }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0 }}>Apply for Leave</h1>
        <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: 4 }}>
          Department of Information Technology • Academic Absence Application
        </p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} style={{ padding: 28 }}>
          <div className="form-group">
            <label className="form-label required">Type of Leave</label>
            <select
              className="form-control form-select"
              value={leaveType}
              onChange={e => setLeaveType(e.target.value)}
            >
              {leaveTypes.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div className="form-group">
              <label className="form-label required">From Date</label>
              <input
                type="date"
                className="form-control"
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label required">To Date</label>
              <input
                type="date"
                className="form-control"
                value={toDate}
                onChange={e => setToDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label required">Reason for Absence</label>
            <textarea
              className="form-control"
              rows={4}
              placeholder="State the medical or personal reason clearly..."
              value={reason}
              onChange={e => setReason(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Supporting Document (Doctor certificate / letter)</label>
            {documentFile ? (
              <div
                style={{
                  padding: 12,
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{documentFile.name}</span>
                <button
                  type="button"
                  onClick={() => setDocumentFile(null)}
                  className="btn btn-outline btn-sm"
                  style={{ color: '#ef4444' }}
                >
                  <X size={14} />
                  <span>Remove</span>
                </button>
              </div>
            ) : (
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '16px 20px',
                  border: '2px dashed #cbd5e1',
                  borderRadius: 8,
                  cursor: 'pointer',
                  background: '#f8fafc'
                }}
              >
                <Upload size={20} color="#64748b" />
                <span style={{ fontSize: '0.85rem', color: '#475569' }}>
                  Click to attach medical prescription or certificate (PDF, JPG, PNG)
                </span>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                />
              </label>
            )}
          </div>

          <div className="form-group" style={{ marginBottom: 24 }}>
            <label className="form-label">Additional Remarks / Parent Contact Note</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Parent informed class advisor Prof. R. Kavitha"
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button
              type="button"
              onClick={() => onNavigate('student-dashboard')}
              className="btn btn-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? 'Submitting...' : 'Submit Leave Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
