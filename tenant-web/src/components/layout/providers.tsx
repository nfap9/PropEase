
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
import { BrandConfigProvider } from '@/contexts/brand-config';
import { ThemeProvider } from '@/components/theme/theme-provider';

/** 认证 Context 类型定义 */
interface AuthContextType {
  user: User | null;
  organization: Organization | null;
  organizations: Organization[];
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (phone: string, password: string) => Promise<string>;
  register: (phone: string, password: string, fullName: string) => Promise<string>;
  logout: () => Promise<void>;
  setOrganization: (org: Organization | null) => void;
  refreshOrganizations: (preferredOrgId?: string | null) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function resolveCurrentOrganization(
  orgs: Organization[],
  currentOrg: Organization | null,
  preferredOrgId?: string | null
): Organization | null {
  if (orgs.length === 0) {
    return null;
  }

  const preferredIds = [preferredOrgId, currentOrg?.id, localStorage.getItem('current_organization_id')];

  for (const orgId of preferredIds) {
    if (!orgId) continue;
    const matchedOrg = orgs.find((org) => org.id === orgId);
    if (matchedOrg) {
      return matchedOrg;
    }
  }

  return orgs[0];
}

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

  const loadOrganizations = async (preferredOrgId?: string | null) => {
    try {
      const orgs = await organizationsApi.list();
      const nextOrganizations = orgs || [];
      setOrganizations(nextOrganizations);
      setOrganization((currentOrg) => {
        const nextOrganization = resolveCurrentOrganization(nextOrganizations, currentOrg, preferredOrgId);
        if (nextOrganization) {
          localStorage.setItem('current_organization_id', nextOrganization.id);
        } else {
          localStorage.removeItem('current_organization_id');
        }
        return nextOrganization;
      });
      return nextOrganizations;
    } catch {
      setOrganizations([]);
      setOrganization(null);
      return [];
    }
  };

  const refreshOrganizations = async (preferredOrgId?: string | null) => {
    await loadOrganizations(preferredOrgId);
  };

  const logout = React.useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // 即使接口失败也清除本地状态
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('current_organization_id');
      document.cookie = 'access_token=; path=/; max-age=0';
      setUser(null);
      setOrganization(null);
      setOrganizations([]);
      queryClient.clear();
      navigate('/login');
    }
  }, [queryClient, navigate]);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        document.cookie = `access_token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
        try {
          const userData = await authApi.getMe();
          setUser(userData);
          await loadOrganizations();
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
    document.cookie = `access_token=${response.access_token}; path=/; max-age=${7 * 24 * 60 * 60}`;
    const userData = await authApi.getMe();
    setUser(userData);

    const orgs = await loadOrganizations();
    return orgs.length > 0 ? '/dashboard' : '/organizations/new';
  };

  const register = async (phone: string, password: string, fullName: string) => {
    await authApi.register({
      phone,
      password,
      full_name: fullName,
    });
    return login(phone, password);
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
      <BrandConfigProvider>
        <AuthProviderInner>{children}</AuthProviderInner>
      </BrandConfigProvider>
      <AppToaster />
    </ThemeProvider>
  );
}
