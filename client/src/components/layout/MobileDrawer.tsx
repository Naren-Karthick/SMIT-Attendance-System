import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  X,
  LayoutDashboard,
  CheckSquare,
  CalendarDays,
  FileCheck,
  Send,
  CalendarCheck,
  Users,
  GraduationCap,
  BookOpen,
  Sliders,
  History,
  TrendingUp,
  FileSpreadsheet,
  Bell,
  User,
  ShieldCheck,
  Network,
  LogOut,
  ArrowRightLeft,
  Sparkles
} from 'lucide-react';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  currentPage,
  onNavigate
}) => {
  const { user, logout, switchUser, unreadCount } = useAuth();
  const { showToast } = useToast();
  const role = user?.role || 'student';

  if (!isOpen) return null;

  const handleNavClick = (page: string) => {
    onNavigate(page);
    onClose();
  };

  const handleQuickSwitch = async (identifier: string, name: string, targetRole: string) => {
    try {
      await switchUser(identifier, 'smit@2026', targetRole);
      showToast(`Switched to ${name} (${targetRole.toUpperCase()})`, 'info');
      onNavigate(targetRole === 'hod' ? 'hod-dashboard' : (targetRole === 'faculty' ? 'faculty-dashboard' : 'student-dashboard'));
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to switch account', 'error');
    }
  };

  return (
    <div className="mobile-drawer-overlay" onClick={onClose}>
      <div className="mobile-drawer-content" onClick={e => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="mobile-drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #1e3a8a, #2563eb)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1rem',
                boxShadow: '0 4px 10px rgba(37, 99, 235, 0.3)'
              }}
            >
              SMIT
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a', lineHeight: 1.2 }}>
                SMIT Smart Attendance
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                IT Dept • AY 2026–2027
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-icon"
            style={{ width: 36, height: 36, borderRadius: '50%', background: '#f1f5f9' }}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* User Card */}
        <div
          style={{
            margin: '12px 16px',
            padding: '12px 14px',
            background: 'linear-gradient(135deg, #f8fafc 0%, #edf2f7 100%)',
            borderRadius: 12,
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: role === 'hod' ? '#7c3aed' : (role === 'faculty' ? '#059669' : '#2563eb'),
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.95rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
              }}
            >
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f172a' }}>
                {user?.fullName}
              </div>
              <div style={{ fontSize: '0.725rem', color: '#64748b', fontFamily: 'monospace' }}>
                {user?.registerNumber || user?.facultyCode || user?.username}
              </div>
            </div>
          </div>
          <span
            className={`badge ${
              role === 'hod' ? 'badge-critical' : (role === 'faculty' ? 'badge-safe' : 'badge-info')
            }`}
            style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', padding: '3px 8px' }}
          >
            {role}
          </span>
        </div>

        {/* Navigation Items (Role-Based) */}
        <div className="mobile-drawer-body">
          {role === 'student' && (
            <>
              <div className="drawer-section-title">Main Menu</div>
              <button
                className={`drawer-link ${currentPage === 'student-dashboard' ? 'active' : ''}`}
                onClick={() => handleNavClick('student-dashboard')}
              >
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </button>
              <button
                className={`drawer-link ${currentPage === 'student-attendance' ? 'active' : ''}`}
                onClick={() => handleNavClick('student-attendance')}
              >
                <CheckSquare size={18} />
                <span>My Attendance</span>
              </button>
              <button
                className={`drawer-link ${currentPage === 'student-timetable' ? 'active' : ''}`}
                onClick={() => handleNavClick('student-timetable')}
              >
                <CalendarDays size={18} />
                <span>Timetable</span>
              </button>

              <div className="drawer-section-title">On-Duty & Leave</div>
              <button
                className={`drawer-link ${currentPage === 'student-apply-od' ? 'active' : ''}`}
                onClick={() => handleNavClick('student-apply-od')}
              >
                <Send size={18} />
                <span>Apply OD</span>
              </button>
              <button
                className={`drawer-link ${currentPage === 'student-od-requests' ? 'active' : ''}`}
                onClick={() => handleNavClick('student-od-requests')}
              >
                <FileCheck size={18} />
                <span>OD Requests</span>
              </button>
              <button
                className={`drawer-link ${currentPage === 'student-apply-leave' ? 'active' : ''}`}
                onClick={() => handleNavClick('student-apply-leave')}
              >
                <CalendarCheck size={18} />
                <span>Apply Leave</span>
              </button>
              <button
                className={`drawer-link ${currentPage === 'student-leave-requests' ? 'active' : ''}`}
                onClick={() => handleNavClick('student-leave-requests')}
              >
                <History size={18} />
                <span>Leave Requests</span>
              </button>
            </>
          )}

          {role === 'faculty' && (
            <>
              <div className="drawer-section-title">Teaching</div>
              <button
                className={`drawer-link ${currentPage === 'faculty-dashboard' ? 'active' : ''}`}
                onClick={() => handleNavClick('faculty-dashboard')}
              >
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </button>
              <button
                className={`drawer-link ${currentPage === 'faculty-classes' ? 'active' : ''}`}
                onClick={() => handleNavClick('faculty-classes')}
              >
                <Users size={18} />
                <span>My Classes</span>
              </button>
              <button
                className={`drawer-link ${currentPage === 'faculty-take-attendance' ? 'active' : ''}`}
                onClick={() => handleNavClick('faculty-take-attendance')}
              >
                <CheckSquare size={18} />
                <span>Take Attendance</span>
              </button>
              <button
                className={`drawer-link ${currentPage === 'faculty-history' ? 'active' : ''}`}
                onClick={() => handleNavClick('faculty-history')}
              >
                <History size={18} />
                <span>Attendance History</span>
              </button>

              <div className="drawer-section-title">Academic</div>
              <button
                className={`drawer-link ${currentPage === 'faculty-timetable' ? 'active' : ''}`}
                onClick={() => handleNavClick('faculty-timetable')}
              >
                <CalendarDays size={18} />
                <span>My Timetable</span>
              </button>
            </>
          )}

          {role === 'hod' && (
            <>
              <div className="drawer-section-title">Department Control</div>
              <button
                className={`drawer-link ${currentPage === 'hod-dashboard' ? 'active' : ''}`}
                onClick={() => handleNavClick('hod-dashboard')}
              >
                <LayoutDashboard size={18} />
                <span>Executive Dashboard</span>
              </button>
              <button
                className={`drawer-link ${currentPage === 'hod-od-approvals' || currentPage === 'hod-leave-approvals' ? 'active' : ''}`}
                onClick={() => handleNavClick('hod-od-approvals')}
              >
                <ShieldCheck size={18} />
                <span>Approval Center (OD & Leave)</span>
              </button>
              <button
                className={`drawer-link ${currentPage === 'hod-attendance' ? 'active' : ''}`}
                onClick={() => handleNavClick('hod-attendance')}
              >
                <CheckSquare size={18} />
                <span>Attendance Hub & Correction</span>
              </button>

              <div className="drawer-section-title">People & Curriculum</div>
              <button
                className={`drawer-link ${currentPage === 'hod-students' ? 'active' : ''}`}
                onClick={() => handleNavClick('hod-students')}
              >
                <GraduationCap size={18} />
                <span>Students Directory (120)</span>
              </button>
              <button
                className={`drawer-link ${currentPage === 'hod-faculty' ? 'active' : ''}`}
                onClick={() => handleNavClick('hod-faculty')}
              >
                <Users size={18} />
                <span>Faculty Directory</span>
              </button>
              <button
                className={`drawer-link ${currentPage === 'hod-subjects' ? 'active' : ''}`}
                onClick={() => handleNavClick('hod-subjects')}
              >
                <BookOpen size={18} />
                <span>Subjects & Credits</span>
              </button>
              <button
                className={`drawer-link ${currentPage === 'hod-assignments' ? 'active' : ''}`}
                onClick={() => handleNavClick('hod-assignments')}
              >
                <Network size={18} />
                <span>Faculty Assignments</span>
              </button>
              <button
                className={`drawer-link ${currentPage === 'hod-timetable' ? 'active' : ''}`}
                onClick={() => handleNavClick('hod-timetable')}
              >
                <CalendarDays size={18} />
                <span>Timetable Management</span>
              </button>

              <div className="drawer-section-title">Insights & Governance</div>
              <button
                className={`drawer-link ${currentPage === 'hod-analytics' ? 'active' : ''}`}
                onClick={() => handleNavClick('hod-analytics')}
              >
                <TrendingUp size={18} />
                <span>Department Analytics</span>
              </button>
              <button
                className={`drawer-link ${currentPage === 'hod-reports' ? 'active' : ''}`}
                onClick={() => handleNavClick('hod-reports')}
              >
                <FileSpreadsheet size={18} />
                <span>Reports & Exports</span>
              </button>
              <button
                className={`drawer-link ${currentPage === 'hod-audit-logs' ? 'active' : ''}`}
                onClick={() => handleNavClick('hod-audit-logs')}
              >
                <History size={18} />
                <span>Immutable Audit Logs</span>
              </button>
              <button
                className={`drawer-link ${currentPage === 'hod-settings' ? 'active' : ''}`}
                onClick={() => handleNavClick('hod-settings')}
              >
                <Sliders size={18} />
                <span>Attendance Policy Settings</span>
              </button>
            </>
          )}

          <div className="drawer-section-title">General & Account</div>
          <button
            className={`drawer-link ${currentPage === 'notifications' ? 'active' : ''}`}
            onClick={() => handleNavClick('notifications')}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Bell size={18} />
              <span>Notifications</span>
            </div>
            {unreadCount > 0 && (
              <span className="badge badge-critical" style={{ fontSize: '0.7rem' }}>
                {unreadCount}
              </span>
            )}
          </button>
          <button
            className={`drawer-link ${currentPage === 'profile' ? 'active' : ''}`}
            onClick={() => handleNavClick('profile')}
          >
            <User size={18} />
            <span>My Profile</span>
          </button>

          {/* Quick Demo Switcher inside Mobile Drawer */}
          <div className="drawer-section-title">Quick Demo Switcher</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, margin: '4px 16px 12px' }}>
            <button
              onClick={() => handleQuickSwitch('hod_it', 'Dr. S. Anitha', 'hod')}
              className="btn btn-outline btn-xs"
              style={{ fontSize: '0.72rem', padding: '6px', textAlign: 'center' }}
            >
              HOD Mode
            </button>
            <button
              onClick={() => handleQuickSwitch('fac_kavitha', 'Prof. R. Kavitha', 'faculty')}
              className="btn btn-outline btn-xs"
              style={{ fontSize: '0.72rem', padding: '6px', textAlign: 'center' }}
            >
              Faculty Mode
            </button>
            <button
              onClick={() => handleQuickSwitch('212625205004', 'Aravind M', 'student')}
              className="btn btn-outline btn-xs"
              style={{ fontSize: '0.72rem', padding: '6px', textAlign: 'center' }}
            >
              Student (Safe)
            </button>
            <button
              onClick={() => handleQuickSwitch('212625205013', 'Ilakiya B', 'student')}
              className="btn btn-outline btn-xs"
              style={{ fontSize: '0.72rem', padding: '6px', textAlign: 'center' }}
            >
              Student (Crit)
            </button>
          </div>
        </div>

        {/* Drawer Footer with Sign Out */}
        <div className="mobile-drawer-footer">
          <button
            onClick={() => {
              logout();
              onClose();
            }}
            className="btn btn-outline btn-sm"
            style={{ width: '100%', color: '#ef4444', borderColor: '#fca5a5' }}
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
