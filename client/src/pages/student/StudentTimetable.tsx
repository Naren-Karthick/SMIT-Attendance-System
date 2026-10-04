import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { safeApiFetch } from '../../utils/api';
import { CalendarDays, Clock, MapPin, User, BookOpen } from 'lucide-react';

export const StudentTimetable: React.FC = () => {
  const { user } = useAuth();
  const [timetableData, setTimetableData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTimetable = async () => {
      try {
        const data = await safeApiFetch(`/api/timetables?batch_id=${user?.batchId || 1}`);
        setTimetableData(data);
      } catch (err) {
        console.warn('Failed to load timetable:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTimetable();
  }, [user]);

  if (loading || !timetableData) {
    return (
      <div className="page-wrapper">
        <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>Loading class schedule...</div>
      </div>
    );
  }

  const { days, grid, periods } = timetableData;
  const currentDayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];
  const defaultDay = days.includes(currentDayName) ? currentDayName : (days[0] || 'Monday');
  const [selectedDay, setSelectedDay] = useState<string>(defaultDay);

  const scheduleSlots = [
    { type: 'period', num: 1, time: '08:45 – 09:40' },
    { type: 'period', num: 2, time: '09:40 – 10:35' },
    { type: 'break', label: 'Morning Tea Break', time: '10:35 – 10:50' },
    { type: 'period', num: 3, time: '10:50 – 11:45' },
    { type: 'period', num: 4, time: '11:45 – 12:40' },
    { type: 'break', label: 'Lunch Break', time: '12:40 – 01:25' },
    { type: 'period', num: 5, time: '01:25 – 02:15' },
    { type: 'period', num: 6, time: '02:15 – 03:05' },
    { type: 'period', num: 7, time: '03:05 – 04:00' }
  ];

  return (
    <div className="page-wrapper">
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0 }}>Weekly Class Timetable</h1>
        <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: 4 }}>
          Department of Information Technology • 2026–2027 Schedule • Room 302 / Labs
        </p>
      </div>

      {/* Desktop Weekly Matrix View */}
      <div className="desktop-timetable-view timetable-grid-wrapper">
        <table className="timetable-table">
          <thead>
            <tr>
              <th style={{ width: 100 }}>Day / Time</th>
              <th>
                <div>P1</div>
                <div style={{ fontSize: '0.7rem', fontWeight: 400 }}>08:45–09:40</div>
              </th>
              <th>
                <div>P2</div>
                <div style={{ fontSize: '0.7rem', fontWeight: 400 }}>09:40–10:35</div>
              </th>
              <th className="timetable-cell-break">BREAK</th>
              <th>
                <div>P3</div>
                <div style={{ fontSize: '0.7rem', fontWeight: 400 }}>10:50–11:45</div>
              </th>
              <th>
                <div>P4</div>
                <div style={{ fontSize: '0.7rem', fontWeight: 400 }}>11:45–12:40</div>
              </th>
              <th className="timetable-cell-break">LUNCH</th>
              <th>
                <div>P5</div>
                <div style={{ fontSize: '0.7rem', fontWeight: 400 }}>01:25–02:15</div>
              </th>
              <th>
                <div>P6</div>
                <div style={{ fontSize: '0.7rem', fontWeight: 400 }}>02:15–03:05</div>
              </th>
              <th>
                <div>P7</div>
                <div style={{ fontSize: '0.7rem', fontWeight: 400 }}>03:05–04:00</div>
              </th>
            </tr>
          </thead>
          <tbody>
            {days.map((day: string) => (
              <tr key={day}>
                <td style={{ background: '#f8fafc', fontWeight: 700, color: '#0f172a', textAlign: 'center', verticalAlign: 'middle' }}>
                  {day}
                </td>

                {/* Period 1 */}
                <td>{renderSlot(grid[day]?.[1])}</td>
                {/* Period 2 */}
                <td>{renderSlot(grid[day]?.[2])}</td>

                {/* Tea Break */}
                <td className="timetable-cell-break">TEA</td>

                {/* Period 3 */}
                <td>{renderSlot(grid[day]?.[3])}</td>
                {/* Period 4 */}
                <td>{renderSlot(grid[day]?.[4])}</td>

                {/* Lunch Break */}
                <td className="timetable-cell-break">LUNCH</td>

                {/* Period 5 */}
                <td>{renderSlot(grid[day]?.[5])}</td>
                {/* Period 6 */}
                <td>{renderSlot(grid[day]?.[6])}</td>
                {/* Period 7 */}
                <td>{renderSlot(grid[day]?.[7])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Day-By-Day Schedule View */}
      <div className="mobile-timetable-view">
        {/* Day Selector Pill Bar */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
            paddingBottom: 8,
            marginBottom: 16,
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {days.map((day: string) => {
            const isSelected = selectedDay === day;
            const isToday = currentDayName === day;
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-outline'}`}
                style={{
                  borderRadius: 20,
                  padding: '8px 16px',
                  fontWeight: 600,
                  fontSize: '0.825rem',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <span>{day}</span>
                {isToday && (
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: isSelected ? '#fff' : '#2563eb'
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Day's Schedule List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {scheduleSlots.map((slot, idx) => {
            if (slot.type === 'break') {
              return (
                <div
                  key={idx}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 10,
                    background: '#f1f5f9',
                    border: '1px dashed #cbd5e1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.78rem',
                    color: '#64748b'
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{slot.label}</span>
                  <span style={{ fontFamily: 'monospace' }}>{slot.time}</span>
                </div>
              );
            }

            const entry = grid[selectedDay]?.[slot.num!];
            const isLab = entry?.subject_type === 'lab';

            return (
              <div
                key={idx}
                className="card"
                style={{
                  padding: 14,
                  borderRadius: 12,
                  borderLeft: `4px solid ${!entry ? '#cbd5e1' : isLab ? '#9333ea' : '#2563eb'}`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: '#eff6ff', color: '#1e3a8a' }}>
                      Period {slot.num}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{slot.time}</span>
                  </div>
                  {entry && (
                    <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b' }}>
                      Room {entry.room || '302'}
                    </span>
                  )}
                </div>

                {entry ? (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: isLab ? '#7e22ce' : '#2563eb' }}>
                        {entry.subject_code}
                      </span>
                      {isLab && (
                        <span className="badge badge-info" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>
                          LAB
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0f172a', marginTop: 2 }}>
                      {entry.subject_name}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <User size={12} />
                      <span>{entry.faculty_name}</span>
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic', marginTop: 4 }}>
                    No lecture scheduled (Free Period / Library)
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

function renderSlot(entry: any) {
  if (!entry) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.75rem' }}>
        —
      </div>
    );
  }

  const isLab = entry.subject_type === 'lab';

  return (
    <div
      className="timetable-slot-card"
      style={{
        borderLeftColor: isLab ? '#9333ea' : '#2563eb',
        background: isLab ? '#faf5ff' : '#f8fafc'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong style={{ fontSize: '0.8rem', color: isLab ? '#7e22ce' : '#1e3a8a' }}>
          {entry.subject_code}
        </strong>
        <span style={{ fontSize: '0.6875rem', color: '#64748b' }}>{entry.room || '302'}</span>
      </div>

      <div style={{ fontSize: '0.725rem', color: '#334155', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={entry.subject_name}>
        {entry.subject_name}
      </div>

      <div style={{ fontSize: '0.6875rem', color: '#64748b', marginTop: 'auto' }}>
        {entry.faculty_name}
      </div>
    </div>
  );
}
