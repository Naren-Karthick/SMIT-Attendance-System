import React, { useState, useEffect } from 'react';
import { StatusBadge } from '../../components/common/StatusBadge';
import { EmptyState } from '../../components/common/EmptyState';
import { ShieldCheck, Search, Filter, Clock, User, FileText } from 'lucide-react';

export const HodAuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [search, setSearch] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('smit_token');
      let url = '/api/audit?limit=60';
      if (actionFilter) url += `&action=${actionFilter}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, search]);

  const actions = [
    'USER_LOGIN',
    'ATTENDANCE_SUBMITTED',
    'ATTENDANCE_MODIFIED',
    'ATTENDANCE_CORRECTION',
    'OD_SUBMISSION',
    'OD_APPROVAL',
    'OD_REJECTION',
    'LEAVE_SUBMISSION',
    'LEAVE_APPROVAL',
    'POLICY_CONFIG_UPDATED',
    'TIMETABLE_ENTRY_UPDATED'
  ];

  return (
    <div className="page-wrapper">
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0 }}>Immutable Department Audit Trail</h1>
        <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: 4 }}>
          Tamper-evident system log capturing all attendance submissions, corrections, approvals, and administrative events
        </p>
      </div>

      {/* Filter Bar */}
      <div
        className="card"
        style={{
          padding: '14px 20px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12
        }}
      >
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <select
            className="form-control form-select"
            style={{ width: 220, padding: '6px 28px 6px 10px', fontSize: '0.825rem' }}
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
          >
            <option value="">All Audit Actions</option>
            {actions.map(a => (
              <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>
            ))}
          </select>

          {actionFilter && (
            <button onClick={() => setActionFilter('')} className="btn btn-outline btn-sm">
              Reset
            </button>
          )}
        </div>

        <div style={{ position: 'relative', width: 260 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            className="form-control"
            style={{ paddingLeft: 30, padding: '6px 12px 6px 30px', fontSize: '0.825rem' }}
            placeholder="Search user, entity, reason..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="card">
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>Loading audit records...</div>
        ) : logs.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="No Audit Records Found"
            description="No actions recorded under current filters."
          />
        ) : (
          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User & Role</th>
                  <th>Action</th>
                  <th>Entity & ID</th>
                  <th>Previous State</th>
                  <th>New State</th>
                  <th>Reason / Justification</th>
                  <th>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id}>
                    <td style={{ fontSize: '0.785rem', color: '#0f172a', whiteSpace: 'nowrap' }}>
                      {log.created_at}
                    </td>
                    <td>
                      <strong style={{ fontSize: '0.85rem', color: '#0f172a' }}>{log.user_name}</strong>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>
                        {log.role}
                      </div>
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          background: log.action.includes('CORRECTION') ? '#fef2f2' : (log.action.includes('APPROVAL') ? '#ecfdf5' : '#eff6ff'),
                          color: log.action.includes('CORRECTION') ? '#dc2626' : (log.action.includes('APPROVAL') ? '#059669' : '#1e3a8a')
                        }}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{log.entity}</div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', fontFamily: 'monospace' }}>
                        {log.entity_id || '—'}
                      </div>
                    </td>
                    <td style={{ fontSize: '0.785rem', color: '#64748b' }}>
                      {log.previous_value || '—'}
                    </td>
                    <td style={{ fontSize: '0.785rem', fontWeight: 600, color: '#0f172a' }}>
                      {log.new_value || '—'}
                    </td>
                    <td style={{ fontSize: '0.785rem', color: '#334155', maxWidth: 220 }}>
                      {log.reason || 'Standard system action'}
                    </td>
                    <td style={{ fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                      {log.ip_address}
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
