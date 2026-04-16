import { describe, expect, it } from 'vitest';
import {
  DEFAULT_ORGANIZATION_HOME_PATH,
  getPostAuthRedirectPath,
  ORGANIZATION_ONBOARDING_PATH,
} from './redirect';

describe('getPostAuthRedirectPath', () => {
  it('redirects to onboarding when user has no organizations', () => {
    expect(getPostAuthRedirectPath([], null)).toBe(ORGANIZATION_ONBOARDING_PATH);
  });

  it('redirects to onboarding when organizations exist but no organization is selected', () => {
    expect(
      getPostAuthRedirectPath(
        [
          {
            id: 'org-1',
            name: '测试组织',
            slug: 'test-org',
            settings: {},
            is_personal: false,
            is_active: true,
            created_at: '2026-03-17T00:00:00.000Z',
            updated_at: '2026-03-17T00:00:00.000Z',
          },
        ],
        null
      )
    ).toBe(ORGANIZATION_ONBOARDING_PATH);
  });

  it('redirects to dashboard when organization is selected', () => {
    const organization = {
      id: 'org-1',
      name: '测试组织',
      slug: 'test-org',
      settings: {},
      is_personal: false,
      is_active: true,
      created_at: '2026-03-17T00:00:00.000Z',
      updated_at: '2026-03-17T00:00:00.000Z',
    };

    expect(getPostAuthRedirectPath([organization], organization)).toBe(
      DEFAULT_ORGANIZATION_HOME_PATH
    );
  });
});
