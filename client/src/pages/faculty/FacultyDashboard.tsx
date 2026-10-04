import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAutoSyncListener } from '../../context/SyncContext';
import { safeApiFetch } from '../../utils/api';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  BookOpen,
  MapPin,
  Users,
  CheckSquare
} from 'lucide-react';

interface FacultyDashboardProps {
  onNavigate: (page: string, params?: any) => void;
}

export const FacultyDashboard: React.FC<FacultyDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchFacultyDashboard = useCallback(async () => {
    if (!user?.facultyId) return;
    try {
      const data = await safeApiFetch(`/api/faculty/${user.facultyId}/dashboard`);
      setDashboardData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user?.facultyId]);

  useEffect(() => {
    fetchFacultyDashboard();
  }, [fetchFacultyDashboard]);

  useAutoSyncListener(fetchFacultyDashboard);

  if (loading || !dashboardData) {
    return (
      <div className="page-wrapper">
        <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>
          Loading your teaching schedule and classes...
        </div>
      </div>
    );
  }

  const {
    todayDate,
    dayOfWeek,
    totalClassesToday,
    completedToday,
    pendingToday,
    totalOdAlerts,
    classes
  } = dashboardData;

  return (
    <div className="page-wrapper">
      {/* Faculty Hero Banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
          color: '#ffffff',
          padding: '24px 28px',
          marginBottom: '24px',
          border: 'none'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: 'rgba(255,255,255,0.15)' }}>
                {dayOfWeek} • {todayDate}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#93c5fd' }}>
                {user?.designation || 'Faculty Member'}
              </span>
            </div>
            <h1 style={{ color: '#fff', fontSize: '1.6rem', fontWeight: 700, margin: 0 }}>
              {user?.fullName}
            </h1>
            <div style={{ fontSize: '0.875rem', color: '#cbd5e1', marginTop: 4 }}>
              Faculty ID: <strong style={{ color: '#fff' }}>{user?.facultyCode || 'SMIT-IT'}</strong> • Department of Information Technology
            </div>
          </div>

          <button
            onClick={() => onNavigate('take-attendance')}
            className="btn btn-primary"
            style={{ background: '#2563eb', padding: '12px 20px', fontSize: '0.95rem' }}
          >
            <CheckSquare size={18} />
            <span>Fast Attendance Portal</span>
          </button>
        </div>
      </div>

      {/* Progress & KPI Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ padding: 18, borderLeft: '4px solid #2563eb' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>TODAY'S CLASSES</div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', margin: '4px 0' }}>
            {totalClassesToday}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Scheduled teaching periods</div>
        </div>

        <div className="card" style={{ padding: 18, borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>COMPLETED SESSIONS</div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#059669', margin: '4px 0' }}>
            {completedToday}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Attendance logged & verified</div>
        </div>

        <div className="card" style={{ padding: 18, borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>PENDING SESSIONS</div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#d97706', margin: '4px 0' }}>
            {pendingToday}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Awaiting period attendance</div>
        </div>

        <div className="card" style={{ padding: 18, borderLeft: '4px solid #6366f1' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>APPROVED OD ALERTS</div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#4f46e5', margin: '4px 0' }}>
            {totalOdAlerts}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Students on verified On-Duty</div>
        </div>
      </div>

      {/* Today's Teaching Schedule & 1-Click Attendance */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div>
            <h3 style={{ margin: 0 }}>Today's Teaching Schedule ({dayOfWeek})</h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>
              Classes allocated from departmental master timetable
            </p>
          </div>
          <button
            onClick={() => onNavigate('faculty-timetable')}
            className="btn btn-outline btn-sm"
          >
            Weekly Grid
          </button>
        </div>

        <div className="card-body" style={{ padding: 20 }}>
          {classes.length === 0 ? (
            <div style={{ padding: 36, textAlign: 'center', color: '#64748b' }}>
              No classes scheduled on this day for your profile. Enjoy your research/preparation time!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {classes.map((cls: any) => {
                const isCompleted = cls.status === 'completed';

                return (
                  <div
                    key={cls.id}
                    style={{
                      padding: '16px 20px',
                      borderRadius: 12,
                      background: isCompleted ? '#f8fafc' : '#ffffff',
                      border: `1px solid ${isCompleted ? '#e2e8f0' : '#cbd5e1'}`,
                      boxShadow: isCompleted ? 'none' : '0 2px 4px rgba(0,0,0,0.04)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 16
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 10,
                          background: isCompleted ? '#ecfdf5' : '#eff6ff',
                          color: isCompleted ? '#059669' : '#2563eb',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <span style={{ fontSize: '0.6875rem', fontWeight: 600 }}>PER</span>
                        <strong style={{ fontSize: '1.1rem', lineHeight: 1 }}>{cls.period_number}</strong>
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1e3a8a' }}>
                            {cls.subject_code}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>•</span>
                          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                            {cls.year_level}nd/rd/th Year IT (Sem {cls.semester})
                          </span>
                          <span className="badge" style={{ background: '#f1f5f9', color: '#334155' }}>
                            {cls.room || 'Room-302'}
                          </span>
                        </div>

                        <div style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', marginTop: 2 }}>
                          {cls.subject_name}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4, fontSize: '0.75rem', color: '#64748b' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Clock size={12} />
                            <span>{cls.start_time} – {cls.end_time}</span>
                          </span>
                          {cls.approvedOdCount > 0 && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#4f46e5', fontWeight: 600 }}>
                              <Sparkles size={12} />
                              <span>{cls.approvedOdCount} student(s) with Approved OD</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {isCompleted ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className="badge badge-approved" style={{ padding: '6px 12px' }}>
                            <CheckCircle2 size={14} />
                            <span>Attendance Submitted</span>
                          </span>
                          <button
                            onClick={() => onNavigate('take-attendance', {
                              batchId: cls.batch_id,
                              subjectId: cls.subject_id,
                              periodNumber: cls.period_number,
                              date: todayDate
                            })}
                            className="btn btn-outline btn-sm"
                          >
                            View / Edit
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => onNavigate('take-attendance', {
                            batchId: cls.batch_id,
                            subjectId: cls.subject_id,
                            periodNumber: cls.period_number,
                            date: todayDate
                          })}
                          className="btn btn-primary"
                        >
                          <CheckSquare size={16} />
                          <span>Take Attendance</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
