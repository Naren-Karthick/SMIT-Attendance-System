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

  return (
    <div className="page-wrapper">
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0 }}>Weekly Class Timetable</h1>
        <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: 4 }}>
          Department of Information Technology • 2026–2027 Schedule • Room 302 / Labs
        </p>
      </div>

      <div className="timetable-grid-wrapper">
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
