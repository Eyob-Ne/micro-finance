import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/axios.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('dmms_token');
    const stored = localStorage.getItem('dmms_user');

    if (token && stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem('dmms_token');
        localStorage.removeItem('dmms_user');
      }
    }

    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', {
      email,
      password,
    });

    localStorage.setItem('dmms_token', data.token);
    localStorage.setItem('dmms_user', JSON.stringify(data.user));

    setUser(data.user);

    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('dmms_token');
    localStorage.removeItem('dmms_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);