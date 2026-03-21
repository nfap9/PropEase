import type { Organization } from '@/types';

export const ORGANIZATION_ONBOARDING_PATH = '/organizations/new';
export const DEFAULT_ORGANIZATION_HOME_PATH = '/dashboard';
export const ADMIN_PATH = '/admin';
export const TENANT_PATHS = ['/dashboard', '/apartments', '/rooms', '/tenants', '/leases', '/utilities', '/bills', '/reports', '/settings', '/organizations', '/notifications'];

export function getPostAuthRedirectPath(
  organizations: Organization[],
  organization: Organization | null,
  isAdmin?: boolean
): string {
  // Admin users always go to admin path
  if (isAdmin) {
    return ADMIN_PATH;
  }

  if (organizations.length === 0 || !organization) {
    return ORGANIZATION_ONBOARDING_PATH;
  }

  return DEFAULT_ORGANIZATION_HOME_PATH;
}

export function isAdminPath(path: string): boolean {
  return path.startsWith('/admin');
}

export function getLogoutRedirectPath(isAdmin?: boolean): string {
  return isAdmin ? '/admin/login' : '/login';
}
