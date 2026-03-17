import { describe, expect, it, vi } from 'vitest';
import { canAccessRule } from './permission-access';

describe('canAccessRule', () => {
  const context = {
    organization: { id: 'org-1', name: '测试组织' } as any,
    permissions: ['tenant:view'],
    isSuperAdmin: false,
    hasPermission: vi.fn((code: string) => code === 'tenant:view'),
  };

  it('blocks organization-scoped pages when no organization is selected', () => {
    expect(
      canAccessRule(
        { requiresOrganization: true, requireAnyPermission: true },
        { ...context, organization: null }
      )
    ).toBe(false);
  });

  it('blocks any-permission pages when the permission list is empty', () => {
    expect(
      canAccessRule(
        { requiresOrganization: true, requireAnyPermission: true },
        { ...context, permissions: [] }
      )
    ).toBe(false);
  });

  it('checks explicit permissions when present', () => {
    expect(
      canAccessRule({ requiresOrganization: true, permission: 'settings:view' }, context)
    ).toBe(false);
    expect(
      canAccessRule({ requiresOrganization: true, permission: 'tenant:view' }, context)
    ).toBe(true);
  });
});
