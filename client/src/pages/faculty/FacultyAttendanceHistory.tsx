import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { EmptyState } from '../../components/common/EmptyState';
import { History, Calendar, CheckSquare, Eye, Search, Filter } from 'lucide-react';

interface FacultyAttendanceHistoryProps {
  onNavigate: (page: string, params?: any) => void;
}

export const FacultyAttendanceHistory: React.FC<FacultyAttendanceHistoryProps> = ({ onNavigate }) => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const token = localStorage.getItem('smit_token');
        let url = '/api/attendance/sessions?limit=50';
        if (dateFilter) url += `&date=${dateFilter}`;

        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setSessions(data.sessions);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, [dateFilter]);

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0 }}>Attendance Session History</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: 4 }}>
            Historical record of all attendance sessions submitted and verified
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input
            type="date"
            className="form-control"
            style={{ width: 150, padding: '6px 10px', fontSize: '0.85rem' }}
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
          />
          {dateFilter && (
            <button onClick={() => setDateFilter('')} className="btn btn-outline btn-sm">
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>Loading session history...</div>
        ) : sessions.length === 0 ? (
          <EmptyState
            icon={History}
            title="No Attendance Sessions Found"
            description="You have not submitted attendance sessions matching the criteria."
          />
        ) : (
          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Date & Period</th>
                  <th>Class / Batch</th>
                  <th>Subject</th>
                  <th>Topic / Room</th>
                  <th style={{ textAlign: 'center' }}>Present / Total</th>
                  <th>OD / Leave</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map(ses => (
                  <tr key={ses.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{ses.session_date}</div>
                      <span className="badge" style={{ background: '#f1f5f9', color: '#334155' }}>
                        Period {ses.period_number}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{ses.batch_name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {ses.year_level}nd/rd/th Year (Sem {ses.semester})
                      </div>
                    </td>
                    <td>
                      <strong style={{ color: '#1e3a8a' }}>{ses.subject_code}</strong>
                      <div style={{ fontSize: '0.785rem', color: '#64748b' }}>{ses.subject_name}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.825rem' }}>{ses.topic || 'Regular Lecture'}</div>
                      <div style={{ fontSize: '0.725rem', color: '#94a3b8' }}>{ses.room || 'IT-301'}</div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <strong style={{ color: '#059669' }}>{ses.present_count}</strong> / {ses.total_students}
                    </td>
                    <td>
                      <span style={{ fontSize: '0.785rem', color: '#2563eb' }}>{ses.od_count} OD</span>
                      {ses.leave_count > 0 && <span style={{ fontSize: '0.785rem', color: '#9333ea', marginLeft: 6 }}>{ses.leave_count} Leave</span>}
                    </td>
                    <td>
                      <button
                        onClick={() => onNavigate('take-attendance', {
                          batchId: ses.batch_id,
                          subjectId: ses.subject_id,
                          periodNumber: ses.period_number,
                          date: ses.session_date
                        })}
                        className="btn btn-outline btn-sm"
                      >
                        <Eye size={13} />
                        <span>View / Edit</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
