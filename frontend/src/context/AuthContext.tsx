import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole, InAppNotification } from '../types/family';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginAsDemoPatient: () => Promise<void>;
  loginAsDemoCaregiver: () => Promise<void>;
  register: (payload: Record<string, any>) => Promise<void>;
  logout: () => void;
  // Notifications
  notifications: InAppNotification[];
  unreadNotificationCount: number;
  refreshNotifications: () => Promise<void>;
  markNotificationRead: (id: number) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('pulsebridge_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState<number>(0);

  // Refresh current user from token
  const loadUser = useCallback(async (jwtToken: string) => {
    try {
      const u = await api.getMe(jwtToken);
      setUser(u);
    } catch {
      localStorage.removeItem('pulsebridge_token');
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch notifications
  const refreshNotifications = useCallback(async () => {
    if (!token) {
      setNotifications([]);
      setUnreadNotificationCount(0);
      return;
    }
    try {
      const notifs = await api.getNotifications(token, 20);
      setNotifications(notifs);
      const countRes = await api.getUnreadNotificationCount(token);
      setUnreadNotificationCount(countRes.unread_count);
    } catch (err) {
      console.warn('Failed to refresh notifications', err);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      loadUser(token);
      refreshNotifications();
      const interval = setInterval(refreshNotifications, 10000);
      return () => clearInterval(interval);
    } else {
      setUser(null);
      setIsLoading(false);
    }
  }, [token, loadUser, refreshNotifications]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.login({ email, password });
      localStorage.setItem('pulsebridge_token', res.access_token);
      setToken(res.access_token);
      setUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsDemoPatient = async () => {
    await login('patient@pulsebridge.demo', 'PulsePass123!');
  };

  const loginAsDemoCaregiver = async () => {
    await login('caregiver@pulsebridge.demo', 'PulsePass123!');
  };

  const register = async (payload: Record<string, any>) => {
    setIsLoading(true);
    try {
      const res = await api.register(payload);
      localStorage.setItem('pulsebridge_token', res.access_token);
      setToken(res.access_token);
      setUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('pulsebridge_token');
    setToken(null);
    setUser(null);
    setNotifications([]);
    setUnreadNotificationCount(0);
  };

  const markNotificationRead = async (id: number) => {
    if (!token) return;
    try {
      await api.markNotificationRead(token, id);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadNotificationCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllNotificationsRead = async () => {
    if (!token) return;
    try {
      await api.markAllNotificationsRead(token);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadNotificationCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        loginAsDemoPatient,
        loginAsDemoCaregiver,
        register,
        logout,
        notifications,
        unreadNotificationCount,
        refreshNotifications,
        markNotificationRead,
        markAllNotificationsRead
      }}
    >
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
