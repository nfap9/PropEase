
/**
 * AppProviders 组件
 *
 * 使用 useNavigate 的内部组件，必须在 RouterProvider 内部渲染
 * 这确保了 Router context 在调用 useNavigate 时已经建立
 */
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { User, Organization } from '@/types';
import { authApi, organizationsApi } from '@/api';
import { AppToaster } from '@apartment-ultra/shared-ui/components/ui';
import { ThemeProvider } from '@/components/theme/theme-provider';

/** 认证 Context 类型定义 */
interface AuthContextType {
  user: User | null;
  organization: Organization | null;
  organizations: Organization[];
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (phone: string, password: string) => Promise<void>;
  register: (phone: string, password: string, fullName: string) => Promise<void>;
  logout: () => void;
  setOrganization: (org: Organization | null) => void;
  refreshOrganizations: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * 内部 AuthProvider 组件 - 使用 useNavigate
 * 必须在 RouterProvider 内部渲染
 */
function AuthProviderInner({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
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

  const logout = React.useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('current_organization_id');
    setUser(null);
    setOrganization(null);
    setOrganizations([]);
    queryClient.clear();
    navigate('/login');
  }, [queryClient, navigate]);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const userData = await authApi.getMe();
          setUser(userData);

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
          logout();
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [logout]);

  const login = async (phone: string, password: string) => {
    const response = await authApi.login({ phone, password });
    localStorage.setItem('access_token', response.access_token);
    localStorage.setItem('refresh_token', response.refresh_token);
    const userData = await authApi.getMe();
    setUser(userData);

    const orgs = await loadOrganizations();
    if (orgs.length > 0) {
      setOrganization(orgs[0]);
      localStorage.setItem('current_organization_id', orgs[0].id);
    }

    navigate('/dashboard');
  };

  const register = async (phone: string, password: string, fullName: string) => {
    await authApi.register({
      phone,
      password,
      full_name: fullName,
    });
    await login(phone, password);
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

/**
 * AppProviders 组件
 * 组合所有 providers，确保 useNavigate 在 Router context 内部调用
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProviderInner>{children}</AuthProviderInner>
      <AppToaster />
    </ThemeProvider>
  );
}
