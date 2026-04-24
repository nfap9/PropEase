import { createContext, useContext } from 'react';
import type { User, Organization } from '@/types';

/** 认证 Context 类型定义 */
export interface AuthContextType {
  user: User | null;
  organization: Organization | null;
  organizations: Organization[];
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (phone: string, password: string) => Promise<string>;
  register: (phone: string, password: string, fullName: string) => Promise<string>;
  logout: () => Promise<void>;
  /** 直接设置当前组织状态（用于初始化或同步更新，不会清理缓存） */
  setOrganization: (org: Organization | null) => void;
  /** 切换组织，会自动更新状态、持久化到 localStorage 并清理组织相关的查询缓存 */
  switchOrganization: (org: Organization | null) => void;
  refreshOrganizations: (preferredOrgId?: string | null) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
 * 组织管理 Hook
 * 统一管理当前组织、组织列表和切换操作
 */
export function useOrganization() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within an AuthProvider');
  }

  const { organization, organizations, isLoading, setOrganization, switchOrganization, refreshOrganizations } = context;

  return {
    /** 当前组织 */
    currentOrganization: organization,
    /** 所有可访问的组织列表 */
    organizations,
    /** 是否正在加载组织信息 */
    isLoading,
    /** 直接设置当前组织（不推荐，内部使用） */
    setOrganization,
    /** 切换组织（推荐），自动清理缓存并刷新页面 */
    switchOrganization,
    /** 刷新组织列表 */
    refreshOrganizations,
  };
}
