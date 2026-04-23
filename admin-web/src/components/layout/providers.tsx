
/**
 * AppProviders 组件
 *
 * 组合所有 Context Providers
 */
import React, { useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { User, Organization } from '@/types';
import { authApi } from '@/api/auth';
import { organizationsApi } from '@/api/organizations';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/components/theme/theme-provider';
import { AuthContext, type AuthContextType } from '@/contexts/auth';



// 创建 QueryClient 实例
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * AuthProvider 组件
 */
function AuthProvider({ children }: { children: ReactNode }) {
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
          // 并行执行：用户数据和组织列表没有依赖关系
          const [userData, orgs] = await Promise.all([
            authApi.getMe(),
            loadOrganizations(),
          ]);
          setUser(userData);

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

/**
 * AppProviders 组件
 * 组合所有 providers
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>{children}</AuthProvider>
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
