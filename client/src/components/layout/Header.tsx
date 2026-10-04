import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useSync } from '../../context/SyncContext';
import { Bell, User, LogOut, ArrowRightLeft, Check, Sparkles, Building2, BookOpen, Menu, RefreshCw, Cloud } from 'lucide-react';

interface HeaderProps {
  onNavigate: (page: string) => void;
  currentPage: string;
  onOpenMobileDrawer?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate, currentPage, onOpenMobileDrawer }) => {
  const { user, logout, switchUser, unreadCount, refreshMe } = useAuth();
  const { showToast } = useToast();
  const { countdown, isSyncing, triggerSync, storageInfo } = useSync();

  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [recentNotifs, setRecentNotifs] = useState<any[]>([]);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const switcherRef = useRef<HTMLDivElement>(null);

  // Close popovers when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (switcherRef.current && !switcherRef.current.contains(e.target as Node)) {
        setSwitcherOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadNotifications = async () => {
    try {
      const token = localStorage.getItem('smit_token');
      const res = await fetch('/api/notifications?filter=all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRecentNotifs(data.notifications.slice(0, 5));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenNotif = () => {
    setNotifOpen(!notifOpen);
    if (!notifOpen) {
      loadNotifications();
    }
  };

  const handleQuickSwitch = async (identifier: string, name: string, role: string) => {
    try {
      await switchUser(identifier, 'smit@2026', role);
      setSwitcherOpen(false);
      showToast(`Switched profile to ${name} (${role.toUpperCase()})`, 'info');
      onNavigate(role === 'hod' ? 'hod-dashboard' : (role === 'faculty' ? 'faculty-dashboard' : 'student-dashboard'));
    } catch (err: any) {
      showToast(err.message || 'Failed to switch account', 'error');
    }
  };

  const demoAccounts = [
    { role: 'hod', name: 'Dr. S. Anitha', title: 'HOD - Information Technology', id: 'hod_it' },
    { role: 'faculty', name: 'Prof. R. Kavitha', title: 'Associate Professor', id: 'fac_kavitha' },
    { role: 'faculty', name: 'Prof. K. Suresh', title: 'Assistant Professor (DBMS)', id: 'fac_suresh' },
    { role: 'student', name: 'Aravind M', title: '2nd Year (Pending OD)', id: '212625205004' },
    { role: 'student', name: 'Ilakiya B', title: '2nd Year (Critical <75%)', id: '212625205013' },
    { role: 'student', name: 'Ashwinmaran S', title: '3rd Year (Approved OD)', id: '212624205001' }
  ];

  return (
    <header className="top-header">
      <div className="header-left">
        {onOpenMobileDrawer && (
          <button
            onClick={onOpenMobileDrawer}
            className="mobile-hamburger-btn"
            aria-label="Open mobile navigation menu"
          >
            <Menu size={20} />
          </button>
        )}
        <div className="header-brand-container">
          <div className="header-logo-badge">
            SMIT
          </div>
          <div className="header-brand-text">
            <div className="header-title-full">
              Sri Muthukumaran Institute of Technology
            </div>
            <div className="header-title-short">
              SMIT Attendance
            </div>
            <div className="header-subtitle-desktop">
              <span>Department of IT</span>
              <span>•</span>
              <span style={{ fontWeight: 600, color: '#1e3a8a' }}>AY 2026–2027</span>
            </div>
          </div>
        </div>
      </div>

      <div className="header-right">
        {/* Vercel Cloud Storage & Auto-Sync Status Badge */}
        <button
          onClick={triggerSync}
          disabled={isSyncing}
          className="btn btn-sm auto-sync-badge"
          title={`Cloud Storage: ${storageInfo?.provider || 'Vercel Blob Storage'}. Auto-syncs every 30s. Click to sync now. Next in ${countdown}s.`}
        >
          <span
            className="sync-pulse-dot"
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: isSyncing ? '#3b82f6' : '#22c55e',
              display: 'inline-block',
              animation: isSyncing ? 'pulseGlow 1s infinite' : 'none'
            }}
          />
          <RefreshCw
            size={13}
            style={{
              animation: isSyncing ? 'spin 1s linear infinite' : 'none'
            }}
          />
          <span className="auto-sync-text">
            {isSyncing ? 'Syncing...' : `Sync ${countdown}s`}
          </span>
        </button>

        {/* Fast Role / Demo User Switcher Button */}
        <div className="header-role-switcher-wrap" style={{ position: 'relative' }} ref={switcherRef}>
          <button
            onClick={() => setSwitcherOpen(!switcherOpen)}
            className="btn btn-outline btn-sm role-switcher-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: '#f8fafc',
              borderColor: '#cbd5e1',
              color: '#1e3a8a',
              fontWeight: 600
            }}
            title="Switch demo user account instantly"
          >
            <ArrowRightLeft size={13} />
            <span className="role-switcher-label">Role Switcher</span>
          </button>

          {switcherOpen && (
            <div
              style={{
                position: 'absolute',
                top: '110%',
                right: 0,
                width: 'min(300px, calc(100vw - 24px))',
                background: '#fff',
                borderRadius: 12,
                boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                border: '1px solid #e2e8f0',
                padding: '12px',
                zIndex: 60
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>
                Quick Test Switcher
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {demoAccounts.map(acc => {
                  const isCurrent = user?.username === acc.id || user?.registerNumber === acc.id;
                  return (
                    <button
                      key={acc.id}
                      onClick={() => handleQuickSwitch(acc.id, acc.name, acc.role)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 10px',
                        borderRadius: 6,
                        border: isCurrent ? '1px solid #2563eb' : '1px solid transparent',
                        background: isCurrent ? '#eff6ff' : 'transparent',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'background 150ms'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.825rem', fontWeight: 600, color: '#0f172a' }}>
                          {acc.name}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                          {acc.title} ({acc.role.toUpperCase()})
                        </div>
                      </div>
                      {isCurrent && <Check size={14} color="#2563eb" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Notifications Bell */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button
            onClick={handleOpenNotif}
            className="btn-icon header-notif-btn"
            style={{ position: 'relative' }}
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: 3,
                  right: 3,
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#ef4444',
                  border: '1.5px solid #fff'
                }}
              />
            )}
          </button>

          {notifOpen && (
            <div
              style={{
                position: 'absolute',
                top: '110%',
                right: 0,
                width: 'min(340px, calc(100vw - 24px))',
                background: '#fff',
                borderRadius: 12,
                boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                border: '1px solid #e2e8f0',
                overflow: 'hidden',
                zIndex: 60
              }}
            >
              <div
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#f8fafc'
                }}
              >
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                  Notifications {unreadCount > 0 && `(${unreadCount} unread)`}
                </span>
                <button
                  onClick={() => {
                    setNotifOpen(false);
                    onNavigate('notifications');
                  }}
                  style={{
                    fontSize: '0.75rem',
                    color: '#2563eb',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  View All
                </button>
              </div>

              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                {recentNotifs.length === 0 ? (
                  <div style={{ padding: 24, textAlign: 'center', color: '#64748b', fontSize: '0.8rem' }}>
                    No recent notifications.
                  </div>
                ) : (
                  recentNotifs.map(n => (
                    <div
                      key={n.id}
                      onClick={() => {
                        setNotifOpen(false);
                        if (n.link_url) onNavigate(n.link_url.replace(/^\//, ''));
                      }}
                      style={{
                        padding: '10px 14px',
                        borderBottom: '1px solid #f1f5f9',
                        cursor: 'pointer',
                        background: n.is_read ? '#fff' : '#f8fafc'
                      }}
                    >
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0f172a' }}>{n.title}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>{n.message}</div>
                      <div style={{ fontSize: '0.6875rem', color: '#94a3b8', marginTop: 4 }}>{n.created_at}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Pill / Profile Dropdown */}
        <div style={{ position: 'relative' }} ref={profileRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="header-profile-btn"
            aria-label="User menu"
          >
            <div
              className="header-profile-avatar"
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: user?.role === 'hod' ? '#1e3a8a' : (user?.role === 'faculty' ? '#047857' : '#2563eb'),
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 700
              }}
            >
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div className="header-user-text" style={{ textAlign: 'left', display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0f172a', lineHeight: 1.1 }}>
                {user?.fullName?.split(' ')[0]}
              </span>
              <span
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  color: user?.role === 'hod' ? '#1e3a8a' : (user?.role === 'faculty' ? '#047857' : '#2563eb')
                }}
              >
                {user?.role}
              </span>
            </div>
          </button>

          {profileOpen && (
            <div
              style={{
                position: 'absolute',
                top: '110%',
                right: 0,
                width: 'min(240px, calc(100vw - 24px))',
                background: '#fff',
                borderRadius: 12,
                boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                border: '1px solid #e2e8f0',
                padding: '8px',
                zIndex: 60
              }}
            >
              <div style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: '0.825rem', fontWeight: 700, color: '#0f172a' }}>{user?.fullName}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  {user?.role === 'student' ? user?.registerNumber : user?.email}
                </div>
              </div>

              {/* Mobile-only quick demo switcher inside profile dropdown */}
              <div className="mobile-only-quick-switch" style={{ padding: '6px 4px', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4, paddingLeft: 6 }}>
                  Switch Demo Account
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {demoAccounts.map(acc => {
                    const isCurrent = user?.username === acc.id || user?.registerNumber === acc.id;
                    return (
                      <button
                        key={acc.id}
                        onClick={() => {
                          setProfileOpen(false);
                          handleQuickSwitch(acc.id, acc.name, acc.role);
                        }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 8px',
                          borderRadius: 6,
                          border: isCurrent ? '1px solid #2563eb' : '1px solid transparent',
                          background: isCurrent ? '#eff6ff' : 'transparent',
                          textAlign: 'left',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          color: isCurrent ? '#1d4ed8' : '#334155'
                        }}
                      >
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <span style={{ fontWeight: 600 }}>{acc.name}</span>
                          <span style={{ color: '#64748b', marginLeft: 4, fontSize: '0.7rem' }}>({acc.role})</span>
                        </div>
                        {isCurrent && <Check size={12} color="#2563eb" style={{ flexShrink: 0 }} />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 4 }}>
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    onNavigate('profile');
                  }}
                  className="nav-link"
                  style={{ color: '#334155' }}
                >
                  <User size={15} />
                  <span>View Profile</span>
                </button>
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    logout();
                  }}
                  className="nav-link"
                  style={{ color: '#ef4444' }}
                >
                  <LogOut size={15} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
