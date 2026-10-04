import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { Network, Plus, CheckCircle2, User, BookOpen } from 'lucide-react';

export const HodAssignments: React.FC = () => {
  const { showToast } = useToast();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [facultyList, setFacultyList] = useState<any[]>([]);
  const [subjectsList, setSubjectsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [selectedBatchId, setSelectedBatchId] = useState(1);
  const [selectedSubjectId, setSelectedSubjectId] = useState(1);
  const [selectedFacultyId, setSelectedFacultyId] = useState(1);
  const [saving, setSaving] = useState(false);

  const batches = [
    { id: 1, name: '2nd Year (3rd Sem) — Batch 2025-2029', year: 2 },
    { id: 2, name: '3rd Year (5th Sem) — Batch 2024-2028', year: 3 },
    { id: 3, name: '4th Year (7th Sem) — Batch 2023-2027', year: 4 }
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('smit_token');
      const [assignRes, facRes, subRes] = await Promise.all([
        fetch('/api/subjects/assignments', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/faculty', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/subjects', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (assignRes.ok) {
        const d = await assignRes.json();
        setAssignments(d.assignments);
      }
      if (facRes.ok) {
        const fd = await facRes.json();
        setFacultyList(fd.faculty);
        if (fd.faculty.length > 0) setSelectedFacultyId(fd.faculty[0].id);
      }
      if (subRes.ok) {
        const sd = await subRes.json();
        setSubjectsList(sd.subjects);
        if (sd.subjects.length > 0) setSelectedSubjectId(sd.subjects[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem('smit_token');
      const res = await fetch('/api/subjects/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          batch_id: selectedBatchId,
          subject_id: selectedSubjectId,
          faculty_id: selectedFacultyId
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to assign faculty.');

      showToast(data.message, 'success');
      fetchData();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Filter subjects for the selected batch year level
  const chosenBatch = batches.find(b => b.id === selectedBatchId);
  const relevantSubjects = subjectsList.filter(s => s.year_level === chosenBatch?.year);

  return (
    <div className="page-wrapper">
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0 }}>Faculty-Subject Assignment Matrix</h1>
        <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: 4 }}>
          Allocate faculty members to theory lectures and lab practicals across year batches
        </p>
      </div>

      {/* Assignment Form Card */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <h3 style={{ margin: 0 }}>New Teaching Assignment</h3>
        </div>

        <form onSubmit={handleAssign} style={{ padding: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, alignItems: 'flex-end' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label required">1. Target Class & Batch</label>
              <select
                className="form-control form-select"
                value={selectedBatchId}
                onChange={e => {
                  const bId = parseInt(e.target.value, 10);
                  setSelectedBatchId(bId);
                  const b = batches.find(item => item.id === bId);
                  const rel = subjectsList.filter(s => s.year_level === b?.year);
                  if (rel.length > 0) setSelectedSubjectId(rel[0].id);
                }}
              >
                {batches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label required">2. Subject</label>
              <select
                className="form-control form-select"
                value={selectedSubjectId}
                onChange={e => setSelectedSubjectId(parseInt(e.target.value, 10))}
              >
                {relevantSubjects.map(s => (
                  <option key={s.id} value={s.id}>{s.code} - {s.name} ({s.type.toUpperCase()})</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label required">3. Assign Faculty Member</label>
              <select
                className="form-control form-select"
                value={selectedFacultyId}
                onChange={e => setSelectedFacultyId(parseInt(e.target.value, 10))}
              >
                {facultyList.map(f => (
                  <option key={f.id} value={f.id}>{f.full_name} ({f.designation})</option>
                ))}
              </select>
            </div>

            <div>
              <button
                type="submit"
                disabled={saving}
                className="btn btn-primary"
                style={{ width: '100%', padding: '9px 16px' }}
              >
                <Plus size={16} />
                <span>{saving ? 'Assigning...' : 'Assign Faculty'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Existing Allocations Table */}
      <div className="card">
        <div className="card-header">
          <h3 style={{ margin: 0 }}>Active Department Allocations ({assignments.length})</h3>
        </div>

        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>Loading assignments...</div>
        ) : (
          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Class / Batch</th>
                  <th>Subject Code & Name</th>
                  <th>Type</th>
                  <th>Assigned Faculty</th>
                  <th>Designation</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map(a => (
                  <tr key={a.id}>
                    <td>
                      <strong style={{ color: '#0f172a' }}>{a.batch_name}</strong>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {a.year_level}nd/rd/th Year (Sem {a.semester})
                      </div>
                    </td>
                    <td>
                      <strong style={{ color: '#1e3a8a', fontFamily: 'monospace' }}>{a.subject_code}</strong>
                      <div style={{ fontSize: '0.8rem', color: '#334155' }}>{a.subject_name}</div>
                    </td>
                    <td>
                      <span className="badge" style={{ background: '#f8fafc', color: '#334155' }}>
                        {a.subject_type?.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: '#0f172a' }}>{a.faculty_name}</strong>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{a.faculty_code}</div>
                    </td>
                    <td style={{ fontSize: '0.825rem', color: '#475569' }}>{a.designation}</td>
                    <td>
                      <span className="badge badge-approved" style={{ fontSize: '0.7rem' }}>
                        Active Allocated
                      </span>
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
