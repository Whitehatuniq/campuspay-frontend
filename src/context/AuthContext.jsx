import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = async (email, password) => {
    const API = (await import('../api/axios')).default;
    const res = await API.post('/api/auth/login', { email, password });
    const { access_token, ...userData } = res.data;
    localStorage.setItem('token', access_token);
    // Fetch full profile to get name, upi_id etc.
    const profileRes = await API.get('/api/auth/profile', {
      headers: { Authorization: 'Bearer ' + access_token }
    });
    const fullUser = { ...userData, ...profileRes.data };
    localStorage.setItem('user', JSON.stringify(fullUser));
    setUser(fullUser);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
