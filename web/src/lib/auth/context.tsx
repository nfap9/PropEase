'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { User, Organization, SendSmsCodeData } from '@/types';
import { authApi, organizationsApi } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  organization: Organization | null;
  organizations: Organization[];
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (phone: string, password?: string, verificationCode?: string) => Promise<void>;
  register: (
    phone: string,
    password: string,
    fullName: string,
    verificationCode: string
  ) => Promise<void>;
  sendSmsCode: (data: SendSmsCodeData) => Promise<void>;
  logout: () => void;
  setOrganization: (org: Organization | null) => void;
  refreshOrganizations: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const queryClient = useQueryClient();

  const loadOrganizations = async () => {
    try {
      const orgs = await organizationsApi.list();
      setOrganizations(orgs || []);
      return orgs || [];
    } catch {
      setOrganizations([]);
      return [];
    }
  };

  const refreshOrganizations = async () => {
    await loadOrganizations();
  };

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const userData = await authApi.getMe();
          setUser(userData);

          // 获取用户的组织列表并设置第一个作为当前组织
          const orgs = await loadOrganizations();
          if (orgs.length > 0) {
            const savedOrgId = localStorage.getItem('current_organization_id');
            if (savedOrgId) {
              const savedOrg = orgs.find((org: Organization) => org.id === savedOrgId);
              if (savedOrg) {
                setOrganization(savedOrg);
              } else {
                setOrganization(orgs[0]);
                localStorage.setItem('current_organization_id', orgs[0].id);
              }
            } else {
              setOrganization(orgs[0]);
              localStorage.setItem('current_organization_id', orgs[0].id);
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

  const login = async (phone: string, password?: string, verificationCode?: string) => {
    const response = await authApi.login({ phone, password, verification_code: verificationCode });
    localStorage.setItem('access_token', response.access_token);
    localStorage.setItem('refresh_token', response.refresh_token);
    const userData = await authApi.getMe();
    setUser(userData);

    // 获取用户的组织列表
    const orgs = await loadOrganizations();
    if (orgs.length > 0) {
      setOrganization(orgs[0]);
      localStorage.setItem('current_organization_id', orgs[0].id);
    }

    router.push('/dashboard');
  };

  const register = async (
    phone: string,
    password: string,
    fullName: string,
    verificationCode: string
  ) => {
    await authApi.register({
      phone,
      password,
      full_name: fullName,
      verification_code: verificationCode,
    });
    // 注册成功后自动登录
    await login(phone, password);
  };

  const sendSmsCode = async (data: SendSmsCodeData) => {
    await authApi.sendSmsCode(data);
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('current_organization_id');
    setUser(null);
    setOrganization(null);
    setOrganizations([]);
    queryClient.clear();
    router.push('/login');
  };

  const handleSetOrganization = (org: Organization | null) => {
    setOrganization(org);
    if (org) {
      localStorage.setItem('current_organization_id', org.id);
    } else {
      localStorage.removeItem('current_organization_id');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        organization,
        organizations,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        sendSmsCode,
        logout,
        setOrganization: handleSetOrganization,
        refreshOrganizations,
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
