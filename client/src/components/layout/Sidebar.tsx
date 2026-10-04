import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
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
  Network
} from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate }) => {
  const { user } = useAuth();
  const role = user?.role || 'student';

  const renderStudentLinks = () => (
    <>
      <div className="nav-section-title">Main</div>
      <button
        className={`nav-link ${currentPage === 'student-dashboard' ? 'active' : ''}`}
        onClick={() => onNavigate('student-dashboard')}
      >
        <LayoutDashboard size={18} />
        <span>Dashboard</span>
      </button>
      <button
        className={`nav-link ${currentPage === 'student-attendance' ? 'active' : ''}`}
        onClick={() => onNavigate('student-attendance')}
      >
        <CheckSquare size={18} />
        <span>My Attendance</span>
      </button>
      <button
        className={`nav-link ${currentPage === 'student-timetable' ? 'active' : ''}`}
        onClick={() => onNavigate('student-timetable')}
      >
        <CalendarDays size={18} />
        <span>Timetable</span>
      </button>

      <div className="nav-section-title">On-Duty (OD)</div>
      <button
        className={`nav-link ${currentPage === 'student-apply-od' ? 'active' : ''}`}
        onClick={() => onNavigate('student-apply-od')}
      >
        <Send size={18} />
        <span>Apply OD</span>
      </button>
      <button
        className={`nav-link ${currentPage === 'student-od-requests' ? 'active' : ''}`}
        onClick={() => onNavigate('student-od-requests')}
      >
        <FileCheck size={18} />
        <span>OD Requests</span>
      </button>

      <div className="nav-section-title">Leave Management</div>
      <button
        className={`nav-link ${currentPage === 'student-apply-leave' ? 'active' : ''}`}
        onClick={() => onNavigate('student-apply-leave')}
      >
        <CalendarCheck size={18} />
        <span>Apply Leave</span>
      </button>
      <button
        className={`nav-link ${currentPage === 'student-leave-requests' ? 'active' : ''}`}
        onClick={() => onNavigate('student-leave-requests')}
      >
        <History size={18} />
        <span>Leave Requests</span>
      </button>

      <div className="nav-section-title">Account</div>
      <button
        className={`nav-link ${currentPage === 'notifications' ? 'active' : ''}`}
        onClick={() => onNavigate('notifications')}
      >
        <Bell size={18} />
        <span>Notifications</span>
      </button>
      <button
        className={`nav-link ${currentPage === 'profile' ? 'active' : ''}`}
        onClick={() => onNavigate('profile')}
      >
        <User size={18} />
        <span>Profile</span>
      </button>
    </>
  );

  const renderFacultyLinks = () => (
    <>
      <div className="nav-section-title">Instructional</div>
      <button
        className={`nav-link ${currentPage === 'faculty-dashboard' ? 'active' : ''}`}
        onClick={() => onNavigate('faculty-dashboard')}
      >
        <LayoutDashboard size={18} />
        <span>Dashboard</span>
      </button>
      <button
        className={`nav-link ${currentPage === 'take-attendance' ? 'active' : ''}`}
        onClick={() => onNavigate('take-attendance')}
      >
        <CheckSquare size={18} />
        <span>Take Attendance</span>
      </button>
      <button
        className={`nav-link ${currentPage === 'faculty-classes' ? 'active' : ''}`}
        onClick={() => onNavigate('faculty-classes')}
      >
        <BookOpen size={18} />
        <span>My Classes</span>
      </button>
      <button
        className={`nav-link ${currentPage === 'faculty-attendance-history' ? 'active' : ''}`}
        onClick={() => onNavigate('faculty-attendance-history')}
      >
        <History size={18} />
        <span>Attendance History</span>
      </button>
      <button
        className={`nav-link ${currentPage === 'faculty-students' ? 'active' : ''}`}
        onClick={() => onNavigate('faculty-students')}
      >
        <Users size={18} />
        <span>Students</span>
      </button>
      <button
        className={`nav-link ${currentPage === 'faculty-timetable' ? 'active' : ''}`}
        onClick={() => onNavigate('faculty-timetable')}
      >
        <CalendarDays size={18} />
        <span>Timetable</span>
      </button>

      <div className="nav-section-title">Approvals & Info</div>
      <button
        className={`nav-link ${currentPage === 'faculty-od' ? 'active' : ''}`}
        onClick={() => onNavigate('faculty-od')}
      >
        <FileCheck size={18} />
        <span>OD Information</span>
      </button>
      <button
        className={`nav-link ${currentPage === 'faculty-leave' ? 'active' : ''}`}
        onClick={() => onNavigate('faculty-leave')}
      >
        <CalendarCheck size={18} />
        <span>Leave Information</span>
      </button>
      <button
        className={`nav-link ${currentPage === 'faculty-reports' ? 'active' : ''}`}
        onClick={() => onNavigate('faculty-reports')}
      >
        <FileSpreadsheet size={18} />
        <span>Reports</span>
      </button>

      <div className="nav-section-title">Account</div>
      <button
        className={`nav-link ${currentPage === 'notifications' ? 'active' : ''}`}
        onClick={() => onNavigate('notifications')}
      >
        <Bell size={18} />
        <span>Notifications</span>
      </button>
      <button
        className={`nav-link ${currentPage === 'profile' ? 'active' : ''}`}
        onClick={() => onNavigate('profile')}
      >
        <User size={18} />
        <span>Profile</span>
      </button>
    </>
  );

  const renderHodLinks = () => (
    <>
      <div className="nav-section-title">Department HQ</div>
      <button
        className={`nav-link ${currentPage === 'hod-dashboard' ? 'active' : ''}`}
        onClick={() => onNavigate('hod-dashboard')}
      >
        <LayoutDashboard size={18} />
        <span>Dashboard</span>
      </button>
      <button
        className={`nav-link ${currentPage === 'hod-analytics' ? 'active' : ''}`}
        onClick={() => onNavigate('hod-analytics')}
      >
        <TrendingUp size={18} />
        <span>Analytics</span>
      </button>
      <button
        className={`nav-link ${currentPage === 'hod-attendance' ? 'active' : ''}`}
        onClick={() => onNavigate('hod-attendance')}
      >
        <CheckSquare size={18} />
        <span>Attendance Hub</span>
      </button>

      <div className="nav-section-title">Approval Center</div>
      <button
        className={`nav-link ${currentPage === 'hod-od-approvals' ? 'active' : ''}`}
        onClick={() => onNavigate('hod-od-approvals')}
      >
        <FileCheck size={18} />
        <span>OD Requests</span>
      </button>
      <button
        className={`nav-link ${currentPage === 'hod-leave-approvals' ? 'active' : ''}`}
        onClick={() => onNavigate('hod-leave-approvals')}
      >
        <CalendarCheck size={18} />
        <span>Leave Requests</span>
      </button>

      <div className="nav-section-title">Academic Directory</div>
      <button
        className={`nav-link ${currentPage === 'hod-students' ? 'active' : ''}`}
        onClick={() => onNavigate('hod-students')}
      >
        <GraduationCap size={18} />
        <span>Students (120)</span>
      </button>
      <button
        className={`nav-link ${currentPage === 'hod-faculty' ? 'active' : ''}`}
        onClick={() => onNavigate('hod-faculty')}
      >
        <Users size={18} />
        <span>Faculty</span>
      </button>
      <button
        className={`nav-link ${currentPage === 'hod-subjects' ? 'active' : ''}`}
        onClick={() => onNavigate('hod-subjects')}
      >
        <BookOpen size={18} />
        <span>Subjects</span>
      </button>
      <button
        className={`nav-link ${currentPage === 'hod-assignments' ? 'active' : ''}`}
        onClick={() => onNavigate('hod-assignments')}
      >
        <Network size={18} />
        <span>Assignments</span>
      </button>
      <button
        className={`nav-link ${currentPage === 'hod-timetable' ? 'active' : ''}`}
        onClick={() => onNavigate('hod-timetable')}
      >
        <CalendarDays size={18} />
        <span>Timetable</span>
      </button>

      <div className="nav-section-title">Administration</div>
      <button
        className={`nav-link ${currentPage === 'hod-reports' ? 'active' : ''}`}
        onClick={() => onNavigate('hod-reports')}
      >
        <FileSpreadsheet size={18} />
        <span>Reports</span>
      </button>
      <button
        className={`nav-link ${currentPage === 'hod-audit-logs' ? 'active' : ''}`}
        onClick={() => onNavigate('hod-audit-logs')}
      >
        <ShieldCheck size={18} />
        <span>Audit Logs</span>
      </button>
      <button
        className={`nav-link ${currentPage === 'hod-settings' ? 'active' : ''}`}
        onClick={() => onNavigate('hod-settings')}
      >
        <Sliders size={18} />
        <span>Settings</span>
      </button>
      <button
        className={`nav-link ${currentPage === 'notifications' ? 'active' : ''}`}
        onClick={() => onNavigate('notifications')}
      >
        <Bell size={18} />
        <span>Notifications</span>
      </button>
    </>
  );

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 700, letterSpacing: '0.02em', color: '#fff' }}>
            SMIT Smart Attendance
          </div>
          <div style={{ fontSize: '0.725rem', color: '#94a3b8' }}>
            IT Department • {role === 'hod' ? 'Control Center' : (role === 'faculty' ? 'Faculty Portal' : 'Student Portal')}
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {role === 'hod' && renderHodLinks()}
        {role === 'faculty' && renderFacultyLinks()}
        {role === 'student' && renderStudentLinks()}
      </nav>
    </aside>
  );
};
