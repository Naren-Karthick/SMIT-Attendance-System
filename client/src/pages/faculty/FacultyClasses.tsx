import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, Users, Clock, CheckSquare, ArrowRight } from 'lucide-react';

interface FacultyClassesProps {
  onNavigate: (page: string, params?: any) => void;
}

export const FacultyClasses: React.FC<FacultyClassesProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const token = localStorage.getItem('smit_token');
        const res = await fetch('/api/subjects/assignments', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          // Filter to logged in faculty unless HOD
          const myAssignments = user?.isHod
            ? data.assignments
            : data.assignments.filter((a: any) => a.faculty_id === user?.facultyId);
          setSubjects(myAssignments);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, [user]);

  return (
    <div className="page-wrapper">
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0 }}>My Assigned Subjects & Classes</h1>
        <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: 4 }}>
          Department of Information Technology • Academic Year 2026–2027
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {subjects.map(item => (
          <div key={item.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="card-header">
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1e3a8a' }}>
                  {item.subject_code}
                </span>
                <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a' }}>{item.subject_name}</h3>
              </div>
              <span className="badge" style={{ background: '#eff6ff', color: '#1d4ed8' }}>
                {item.subject_type.toUpperCase()}
              </span>
            </div>

            <div className="card-body" style={{ flex: 1 }}>
              <div style={{ fontSize: '0.825rem', color: '#475569', marginBottom: 12 }}>
                Class: <strong>{item.batch_name}</strong> ({item.year_level}nd/rd/th Year • Sem {item.semester})
              </div>

              <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8, fontSize: '0.8rem', color: '#64748b' }}>
                Instruction Hours: 4 hrs/week • Anna University R2021 Curriculum
              </div>
            </div>

            <div className="card-footer" style={{ justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Section A</span>
              <button
                onClick={() => onNavigate('take-attendance', {
                  batchId: item.batch_id,
                  subjectId: item.subject_id
                })}
                className="btn btn-primary btn-sm"
              >
                <CheckSquare size={14} />
                <span>Take Attendance</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
