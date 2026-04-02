'use client';

/**
 * 运营后台认证状态管理模块
 *
 * 提供全局认证 Context，包含：
 * - 管理员登录/注册/登出
 * - 组织切换
 * - 认证状态自动检查（页面加载时）
 *
 * 与 tenant-web 的 AuthContext 类似，但用于运营后台
 */
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { User, Organization } from '@/types';
import { authApi, organizationsApi } from '@/lib/api';

/** 认证 Context 类型定义 */
interface AuthContextType {
  user: User | null;                         // 当前登录用户
  organization: Organization | null;          // 当前选中的组织
  organizations: Organization[];            // 用户所属的所有组织
  isLoading: boolean;                        // 初始加载状态
  isAuthenticated: boolean;                  // 是否已认证
  login: (phone: string, password: string) => Promise<void>;  // 登录
  register: (phone: string, password: string, fullName: string) => Promise<void>;  // 注册
  logout: () => void;                       // 登出
  setOrganization: (org: Organization | null) => void;  // 切换组织
  refreshOrganizations: () => Promise<void>;  // 刷新组织列表
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const queryClient = useQueryClient();

  /** 加载用户的组织列表 */
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

  /** 刷新组织列表（外部调用） */
  const refreshOrganizations = async () => {
    await loadOrganizations();
  };

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

  /**
   * 登录
   * 1. 调用登录 API 获取 token
   * 2. 保存 token 到 localStorage
   * 3. 获取用户信息和组织列表
   * 4. 跳转 dashboard
   */
  const login = async (phone: string, password: string) => {
    const response = await authApi.login({ phone, password });
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
    await login(phone, password);
  };

  /**
   * 登出
   * 清除所有本地状态和存储，跳转登录页
   */
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
