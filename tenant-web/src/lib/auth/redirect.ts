import type { Organization } from '@/types';

export const ORGANIZATION_ONBOARDING_PATH = '/organizations/new';
export const DEFAULT_ORGANIZATION_HOME_PATH = '/dashboard';

export function getPostAuthRedirectPath(
  organizations: Organization[],
  organization: Organization | null
): string {
  if (organizations.length === 0 || !organization) {
    return ORGANIZATION_ONBOARDING_PATH;
  }

  return DEFAULT_ORGANIZATION_HOME_PATH;
}
