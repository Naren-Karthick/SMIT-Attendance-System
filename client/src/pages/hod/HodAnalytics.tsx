import React, { useState, useEffect } from 'react';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  TrendingUp,
  AlertTriangle,
  BookOpen,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  Users,
  Award,
  ArrowRight
} from 'lucide-react';

interface HodAnalyticsProps {
  onNavigate: (page: string, params?: any) => void;
}

export const HodAnalytics: React.FC<HodAnalyticsProps> = ({ onNavigate }) => {
  const [trends, setTrends] = useState<any>(null);
  const [subjectStats, setSubjectStats] = useState<any[]>([]);
  const [lowStudents, setLowStudents] = useState<any[]>([]);
  const [yearData, setYearData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem('smit_token');
        const [trendRes, subRes, lowRes, yrRes] = await Promise.all([
          fetch('/api/analytics/trends', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/analytics/subject-stats', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/analytics/low-attendance-students', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/analytics/year-comparison', { headers: { Authorization: `Bearer ${token}` } })
        ]);

        if (trendRes.ok) setTrends(await trendRes.json());
        if (subRes.ok) {
          const sd = await subRes.json();
          setSubjectStats(sd.subjects);
        }
        if (lowRes.ok) {
          const ld = await lowRes.json();
          setLowStudents(ld.students);
        }
        if (yrRes.ok) {
          const yd = await yrRes.json();
          setYearData(yd.comparison);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading || !trends) {
    return (
      <div className="page-wrapper">
        <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>Computing department analytics...</div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0 }}>Department Attendance Analytics</h1>
        <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: 4 }}>
          Actionable academic intelligence, compliance indicators, and at-risk student monitoring
        </p>
      </div>

      {/* Year-Wise Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>
        {yearData.map((y: any) => (
          <div key={y.year} className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem' }}>{y.label}</h3>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>
                  {y.studentCount} students enrolled
                </div>
              </div>
              <span
                style={{
                  fontSize: '1.4rem',
                  fontWeight: 800,
                  color: y.averageAttendance >= 85 ? '#059669' : (y.averageAttendance >= 75 ? '#d97706' : '#dc2626')
                }}
              >
                {y.averageAttendance}%
              </span>
            </div>

            <div style={{ height: 8, background: '#e2e8f0', borderRadius: 999, overflow: 'hidden', margin: '14px 0 10px' }}>
              <div
                style={{
                  width: `${Math.min(100, y.averageAttendance)}%`,
                  height: '100%',
                  background: y.averageAttendance >= 85 ? '#10b981' : (y.averageAttendance >= 75 ? '#f59e0b' : '#ef4444')
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b' }}>
              <span>Safe: <strong style={{ color: '#059669' }}>{y.safeCount}</strong></span>
              <span>Warning: <strong style={{ color: '#d97706' }}>{y.warningCount}</strong></span>
              <span>Critical: <strong style={{ color: '#dc2626' }}>{y.criticalCount}</strong></span>
            </div>
          </div>
        ))}
      </div>

      {/* Low Attendance Intervention Watchlist (Section 18) */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header" style={{ background: '#fef2f2', borderBottom: '1px solid #fecaca' }}>
          <div>
            <h3 style={{ margin: 0, color: '#991b1b', display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={18} color="#dc2626" />
              <span>Low Attendance Student Intervention Watchlist ({lowStudents.length})</span>
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#7f1d1d', marginTop: 2 }}>
              Students below 85% warning threshold requiring mentor counseling for exam eligibility
            </p>
          </div>
        </div>

        <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Register No</th>
                <th>Student Name</th>
                <th>Year</th>
                <th>Attendance %</th>
                <th>Risk Category</th>
                <th>At-Risk Subjects</th>
                <th>Classes Needed To Reach 75%</th>
              </tr>
            </thead>
            <tbody>
              {lowStudents.map(st => (
                <tr key={st.id}>
                  <td style={{ fontWeight: 700, fontFamily: 'monospace' }}>{st.registerNumber}</td>
                  <td style={{ fontWeight: 600 }}>{st.fullName}</td>
                  <td>{st.yearLevel}nd/rd/th Year</td>
                  <td>
                    <strong style={{ fontSize: '0.95rem', color: st.statusBadge === 'critical' ? '#dc2626' : '#d97706' }}>
                      {st.percentage}%
                    </strong>
                  </td>
                  <td>
                    <StatusBadge status={st.statusText} size="sm" />
                  </td>
                  <td>
                    {st.atRiskSubjects.length > 0 ? (
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {st.atRiskSubjects.map((sb: string, i: number) => (
                          <span key={i} className="badge" style={{ background: '#fef2f2', color: '#b91c1c' }}>
                            {sb}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Overall borderline</span>
                    )}
                  </td>
                  <td>
                    {st.classesNeededToRecover > 0 ? (
                      <span style={{ fontWeight: 600, color: '#dc2626' }}>
                        {st.classesNeededToRecover} consecutive classes
                      </span>
                    ) : (
                      <span style={{ color: '#059669' }}>Borderline Safe</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Subject-Wise Attendance Breakdown */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div>
            <h3 style={{ margin: 0 }}>Subject-Wise Attendance Metrics</h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>
              Identify subjects with low attendance or instructional challenges
            </p>
          </div>
        </div>

        <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Subject Name</th>
                <th>Year</th>
                <th>Faculty In-Charge</th>
                <th>Sessions Held</th>
                <th>Average Attendance %</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {subjectStats.map(sub => (
                <tr key={sub.id}>
                  <td style={{ fontWeight: 700, color: '#1e3a8a' }}>{sub.code}</td>
                  <td style={{ fontWeight: 600 }}>{sub.name}</td>
                  <td>{sub.yearLevel}nd/rd/th Year</td>
                  <td>{sub.facultyName}</td>
                  <td>{sub.sessionsHeld} sessions</td>
                  <td style={{ width: 140 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 6, background: '#e2e8f0', borderRadius: 999, overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${Math.min(100, sub.averagePercentage)}%`,
                            height: '100%',
                            background: sub.averagePercentage >= 85 ? '#10b981' : (sub.averagePercentage >= 75 ? '#f59e0b' : '#ef4444')
                          }}
                        />
                      </div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                        {sub.averagePercentage}%
                      </span>
                    </div>
                  </td>
                  <td>
                    <StatusBadge status={sub.statusBadge.toUpperCase()} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Request Volume Distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        {/* OD Categories */}
        <div className="card">
          <div className="card-header">
            <h4 style={{ margin: 0 }}>OD Application Volumes</h4>
          </div>
          <div className="card-body" style={{ padding: 16 }}>
            {trends.odCategories.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: '#64748b' }}>No ODs logged yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {trends.odCategories.map((od: any, idx: number) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#f8fafc', borderRadius: 6 }}>
                    <span style={{ fontSize: '0.825rem', fontWeight: 600 }}>{od.od_type}</span>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span className="badge badge-approved" style={{ fontSize: '0.7rem' }}>
                        {od.approved_count} approved
                      </span>
                      <strong style={{ fontSize: '0.85rem' }}>{od.count} total</strong>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Leave Categories */}
        <div className="card">
          <div className="card-header">
            <h4 style={{ margin: 0 }}>Leave Volumes by Category</h4>
          </div>
          <div className="card-body" style={{ padding: 16 }}>
            {trends.leaveCategories.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: '#64748b' }}>No leaves logged yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {trends.leaveCategories.map((lv: any, idx: number) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#f8fafc', borderRadius: 6 }}>
                    <span style={{ fontSize: '0.825rem', fontWeight: 600 }}>{lv.leave_type}</span>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span className="badge badge-approved" style={{ fontSize: '0.7rem' }}>
                        {lv.approved_count} approved
                      </span>
                      <strong style={{ fontSize: '0.85rem' }}>{lv.count} total</strong>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
