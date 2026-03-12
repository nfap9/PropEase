import type { QueryClient } from '@tanstack/react-query';

/**
 * 与组织及组织权限相关的 query key 前缀。
 * 切换组织时应 invalidate 这些查询以重新加载权限、菜单及业务数据。
 */
const ORG_SCOPED_QUERY_PREFIXES = [
  'my-permissions',
  'subscription-status',
  'organization-members',
  'organization-usage',
  'subscription-order',
  'role-permissions',
  'apartments',
  'all-rooms',
  'allRooms',
  'rooms',
  'tenants',
  'tenant',
  'leases',
  'bills',
  'utilities',
  'utility-config',
  'apartment',
  'dashboard-overview',
  'income-report',
  'occupancy-report',
] as const;

/**
 * 使所有与组织、组织权限相关的查询失效。
 * 在切换组织时调用，确保权限、菜单及业务数据重新加载。
 */
export function invalidateOrgScopedQueries(queryClient: QueryClient): void {
  queryClient.invalidateQueries({
    predicate: (query) => {
      const key = query.queryKey;
      if (!Array.isArray(key) || key.length === 0) return false;
      const firstKey = String(key[0]);
      return ORG_SCOPED_QUERY_PREFIXES.includes(
        firstKey as (typeof ORG_SCOPED_QUERY_PREFIXES)[number]
      );
    },
  });
}
