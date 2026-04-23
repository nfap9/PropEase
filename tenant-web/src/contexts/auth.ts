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
  setOrganization: (org: Organization | null) => void;
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
