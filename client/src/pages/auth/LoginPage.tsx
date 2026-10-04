import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ShieldCheck, GraduationCap, Users, Lock, User, ArrowRight, Eye, EyeOff, Sparkles } from 'lucide-react';

interface LoginPageProps {
  onSuccess: (role: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess }) => {
  const { login } = useAuth();
  const { showToast } = useToast();

  const [selectedRole, setSelectedRole] = useState<'student' | 'faculty' | 'hod'>('student');
  const [identifier, setIdentifier] = useState('212625205004'); // Pre-fill with Aravind M for instant testing
  const [password, setPassword] = useState('smit@2026');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRoleChange = (role: 'student' | 'faculty' | 'hod') => {
    setSelectedRole(role);
    if (role === 'student') setIdentifier('212625205004'); // Aravind M (2nd Year IT)
    else if (role === 'faculty') setIdentifier('fac_kavitha');
    else if (role === 'hod') setIdentifier('hod_it');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      showToast('Please enter both identifier and password.', 'error');
      return;
    }

    setLoading(true);
    try {
      const user = await login(identifier.trim(), password, selectedRole);
      showToast(`Welcome back, ${user.fullName}!`, 'success');
      onSuccess(user.role);
    } catch (err: any) {
      showToast(err.message || 'Login failed. Please check credentials.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const quickLogins = [
    { role: 'student', label: 'Student (Aravind M - Has Pending OD)', id: '212625205004' },
    { role: 'student', label: 'Student (Ilakiya B - Low Attendance)', id: '212625205013' },
    { role: 'faculty', label: 'Faculty (Prof. R. Kavitha - DSA)', id: 'fac_kavitha' },
    { role: 'faculty', label: 'Faculty (Prof. K. Suresh - DBMS)', id: 'fac_suresh' },
    { role: 'hod', label: 'HOD (Dr. S. Anitha - Department Head)', id: 'hod_it' }
  ];

  const getIdentifierLabel = () => {
    switch (selectedRole) {
      case 'student': return 'Register Number (e.g., 212625205004)';
      case 'faculty': return 'Faculty ID / Username (e.g., fac_kavitha)';
      case 'hod': return 'HOD Department ID (e.g., hod_it)';
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #220306 0%, #3b060b 45%, #610a12 75%, #b45309 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px'
      }}
    >
      <div style={{ maxWidth: 480, width: '100%' }}>
        {/* Institutional Header Banner with Official SMIT Crest */}
        <div style={{ textAlign: 'center', marginBottom: 28, color: '#fff' }}>
          <img
            src="/smit-logo.png"
            alt="Sri Muthukumaran Institute of Technology"
            style={{
              width: 92,
              height: 92,
              objectFit: 'contain',
              filter: 'drop-shadow(0 10px 24px rgba(0, 0, 0, 0.55))',
              marginBottom: 12
            }}
          />

          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>
            SMIT Smart Attendance
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#fed7aa', marginTop: 4, fontWeight: 500 }}>
            Sri Muthukumaran Institute of Technology
          </p>
          <div
            style={{
              display: 'inline-block',
              marginTop: 8,
              padding: '4px 14px',
              borderRadius: 999,
              background: 'rgba(217, 119, 6, 0.2)',
              border: '1px solid rgba(251, 191, 36, 0.4)',
              backdropFilter: 'blur(4px)',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#fef3c7'
            }}
          >
            Information Technology • Academic Year 2026–2027
          </div>
        </div>

        {/* Login Card */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: 16,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            overflow: 'hidden'
          }}
        >
          {/* Role Switcher Tabs */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              background: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
              padding: 6,
              gap: 6
            }}
          >
            <button
              type="button"
              onClick={() => handleRoleChange('student')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '9px 12px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.8125rem',
                transition: 'all 150ms',
                background: selectedRole === 'student' ? '#ffffff' : 'transparent',
                color: selectedRole === 'student' ? 'var(--primary-700)' : '#64748b',
                boxShadow: selectedRole === 'student' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              <GraduationCap size={15} />
              <span>Student</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleChange('faculty')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '9px 12px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.8125rem',
                transition: 'all 150ms',
                background: selectedRole === 'faculty' ? '#ffffff' : 'transparent',
                color: selectedRole === 'faculty' ? 'var(--primary-700)' : '#64748b',
                boxShadow: selectedRole === 'faculty' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              <Users size={15} />
              <span>Faculty</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleChange('hod')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '9px 12px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.8125rem',
                transition: 'all 150ms',
                background: selectedRole === 'hod' ? '#ffffff' : 'transparent',
                color: selectedRole === 'hod' ? 'var(--primary-700)' : '#64748b',
                boxShadow: selectedRole === 'hod' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              <ShieldCheck size={15} />
              <span>HOD</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: '24px 28px' }}>
            <div className="form-group">
              <label className="form-label required">{getIdentifierLabel()}</label>
              <div style={{ position: 'relative' }}>
                <User
                  size={16}
                  style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
                />
                <input
                  type="text"
                  className="form-control"
                  style={{ paddingLeft: 38 }}
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  placeholder="Enter login identifier"
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label required">Password</label>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Demo: smit@2026</span>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={16}
                  style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  style={{ paddingLeft: 38, paddingRight: 38 }}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer'
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', padding: '11px', fontSize: '0.95rem', fontWeight: 600 }}
            >
              {loading ? (
                <span>Signing In...</span>
              ) : (
                <>
                  <span>Sign In as {selectedRole.toUpperCase()}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Instant 1-Click Demo Profiles Footer */}
          <div
            style={{
              padding: '16px 24px',
              background: '#f8fafc',
              borderTop: '1px solid #e2e8f0'
            }}
          >
            <div
              style={{
                fontSize: '0.725rem',
                fontWeight: 700,
                color: '#64748b',
                textTransform: 'uppercase',
                marginBottom: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 5
              }}
            >
              <Sparkles size={12} color="var(--primary-700)" />
              <span>1-Click Demo Fast Logins</span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {quickLogins.map(ql => (
                <button
                  key={ql.id}
                  type="button"
                  onClick={() => {
                    setSelectedRole(ql.role as any);
                    setIdentifier(ql.id);
                    setPassword('smit@2026');
                  }}
                  className="btn btn-outline btn-sm"
                  style={{
                    fontSize: '0.725rem',
                    padding: '4px 8px',
                    borderColor: identifier === ql.id ? 'var(--primary-700)' : '#cbd5e1',
                    background: identifier === ql.id ? 'var(--primary-50)' : '#ffffff',
                    color: identifier === ql.id ? 'var(--primary-700)' : '#334155',
                    fontWeight: identifier === ql.id ? 700 : 500
                  }}
                >
                  {ql.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 18, color: '#94a3b8', fontSize: '0.75rem' }}>
          Sri Muthukumaran Institute of Technology • Chennai • Autonomous Institution
        </div>
      </div>
    </div>
  );
};
