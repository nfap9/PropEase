import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createCustomRoleService } from './customRole.service.js';
import type { CustomRoleRepository } from '../repositories/customRole.repo.js';
import type { CustomRole } from '@prisma/client';

describe('CustomRoleService', () => {
  const mockRole: CustomRole = {
    id: 'role-1',
    organization_id: 'org-1',
    name: '管理员',
    description: '组织管理员',
    permissions: '["admin:read", "admin:write"]',
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const repo: CustomRoleRepository = {
    findByOrgId: vi.fn(),
    findByIdAndOrg: vi.fn(),
    countByOrgId: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };

  const service = createCustomRoleService(() => repo);

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('list', () => {
    it('should return roles sorted by is_active desc then name naturally', async () => {
      const roles: CustomRole[] = [
        { ...mockRole, id: 'role-1', name: '财务', is_active: false },
        { ...mockRole, id: 'role-2', name: '管理员', is_active: true },
        { ...mockRole, id: 'role-3', name: '运营', is_active: true },
      ];
      vi.mocked(repo.findByOrgId).mockResolvedValue(roles);

      const result = await service.list('org-1');

      expect(result[0].is_active).toBe(true);
      expect(result[1].is_active).toBe(true);
      expect(result[2].is_active).toBe(false);
      expect(repo.findByOrgId).toHaveBeenCalledWith('org-1');
    });

    it('should return empty array when no roles exist', async () => {
      vi.mocked(repo.findByOrgId).mockResolvedValue([]);

      const result = await service.list('org-1');

      expect(result).toEqual([]);
    });
  });

  describe('initDefaultRoles', () => {
    it('should return alreadyInitialized true when roles exist', async () => {
      vi.mocked(repo.countByOrgId).mockResolvedValue(3);

      const result = await service.initDefaultRoles('org-1');

      expect(result.alreadyInitialized).toBe(true);
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('should create default roles when none exist', async () => {
      vi.mocked(repo.countByOrgId).mockResolvedValue(0);
      vi.mocked(repo.create).mockResolvedValue(mockRole);

      const result = await service.initDefaultRoles('org-1');

      expect(result.alreadyInitialized).toBe(false);
      expect(repo.create).toHaveBeenCalledTimes(3);
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          organization_id: 'org-1',
          name: '管理员',
          description: '组织管理员',
        })
      );
    });
  });

  describe('create', () => {
    it('should create a new role', async () => {
      const input = { name: '新角色', description: '新角色描述', permissions: '["read"]' };
      vi.mocked(repo.create).mockResolvedValue({ ...mockRole, ...input });

      const result = await service.create('org-1', input);

      expect(result.name).toBe('新角色');
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          organization_id: 'org-1',
          name: '新角色',
        })
      );
    });
  });

  describe('getById', () => {
    it('should return role when found', async () => {
      vi.mocked(repo.findByIdAndOrg).mockResolvedValue(mockRole);

      const result = await service.getById('org-1', 'role-1');

      expect(result.id).toBe('role-1');
    });

    it('should throw 404 when role not found', async () => {
      vi.mocked(repo.findByIdAndOrg).mockResolvedValue(null);

      await expect(service.getById('org-1', 'nonexistent')).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('should update role successfully', async () => {
      const updateData = { name: '更新后的名称' };
      vi.mocked(repo.findByIdAndOrg).mockResolvedValue(mockRole);
      vi.mocked(repo.update).mockResolvedValue({ ...mockRole, name: '更新后的名称' });

      const result = await service.update('org-1', 'role-1', updateData);

      expect(result.name).toBe('更新后的名称');
      expect(repo.update).toHaveBeenCalledWith('role-1', updateData);
    });

    it('should throw 404 when role not found', async () => {
      vi.mocked(repo.findByIdAndOrg).mockResolvedValue(null);

      await expect(service.update('org-1', 'nonexistent', { name: 'test' })).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('should delete role successfully', async () => {
      vi.mocked(repo.findByIdAndOrg).mockResolvedValue(mockRole);
      vi.mocked(repo.delete).mockResolvedValue();

      await service.delete('org-1', 'role-1');

      expect(repo.delete).toHaveBeenCalledWith('role-1');
    });

    it('should throw 404 when role not found', async () => {
      vi.mocked(repo.findByIdAndOrg).mockResolvedValue(null);

      await expect(service.delete('org-1', 'nonexistent')).rejects.toThrow();
    });
  });
});
