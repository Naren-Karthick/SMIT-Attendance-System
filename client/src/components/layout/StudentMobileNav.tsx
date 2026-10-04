import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, CheckSquare, FileCheck, CalendarCheck, Bell, User } from 'lucide-react';

interface StudentMobileNavProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const StudentMobileNav: React.FC<StudentMobileNavProps> = ({ currentPage, onNavigate }) => {
  const { user, unreadCount } = useAuth();
  if (user?.role !== 'student') return null;

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
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
        className={`mobile-nav-item ${currentPage === 'student-od-requests' || currentPage === 'student-apply-od' ? 'active' : ''}`}
        onClick={() => onNavigate('student-od-requests')}
      >
        <FileCheck size={20} />
        <span>OD</span>
      </button>

      <button
        className={`mobile-nav-item ${currentPage === 'student-leave-requests' || currentPage === 'student-apply-leave' ? 'active' : ''}`}
        onClick={() => onNavigate('student-leave-requests')}
      >
        <CalendarCheck size={20} />
        <span>Leave</span>
      </button>

      <button
        className={`mobile-nav-item ${currentPage === 'notifications' ? 'active' : ''}`}
        onClick={() => onNavigate('notifications')}
        style={{ position: 'relative' }}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: 6,
              right: 18,
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: '#ef4444'
            }}
          />
        )}
        <span>Alerts</span>
      </button>

      <button
        className={`mobile-nav-item ${currentPage === 'profile' ? 'active' : ''}`}
        onClick={() => onNavigate('profile')}
      >
        <User size={20} />
        <span>Profile</span>
      </button>
    </nav>
  );
};
