import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { Sliders, Save, ShieldAlert, CheckCircle2, RotateCcw } from 'lucide-react';

export const HodSettings: React.FC = () => {
  const { showToast } = useToast();
  const [settings, setSettings] = useState<any>({
    min_attendance_pct: 75.0,
    warning_threshold_pct: 85.0,
    od_treatment: 'attended',
    permission_treatment: 'attended',
    leave_treatment: 'excluded',
    faculty_edit_window_hours: 24,
    allowed_evidence_formats: 'PDF,JPG,JPEG,PNG',
    max_upload_size_mb: 5,
    active_academic_year: '2026-2027',
    active_semester: 'Odd'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem('smit_token');
        const res = await fetch('/api/settings', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setSettings(data.settings);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem('smit_token');
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update settings');

      showToast(data.message, 'success');
      setSettings(data.settings);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-wrapper">
        <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>Loading department policies...</div>
      </div>
    );
  }

  return (
    <div className="page-wrapper" style={{ maxWidth: 840 }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0 }}>Department Attendance Rules & Policies</h1>
        <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: 4 }}>
          Department of Information Technology • Academic regulation parameters and request rules
        </p>
      </div>

      <form onSubmit={handleSave}>
        {/* Attendance Thresholds */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <h3 style={{ margin: 0 }}>Attendance Calculation Engine Rules</h3>
          </div>

          <div className="card-body" style={{ padding: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 18 }}>
              <div className="form-group">
                <label className="form-label required">Minimum Attendance Threshold (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="50"
                  max="100"
                  className="form-control"
                  value={settings.min_attendance_pct}
                  onChange={e => setSettings({ ...settings, min_attendance_pct: parseFloat(e.target.value) })}
                  required
                />
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Students below this percentage are classified as <strong>Critical</strong> (&lt;75%).
                </span>
              </div>

              <div className="form-group">
                <label className="form-label required">Warning Threshold (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="60"
                  max="100"
                  className="form-control"
                  value={settings.warning_threshold_pct}
                  onChange={e => setSettings({ ...settings, warning_threshold_pct: parseFloat(e.target.value) })}
                  required
                />
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Students below this are classified as <strong>Warning</strong> (75–84.99%).
                </span>
              </div>

              <div className="form-group">
                <label className="form-label required">Faculty Edit Window (Hours)</label>
                <input
                  type="number"
                  min="1"
                  max="168"
                  className="form-control"
                  value={settings.faculty_edit_window_hours}
                  onChange={e => setSettings({ ...settings, faculty_edit_window_hours: parseInt(e.target.value, 10) })}
                  required
                />
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Allowed time window for faculty to revise attendance before lock.
                </span>
              </div>
            </div>

            <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #f1f5f9' }}>
              <h4 style={{ fontSize: '0.9rem', marginBottom: 12 }}>Status Accounting Treatment</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label required">Approved OD Treatment</label>
                  <select
                    className="form-control form-select"
                    value={settings.od_treatment}
                    onChange={e => setSettings({ ...settings, od_treatment: e.target.value })}
                  >
                    <option value="attended">Attended (Counts as Present)</option>
                    <option value="excluded">Excluded (Does not affect %)</option>
                    <option value="not_attended">Not Attended (Marked absent)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label required">Approved Permission Treatment</label>
                  <select
                    className="form-control form-select"
                    value={settings.permission_treatment}
                    onChange={e => setSettings({ ...settings, permission_treatment: e.target.value })}
                  >
                    <option value="attended">Attended (Counts as Present)</option>
                    <option value="excluded">Excluded (Does not affect %)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label required">Approved Leave Treatment</label>
                  <select
                    className="form-control form-select"
                    value={settings.leave_treatment}
                    onChange={e => setSettings({ ...settings, leave_treatment: e.target.value })}
                  >
                    <option value="excluded">Excluded from Applicable Hours</option>
                    <option value="not_attended">Counted in Total (Not Attended)</option>
                    <option value="attended">Attended</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Request Evidence & Academic Config */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <h3 style={{ margin: 0 }}>Request Uploads & Academic Session</h3>
          </div>

          <div className="card-body" style={{ padding: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 18 }}>
              <div className="form-group">
                <label className="form-label required">Allowed Evidence Formats</label>
                <input
                  type="text"
                  className="form-control"
                  value={settings.allowed_evidence_formats}
                  onChange={e => setSettings({ ...settings, allowed_evidence_formats: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label required">Maximum Upload Size (MB)</label>
                <input
                  type="number"
                  min="1"
                  max="25"
                  className="form-control"
                  value={settings.max_upload_size_mb}
                  onChange={e => setSettings({ ...settings, max_upload_size_mb: parseInt(e.target.value, 10) })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label required">Active Academic Year</label>
                <input
                  type="text"
                  className="form-control"
                  value={settings.active_academic_year}
                  onChange={e => setSettings({ ...settings, active_academic_year: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label required">Active Semester</label>
                <select
                  className="form-control form-select"
                  value={settings.active_semester}
                  onChange={e => setSettings({ ...settings, active_semester: e.target.value })}
                >
                  <option value="Odd">Odd Semester (3rd, 5th, 7th)</option>
                  <option value="Even">Even Semester (4th, 6th, 8th)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="card-footer" style={{ justifyContent: 'flex-end', padding: '14px 24px' }}>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary"
              style={{ padding: '9px 24px' }}
            >
              <Save size={16} />
              <span>{saving ? 'Saving Policies...' : 'Save Department Policies'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
