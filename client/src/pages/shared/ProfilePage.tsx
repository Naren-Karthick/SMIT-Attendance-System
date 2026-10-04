import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Phone, ShieldCheck, GraduationCap, Building2, Calendar } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="page-wrapper" style={{ maxWidth: 760 }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0 }}>Institutional Profile</h1>
        <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: 4 }}>
          Sri Muthukumaran Institute of Technology • Department of Information Technology
        </p>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header" style={{ background: '#1e3a8a', color: '#fff', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: '#fff',
                color: '#1e3a8a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                fontWeight: 800
              }}
            >
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div>
              <h2 style={{ color: '#fff', margin: 0, fontSize: '1.35rem' }}>{user?.fullName}</h2>
              <div style={{ fontSize: '0.85rem', color: '#93c5fd', marginTop: 2 }}>
                {user?.role === 'hod' ? 'Head of Department' : (user?.role === 'faculty' ? user?.designation : `Student • ${user?.yearLevel}nd/rd/th Year IT`)}
              </div>
            </div>
          </div>
        </div>

        <div className="card-body" style={{ padding: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 18 }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>ACCOUNT ROLE</div>
              <div style={{ fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', marginTop: 2 }}>
                {user?.role}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>IDENTIFIER</div>
              <div style={{ fontWeight: 700, fontFamily: 'monospace', color: '#1e3a8a', marginTop: 2 }}>
                {user?.registerNumber || user?.facultyCode || user?.username}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>EMAIL ADDRESS</div>
              <div style={{ color: '#334155', marginTop: 2 }}>
                {user?.email || '—'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>CONTACT NUMBER</div>
              <div style={{ color: '#334155', marginTop: 2 }}>
                {user?.phone || '—'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>DEPARTMENT</div>
              <div style={{ color: '#334155', marginTop: 2 }}>
                Information Technology
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>INSTITUTION</div>
              <div style={{ color: '#334155', marginTop: 2 }}>
                Sri Muthukumaran Institute of Technology
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 20 }}>
        <h4 style={{ margin: 0, marginBottom: 8 }}>Authentication & Security</h4>
        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
          Session Token: Protected with JWT standard encryption • Role-Based Access Control verified on every server request.
        </div>
      </div>
    </div>
  );
};
