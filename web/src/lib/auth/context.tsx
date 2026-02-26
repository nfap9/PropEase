'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { User, Organization } from '@/types';
import { authApi, organizationsApi } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  organization: Organization | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => void;
  setOrganization: (org: Organization | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const userData = await authApi.getMe();
          setUser(userData);

          // 获取用户的组织列表并设置第一个作为当前组织
          const orgs = await organizationsApi.list();
          if (orgs && orgs.length > 0) {
            const savedOrgId = localStorage.getItem('current_organization_id');
            if (savedOrgId) {
              const savedOrg = orgs.find((org: Organization) => org.id === parseInt(savedOrgId));
              if (savedOrg) {
                setOrganization(savedOrg);
              } else {
                setOrganization(orgs[0]);
              }
            } else {
              setOrganization(orgs[0]);
              localStorage.setItem('current_organization_id', String(orgs[0].id));
            }
          }
        } catch {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('current_organization_id');
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    localStorage.setItem('access_token', response.access_token);
    localStorage.setItem('refresh_token', response.refresh_token);
    const userData = await authApi.getMe();
    setUser(userData);

    // 获取用户的组织列表
    const orgs = await organizationsApi.list();
    if (orgs && orgs.length > 0) {
      setOrganization(orgs[0]);
      localStorage.setItem('current_organization_id', String(orgs[0].id));
    }

    router.push('/dashboard');
  };

  const register = async (email: string, password: string, fullName: string) => {
    await authApi.register({ email, password, full_name: fullName });
    await login(email, password);
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('current_organization_id');
    setUser(null);
    setOrganization(null);
    router.push('/login');
  };

  const handleSetOrganization = (org: Organization | null) => {
    setOrganization(org);
    if (org) {
      localStorage.setItem('current_organization_id', String(org.id));
    } else {
      localStorage.removeItem('current_organization_id');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        organization,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        setOrganization: handleSetOrganization,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthProvider;
