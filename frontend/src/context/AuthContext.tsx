import React, { createContext, useContext, useState } from 'react';

export interface User {
  id: string;
  email: string;
  role: { id: string; name: string };
  employee?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    job_position: string;
    avatar_url?: string;
  } | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isLoading: boolean;
}

export const DEFAULT_DEMO_USER: User = {
  id: 'usr_payroll',
  email: 'payroll@peoplepay360.com',
  role: { id: 'hr_payroll_manager', name: 'HR Payroll Manager' },
  employee: {
    id: 'emp_amara',
    first_name: 'Amara',
    last_name: 'Chen',
    email: 'amara.chen@peoplepay360.com',
    job_position: 'Store Supervisor',
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('pp360_token') || 'demo-token');
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('pp360_user');
    return saved ? JSON.parse(saved) : DEFAULT_DEMO_USER;
  });
  const [isLoading, setIsLoading] = useState(false);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('pp360_token', newToken);
    localStorage.setItem('pp360_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('pp360_token');
    localStorage.removeItem('pp360_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
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
