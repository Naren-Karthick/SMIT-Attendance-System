import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../../components/common/Modal';
import { BookOpen, Plus, Edit, Users, Award, Clock } from 'lucide-react';

export const HodSubjects: React.FC = () => {
  const { showToast } = useToast();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [yearFilter, setYearFilter] = useState('');

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newSubject, setNewSubject] = useState({
    code: '',
    name: '',
    type: 'theory',
    credits: 3,
    weekly_hours: 4,
    year_level: 2,
    semester: 3
  });

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<any | null>(null);

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('smit_token');
      let url = '/api/subjects';
      if (yearFilter) url += `?year_level=${yearFilter}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSubjects(data.subjects);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, [yearFilter]);

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('smit_token');
      const res = await fetch('/api/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newSubject)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add subject');

      showToast(data.message, 'success');
      setAddModalOpen(false);
      fetchSubjects();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleUpdateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubject) return;
    try {
      const token = localStorage.getItem('smit_token');
      const res = await fetch(`/api/subjects/${editingSubject.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: editingSubject.name,
          type: editingSubject.type,
          credits: editingSubject.credits,
          weekly_hours: editingSubject.weekly_hours
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update subject');

      showToast('Subject updated successfully.', 'success');
      setEditModalOpen(false);
      fetchSubjects();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0 }}>Curriculum & Subject Management</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: 4 }}>
            Department of Information Technology • Anna University R2021 Curriculum
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <select
            className="form-control form-select"
            style={{ width: 160, padding: '6px 28px 6px 10px', fontSize: '0.825rem' }}
            value={yearFilter}
            onChange={e => setYearFilter(e.target.value)}
          >
            <option value="">All Years</option>
            <option value="2">2nd Year (3rd Sem)</option>
            <option value="3">3rd Year (5th Sem)</option>
            <option value="4">4th Year (7th Sem)</option>
          </select>

          <button onClick={() => setAddModalOpen(true)} className="btn btn-primary">
            <Plus size={16} />
            <span>Add New Subject</span>
          </button>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>Loading subjects...</div>
        ) : (
          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Subject Code</th>
                  <th>Subject Name</th>
                  <th>Type</th>
                  <th>Year & Semester</th>
                  <th>Credits</th>
                  <th>Weekly Hours</th>
                  <th>Assigned Faculty</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map(s => (
                  <tr key={s.id}>
                    <td>
                      <strong style={{ color: '#1e3a8a', fontFamily: 'monospace', fontSize: '0.9rem' }}>
                        {s.code}
                      </strong>
                    </td>
                    <td style={{ fontWeight: 600 }}>{s.name}</td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          background: s.type === 'lab' ? '#faf5ff' : '#eff6ff',
                          color: s.type === 'lab' ? '#7e22ce' : '#1d4ed8'
                        }}
                      >
                        {s.type.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <span className="badge" style={{ background: '#f8fafc', color: '#334155' }}>
                        {s.year_level}nd/rd/th Year (Sem {s.semester})
                      </span>
                    </td>
                    <td>
                      <strong>{s.credits}</strong> credits
                    </td>
                    <td>{s.weekly_hours} hrs/week</td>
                    <td>
                      {s.assignments?.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {s.assignments.map((a: any, i: number) => (
                            <span key={i} style={{ fontSize: '0.8rem', color: '#0f172a', fontWeight: 500 }}>
                              {a.faculty_name} ({a.batch_name?.split(' ')[0]})
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>Unassigned</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => {
                          setEditingSubject(s);
                          setEditModalOpen(true);
                        }}
                        className="btn btn-outline btn-sm"
                      >
                        <Edit size={13} />
                        <span>Edit</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Subject Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add Curriculum Subject"
      >
        <form onSubmit={handleCreateSubject}>
          <div className="form-group">
            <label className="form-label required">Subject Code</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. CS25C05"
              value={newSubject.code}
              onChange={e => setNewSubject({ ...newSubject, code: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label required">Subject Name</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Operating Systems"
              value={newSubject.name}
              onChange={e => setNewSubject({ ...newSubject, name: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label required">Type</label>
              <select
                className="form-control form-select"
                value={newSubject.type}
                onChange={e => setNewSubject({ ...newSubject, type: e.target.value })}
              >
                <option value="theory">Theory</option>
                <option value="lab">Laboratory</option>
                <option value="elective">Professional Elective</option>
              </select>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label required">Year Level</label>
              <select
                className="form-control form-select"
                value={newSubject.year_level}
                onChange={e => {
                  const y = parseInt(e.target.value, 10);
                  setNewSubject({
                    ...newSubject,
                    year_level: y,
                    semester: y === 2 ? 3 : (y === 3 ? 5 : 7)
                  });
                }}
              >
                <option value={2}>2nd Year (Sem 3)</option>
                <option value={3}>3rd Year (Sem 5)</option>
                <option value={4}>4th Year (Sem 7)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label required">Credits</label>
              <input
                type="number"
                className="form-control"
                min={1}
                max={10}
                value={newSubject.credits}
                onChange={e => setNewSubject({ ...newSubject, credits: parseInt(e.target.value, 10) || 3 })}
                required
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label required">Weekly Hours</label>
              <input
                type="number"
                className="form-control"
                min={1}
                max={10}
                value={newSubject.weekly_hours}
                onChange={e => setNewSubject({ ...newSubject, weekly_hours: parseInt(e.target.value, 10) || 4 })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" onClick={() => setAddModalOpen(false)} className="btn btn-outline">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Add Subject
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Subject Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Subject"
        subtitle={editingSubject?.code}
      >
        {editingSubject && (
          <form onSubmit={handleUpdateSubject}>
            <div className="form-group">
              <label className="form-label required">Subject Name</label>
              <input
                type="text"
                className="form-control"
                value={editingSubject.name}
                onChange={e => setEditingSubject({ ...editingSubject, name: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label required">Type</label>
                <select
                  className="form-control form-select"
                  value={editingSubject.type}
                  onChange={e => setEditingSubject({ ...editingSubject, type: e.target.value })}
                >
                  <option value="theory">Theory</option>
                  <option value="lab">Laboratory</option>
                  <option value="elective">Elective</option>
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label required">Credits</label>
                <input
                  type="number"
                  className="form-control"
                  min={1}
                  max={10}
                  value={editingSubject.credits}
                  onChange={e => setEditingSubject({ ...editingSubject, credits: parseInt(e.target.value, 10) || 3 })}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button type="button" onClick={() => setEditModalOpen(false)} className="btn btn-outline">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Save Subject
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
