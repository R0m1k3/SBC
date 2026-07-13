import { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/api/auth/me')
      .then((d) => setUser(d.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const d = await api.post('/api/auth/login', { email, password });
    setUser(d.user);
    return d.user;
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } finally {
      setUser(null);
    }
  };

  // Re-fetches the current user — used after a forced password change so
  // mustChangePassword flips to false without a full re-login.
  const refreshUser = async () => {
    const d = await api.get('/api/auth/me');
    setUser(d.user);
    return d.user;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
