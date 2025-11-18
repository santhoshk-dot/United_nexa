import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AppUser } from '../types';

// Default Admin User (created if no users exist)
const DEFAULT_ADMIN: AppUser = {
  id: 'admin-1',
  name: 'System Admin',
  email: 'admin@example.com',
  password: 'password',
  mobile: '9876543210',
  role: 'admin',
};

interface AuthContextType {
  user: AppUser | null;
  users: AppUser[]; // List of all users for management
  financialYear: string | null; // Store selected year
  loading: boolean;
  error: string | null;
  login: (email: string, password: string, year: string) => Promise<void>;
  logout: () => void;
  
  // User Management Actions
  addUser: (user: AppUser) => void;
  updateUser: (user: AppUser) => void;
  deleteUser: (id: string) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [financialYear, setFinancialYear] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Initialize Data
  useEffect(() => {
    try {
      // 1. Load Users Database from LocalStorage
      const storedUsers = localStorage.getItem('app_users');
      if (storedUsers) {
        setUsers(JSON.parse(storedUsers));
      } else {
        // Initialize with default admin if empty
        setUsers([DEFAULT_ADMIN]);
        localStorage.setItem('app_users', JSON.stringify([DEFAULT_ADMIN]));
      }

      // 2. Check for Active Session
      const storedSession = localStorage.getItem('authUser');
      const storedYear = localStorage.getItem('authYear');
      if (storedSession) {
        setUser(JSON.parse(storedSession));
      }
      if (storedYear) {
        setFinancialYear(storedYear);
      }
    } catch (e) {
      console.error("Auth initialization error", e);
      localStorage.removeItem('authUser');
      localStorage.removeItem('authYear');
    } finally {
      setLoading(false);
    }
  }, []);

  // Sync Users to LocalStorage whenever the list changes
  useEffect(() => {
    if (users.length > 0) {
      localStorage.setItem('app_users', JSON.stringify(users));
    }
  }, [users]);

  const login = async (email: string, password: string, year: string) => {
    setLoading(true);
    setError(null);
    
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        // Find user in the local "database"
        const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);

        if (foundUser) {
          localStorage.setItem('authUser', JSON.stringify(foundUser));
          localStorage.setItem('authYear', year);
          setUser(foundUser);
          setFinancialYear(year);
          setLoading(false);
          navigate('/'); 
          resolve();
        } else {
          setError('Invalid email or password.');
          setLoading(false);
          reject(new Error('Invalid email or password.'));
        }
      }, 800); // Simulate network delay
    });
  };

  const logout = () => {
    setUser(null);
    setFinancialYear(null);
    localStorage.removeItem('authUser');
    localStorage.removeItem('authYear');
    navigate('/login');
  };

  // --- User Management Functions ---

  const addUser = (newUser: AppUser) => {
    setUsers(prev => [...prev, newUser]);
  };

  const updateUser = (updatedUser: AppUser) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    // If updating the currently logged-in user, update session state too
    if (user && user.id === updatedUser.id) {
      setUser(updatedUser);
      localStorage.setItem('authUser', JSON.stringify(updatedUser));
    }
  };

  const deleteUser = (id: string) => {
    if (user && user.id === id) {
      alert("You cannot delete your own account while logged in.");
      return;
    }
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  const value = {
    user,
    users,
    financialYear,
    loading,
    error,
    login,
    logout,
    addUser,
    updateUser,
    deleteUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};