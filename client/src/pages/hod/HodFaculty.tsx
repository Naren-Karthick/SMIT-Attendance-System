import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../../components/common/Modal';
import { Users, Plus, Edit, BookOpen, Clock, Mail, Phone, MapPin } from 'lucide-react';

export const HodFaculty: React.FC = () => {
  const { showToast } = useToast();
  const [faculty, setFaculty] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Faculty Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newFaculty, setNewFaculty] = useState({
    faculty_id: '',
    full_name: '',
    designation: 'Assistant Professor',
    email: '',
    phone: '',
    room_no: 'IT-Staff-06'
  });

  // Edit Faculty Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<any | null>(null);

  const fetchFaculty = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('smit_token');
      const res = await fetch('/api/faculty', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFaculty(data.faculty);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaculty();
  }, []);

  const handleCreateFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('smit_token');
      const res = await fetch('/api/faculty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newFaculty)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create faculty');

      showToast(data.message, 'success');
      setAddModalOpen(false);
      fetchFaculty();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleUpdateFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFaculty) return;
    try {
      const token = localStorage.getItem('smit_token');
      const res = await fetch(`/api/faculty/${editingFaculty.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          full_name: editingFaculty.full_name,
          designation: editingFaculty.designation,
          email: editingFaculty.email,
          phone: editingFaculty.phone,
          room_no: editingFaculty.room_no
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update faculty');

      showToast('Faculty updated successfully.', 'success');
      setEditModalOpen(false);
      fetchFaculty();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0 }}>Faculty Management</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: 4 }}>
            Department of Information Technology • Workload allocations & teaching assignments
          </p>
        </div>

        <button onClick={() => setAddModalOpen(true)} className="btn btn-primary">
          <Plus size={16} />
          <span>Add Faculty Member</span>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
        {faculty.map(f => (
          <div key={f.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="card-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1e3a8a', fontFamily: 'monospace' }}>
                    {f.faculty_id}
                  </span>
                  {f.is_hod === 1 && (
                    <span className="badge" style={{ background: '#1e3a8a', color: '#fff', fontSize: '0.6875rem' }}>
                      HOD / Head
                    </span>
                  )}
                </div>
                <h3 style={{ margin: '2px 0 0', fontSize: '1.05rem', color: '#0f172a' }}>{f.full_name}</h3>
                <div style={{ fontSize: '0.785rem', color: '#64748b' }}>{f.designation}</div>
              </div>

              <button
                onClick={() => {
                  setEditingFaculty(f);
                  setEditModalOpen(true);
                }}
                className="btn-icon"
                title="Edit faculty"
              >
                <Edit size={16} />
              </button>
            </div>

            <div className="card-body" style={{ flex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.8rem', color: '#475569', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Mail size={14} color="#94a3b8" />
                  <span>{f.email}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Phone size={14} color="#94a3b8" />
                  <span>{f.phone || '—'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MapPin size={14} color="#94a3b8" />
                  <span>Cabin: {f.room_no || 'IT Department'}</span>
                </div>
              </div>

              <div style={{ padding: 10, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 12 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>
                  Assigned Subjects ({f.assignedSubjects?.length || 0})
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {f.assignedSubjects?.length > 0 ? (
                    f.assignedSubjects.map((s: any, idx: number) => (
                      <span key={idx} className="badge" style={{ background: '#eff6ff', color: '#1d4ed8', fontSize: '0.7rem' }}>
                        {s.code} ({s.batch_name?.split(' ')[0]})
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>No courses assigned</span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b' }}>
                <span>Weekly Periods: <strong>{f.weekly_periods_count || 0} hrs</strong></span>
                <span>Sessions Taken: <strong>{f.total_sessions_taken || 0}</strong></span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Faculty Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add Faculty Member"
      >
        <form onSubmit={handleCreateFaculty}>
          <div className="form-group">
            <label className="form-label required">Faculty ID</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. SMIT-IT-006"
              value={newFaculty.faculty_id}
              onChange={e => setNewFaculty({ ...newFaculty, faculty_id: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label required">Full Name</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Dr. K. Ramanathan"
              value={newFaculty.full_name}
              onChange={e => setNewFaculty({ ...newFaculty, full_name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label required">Designation</label>
            <select
              className="form-control form-select"
              value={newFaculty.designation}
              onChange={e => setNewFaculty({ ...newFaculty, designation: e.target.value })}
            >
              <option value="Professor">Professor</option>
              <option value="Associate Professor">Associate Professor</option>
              <option value="Assistant Professor (Sr. Gr)">Assistant Professor (Sr. Gr)</option>
              <option value="Assistant Professor">Assistant Professor</option>
              <option value="Visiting Professor">Visiting Professor</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label required">Email Address</label>
            <input
              type="email"
              className="form-control"
              placeholder="e.g. ramanathan.k@smit.edu.in"
              value={newFaculty.email}
              onChange={e => setNewFaculty({ ...newFaculty, email: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Phone</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. 9840123456"
                value={newFaculty.phone}
                onChange={e => setNewFaculty({ ...newFaculty, phone: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Cabin / Room</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. IT-Staff-06"
                value={newFaculty.room_no}
                onChange={e => setNewFaculty({ ...newFaculty, room_no: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
            <button type="button" onClick={() => setAddModalOpen(false)} className="btn btn-outline">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Add Faculty
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Faculty Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Faculty Details"
        subtitle={editingFaculty?.faculty_id}
      >
        {editingFaculty && (
          <form onSubmit={handleUpdateFaculty}>
            <div className="form-group">
              <label className="form-label required">Full Name</label>
              <input
                type="text"
                className="form-control"
                value={editingFaculty.full_name}
                onChange={e => setEditingFaculty({ ...editingFaculty, full_name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label required">Designation</label>
              <select
                className="form-control form-select"
                value={editingFaculty.designation}
                onChange={e => setEditingFaculty({ ...editingFaculty, designation: e.target.value })}
              >
                <option value="Professor">Professor</option>
                <option value="Associate Professor">Associate Professor</option>
                <option value="Assistant Professor (Sr. Gr)">Assistant Professor (Sr. Gr)</option>
                <option value="Assistant Professor">Assistant Professor</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label required">Email</label>
              <input
                type="email"
                className="form-control"
                value={editingFaculty.email}
                onChange={e => setEditingFaculty({ ...editingFaculty, email: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button type="button" onClick={() => setEditModalOpen(false)} className="btn btn-outline">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Save Changes
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
