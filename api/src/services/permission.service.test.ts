import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPermissionService } from './permission.service.js';
import type { PermissionRepository } from '../repositories/permission.repo.js';
import type { OrgRole } from '@prisma/client';

const mockRole: OrgRole = {
  id: 'role-1',
  organization_id: 'org-1',
  name: '管理员',
  description: null,
  is_system: false,
  permissions: ['apartment:view', 'apartment:edit'] as any,
  created_at: new Date(),
  updated_at: new Date(),
};

function createMockRepo(): PermissionRepository {
  return {
    findOrgById: vi.fn(),
    findOrgRoles: vi.fn(),
    findOrgRoleById: vi.fn(),
    findOrgRoleByName: vi.fn(),
    createOrgRole: vi.fn(),
    updateOrgRole: vi.fn(),
    deleteOrgRole: vi.fn(),
    countRoleMembers: vi.fn(),
    findMemberByOrgAndUser: vi.fn(),
    findMemberRoleId: vi.fn(),
    findMemberWithRole: vi.fn(),
  };
}

describe('PermissionService', () => {
  let repo: PermissionRepository;

  beforeEach(() => {
    vi.resetAllMocks();
    repo = createMockRepo();
  });

  // ===== listAll =====
  describe('listAll', () => {
    it('returns all permissions sorted by resource then action', () => {
      const service = createPermissionService(() => repo);
      const result = service.listAll();

      // 验证至少有一个已知权限
      expect(result.some((p) => p.code === 'apartment:view')).toBe(true);
      expect(result.some((p) => p.code === 'bill:edit')).toBe(true);

      // 验证排序：apartment:view 在 apartment:edit 之前
      const aptViewIdx = result.findIndex((p) => p.code === 'apartment:view');
      const aptEditIdx = result.findIndex((p) => p.code === 'apartment:edit');
      expect(aptViewIdx).toBeLessThan(aptEditIdx);

      // 验证每个权限都有 code、name、resource、action
      for (const p of result) {
        expect(p.code).toBeDefined();
        expect(p.name).toBeDefined();
        expect(p.resource).toBeDefined();
        expect(p.action).toBeDefined();
      }
    });
  });

  // ===== listGrouped =====
  describe('listGrouped', () => {
    it('groups permissions by resource', () => {
      const service = createPermissionService(() => repo);
      const result = service.listGrouped();

      expect(result['apartment']).toBeDefined();
      expect(result['apartment'].length).toBeGreaterThan(0);
      expect(result['apartment'].every((p) => p.resource === 'apartment')).toBe(true);
    });

    it('contains all resources that have permissions', () => {
      const service = createPermissionService(() => repo);
      const result = service.listGrouped();

      // 至少包含核心资源
      expect(result['apartment']).toBeDefined();
      expect(result['bill']).toBeDefined();
      expect(result['tenant']).toBeDefined();
    });
  });

  // ===== listOrgRoles =====
  describe('listOrgRoles', () => {
    it('returns roles with member counts', async () => {
      const roles: OrgRole[] = [
        { ...mockRole, id: 'role-1', name: '管理员' },
        { ...mockRole, id: 'role-2', name: '查看者', is_system: true },
      ];
      repo.findOrgRoles.mockResolvedValue(roles);
      repo.countRoleMembers.mockResolvedValueOnce(3).mockResolvedValueOnce(1);

      const service = createPermissionService(() => repo);
      const result = await service.listOrgRoles('org-1');

      expect(result).toHaveLength(2);
      expect(result[0].member_count).toBe(3);
      expect(result[1].member_count).toBe(1);
      expect(result[0].permissions).toEqual(['apartment:view', 'apartment:edit']);
    });

    it('returns empty array when no roles', async () => {
      repo.findOrgRoles.mockResolvedValue([]);

      const service = createPermissionService(() => repo);
      const result = await service.listOrgRoles('org-1');

      expect(result).toHaveLength(0);
    });
  });

  // ===== getOrgRole =====
  describe('getOrgRole', () => {
    it('returns role when found', async () => {
      repo.findOrgRoleById.mockResolvedValue(mockRole);

      const service = createPermissionService(() => repo);
      const result = await service.getOrgRole('role-1');

      expect(result).toEqual(mockRole);
    });

    it('returns null when not found', async () => {
      repo.findOrgRoleById.mockResolvedValue(null);

      const service = createPermissionService(() => repo);
      const result = await service.getOrgRole('nonexistent');

      expect(result).toBeNull();
    });
  });

  // ===== createOrgRole =====
  describe('createOrgRole', () => {
    it('creates role when name is unique', async () => {
      repo.findOrgRoleByName.mockResolvedValue(null);
      repo.createOrgRole.mockResolvedValue(mockRole);

      const service = createPermissionService(() => repo);
      const result = await service.createOrgRole('org-1', '管理员');

      expect(repo.findOrgRoleByName).toHaveBeenCalledWith('org-1', '管理员');
      expect(repo.createOrgRole).toHaveBeenCalledWith(
        expect.objectContaining({
          organization_id: 'org-1',
          name: '管理员',
          is_system: false,
          permissions: [],
        })
      );
      expect(result).toEqual(mockRole);
    });

    it('throws 400 when role name already exists', async () => {
      repo.findOrgRoleByName.mockResolvedValue(mockRole);

      const service = createPermissionService(() => repo);
      await expect(service.createOrgRole('org-1', '管理员')).rejects.toMatchObject({
        statusCode: 400,
      });
    });
  });

  // ===== updateOrgRole =====
  describe('updateOrgRole', () => {
    it('updates role name and description', async () => {
      const updated = { ...mockRole, name: '新名称', description: '描述' };
      repo.findOrgRoleById.mockResolvedValue(mockRole);
      repo.findOrgRoleByName.mockResolvedValue(null);
      repo.updateOrgRole.mockResolvedValue(updated as OrgRole);

      const service = createPermissionService(() => repo);
      const result = await service.updateOrgRole('role-1', { name: '新名称', description: '描述' });

      expect(result.name).toBe('新名称');
    });

    it('throws 404 when role not found', async () => {
      repo.findOrgRoleById.mockResolvedValue(null);

      const service = createPermissionService(() => repo);
      await expect(service.updateOrgRole('nonexistent', { name: 'x' })).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it('throws 403 when updating system role', async () => {
      repo.findOrgRoleById.mockResolvedValue({ ...mockRole, is_system: true });

      const service = createPermissionService(() => repo);
      await expect(service.updateOrgRole('role-1', { name: 'x' })).rejects.toMatchObject({
        statusCode: 403,
      });
    });

    it('throws 400 when new name conflicts with existing role', async () => {
      repo.findOrgRoleById.mockResolvedValue(mockRole);
      repo.findOrgRoleByName.mockResolvedValue({ ...mockRole, id: 'other-role', name: '冲突名称' });

      const service = createPermissionService(() => repo);
      await expect(service.updateOrgRole('role-1', { name: '冲突名称' })).rejects.toMatchObject({
        statusCode: 400,
      });
    });
  });

  // ===== deleteOrgRole =====
  describe('deleteOrgRole', () => {
    it('deletes role when no members', async () => {
      repo.findOrgRoleById.mockResolvedValue(mockRole);
      repo.countRoleMembers.mockResolvedValue(0);
      repo.deleteOrgRole.mockResolvedValue(undefined);

      const service = createPermissionService(() => repo);
      await service.deleteOrgRole('role-1', 'user-1');

      expect(repo.deleteOrgRole).toHaveBeenCalledWith('role-1');
    });

    it('throws 404 when role not found', async () => {
      repo.findOrgRoleById.mockResolvedValue(null);

      const service = createPermissionService(() => repo);
      await expect(service.deleteOrgRole('nonexistent', 'user-1')).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it('throws 403 when deleting system role', async () => {
      repo.findOrgRoleById.mockResolvedValue({ ...mockRole, is_system: true });

      const service = createPermissionService(() => repo);
      await expect(service.deleteOrgRole('role-1', 'user-1')).rejects.toMatchObject({
        statusCode: 403,
      });
    });

    it('throws 400 when role has members', async () => {
      repo.findOrgRoleById.mockResolvedValue(mockRole);
      repo.countRoleMembers.mockResolvedValue(5);

      const service = createPermissionService(() => repo);
      await expect(service.deleteOrgRole('role-1', 'user-1')).rejects.toMatchObject({
        statusCode: 400,
      });
    });
  });

  // ===== getRolePermissions =====
  describe('getRolePermissions', () => {
    it('returns role permissions', async () => {
      const role = { ...mockRole, permissions: ['apartment:view', 'bill:edit'] as any };
      repo.findOrgRoleById.mockResolvedValue(role);

      const service = createPermissionService(() => repo);
      const result = await service.getRolePermissions('role-1');

      expect(result.id).toBe('role-1');
      expect(result.permissions).toEqual(['apartment:view', 'bill:edit']);
    });

    it('throws 404 when role not found', async () => {
      repo.findOrgRoleById.mockResolvedValue(null);

      const service = createPermissionService(() => repo);
      await expect(service.getRolePermissions('nonexistent')).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  // ===== updateRolePermissions =====
  describe('updateRolePermissions', () => {
    it('updates permission codes', async () => {
      repo.findOrgRoleById.mockResolvedValue(mockRole);
      repo.updateOrgRole.mockResolvedValue(mockRole);

      const service = createPermissionService(() => repo);
      await service.updateRolePermissions('role-1', ['apartment:view', 'apartment:edit'], 'user-1');

      expect(repo.updateOrgRole).toHaveBeenCalledWith('role-1', {
        permissions: ['apartment:view', 'apartment:edit'],
      });
    });

    it('filters out invalid permission codes', async () => {
      repo.findOrgRoleById.mockResolvedValue(mockRole);
      repo.updateOrgRole.mockResolvedValue(mockRole);

      const service = createPermissionService(() => repo);
      await service.updateRolePermissions('role-1', ['apartment:view', 'invalid:code'], 'user-1');

      // invalid:code should be filtered out
      expect(repo.updateOrgRole).toHaveBeenCalledWith('role-1', {
        permissions: ['apartment:view'],
      });
    });

    it('throws 404 when role not found', async () => {
      repo.findOrgRoleById.mockResolvedValue(null);

      const service = createPermissionService(() => repo);
      await expect(service.updateRolePermissions('nonexistent', [], 'user-1')).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it('throws 403 when updating system role', async () => {
      repo.findOrgRoleById.mockResolvedValue({ ...mockRole, is_system: true });

      const service = createPermissionService(() => repo);
      await expect(service.updateRolePermissions('role-1', ['apartment:view'], 'user-1')).rejects.toMatchObject({
        statusCode: 403,
      });
    });
  });

  // ===== getMyPermissions =====
  describe('getMyPermissions', () => {
    it('returns permissions from member role', async () => {
      repo.findMemberWithRole.mockResolvedValue({
        id: 'member-1',
        organization_id: 'org-1',
        user_id: 'user-1',
        role_id: 'role-1',
        created_at: new Date(),
        updated_at: new Date(),
        role: { ...mockRole, permissions: ['apartment:view', 'tenant:view'] as any },
      } as any);

      const service = createPermissionService(() => repo);
      const result = await service.getMyPermissions('user-1', 'org-1');

      expect(result).toEqual(['apartment:view', 'tenant:view']);
    });

    it('returns empty array when user is not a member', async () => {
      repo.findMemberWithRole.mockResolvedValue(null);

      const service = createPermissionService(() => repo);
      const result = await service.getMyPermissions('user-1', 'org-1');

      expect(result).toEqual([]);
    });

    it('returns empty array when role has no permissions', async () => {
      repo.findMemberWithRole.mockResolvedValue({
        id: 'member-1',
        organization_id: 'org-1',
        user_id: 'user-1',
        role_id: 'role-1',
        created_at: new Date(),
        updated_at: new Date(),
        role: { ...mockRole, permissions: [] as any },
      } as any);

      const service = createPermissionService(() => repo);
      const result = await service.getMyPermissions('user-1', 'org-1');

      expect(result).toEqual([]);
    });
  });
});
