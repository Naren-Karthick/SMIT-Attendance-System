import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { EmptyState } from '../../components/common/EmptyState';
import { Bell, CheckCheck, Check, Clock, Calendar, FileText } from 'lucide-react';

interface NotificationsPageProps {
  onNavigate: (page: string) => void;
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({ onNavigate }) => {
  const { user, refreshMe } = useAuth();
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetchNotifs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('smit_token');
      const res = await fetch(`/api/notifications?filter=${filter}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, [filter]);

  const handleMarkAsRead = async (id: number) => {
    try {
      const token = localStorage.getItem('smit_token');
      await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
      refreshMe();
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const token = localStorage.getItem('smit_token');
      await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      showToast('All notifications marked as read.', 'success');
      fetchNotifs();
      refreshMe();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="page-wrapper" style={{ maxWidth: 840 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0 }}>Notification Center</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: 4 }}>
            System updates, attendance warnings, and request approval alerts
          </p>
        </div>

        <button onClick={handleMarkAllRead} className="btn btn-outline btn-sm">
          <CheckCheck size={14} />
          <span>Mark All Read</span>
        </button>
      </div>

      {/* Tabs / Filter strip */}
      <div
        className="card"
        style={{
          padding: '10px 16px',
          marginBottom: 16,
          display: 'flex',
          gap: 8,
          overflowX: 'auto'
        }}
      >
        {['all', 'unread', 'request', 'attendance', 'system'].map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className="btn btn-sm"
            style={{
              background: filter === tab ? '#1e3a8a' : '#f1f5f9',
              color: filter === tab ? '#fff' : '#475569',
              borderColor: filter === tab ? '#1e3a8a' : '#cbd5e1',
              fontWeight: 600,
              textTransform: 'capitalize'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="card">
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>Loading alerts...</div>
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="All Caught Up"
            description="You have no notifications under this category."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {notifications.map(notif => (
              <div
                key={notif.id}
                style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid #f1f5f9',
                  background: notif.is_read === 1 ? '#ffffff' : '#f8fafc',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 16
                }}
              >
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 999,
                      background: notif.type === 'attendance' ? '#eff6ff' : (notif.type === 'request' ? '#f0fdf4' : '#faf5ff'),
                      color: notif.type === 'attendance' ? '#2563eb' : (notif.type === 'request' ? '#059669' : '#9333ea'),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <Bell size={16} />
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>{notif.title}</strong>
                      {notif.is_read === 0 && (
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563eb' }} />
                      )}
                    </div>
                    <div style={{ fontSize: '0.825rem', color: '#475569', marginTop: 3 }}>
                      {notif.message}
                    </div>
                    <div style={{ fontSize: '0.725rem', color: '#94a3b8', marginTop: 4 }}>
                      {notif.created_at}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                  {notif.link_url && (
                    <button
                      onClick={() => onNavigate(notif.link_url.replace(/^\//, ''))}
                      className="btn btn-outline btn-sm"
                      style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                    >
                      View
                    </button>
                  )}
                  {notif.is_read === 0 && (
                    <button
                      onClick={() => handleMarkAsRead(notif.id)}
                      className="btn-icon"
                      title="Mark as read"
                    >
                      <Check size={14} color="#64748b" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
