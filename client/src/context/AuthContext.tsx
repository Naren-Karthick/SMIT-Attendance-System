import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface User {
  id: number;
  username: string;
  role: 'student' | 'faculty' | 'hod';
  fullName: string;
  email: string;
  phone?: string;
  studentId?: number;
  registerNumber?: string;
  batchId?: number;
  yearLevel?: number;
  semester?: number;
  facultyId?: number;
  facultyCode?: string;
  designation?: string;
  isHod?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  unreadCount: number;
  login: (identifier: string, password: string, role?: string) => Promise<User>;
  logout: () => void;
  switchUser: (identifier: string, password?: string, role?: string) => Promise<User>;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('smit_token'));
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshMe = useCallback(async () => {
    const currentToken = localStorage.getItem('smit_token');
    if (!currentToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setUnreadCount(data.unreadNotifications || 0);
      } else {
        localStorage.removeItem('smit_token');
        setToken(null);
        setUser(null);
      }
    } catch (err) {
      console.error('Failed to restore session:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshMe();
  }, [refreshMe]);

  const login = async (identifier: string, password: string, role?: string): Promise<User> => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password, role })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to sign in');
    }

    localStorage.setItem('smit_token', data.token);
    setToken(data.token);
    setUser(data.user);
    refreshMe();
    return data.user;
  };

  const logout = async () => {
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err) {
        console.error('Logout error:', err);
      }
    }
    localStorage.removeItem('smit_token');
    setToken(null);
    setUser(null);
  };

  const switchUser = async (identifier: string, password = 'smit@2026', role?: string): Promise<User> => {
    return login(identifier, password, role);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, unreadCount, login, logout, switchUser, refreshMe }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
