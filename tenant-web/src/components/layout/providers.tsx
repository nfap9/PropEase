/**
 * 认证 Provider
 *
 * 提供用户登录状态、组织信息、登录/登出方法
 * 由于 logout 需要导航，使用 router.navigate 代替 useNavigate hook
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { User, Organization } from '@/types';
import { authApi } from '@/api/auth';
import { organizationsApi } from '@/api/organizations';
import { Toaster } from 'sonner';
import { BrandConfigProvider } from '@/contexts/brand-config';
import { ThemeProvider } from '@/components/theme/theme-provider';
import { router } from '@/routes';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

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
 * AuthProvider 组件
 * 注意：logout 使用 router.navigate 而不是 useNavigate，避免 Router context 依赖
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const queryClientRef = useRef(useQueryClient());

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

  const logout = useCallback(async () => {
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
      queryClientRef.current.clear();
      router.navigate('/tenant/login');
    }
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        document.cookie = `access_token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
        try {
          // 并行执行：用户数据和组织列表没有依赖关系
          const [userData] = await Promise.all([
            authApi.getMe(),
            loadOrganizations(),
          ]);
          setUser(userData);
        } catch {
          await logout();
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
    const savedOrgId = localStorage.getItem('current_organization_id');
    const savedOrgIsValid = savedOrgId && orgs.some((org) => org.id === savedOrgId);

    if (savedOrgIsValid) {
      return '/workspace/dashboard';
    } else if (orgs.length > 0) {
      return '/organizations';
    } else {
      return '/organizations/new';
    }
  };

  const register = async (phone: string, password: string, fullName: string) => {
    // 注册用户
    await authApi.register({ phone, password, full_name: fullName });
    // 注册成功后自动登录获取 token
    const tokenResponse = await authApi.login({ phone, password });
    localStorage.setItem('access_token', tokenResponse.access_token);
    localStorage.setItem('refresh_token', tokenResponse.refresh_token);
    document.cookie = `access_token=${tokenResponse.access_token}; path=/; max-age=${7 * 24 * 60 * 60}`;
    const userData = await authApi.getMe();
    setUser(userData);

    const orgs = await loadOrganizations();
    if (orgs.length > 0) {
      return '/organizations';
    } else {
      return '/organizations/new';
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
        setOrganization,
        refreshOrganizations,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * 使用认证 Context 的 Hook
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * AppProviders - 应用顶层 Providers
 * 包含 QueryClient、Theme、BrandConfig 和 Auth Provider
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrandConfigProvider>
          <AuthProvider>{children}</AuthProvider>
        </BrandConfigProvider>
      </ThemeProvider>
      <Toaster />
    </QueryClientProvider>
  );
}
