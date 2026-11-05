import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { loginRequest, logoutRequest, meRequest } from '../services/auth.js';
import { clearToken, getToken, setToken } from '../utils/storage.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function restore() {
      if (!getToken()) {
        if (active) setLoading(false);
        return;
      }

      try {
        const nextUser = await meRequest();
        if (active) setUser(nextUser);
      } catch {
        clearToken();
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    function onUnauthorized() {
      clearToken();
      setUser(null);
    }

    restore();
    window.addEventListener('companyai:unauthorized', onUnauthorized);
    return () => {
      active = false;
      window.removeEventListener('companyai:unauthorized', onUnauthorized);
    };
  }, []);

  const value = useMemo(() => {
    async function login(email, password) {
      const data = await loginRequest(email, password);
      setToken(data.token);
      setUser(data.user);
      return data.user;
    }

    async function logout() {
      try {
        await logoutRequest();
      } catch (error) {
        if (error?.response?.status !== 401) throw error;
      }
      clearToken();
      setUser(null);
    }

    return { user, loading, login, logout };
  }, [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
