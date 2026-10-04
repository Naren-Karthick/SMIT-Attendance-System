import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { ResponsiveMobileNav } from './components/layout/ResponsiveMobileNav';
import { MobileDrawer } from './components/layout/MobileDrawer';
import { LoginPage } from './pages/auth/LoginPage';

// Student Pages
import { StudentDashboard } from './pages/student/StudentDashboard';
import { StudentAttendance } from './pages/student/StudentAttendance';
import { StudentApplyOD } from './pages/student/StudentApplyOD';
import { StudentODRequests } from './pages/student/StudentODRequests';
import { StudentApplyLeave } from './pages/student/StudentApplyLeave';
import { StudentLeaveRequests } from './pages/student/StudentLeaveRequests';
import { StudentTimetable } from './pages/student/StudentTimetable';

// Faculty Pages
import { FacultyDashboard } from './pages/faculty/FacultyDashboard';
import { TakeAttendancePage } from './pages/faculty/TakeAttendancePage';
import { FacultyClasses } from './pages/faculty/FacultyClasses';
import { FacultyAttendanceHistory } from './pages/faculty/FacultyAttendanceHistory';

// HOD Pages
import { HodDashboard } from './pages/hod/HodDashboard';
import { HodApprovals } from './pages/hod/HodApprovals';
import { HodStudents } from './pages/hod/HodStudents';
import { HodFaculty } from './pages/hod/HodFaculty';
import { HodSubjects } from './pages/hod/HodSubjects';
import { HodAssignments } from './pages/hod/HodAssignments';
import { HodTimetable } from './pages/hod/HodTimetable';
import { HodAttendanceHub } from './pages/hod/HodAttendanceHub';
import { HodAnalytics } from './pages/hod/HodAnalytics';
import { HodReports } from './pages/hod/HodReports';
import { HodAuditLogs } from './pages/hod/HodAuditLogs';
import { HodSettings } from './pages/hod/HodSettings';

// Shared Pages
import { NotificationsPage } from './pages/shared/NotificationsPage';
import { ProfilePage } from './pages/shared/ProfilePage';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<string>('');
  const [pageParams, setPageParams] = useState<any>(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Set default page based on role when user logs in or role switches
  useEffect(() => {
    if (user) {
      if (user.role === 'student') setCurrentPage('student-dashboard');
      else if (user.role === 'faculty') setCurrentPage('faculty-dashboard');
      else if (user.role === 'hod') setCurrentPage('hod-dashboard');
    }
  }, [user?.role, user?.id]);

  const handleNavigate = (page: string, params?: any) => {
    setCurrentPage(page);
    setPageParams(params || null);
    setMobileDrawerOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0f172a',
          color: '#ffffff'
        }}
      >
        <div style={{ fontWeight: 700, fontSize: '1.25rem', marginBottom: 8 }}>
          SMIT Smart Attendance
        </div>
        <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
          Sri Muthukumaran Institute of Technology • Initializing...
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onSuccess={role => {
      if (role === 'student') setCurrentPage('student-dashboard');
      else if (role === 'faculty') setCurrentPage('faculty-dashboard');
      else if (role === 'hod') setCurrentPage('hod-dashboard');
    }} />;
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      // Student Routes
      case 'student-dashboard':
        return <StudentDashboard onNavigate={handleNavigate} />;
      case 'student-attendance':
        return <StudentAttendance />;
      case 'student-apply-od':
        return <StudentApplyOD onNavigate={handleNavigate} />;
      case 'student-od-requests':
        return <StudentODRequests onNavigate={handleNavigate} />;
      case 'student-apply-leave':
        return <StudentApplyLeave onNavigate={handleNavigate} />;
      case 'student-leave-requests':
        return <StudentLeaveRequests onNavigate={handleNavigate} />;
      case 'student-timetable':
        return <StudentTimetable />;

      // Faculty Routes
      case 'faculty-dashboard':
        return <FacultyDashboard onNavigate={handleNavigate} />;
      case 'take-attendance':
        return <TakeAttendancePage initialParams={pageParams} onNavigate={handleNavigate} />;
      case 'faculty-classes':
        return <FacultyClasses onNavigate={handleNavigate} />;
      case 'faculty-attendance-history':
        return <FacultyAttendanceHistory onNavigate={handleNavigate} />;
      case 'faculty-students':
        return <HodStudents />;
      case 'faculty-od':
        return <HodApprovals initialTab="od" />;
      case 'faculty-leave':
        return <HodApprovals initialTab="leave" />;
      case 'faculty-reports':
        return <HodReports />;
      case 'faculty-timetable':
        return <HodTimetable />;

      // HOD Routes
      case 'hod-dashboard':
        return <HodDashboard onNavigate={handleNavigate} />;
      case 'hod-analytics':
        return <HodAnalytics onNavigate={handleNavigate} />;
      case 'hod-attendance':
        return <HodAttendanceHub onNavigate={handleNavigate} />;
      case 'hod-od-approvals':
        return <HodApprovals initialTab="od" />;
      case 'hod-leave-approvals':
        return <HodApprovals initialTab="leave" />;
      case 'hod-students':
        return <HodStudents />;
      case 'hod-faculty':
        return <HodFaculty />;
      case 'hod-subjects':
        return <HodSubjects />;
      case 'hod-assignments':
        return <HodAssignments />;
      case 'hod-timetable':
        return <HodTimetable />;
      case 'hod-reports':
        return <HodReports />;
      case 'hod-audit-logs':
        return <HodAuditLogs />;
      case 'hod-settings':
        return <HodSettings />;

      // Shared Routes
      case 'notifications':
        return <NotificationsPage onNavigate={handleNavigate} />;
      case 'profile':
        return <ProfilePage />;

      default:
        if (user.role === 'student') return <StudentDashboard onNavigate={handleNavigate} />;
        if (user.role === 'faculty') return <FacultyDashboard onNavigate={handleNavigate} />;
        return <HodDashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="app-container">
      {/* Desktop Navigation Sidebar */}
      <Sidebar currentPage={currentPage} onNavigate={handleNavigate} />

      {/* Slide-out Mobile Navigation Drawer for all roles */}
      <MobileDrawer
        isOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        currentPage={currentPage}
        onNavigate={handleNavigate}
      />

      <div className="main-content">
        {/* Top Header with Hamburger Menu Toggle */}
        <Header
          currentPage={currentPage}
          onNavigate={handleNavigate}
          onOpenMobileDrawer={() => setMobileDrawerOpen(true)}
        />

        {/* Page Content */}
        <main style={{ flex: 1 }}>{renderCurrentPage()}</main>

        {/* Universal Mobile Bottom Navigation for Student, Faculty & HOD */}
        <ResponsiveMobileNav
          currentPage={currentPage}
          onNavigate={handleNavigate}
          onOpenDrawer={() => setMobileDrawerOpen(true)}
        />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
}
