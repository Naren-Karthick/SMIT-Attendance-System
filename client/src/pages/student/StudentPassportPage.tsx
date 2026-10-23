import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { safeApiFetch } from '../../utils/api';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ShieldCheck, QrCode, Download, Award, CheckCircle, AlertTriangle, FileText, Calendar } from 'lucide-react';

export const StudentPassportPage: React.FC = () => {
  const { user } = useAuth();
  const [passportData, setPassportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPassport() {
      try {
        setLoading(true);
        const data = await safeApiFetch<any>('/api/passport/generate', {
          method: 'POST',
          body: JSON.stringify({ student_id: user?.studentId })
        });
        setPassportData(data);
      } catch (err: any) {
        setError(err.message || 'Failed to generate Digital Attendance Passport');
      } finally {
        setLoading(false);
      }
    }
    fetchPassport();
  }, [user?.studentId]);

  if (loading) {
    return (
      <div className="page-wrapper">
        <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="text-body">Cryptographically verifying & compiling Attendance Passport...</div>
        </div>
      </div>
    );
  }

  if (error || !passportData) {
    return (
      <div className="page-wrapper">
        <div className="card" style={{ padding: 24, textAlign: 'center', color: '#dc2626' }}>
          <AlertTriangle size={32} style={{ margin: '0 auto 12px' }} />
          <h3>Unable to issue passport</h3>
          <p>{error || 'An unexpected error occurred while loading your digital record.'}</p>
        </div>
      </div>
    );
  }

  const { passport, passportToken, verificationUrl } = passportData;

  return (
    <div className="page-wrapper" style={{ maxWidth: 880, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Digital Attendance Passport</h2>
        <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: 4 }}>
          Tamper-evident, cryptographically certified institutional attendance credential.
        </p>
      </div>

      {/* Main Credential Certificate Card */}
      <div
        className="card"
        style={{
          border: '2px solid #800d18',
          borderRadius: 16,
          padding: 32,
          background: 'linear-gradient(180deg, #ffffff 0%, #fafafa 100%)',
          boxShadow: '0 10px 25px -5px rgba(128, 13, 24, 0.1)',
          position: 'relative'
        }}
      >
        {/* Certificate Header */}
        <div style={{ borderBottom: '2px solid #f1f5f9', paddingBottom: 20, marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Award size={28} color="#800d18" />
              <h3 style={{ margin: 0, color: '#800d18', fontSize: '1.25rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Sri Muthukumaran Institute of Technology
              </h3>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '4px 0 0 36px' }}>
              Affiliated to Anna University • Department of Information Technology
            </p>
          </div>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '4px 10px', borderRadius: 999, background: '#fef2f2', color: '#800d18', border: '1px solid #fecaca' }}>
            REGULATION R2021
          </span>
        </div>

        {/* Student Details & Status Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 28 }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Candidate Name</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginTop: 2 }}>{passport.student.fullName}</div>
            <div style={{ fontSize: '0.85rem', color: '#475569' }}>Reg No: {passport.student.registerNumber}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Academic Standing</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginTop: 2 }}>Semester {passport.student.semester}</div>
            <div style={{ fontSize: '0.85rem', color: '#475569' }}>Batch {passport.student.batch}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Final Exam Eligibility</div>
            <div style={{ marginTop: 4 }}>
              <StatusBadge status={passport.eligibility === 'ELIGIBLE' ? 'Safe' : (passport.eligibility === 'CONDONATION_REQUIRED' ? 'Warning' : 'Critical')} />
            </div>
          </div>
        </div>

        {/* Attendance Statistics Highlight */}
        <div style={{ background: '#f8fafc', borderRadius: 12, padding: 20, border: '1px solid #e2e8f0', marginBottom: 24, display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: passport.metrics.percentage >= 75 ? '#166534' : '#dc2626' }}>
              {passport.metrics.percentage}%
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Overall Attendance</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>
              {passport.metrics.attendedHours} / {passport.metrics.applicableTotal}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Attended / Applicable Hrs</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#2563eb' }}>
              {passport.metrics.od}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Approved OD Hours</div>
          </div>
        </div>

        {/* Subject-Wise Summary Table */}
        <div style={{ marginBottom: 28 }}>
          <h4 style={{ margin: '0 0 12px', fontSize: '0.9rem', color: '#334155', fontWeight: 700 }}>Course-Wise Clearance Summary</h4>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', textAlign: 'left', borderBottom: '1px solid #cbd5e1' }}>
                  <th style={{ padding: '8px 12px' }}>Code</th>
                  <th style={{ padding: '8px 12px' }}>Subject Title</th>
                  <th style={{ padding: '8px 12px', textAlign: 'center' }}>Total</th>
                  <th style={{ padding: '8px 12px', textAlign: 'center' }}>Attended</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right' }}>%</th>
                </tr>
              </thead>
              <tbody>
                {passport.subjects.map((sub: any) => (
                  <tr key={sub.subjectId} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 600 }}>{sub.code}</td>
                    <td style={{ padding: '8px 12px' }}>{sub.name}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>{sub.applicableTotal}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>{sub.attendedHours}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: sub.percentage >= 75 ? '#166534' : '#dc2626' }}>
                      {sub.percentage}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cryptographic Signature Footer */}
        <div style={{ borderTop: '2px dashed #cbd5e1', paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ maxWidth: 460 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#166534', fontWeight: 600, fontSize: '0.85rem' }}>
              <ShieldCheck size={18} />
              <span>Signed by COE / Office of the Controller of Examinations</span>
            </div>
            <div style={{ fontSize: '0.7rem', color: '#64748b', wordBreak: 'break-all', marginTop: 4 }}>
              SHA256 Token: <code>{passport.signature}</code>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 2 }}>
              Issued at: {new Date(passport.issuedAt).toLocaleString()}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ display: 'inline-block', padding: 8, background: '#fff', border: '1px solid #cbd5e1', borderRadius: 8 }}>
              <QrCode size={64} color="#0f172a" />
            </div>
            <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 2 }}>Scan to Verify</div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 20, textAlign: 'center' }}>
        <button
          onClick={() => window.print()}
          className="btn btn-primary"
          style={{ background: '#800d18', borderColor: '#800d18', fontWeight: 600 }}
        >
          <Download size={16} />
          <span>Print / Save Verified PDF</span>
        </button>
      </div>
    </div>
  );
};