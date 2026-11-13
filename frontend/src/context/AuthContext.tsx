'use client';

import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User } from '@/types';
import { api } from '@/lib/api';
import { getToken, setToken, removeToken, isTokenExpired } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, phone: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  loading: true,
  isAuthenticated: false,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const token = getToken();
      if (!token || isTokenExpired(token)) {
        removeToken();
        setUser(null);
        return;
      }
      const userData = await api.auth.getMe();
      setUser(userData);
    } catch {
      removeToken();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    fetchUser().finally(() => setIsLoading(false));
  }, [fetchUser]);

  const establishSession = async (accessToken: string) => {
    setToken(accessToken);
    try {
      const userData = await api.auth.getMe();
      setUser(userData);
    } catch (error) {
      removeToken();
      setUser(null);
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    const response = await api.auth.login(email, password);
    await establishSession(response.access_token);
  };

  const register = async (fullName: string, email: string, phone: string, password: string) => {
    const response = await api.auth.register({
      full_name: fullName,
      email,
      phone,
      password,
    });
    await establishSession(response.access_token);
  };

  const logout = () => {
    removeToken();
    setUser(null);
  };

  const refreshUser = async () => {
    await fetchUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        loading: isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}


