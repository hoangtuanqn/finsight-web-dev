import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api/index.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [googleClientId, setGoogleClientId] = useState(null);
  const [facebookAppId, setFacebookAppId] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const configRes = await authAPI.getGoogleConfig();
        if (configRes.data?.data?.clientId) {
          setGoogleClientId(configRes.data.data.clientId);
        }

        const fbConfigRes = await authAPI.getFacebookConfig();
        if (fbConfigRes.data?.data?.appId) {
          setFacebookAppId(fbConfigRes.data.data.appId);
        }
        
        const token = localStorage.getItem('finsight_token');
        if (token) {
          const userRes = await authAPI.me();
          if (userRes.data?.success) {
            setUser(userRes.data.data.user);
          } else {
            localStorage.removeItem('finsight_token');
          }
        }
      } catch (err) {
        console.error('Auth init error:', err);
        localStorage.removeItem('finsight_token');
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { user, token } = res.data.data;
    localStorage.setItem('finsight_token', token);
    setUser(user);
    return user;
  };

  const loginWithGoogle = async (credential) => {
    const res = await authAPI.googleLogin({ credential });
    const { user, token } = res.data.data;
    localStorage.setItem('finsight_token', token);
    setUser(user);
    return user;
  };

  const loginWithFacebook = async (accessToken) => {
    const res = await authAPI.facebookLogin({ accessToken });
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
    <AuthContext.Provider value={{ 
      user, setUser, 
      login, loginWithGoogle, loginWithFacebook, 
      register, logout, loading, 
      googleClientId, facebookAppId 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
