import type { Organization } from '@/types';
import { ORGANIZATION_ONBOARDING_PATH, DEFAULT_ORGANIZATION_HOME_PATH } from '@/constants/auth-redirect';

export { ORGANIZATION_ONBOARDING_PATH, DEFAULT_ORGANIZATION_HOME_PATH };

export function getPostAuthRedirectPath(
  organizations: Organization[],
  organization: Organization | null
): string {
  if (organizations.length === 0 || !organization) {
    return ORGANIZATION_ONBOARDING_PATH;
  }

  return DEFAULT_ORGANIZATION_HOME_PATH;
}
