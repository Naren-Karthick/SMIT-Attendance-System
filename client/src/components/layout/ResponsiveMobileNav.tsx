import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  CheckSquare,
  FileCheck,
  CalendarCheck,
  Menu,
  Users,
  History,
  ShieldCheck,
  GraduationCap,
  TrendingUp,
  Send
} from 'lucide-react';

interface ResponsiveMobileNavProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onOpenDrawer: () => void;
}

export const ResponsiveMobileNav: React.FC<ResponsiveMobileNavProps> = ({
  currentPage,
  onNavigate,
  onOpenDrawer
}) => {
  const { user } = useAuth();
  const role = user?.role || 'student';

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Bottom Navigation">
      {/* 1. Student Bottom Nav */}
      {role === 'student' && (
        <>
          <button
            className={`mobile-nav-item ${currentPage === 'student-dashboard' ? 'active' : ''}`}
            onClick={() => onNavigate('student-dashboard')}
          >
            <LayoutDashboard size={20} />
            <span>Home</span>
          </button>

          <button
            className={`mobile-nav-item ${currentPage === 'student-attendance' ? 'active' : ''}`}
            onClick={() => onNavigate('student-attendance')}
          >
            <CheckSquare size={20} />
            <span>Attendance</span>
          </button>

          <button
            className={`mobile-nav-item ${currentPage === 'student-apply-od' ? 'active' : ''}`}
            onClick={() => onNavigate('student-apply-od')}
          >
            <div className="mobile-nav-highlight">
              <Send size={18} />
            </div>
            <span>Apply OD</span>
          </button>

          <button
            className={`mobile-nav-item ${currentPage === 'student-od-requests' || currentPage === 'student-leave-requests' ? 'active' : ''}`}
            onClick={() => onNavigate('student-od-requests')}
          >
            <FileCheck size={20} />
            <span>Requests</span>
          </button>

          <button className="mobile-nav-item" onClick={onOpenDrawer} aria-label="Open menu">
            <Menu size={20} />
            <span>Menu</span>
          </button>
        </>
      )}

      {/* 2. Faculty Bottom Nav */}
      {role === 'faculty' && (
        <>
          <button
            className={`mobile-nav-item ${currentPage === 'faculty-dashboard' ? 'active' : ''}`}
            onClick={() => onNavigate('faculty-dashboard')}
          >
            <LayoutDashboard size={20} />
            <span>Home</span>
          </button>

          <button
            className={`mobile-nav-item ${currentPage === 'faculty-classes' ? 'active' : ''}`}
            onClick={() => onNavigate('faculty-classes')}
          >
            <Users size={20} />
            <span>Classes</span>
          </button>

          <button
            className={`mobile-nav-item ${currentPage === 'faculty-take-attendance' ? 'active' : ''}`}
            onClick={() => onNavigate('faculty-take-attendance')}
          >
            <div className="mobile-nav-highlight">
              <CheckSquare size={18} />
            </div>
            <span>Take</span>
          </button>

          <button
            className={`mobile-nav-item ${currentPage === 'faculty-history' ? 'active' : ''}`}
            onClick={() => onNavigate('faculty-history')}
          >
            <History size={20} />
            <span>History</span>
          </button>

          <button className="mobile-nav-item" onClick={onOpenDrawer} aria-label="Open menu">
            <Menu size={20} />
            <span>Menu</span>
          </button>
        </>
      )}

      {/* 3. HOD Bottom Nav */}
      {role === 'hod' && (
        <>
          <button
            className={`mobile-nav-item ${currentPage === 'hod-dashboard' ? 'active' : ''}`}
            onClick={() => onNavigate('hod-dashboard')}
          >
            <LayoutDashboard size={20} />
            <span>Control</span>
          </button>

          <button
            className={`mobile-nav-item ${currentPage === 'hod-od-approvals' || currentPage === 'hod-leave-approvals' ? 'active' : ''}`}
            onClick={() => onNavigate('hod-od-approvals')}
          >
            <ShieldCheck size={20} />
            <span>Approvals</span>
          </button>

          <button
            className={`mobile-nav-item ${currentPage === 'hod-students' ? 'active' : ''}`}
            onClick={() => onNavigate('hod-students')}
          >
            <GraduationCap size={20} />
            <span>Students</span>
          </button>

          <button
            className={`mobile-nav-item ${currentPage === 'hod-analytics' ? 'active' : ''}`}
            onClick={() => onNavigate('hod-analytics')}
          >
            <TrendingUp size={20} />
            <span>Analytics</span>
          </button>

          <button className="mobile-nav-item" onClick={onOpenDrawer} aria-label="Open menu">
            <Menu size={20} />
            <span>Menu</span>
          </button>
        </>
      )}
    </nav>
  );
};
