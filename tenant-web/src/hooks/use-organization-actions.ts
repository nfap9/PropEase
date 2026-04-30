import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { router } from '@/routes';
import { invalidateOrgScopedQueries } from '@propease/web-shared';
import type { Organization } from '@/types';

/**
 * 组织相关操作 Hook
 * 包含切换组织、持久化、缓存清理等业务逻辑
 */
export function useOrganizationActions() {
  const queryClient = useQueryClient();

  /** 持久化当前组织 ID 到 localStorage */
  const persistOrganization = useCallback((org: Organization | null) => {
    if (org) {
      localStorage.setItem('current_organization_id', org.id);
    } else {
      localStorage.removeItem('current_organization_id');
    }
  }, []);

  /** 切换组织：更新状态 + 持久化 + 清理缓存 + 刷新页面 */
  const switchOrganization = useCallback(
    (org: Organization | null, setOrganization: (org: Organization | null) => void) => {
      persistOrganization(org);
      setOrganization(org);
      invalidateOrgScopedQueries(queryClient);
      router.navigate(0);
    },
    [persistOrganization, queryClient]
  );

  /** 清理组织相关的所有持久化状态 */
  const clearOrganizationState = useCallback(() => {
    localStorage.removeItem('current_organization_id');
  }, []);

  return {
    switchOrganization,
    persistOrganization,
    clearOrganizationState,
  };
}
