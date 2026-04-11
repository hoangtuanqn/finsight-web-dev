import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api/index.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('finsight_token');
    if (token) {
      authAPI.me()
        .then(res => setUser(res.data.data.user))
        .catch(() => localStorage.removeItem('finsight_token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { user, token } = res.data.data;
    localStorage.setItem('finsight_token', token);
    setUser(user);
    return user;
  };

  const register = async (email, password, fullName) => {
    const res = await authAPI.register({ email, password, fullName });
    const { user, token } = res.data.data;
    localStorage.setItem('finsight_token', token);
    setUser(user);
    return user;
  };

  const logout = () => {
    localStorage.removeItem('finsight_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
