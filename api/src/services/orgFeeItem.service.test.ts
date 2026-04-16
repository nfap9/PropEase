import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createOrgFeeItemService, type CreateOrgFeeItemInput, type UpdateOrgFeeItemInput } from './orgFeeItem.service.js';
import type { OrgFeeItemRepository } from '../repositories/orgFeeItem.repo.js';

describe('OrgFeeItemService', () => {
  const mockItem = {
    id: 'item-1',
    organization_id: 'org-1',
    category: 'water',
    name: '水费',
    amount: 100 as unknown,
    cycle: 'monthly',
    sort_order: 1,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const repo: OrgFeeItemRepository = {
    findById: vi.fn(),
    findByIdAndOrg: vi.fn(),
    findByOrgId: vi.fn(),
    findByIds: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn(),
  };

  const service = createOrgFeeItemService(() => repo);

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('list', () => {
    it('should return active fee items for org', async () => {
      vi.mocked(repo.findByOrgId).mockResolvedValue([mockItem]);

      const result = await service.list('org-1');

      expect(result).toHaveLength(1);
      expect(repo.findByOrgId).toHaveBeenCalledWith('org-1', { isActive: true });
    });

    it('should pass filters to repository', async () => {
      vi.mocked(repo.findByOrgId).mockResolvedValue([]);

      await service.list('org-1', { category: 'electricity', cycle: 'monthly', search: 'test' });

      expect(repo.findByOrgId).toHaveBeenCalledWith('org-1', {
        category: 'electricity',
        cycle: 'monthly',
        search: 'test',
        isActive: true,
      });
    });
  });

  describe('getById', () => {
    it('should return fee item when found and active', async () => {
      vi.mocked(repo.findByIdAndOrg).mockResolvedValue(mockItem);

      const result = await service.getById('org-1', 'item-1');

      expect(result.id).toBe('item-1');
    });

    it('should throw 404 when not found', async () => {
      vi.mocked(repo.findByIdAndOrg).mockResolvedValue(null);

      await expect(service.getById('org-1', 'nonexistent')).rejects.toThrow('费用项目不存在');
    });

    it('should throw 404 when item is inactive', async () => {
      vi.mocked(repo.findByIdAndOrg).mockResolvedValue({ ...mockItem, is_active: false });

      await expect(service.getById('org-1', 'item-1')).rejects.toThrow('费用项目不存在');
    });
  });

  describe('create', () => {
    it('should create a new fee item', async () => {
      const input: CreateOrgFeeItemInput = {
        name: '新费用项',
        category: 'other',
        amount: 150,
        cycle: 'monthly',
      };
      vi.mocked(repo.findByOrgId).mockResolvedValue([]);
      vi.mocked(repo.create).mockResolvedValue({ ...mockItem, ...input });

      const result = await service.create('org-1', input);

      expect(result.name).toBe('新费用项');
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          organization_id: 'org-1',
          name: '新费用项',
          is_active: true,
        })
      );
    });

    it('should throw error when duplicate name exists', async () => {
      const input: CreateOrgFeeItemInput = {
        name: '水费',
        category: 'water',
        amount: 100,
        cycle: 'monthly',
      };
      vi.mocked(repo.findByOrgId).mockResolvedValue([mockItem]);

      await expect(service.create('org-1', input)).rejects.toThrow('费用项目名称已存在');
    });

    it('should allow duplicate name if existing item is inactive', async () => {
      const input: CreateOrgFeeItemInput = {
        name: '水费',
        category: 'water',
        amount: 100,
        cycle: 'monthly',
      };
      vi.mocked(repo.findByOrgId).mockResolvedValue([{ ...mockItem, is_active: false }]);
      vi.mocked(repo.create).mockResolvedValue(mockItem);

      const result = await service.create('org-1', input);

      expect(repo.create).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update fee item successfully', async () => {
      const updateData: UpdateOrgFeeItemInput = {
        name: '更新后的名称',
        amount: 200,
      };
      vi.mocked(repo.findByIdAndOrg).mockResolvedValue(mockItem);
      vi.mocked(repo.update).mockResolvedValue({ ...mockItem, ...updateData, amount: 200 as unknown });

      const result = await service.update('org-1', 'item-1', updateData);

      expect(result.name).toBe('更新后的名称');
      expect(repo.update).toHaveBeenCalledWith('item-1', expect.objectContaining({
        name: '更新后的名称',
        amount: 200,
      }));
    });

    it('should throw 404 when item not found', async () => {
      vi.mocked(repo.findByIdAndOrg).mockResolvedValue(null);

      await expect(service.update('org-1', 'nonexistent', { name: 'test' })).rejects.toThrow('费用项目不存在');
    });
  });

  describe('delete', () => {
    it('should soft delete fee item', async () => {
      vi.mocked(repo.findByIdAndOrg).mockResolvedValue(mockItem);
      vi.mocked(repo.softDelete).mockResolvedValue();

      await service.delete('org-1', 'item-1');

      expect(repo.softDelete).toHaveBeenCalledWith('item-1');
    });

    it('should throw 404 when item not found', async () => {
      vi.mocked(repo.findByIdAndOrg).mockResolvedValue(null);

      await expect(service.delete('org-1', 'nonexistent')).rejects.toThrow('费用项目不存在');
    });
  });
});
