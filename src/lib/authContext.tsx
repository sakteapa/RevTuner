/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Authentication Context (Phone + Password, OTP verification, and Admin Access)
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface UserProfile {
  uid: string;
  phoneNumber: string;
  displayName: string;
  workshopName: string;
  role: 'admin' | 'tuner';
  tokenBalance: number;
  isAdmin: boolean;
}

interface AuthContextType {
  user: UserProfile | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
  login: (phoneNumber: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (
    phoneNumber: string,
    password: string,
    displayName?: string,
    workshopName?: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUserBalance: (newBalance: number) => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_USER_KEY = 'revtuner_auth_user_v1';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const isLoggedIn = Boolean(user);
  const isAdmin = Boolean(user?.isAdmin || user?.phoneNumber === '6009316925');

  // Save to localStorage on change
  useEffect(() => {
    if (user) {
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
    }
  }, [user]);

  const login = async (phoneNumber: string, password: string) => {
    try {
      const cleanPhone = phoneNumber.replace(/[^0-9]/g, '').slice(-10);

      // Call Server Auth API
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: cleanPhone, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Login failed' };
      }

      setUser(data.user);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error during login' };
    }
  };

  const signup = async (
    phoneNumber: string,
    password: string,
    displayName?: string,
    workshopName?: string
  ) => {
    try {
      const cleanPhone = phoneNumber.replace(/[^0-9]/g, '').slice(-10);

      // Call Server Signup API
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: cleanPhone,
          password,
          displayName,
          workshopName,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Signup failed' };
      }

      setUser(data.user);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error during signup' };
    }
  };

  const logout = () => {
    setUser(null);
  };

  const updateUserBalance = (newBalance: number) => {
    if (user) {
      setUser({ ...user, tokenBalance: newBalance });
    }
  };

  const updateProfile = (profile: Partial<UserProfile>) => {
    if (user) {
      setUser({ ...user, ...profile });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn,
        isAdmin,
        login,
        signup,
        logout,
        updateUserBalance,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
