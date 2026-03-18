import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPermissionService } from './permission.service.js';

describe('PermissionService', () => {
  const repo = {
    findAll: vi.fn(),
    findByCodes: vi.fn(),
    findOrgById: vi.fn(),
    updateOrgSettings: vi.fn(),
    findMemberRole: vi.fn(),
    findAllSystemRoleConfigs: vi.fn(),
    findUserSystemRoles: vi.fn(),
    hasSystemRole: vi.fn(),
    upsertUserSystemRole: vi.fn(),
    deleteUserSystemRole: vi.fn(),
  };

  const allPermissions = [
    { code: 'apartment:view' },
    { code: 'tenant:view' },
    { code: 'settings:view' },
  ];

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns all permissions for organization owners', async () => {
    repo.findUserSystemRoles.mockResolvedValue([]);
    repo.findMemberRole.mockResolvedValue('owner');
    repo.findAll.mockResolvedValue(allPermissions);

    const service = createPermissionService(() => repo as any);
    const result = await service.getMyPermissions('user-1', 'org-1');

    expect(result).toEqual({
      permissions: ['apartment:view', 'tenant:view', 'settings:view'],
      system_roles: [],
      is_super_admin: false,
    });
  });

  it('falls back to default full permissions when owner permissions table is empty', async () => {
    repo.findUserSystemRoles.mockResolvedValue([]);
    repo.findMemberRole.mockResolvedValue('owner');
    repo.findAll.mockResolvedValue([]);

    const service = createPermissionService(() => repo as any);
    const result = await service.getMyPermissions('user-1', 'org-1');

    expect(result.permissions).toContain('apartment:view');
    expect(result.permissions).toContain('report:export');
    expect(result.permissions).toContain('settings:edit');
    expect(result.system_roles).toEqual([]);
    expect(result.is_super_admin).toBe(false);
  });

  it('returns custom role permissions for organization members', async () => {
    repo.findUserSystemRoles.mockResolvedValue([]);
    repo.findMemberRole.mockResolvedValue('member');
    repo.findOrgById.mockResolvedValue({
      id: 'org-1',
      settings: {
        role_permissions: {
          member: ['tenant:view', 'settings:view'],
        },
      },
    });

    const service = createPermissionService(() => repo as any);
    const result = await service.getMyPermissions('user-1', 'org-1');

    expect(result).toEqual({
      permissions: ['tenant:view', 'settings:view'],
      system_roles: [],
      is_super_admin: false,
    });
  });

  it('returns default role permissions when organization does not customize them', async () => {
    repo.findUserSystemRoles.mockResolvedValue([]);
    repo.findMemberRole.mockResolvedValue('viewer');
    repo.findOrgById.mockResolvedValue({
      id: 'org-1',
      settings: {},
    });

    const service = createPermissionService(() => repo as any);
    const result = await service.getMyPermissions('user-1', 'org-1');

    expect(result.permissions).toContain('apartment:view');
    expect(result.permissions).toContain('report:view');
    expect(result.permissions).not.toContain('apartment:edit');
    expect(result.is_super_admin).toBe(false);
  });
});
