// frontend/src/context/AuthContext.jsx
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import * as authApi from '../api/auth';

const AuthContext = createContext(null);
const STORAGE_KEY = 'airbrb_auth';

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return { token: null, email: null, name: null };
      }
      return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse auth from storage', e);
      return { token: null, email: null, name: null };
    }
  });

  const isAuthenticated = !!authState.token;

  useEffect(() => {
    if (authState?.token) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(authState));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [authState]);

  const login = useCallback(async (email, password) => {
    const data = await authApi.login(email, password);
    setAuthState({
      token: data.token,
      email,
      name: data.name || null,
    });
    return data;
  }, []);

  const register = useCallback(async (email, password, name) => {
    const data = await authApi.register(email, password, name);
    setAuthState({
      token: data.token,
      email,
      name,
    });
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      if (authState.token) {
        await authApi.logout(authState.token);
      }
    } catch (e) {
      console.error('Logout error', e);
    } finally {
      setAuthState({ token: null, email: null, name: null });
    }
  }, [authState.token]);

  const value = {
    ...authState,
    isAuthenticated,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return ctx;
}