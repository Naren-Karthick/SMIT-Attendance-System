import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { safeApiFetch } from '../../utils/api';
import { StatusBadge } from '../../components/common/StatusBadge';
import { AlertTriangle, CheckCircle, Clock, Plus, UserCheck, MessageSquare, ShieldAlert, ArrowUpRight } from 'lucide-react';

export const MentorInterventionInbox: React.FC = () => {
  const { user } = useAuth();
  const [interventions, setInterventions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newPlan, setNewPlan] = useState({
    student_id: '',
    risk_level: 'HIGH',
    reason_code: 'ACADEMIC_ATTENDANCE',
    counseling_notes: '',
    action_plan: '',
    follow_up_date: ''
  });

  const fetchInterventions = async () => {
    try {
      setLoading(true);
      const res = await safeApiFetch<{ success: boolean; interventions: any[] }>('/api/interventions/inbox');
      setInterventions(res.interventions || []);
    } catch (err) {
      console.error('Failed to load interventions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterventions();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await safeApiFetch('/api/interventions/create', {
        method: 'POST',
        body: JSON.stringify(newPlan)
      });
      setShowModal(false);
      setNewPlan({
        student_id: '',
        risk_level: 'HIGH',
        reason_code: 'ACADEMIC_ATTENDANCE',
        counseling_notes: '',
        action_plan: '',
        follow_up_date: ''
      });
      fetchInterventions();
    } catch (err: any) {
      alert(err.message || 'Error recording intervention');
    }
  };

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Mentor Intervention Inbox</h2>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: 4 }}>
            Active attendance recovery plans and counseling records for mentored students.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn btn-primary"
          style={{ background: '#800d18', borderColor: '#800d18', fontWeight: 600 }}
        >
          <Plus size={16} />
          <span>Record Support Plan</span>
        </button>
      </div>

      {loading ? (
        <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="text-body">Loading active intervention queue...</div>
        </div>
      ) : interventions.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
          <UserCheck size={48} style={{ margin: '0 auto 12px', color: '#166534' }} />
          <h3>No At-Risk Students Requiring Intervention</h3>
          <p>All assigned mentees currently meet the required attendance thresholds.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {interventions.map((item) => (
            <div
              key={item.id}
              className="card"
              style={{
                padding: 20,
                borderLeft: `5px solid ${item.risk_level === 'CRITICAL' ? '#dc2626' : (item.risk_level === 'HIGH' ? '#ea580c' : '#3b82f6')}`
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{item.student_name}</h3>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>({item.register_number})</span>
                    <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: 999, background: '#f1f5f9', fontWeight: 600 }}>
                      {item.batch_name}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#dc2626', fontWeight: 600, marginTop: 4 }}>
                    Trigger Attendance: {item.trigger_attendance_pct}% • Reason: {item.reason_code}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <StatusBadge status={item.status === 'RESOLVED' ? 'Safe' : (item.status === 'IN_PROGRESS' ? 'Warning' : 'Critical')} />
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, margin: '14px 0', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.8rem', color: '#475569', marginBottom: 6 }}>
                  <strong>Counseling Diagnostic:</strong> {item.counseling_notes}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#166534' }}>
                  <strong>Action Plan:</strong> {item.action_plan}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#94a3b8' }}>
                <div>Follow-up Target: {item.follow_up_date || 'Ongoing'}</div>
                <div>Student Acknowledgment: {item.student_acknowledged ? 'Verified ✓' : 'Pending'}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for creating a new intervention */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div className="card" style={{ maxWidth: 520, width: '100%', padding: 24, borderRadius: 12 }}>
            <h3 style={{ margin: '0 0 16px' }}>Record Student Intervention</h3>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Student ID</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 1"
                  className="input"
                  style={{ width: '100%' }}
                  value={newPlan.student_id}
                  onChange={e => setNewPlan({ ...newPlan, student_id: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Risk Level</label>
                <select
                  className="input"
                  style={{ width: '100%' }}
                  value={newPlan.risk_level}
                  onChange={e => setNewPlan({ ...newPlan, risk_level: e.target.value })}
                >
                  <option value="CRITICAL">CRITICAL (&lt;75% with repeat absences)</option>
                  <option value="HIGH">HIGH (Near border margin 75-80%)</option>
                  <option value="MODERATE">MODERATE (Subject-specific deficit)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Counseling Notes</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Summarize root cause (e.g. medical illness, transportation, personal issues)..."
                  className="input"
                  style={{ width: '100%' }}
                  value={newPlan.counseling_notes}
                  onChange={e => setNewPlan({ ...newPlan, counseling_notes: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Support & Action Plan</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Remedial schedule, mandatory attendance streak target, parent notification..."
                  className="input"
                  style={{ width: '100%' }}
                  value={newPlan.action_plan}
                  onChange={e => setNewPlan({ ...newPlan, action_plan: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline">Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ background: '#800d18', borderColor: '#800d18' }}>Save Support Plan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};