import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../../components/common/Modal';
import { CalendarDays, Plus, Edit, Clock, MapPin, BookOpen, Trash2 } from 'lucide-react';

export const HodTimetable: React.FC = () => {
  const { showToast } = useToast();
  const [selectedBatchId, setSelectedBatchId] = useState(1);
  const [timetableData, setTimetableData] = useState<any>(null);
  const [facultyList, setFacultyList] = useState<any[]>([]);
  const [subjectsList, setSubjectsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit / Add Slot Modal
  const [slotModalOpen, setSlotModalOpen] = useState(false);
  const [slotForm, setSlotForm] = useState({
    day_of_week: 'Monday',
    period_number: 1,
    subject_id: 1,
    faculty_id: 1,
    room: 'Room-302'
  });

  const batches = [
    { id: 1, name: '2nd Year IT (3rd Sem) — Batch 2025-2029', year: 2 },
    { id: 2, name: '3rd Year IT (5th Sem) — Batch 2024-2028', year: 3 },
    { id: 3, name: '4th Year IT (7th Sem) — Batch 2023-2027', year: 4 }
  ];

  const fetchTimetable = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('smit_token');
      const [tRes, fRes, sRes] = await Promise.all([
        fetch(`/api/timetables?batch_id=${selectedBatchId}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/faculty', { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/subjects?year_level=${batches.find(b => b.id === selectedBatchId)?.year}`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (tRes.ok) setTimetableData(await tRes.json());
      if (fRes.ok) {
        const fd = await fRes.json();
        setFacultyList(fd.faculty);
      }
      if (sRes.ok) {
        const sd = await sRes.json();
        setSubjectsList(sd.subjects);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimetable();
  }, [selectedBatchId]);

  const handleSaveSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('smit_token');
      const res = await fetch('/api/timetables/entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          batch_id: selectedBatchId,
          ...slotForm
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to configure timetable slot.');

      showToast(data.message, 'success');
      setSlotModalOpen(false);
      fetchTimetable();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleOpenEdit = (day: string, period: number, currentEntry?: any) => {
    setSlotForm({
      day_of_week: day,
      period_number: period,
      subject_id: currentEntry?.subject_id || (subjectsList[0]?.id || 1),
      faculty_id: currentEntry?.faculty_id || (facultyList[0]?.id || 1),
      room: currentEntry?.room || 'Room-302'
    });
    setSlotModalOpen(true);
  };

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0 }}>Master Department Timetable</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: 4 }}>
            Visual weekly schedule grid • Manage period slots, faculty assignments, and lab rooms
          </p>
        </div>

        {/* Year Batch Selector */}
        <div style={{ display: 'flex', gap: 8 }}>
          {batches.map(b => (
            <button
              key={b.id}
              onClick={() => setSelectedBatchId(b.id)}
              className="btn btn-sm"
              style={{
                background: selectedBatchId === b.id ? '#1e3a8a' : '#f1f5f9',
                color: selectedBatchId === b.id ? '#fff' : '#475569',
                borderColor: selectedBatchId === b.id ? '#1e3a8a' : '#cbd5e1',
                fontWeight: 600
              }}
            >
              {b.year}nd/rd/th Year (Sem {b.year === 2 ? 3 : (b.year === 3 ? 5 : 7)})
            </button>
          ))}
        </div>
      </div>

      {/* Timetable Visual Grid */}
      {loading || !timetableData ? (
        <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>Loading timetable grid...</div>
      ) : (
        <div className="timetable-grid-wrapper">
          <table className="timetable-table">
            <thead>
              <tr>
                <th style={{ width: 100 }}>Day</th>
                <th><div>P1</div><div style={{ fontSize: '0.7rem', fontWeight: 400 }}>08:45–09:40</div></th>
                <th><div>P2</div><div style={{ fontSize: '0.7rem', fontWeight: 400 }}>09:40–10:35</div></th>
                <th className="timetable-cell-break">BREAK</th>
                <th><div>P3</div><div style={{ fontSize: '0.7rem', fontWeight: 400 }}>10:50–11:45</div></th>
                <th><div>P4</div><div style={{ fontSize: '0.7rem', fontWeight: 400 }}>11:45–12:40</div></th>
                <th className="timetable-cell-break">LUNCH</th>
                <th><div>P5</div><div style={{ fontSize: '0.7rem', fontWeight: 400 }}>01:25–02:15</div></th>
                <th><div>P6</div><div style={{ fontSize: '0.7rem', fontWeight: 400 }}>02:15–03:05</div></th>
                <th><div>P7</div><div style={{ fontSize: '0.7rem', fontWeight: 400 }}>03:05–04:00</div></th>
              </tr>
            </thead>
            <tbody>
              {timetableData.days.map((day: string) => (
                <tr key={day}>
                  <td style={{ background: '#f8fafc', fontWeight: 700, color: '#0f172a', textAlign: 'center', verticalAlign: 'middle' }}>
                    {day}
                  </td>

                  <td>{renderEditableSlot(day, 1, timetableData.grid[day]?.[1], handleOpenEdit)}</td>
                  <td>{renderEditableSlot(day, 2, timetableData.grid[day]?.[2], handleOpenEdit)}</td>

                  <td className="timetable-cell-break">TEA</td>

                  <td>{renderEditableSlot(day, 3, timetableData.grid[day]?.[3], handleOpenEdit)}</td>
                  <td>{renderEditableSlot(day, 4, timetableData.grid[day]?.[4], handleOpenEdit)}</td>

                  <td className="timetable-cell-break">LUNCH</td>

                  <td>{renderEditableSlot(day, 5, timetableData.grid[day]?.[5], handleOpenEdit)}</td>
                  <td>{renderEditableSlot(day, 6, timetableData.grid[day]?.[6], handleOpenEdit)}</td>
                  <td>{renderEditableSlot(day, 7, timetableData.grid[day]?.[7], handleOpenEdit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Slot Modal */}
      <Modal
        isOpen={slotModalOpen}
        onClose={() => setSlotModalOpen(false)}
        title="Configure Timetable Period Slot"
        subtitle={`${slotForm.day_of_week} • Period ${slotForm.period_number}`}
      >
        <form onSubmit={handleSaveSlot}>
          <div className="form-group">
            <label className="form-label required">Subject</label>
            <select
              className="form-control form-select"
              value={slotForm.subject_id}
              onChange={e => setSlotForm({ ...slotForm, subject_id: parseInt(e.target.value, 10) })}
            >
              {subjectsList.map(s => (
                <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label required">Faculty In-Charge</label>
            <select
              className="form-control form-select"
              value={slotForm.faculty_id}
              onChange={e => setSlotForm({ ...slotForm, faculty_id: parseInt(e.target.value, 10) })}
            >
              {facultyList.map(f => (
                <option key={f.id} value={f.id}>{f.full_name} ({f.designation})</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label required">Classroom / Lab</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Room-302 / Lab-IT-01"
              value={slotForm.room}
              onChange={e => setSlotForm({ ...slotForm, room: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
            <button type="button" onClick={() => setSlotModalOpen(false)} className="btn btn-outline">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Slot
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

function renderEditableSlot(day: string, period: number, entry: any, onEdit: (d: string, p: number, e: any) => void) {
  if (!entry) {
    return (
      <div
        onClick={() => onEdit(day, period, null)}
        style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: '#cbd5e1',
          fontSize: '0.75rem',
          border: '1px dashed transparent',
          borderRadius: 6
        }}
        title="Click to add class slot"
      >
        + Add
      </div>
    );
  }

  const isLab = entry.subject_type === 'lab';

  return (
    <div
      onClick={() => onEdit(day, period, entry)}
      className="timetable-slot-card"
      style={{
        borderLeftColor: isLab ? '#9333ea' : '#2563eb',
        background: isLab ? '#faf5ff' : '#f8fafc'
      }}
      title="Click to edit slot"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong style={{ fontSize: '0.8rem', color: isLab ? '#7e22ce' : '#1e3a8a' }}>
          {entry.subject_code}
        </strong>
        <span style={{ fontSize: '0.6875rem', color: '#64748b' }}>{entry.room || '302'}</span>
      </div>

      <div style={{ fontSize: '0.725rem', color: '#334155', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {entry.subject_name}
      </div>

      <div style={{ fontSize: '0.6875rem', color: '#64748b', marginTop: 'auto' }}>
        {entry.faculty_name}
      </div>
    </div>
  );
}
