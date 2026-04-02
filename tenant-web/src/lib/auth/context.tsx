'use client';

/**
 * 认证状态管理模块
 *
 * 提供全局认证 Context，包含：
 * - 用户登录/注册/登出
 * - 组织切换
 * - 认证状态自动检查（页面加载时）
 *
 * Token 存储在 localStorage，切换页面时自动验证有效性
 */
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { User, Organization } from '@/types';
import { authApi, organizationsApi } from '@/lib/api';

/** 认证 Context 类型定义 */
interface AuthContextType {
  user: User | null;                         // 当前登录用户
  organization: Organization | null;        // 当前选中的组织
  organizations: Organization[];            // 用户所属的所有组织
  isLoading: boolean;                        // 初始加载状态
  isAuthenticated: boolean;                  // 是否已认证
  login: (phone: string, password: string) => Promise<string>;  // 登录，返回跳转路径
  register: (phone: string, password: string, fullName: string) => Promise<string>;  // 注册
  logout: () => void;                        // 登出
  setOrganization: (org: Organization | null) => void;  // 切换组织
  refreshOrganizations: (preferredOrgId?: string | null) => Promise<void>;  // 刷新组织列表
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * 确定当前应选中的组织
 * 优先级：preferredOrgId > currentOrg > localStorage > orgs[0]
 */
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const queryClient = useQueryClient();

  /**
   * 加载用户的组织列表并确定当前组织
   */
  const loadOrganizations = async (preferredOrgId?: string | null) => {
    try {
      const orgs = await organizationsApi.list();
      const nextOrganizations = orgs || [];
      setOrganizations(nextOrganizations);
      setOrganization((currentOrg) => {
        const nextOrganization = resolveCurrentOrganization(
          nextOrganizations,
          currentOrg,
          preferredOrgId
        );

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

  /** 刷新组织列表（外部调用） */
  const refreshOrganizations = async (preferredOrgId?: string | null) => {
    await loadOrganizations(preferredOrgId);
  };

  /**
   * 登出
   * 清除所有本地状态和存储，跳转登录页
   */
  const logout = React.useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('current_organization_id');
    setUser(null);
    setOrganization(null);
    setOrganizations([]);
    queryClient.clear();
    router.push('/login');
  }, [queryClient, router]);

  /**
   * 页面加载时检查认证状态
   * 验证 localStorage 中的 token 是否有效
   */
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
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

  /**
   * 登录
   * 1. 调用登录 API 获取 token
   * 2. 保存 token 到 localStorage
   * 3. 获取用户信息和组织列表
   * 4. 返回跳转路径（有组织去 dashboard，无组织去创建组织）
   */
  const login = async (phone: string, password: string) => {
    const response = await authApi.login({ phone, password });
    localStorage.setItem('access_token', response.access_token);
    localStorage.setItem('refresh_token', response.refresh_token);
    const userData = await authApi.getMe();
    setUser(userData);

    const orgs = await loadOrganizations();
    return orgs.length > 0 ? '/dashboard' : '/organizations/new';
  };

  /**
   * 注册
   * 注册成功后自动登录
   */
  const register = async (phone: string, password: string, fullName: string) => {
    await authApi.register({
      phone,
      password,
      full_name: fullName,
    });
    // 注册成功后自动登录
    return login(phone, password);
  };

  /** 切换当前组织 */
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
 * 使用认证 Context 的 Hook
 * @throws 如果在 AuthProvider 外使用
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthProvider;
