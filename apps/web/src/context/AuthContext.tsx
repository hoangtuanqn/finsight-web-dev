import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '../api/index';

interface AuthContextType {
  user: any;
  setUser: (user: any) => void;
  refreshUser: () => Promise<any>;
  login: (email: any, password: any) => Promise<any>;
  loginWithGoogle: (credential: any) => Promise<any>;
  loginWithFacebook: (accessToken: any) => Promise<any>;
  register: (email: any, password: any, fullName: any) => Promise<any>;
  logout: () => void;
  loading: boolean;
  googleClientId: string | null;
  facebookAppId: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [googleClientId, setGoogleClientId] = useState<string | null>(null);
  const [facebookAppId, setFacebookAppId] = useState<string | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const configRes = await (authAPI as any).getGoogleConfig();
        if (configRes.data?.data?.clientId) {
          setGoogleClientId(configRes.data.data.clientId);
        }

        const fbConfigRes = await (authAPI as any).getFacebookConfig();
        if (fbConfigRes.data?.data?.appId) {
          setFacebookAppId(fbConfigRes.data.data.appId);
        }
        
        const token = localStorage.getItem('finsight_token');
        if (token) {
          const userRes = await (authAPI as any).me();
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

  const login = async (email: any, password: any) => {
    const res = await (authAPI as any).login({ email, password });
    const { user, token } = res.data.data;
    localStorage.setItem('finsight_token', token);
    setUser(user);
    return user;
  };

  const loginWithGoogle = async (credential: any) => {
    const res = await (authAPI as any).googleLogin({ credential });
    const { user, token } = res.data.data;
    localStorage.setItem('finsight_token', token);
    setUser(user);
    return user;
  };

  const loginWithFacebook = async (accessToken: any) => {
    const res = await (authAPI as any).facebookLogin({ accessToken });
    const { user, token } = res.data.data;
    localStorage.setItem('finsight_token', token);
    setUser(user);
    return user;
  };

  const register = async (email: any, password: any, fullName: any) => {
    const res = await (authAPI as any).register({ email, password, fullName });
    const { user, token } = res.data.data;
    localStorage.setItem('finsight_token', token);
    setUser(user);
    return user;
  };

  const logout = () => {
    localStorage.removeItem('finsight_token');
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const token = localStorage.getItem('finsight_token');
      if (token) {
        const userRes = await (authAPI as any).me();
        if (userRes.data?.success) {
          setUser(userRes.data.data.user);
          return userRes.data.data.user;
        }
      }
    } catch (err) {
      console.error('Failed to refresh user:', err);
    }
    return null;
  };

  return (
    <AuthContext.Provider value={{ 
      user, setUser, refreshUser,
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
