import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createTenantService, type TenantService } from './tenant.service.js';
import type { TenantRepository } from '../repositories/tenant.repo.js';
import type { Tenant } from '@prisma/client';

describe('TenantService', () => {
  // Mock Repository
  const mockRepo: TenantRepository = {
    findById: vi.fn(),
    findByIdAndOrg: vi.fn(),
    findByOrgId: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };

  let service: TenantService;

  const orgId = '01HQTESTORG000000001';
  const sampleTenant: Tenant = {
    id: '01HQTESTTENANT0000001',
    organization_id: orgId,
    name: '张三',
    phone: '13800138000',
    id_card: '110101199001011234',
    emergency_contact: '李四',
    emergency_phone: '13900139000',
    notes: '测试租客',
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
    service = createTenantService(() => mockRepo);
  });

  describe('list', () => {
    it('should return tenants for organization', async () => {
      vi.mocked(mockRepo.findByOrgId).mockResolvedValue([sampleTenant]);

      const result = await service.list(orgId);

      expect(mockRepo.findByOrgId).toHaveBeenCalledWith(orgId, undefined);
      expect(result).toEqual([sampleTenant]);
    });

    it('should pass search parameter to repository', async () => {
      vi.mocked(mockRepo.findByOrgId).mockResolvedValue([sampleTenant]);

      await service.list(orgId, '张三');

      expect(mockRepo.findByOrgId).toHaveBeenCalledWith(orgId, '张三');
    });
  });

  describe('getById', () => {
    it('should return tenant when found in organization', async () => {
      vi.mocked(mockRepo.findByIdAndOrg).mockResolvedValue(sampleTenant);

      const result = await service.getById(orgId, '01HQTESTTENANT0000001');

      expect(mockRepo.findByIdAndOrg).toHaveBeenCalledWith('01HQTESTTENANT0000001', orgId);
      expect(result).toEqual(sampleTenant);
    });

    it('should throw 404 error when tenant not found', async () => {
      vi.mocked(mockRepo.findByIdAndOrg).mockResolvedValue(null);

      await expect(service.getById(orgId, 'non-existent')).rejects.toMatchObject({
        statusCode: 404,
        message: '租客不存在',
      });
    });

    it('should throw 404 error when tenant belongs to different org', async () => {
      vi.mocked(mockRepo.findByIdAndOrg).mockResolvedValue(null);

      await expect(service.getById('different-org', sampleTenant.id)).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe('create', () => {
    it('should create tenant with valid data', async () => {
      vi.mocked(mockRepo.create).mockResolvedValue(sampleTenant);

      const input = {
        name: '张三',
        phone: '13800138000',
      };

      const result = await service.create(orgId, input);

      expect(mockRepo.create).toHaveBeenCalled();
      expect(result).toEqual(sampleTenant);
    });
  });

  describe('update', () => {
    it('should update tenant with valid data', async () => {
      const updatedTenant = { ...sampleTenant, name: '李四' };
      vi.mocked(mockRepo.findByIdAndOrg).mockResolvedValue(sampleTenant);
      vi.mocked(mockRepo.update).mockResolvedValue(updatedTenant);

      const result = await service.update(orgId, sampleTenant.id, { name: '李四' });

      expect(mockRepo.update).toHaveBeenCalledWith(
        sampleTenant.id,
        expect.objectContaining({ name: '李四' })
      );
      expect(result.name).toBe('李四');
    });

    it('should throw 404 when updating non-existent tenant', async () => {
      vi.mocked(mockRepo.findByIdAndOrg).mockResolvedValue(null);

      await expect(service.update(orgId, 'non-existent', { name: '李四' })).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe('delete', () => {
    it('should delete existing tenant', async () => {
      vi.mocked(mockRepo.findByIdAndOrg).mockResolvedValue(sampleTenant);
      vi.mocked(mockRepo.delete).mockResolvedValue(undefined);

      await service.delete(orgId, sampleTenant.id);

      expect(mockRepo.delete).toHaveBeenCalledWith(sampleTenant.id);
    });

    it('should throw 404 when deleting non-existent tenant', async () => {
      vi.mocked(mockRepo.findByIdAndOrg).mockResolvedValue(null);

      await expect(service.delete(orgId, 'non-existent')).rejects.toMatchObject({
        statusCode: 404,
      });

      expect(mockRepo.delete).not.toHaveBeenCalled();
    });
  });
});
