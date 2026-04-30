/**
 * 权限访问控制
 * 业务权限码 (apartment:view, bill:create 等) 定义在 @propease/api-contract
 * 运营后台权限码 (admin:user:read 等) 定义在 admin-permissions.ts
 */
import type { Organization } from '@/types';

export interface AccessRule {
  permission?: string | null;
  requiresOrganization?: boolean;
  requireAnyPermission?: boolean;
}

export interface AccessContext {
  organization: Organization | null;
  permissions: string[];
  hasPermission: (code: string) => boolean;
}

export function canAccessRule(rule: AccessRule, context: AccessContext): boolean {
  if (rule.requiresOrganization && !context.organization) {
    return false;
  }

  if (rule.requireAnyPermission && context.permissions.length === 0) {
    return false;
  }

  if (rule.permission && !context.hasPermission(rule.permission)) {
    return false;
  }

  return true;
}
