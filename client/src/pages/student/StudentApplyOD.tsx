import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { compressEvidenceFile, parseApiResponse } from '../../utils/fileCompressor';
import confetti from 'canvas-confetti';
import {
  FileCheck,
  Calendar,
  MapPin,
  Clock,
  Upload,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  X,
  FileText,
  Sparkles
} from 'lucide-react';

interface StudentApplyODProps {
  onNavigate: (page: string) => void;
}

export const StudentApplyOD: React.FC<StudentApplyODProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [successRequestId, setSuccessRequestId] = useState<string | null>(null);

  // Form State
  const [odType, setOdType] = useState('Hackathon / Project Expo');
  const [eventName, setEventName] = useState('');
  const [venue, setVenue] = useState('');

  const [fromDate, setFromDate] = useState(new Date().toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
  const [fromPeriod, setFromPeriod] = useState(1);
  const [toPeriod, setToPeriod] = useState(7);

  const [description, setDescription] = useState('');
  const [remarks, setRemarks] = useState('');

  // Evidence state
  const [evidenceFile, setEvidenceFile] = useState<{
    base64: string;
    name: string;
    type: string;
    size: number;
  } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const odTypes = [
    'Hackathon / Project Expo',
    'Paper Presentation',
    'Technical Symposium',
    'Sports / Culturals',
    'Internship / Industrial Visit',
    'Workshop / Conference',
    'Other Academic On-Duty'
  ];

  const [compressing, setCompressing] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 8MB before compression)
    if (file.size > 8 * 1024 * 1024) {
      setUploadError('File size exceeds the 8MB limit. Please select a smaller photo or document.');
      return;
    }

    // Validate extension
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'png', 'jpg', 'jpeg', 'webp'].includes(ext || '')) {
      setUploadError('Only PDF, JPG, and PNG documents are accepted.');
      return;
    }

    if (ext === 'pdf' && file.size > 3.5 * 1024 * 1024) {
      setUploadError('PDF file exceeds 3.5MB cloud limit. Please compress your PDF or upload as a photo.');
      return;
    }

    setUploadError(null);
    setCompressing(true);
    try {
      const compressed = await compressEvidenceFile(file);
      setEvidenceFile({
        base64: compressed.base64,
        name: compressed.name,
        type: compressed.type,
        size: compressed.size
      });
      if (compressed.size < file.size) {
        const savedPercent = Math.round((1 - compressed.size / file.size) * 100);
        showToast(`Document optimized for cloud upload (${Math.round(compressed.size / 1024)} KB, reduced ${savedPercent}%)`, 'info');
      }
    } catch (err: any) {
      setUploadError(err.message || 'Failed to process document');
    } finally {
      setCompressing(false);
    }
  };

  const validateStep = (currentStep: number) => {
    if (currentStep === 1) {
      if (!eventName.trim() || !venue.trim()) {
        showToast('Please enter event name and venue.', 'error');
        return false;
      }
    }
    if (currentStep === 2) {
      if (!fromDate || !toDate) {
        showToast('Please select both from and to dates.', 'error');
        return false;
      }
      if (new Date(toDate) < new Date(fromDate)) {
        showToast('To date cannot be earlier than From date.', 'error');
        return false;
      }
    }
    if (currentStep === 3) {
      if (!description.trim()) {
        showToast('Please explain the reason and role in the event.', 'error');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(prev => prev + 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('smit_token');
      const res = await fetch('/api/od/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          od_type: odType,
          event_name: eventName,
          venue,
          from_date: fromDate,
          to_date: toDate,
          from_period: fromPeriod,
          to_period: toPeriod,
          description,
          remarks,
          evidence_base64: evidenceFile?.base64,
          evidence_name: evidenceFile?.name,
          evidence_type: evidenceFile?.type,
          evidence_size: evidenceFile?.size
        })
      });

      const result = await parseApiResponse(res);

      setSuccessRequestId(result.requestId);
      showToast('OD request submitted successfully!', 'success');
      try {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      } catch (e) {}
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (successRequestId) {
    return (
      <div className="page-wrapper" style={{ maxWidth: 640 }}>
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 999,
              background: '#ecfdf5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              color: '#059669'
            }}
          >
            <CheckCircle2 size={36} />
          </div>

          <h2 style={{ marginBottom: 6 }}>OD Request Submitted!</h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: 20 }}>
            Your On-Duty application has been transmitted to HOD Dr. S. Anitha for review.
          </p>

          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              padding: 16,
              maxWidth: 380,
              margin: '0 auto 24px',
              textAlign: 'left'
            }}
          >
            <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
              Tracking Request Reference
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e3a8a', margin: '4px 0' }}>
              {successRequestId}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#334155' }}>
              Event: <strong>{eventName}</strong> ({fromDate} to {toDate})
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button
              onClick={() => onNavigate('student-od-requests')}
              className="btn btn-primary"
            >
              <span>Track OD Status</span>
              <ArrowRight size={16} />
            </button>
            <button
              onClick={() => {
                setSuccessRequestId(null);
                setStep(1);
                setEventName('');
                setVenue('');
                setDescription('');
                setEvidenceFile(null);
              }}
              className="btn btn-outline"
            >
              Submit Another OD
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper" style={{ maxWidth: 760 }}>
      {/* Page Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0 }}>Apply for On-Duty (OD)</h1>
        <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: 4 }}>
          Department of Information Technology • Institutional OD Request Protocol
        </p>
      </div>

      {/* 5-Step Progress Stepper */}
      <div
        className="card"
        style={{
          padding: '16px 20px',
          marginBottom: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 8,
          overflowX: 'auto'
        }}
      >
        {[
          { num: 1, label: 'Event Details' },
          { num: 2, label: 'Schedule' },
          { num: 3, label: 'Reason' },
          { num: 4, label: 'Evidence' },
          { num: 5, label: 'Review' }
        ].map(s => {
          const isDone = step > s.num;
          const isCurrent = step === s.num;
          return (
            <div
              key={s.num}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                opacity: isCurrent || isDone ? 1 : 0.45,
                whiteSpace: 'nowrap'
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 999,
                  background: isDone ? '#10b981' : (isCurrent ? '#1e3a8a' : '#e2e8f0'),
                  color: isDone || isCurrent ? '#fff' : '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.8rem',
                  fontWeight: 700
                }}
              >
                {isDone ? <CheckCircle2 size={16} /> : s.num}
              </div>
              <span
                className="step-label"
                style={{ fontSize: '0.8rem', fontWeight: isCurrent ? 700 : 500, color: isCurrent ? '#0f172a' : '#64748b' }}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Step Forms */}
      <div className="card">
        <div className="card-body" style={{ padding: 28 }}>
          {/* STEP 1: EVENT */}
          {step === 1 && (
            <div>
              <h3 style={{ marginBottom: 16 }}>Step 1: Event Information</h3>

              <div className="form-group">
                <label className="form-label required">On-Duty Category</label>
                <select
                  className="form-control form-select"
                  value={odType}
                  onChange={e => setOdType(e.target.value)}
                >
                  {odTypes.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label required">Event / Conference / Fest Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. National Smart India Hackathon Prelims 2026"
                  value={eventName}
                  onChange={e => setEventName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label required">Venue / Host College / Institution</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. IIT Madras Research Park / SSN College of Engineering"
                  value={venue}
                  onChange={e => setVenue(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          {/* STEP 2: SCHEDULE */}
          {step === 2 && (
            <div>
              <h3 style={{ marginBottom: 16 }}>Step 2: Date & Period Schedule</h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 16 }}>
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

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label required">From Period</label>
                  <select
                    className="form-control form-select"
                    value={fromPeriod}
                    onChange={e => setFromPeriod(parseInt(e.target.value, 10))}
                  >
                    {[
                      { p: 1, label: '08:45 AM' },
                      { p: 2, label: '09:40 AM' },
                      { p: 3, label: '10:50 AM' },
                      { p: 4, label: '11:45 AM' },
                      { p: 5, label: '01:25 PM' },
                      { p: 6, label: '02:15 PM' },
                      { p: 7, label: '03:05 PM' }
                    ].map(item => (
                      <option key={item.p} value={item.p}>Period {item.p} ({item.label})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label required">To Period</label>
                  <select
                    className="form-control form-select"
                    value={toPeriod}
                    onChange={e => setToPeriod(parseInt(e.target.value, 10))}
                  >
                    {[1, 2, 3, 4, 5, 6, 7].map(p => (
                      <option key={p} value={p}>Period {p} ({p === 7 ? '04:00 PM' : 'End of period'})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.8rem', color: '#64748b' }}>
                Note: Standard full-day OD spans Period 1 through Period 7. For partial day attendance, specify starting and ending period numbers.
              </div>
            </div>
          )}

          {/* STEP 3: REASON */}
          {step === 3 && (
            <div>
              <h3 style={{ marginBottom: 16 }}>Step 3: Reason & Description</h3>

              <div className="form-group">
                <label className="form-label required">Detailed Description of Activity</label>
                <textarea
                  className="form-control"
                  rows={4}
                  placeholder="Describe your role, paper title, project domain, or team details..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Additional Remarks / Mentor Faculty (Optional)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Recommended by Class Advisor Prof. R. Kavitha"
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* STEP 4: EVIDENCE */}
          {step === 4 && (
            <div>
              <h3 style={{ marginBottom: 16 }}>Step 4: Upload Supporting Evidence</h3>
              <p style={{ fontSize: '0.825rem', color: '#64748b', marginBottom: 16 }}>
                Attach acceptance letter, selection email, invitation pass, or certificate. Formats: PDF, PNG, JPG (Max 5MB).
              </p>

              {evidenceFile ? (
                <div
                  style={{
                    padding: 16,
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <FileCheck size={28} color="#059669" />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#0f172a' }}>
                        {evidenceFile.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {(evidenceFile.size / 1024).toFixed(1)} KB • Ready for submission
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEvidenceFile(null)}
                    className="btn btn-outline btn-sm"
                    style={{ color: '#ef4444', borderColor: '#fca5a5' }}
                  >
                    <X size={14} />
                    <span>Remove</span>
                  </button>
                </div>
              ) : (
                <label
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 36,
                    border: '2px dashed #cbd5e1',
                    borderRadius: 12,
                    cursor: 'pointer',
                    background: '#f8fafc',
                    transition: 'border-color 150ms'
                  }}
                >
                  <Upload size={32} color="#64748b" style={{ marginBottom: 12 }} />
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0f172a' }}>
                    Click to browse or drag and drop certificate / letter
                  </span>
                  <span style={{ fontSize: '0.785rem', color: '#64748b', marginTop: 4 }}>
                    Accepted: PDF, PNG, JPG up to 5MB
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    style={{ display: 'none' }}
                    onChange={handleFileUpload}
                  />
                </label>
              )}

              {uploadError && (
                <div style={{ marginTop: 12, color: '#ef4444', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertCircle size={14} />
                  <span>{uploadError}</span>
                </div>
              )}
            </div>
          )}

          {/* STEP 5: REVIEW */}
          {step === 5 && (
            <div>
              <h3 style={{ marginBottom: 16 }}>Step 5: Review & Submit</h3>

              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                  padding: 20,
                  marginBottom: 20
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>EVENT TYPE</div>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{odType}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>EVENT NAME</div>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{eventName}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>VENUE</div>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{venue}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>DATES & PERIODS</div>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>
                      {fromDate} {toDate !== fromDate ? `to ${toDate}` : ''} (P{fromPeriod}–P{toPeriod})
                    </div>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>DESCRIPTION</div>
                    <div style={{ color: '#334155', fontSize: '0.85rem', marginTop: 2 }}>{description}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>ATTACHED EVIDENCE</div>
                    <div style={{ color: evidenceFile ? '#059669' : '#d97706', fontSize: '0.85rem', fontWeight: 600 }}>
                      {evidenceFile ? `✓ ${evidenceFile.name}` : 'Self-declaration (No file attached)'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Stepper Navigation Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, paddingTop: 16, borderTop: '1px solid #e2e8f0' }}>
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(prev => prev - 1)}
                className="btn btn-outline"
              >
                <ArrowLeft size={16} />
                <span>Previous</span>
              </button>
            ) : <div />}

            {step < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                className="btn btn-primary"
              >
                <span>Continue</span>
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                disabled={loading}
                onClick={handleSubmit}
                className="btn btn-success"
                style={{ padding: '10px 24px', fontSize: '0.925rem' }}
              >
                {loading ? 'Submitting...' : 'Submit OD Request'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
