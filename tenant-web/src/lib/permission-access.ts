import type { Organization } from '@/types';

export interface AccessRule {
  permission?: string | null;
  requiresOrganization?: boolean;
  requireAnyPermission?: boolean;
}

export interface AccessContext {
  organization: Organization | null;
  permissions: string[];
  isSuperAdmin: boolean;
  hasPermission: (code: string) => boolean;
}

export function canAccessRule(rule: AccessRule, context: AccessContext): boolean {
  if (rule.requiresOrganization && !context.organization) {
    return false;
  }

  if (context.isSuperAdmin) {
    return true;
  }

  if (rule.requireAnyPermission && context.permissions.length === 0) {
    return false;
  }

  if (rule.permission && !context.hasPermission(rule.permission)) {
    return false;
  }

  return true;
}
