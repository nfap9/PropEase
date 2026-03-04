import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createTenantRepository, type TenantRepository } from './tenant.repo.js';
import type { Tenant } from '../generated/client/index.js';

describe('TenantRepository', () => {
  // Mock PrismaClient
  const mockTenant = {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };

  const mockDb = { tenant: mockTenant } as unknown as Parameters<typeof createTenantRepository>[0];
  let repo: TenantRepository;

  beforeEach(() => {
    vi.resetAllMocks();
    repo = createTenantRepository(mockDb);
  });

  const sampleTenant: Tenant = {
    id: '01HQTESTTENANT0000001',
    organization_id: '01HQTESTORG000000001',
    name: '张三',
    phone: '13800138000',
    id_card: '110101199001011234',
    emergency_contact: '李四',
    emergency_phone: '13900139000',
    notes: '测试租客',
    created_at: new Date(),
    updated_at: new Date(),
  };

  describe('findById', () => {
    it('should return tenant by id', async () => {
      mockTenant.findUnique.mockResolvedValue(sampleTenant);

      const result = await repo.findById('01HQTESTTENANT0000001');

      expect(mockTenant.findUnique).toHaveBeenCalledWith({
        where: { id: '01HQTESTTENANT0000001' },
      });
      expect(result).toEqual(sampleTenant);
    });

    it('should return null if not found', async () => {
      mockTenant.findUnique.mockResolvedValue(null);

      const result = await repo.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findByIdAndOrg', () => {
    it('should return tenant by id and orgId', async () => {
      mockTenant.findFirst.mockResolvedValue(sampleTenant);

      const result = await repo.findByIdAndOrg('01HQTESTTENANT0000001', '01HQTESTORG000000001');

      expect(mockTenant.findFirst).toHaveBeenCalledWith({
        where: { id: '01HQTESTTENANT0000001', organization_id: '01HQTESTORG000000001' },
      });
      expect(result).toEqual(sampleTenant);
    });
  });

  describe('findByOrgId', () => {
    it('should return tenants by orgId without search', async () => {
      mockTenant.findMany.mockResolvedValue([sampleTenant]);

      const result = await repo.findByOrgId('01HQTESTORG000000001');

      expect(mockTenant.findMany).toHaveBeenCalledWith({
        where: { organization_id: '01HQTESTORG000000001' },
      });
      expect(result).toEqual([sampleTenant]);
    });

    it('should return tenants with search filter', async () => {
      mockTenant.findMany.mockResolvedValue([sampleTenant]);

      await repo.findByOrgId('01HQTESTORG000000001', '张三');

      expect(mockTenant.findMany).toHaveBeenCalledWith({
        where: {
          organization_id: '01HQTESTORG000000001',
          OR: [
            { name: { contains: '张三', mode: 'insensitive' } },
            { phone: { contains: '张三', mode: 'insensitive' } },
          ],
        },
      });
    });

    it('should not add OR filter for empty search', async () => {
      mockTenant.findMany.mockResolvedValue([]);

      await repo.findByOrgId('01HQTESTORG000000001', '');

      expect(mockTenant.findMany).toHaveBeenCalledWith({
        where: { organization_id: '01HQTESTORG000000001' },
      });
    });
  });

  describe('create', () => {
    it('should create tenant with data', async () => {
      const createInput = {
        id: '01HQTESTTENANT0000001',
        organization: { connect: { id: '01HQTESTORG000000001' } },
        name: '张三',
        phone: '13800138000',
      };
      mockTenant.create.mockResolvedValue(sampleTenant);

      const result = await repo.create(createInput);

      expect(mockTenant.create).toHaveBeenCalledWith({ data: createInput });
      expect(result).toEqual(sampleTenant);
    });
  });

  describe('update', () => {
    it('should update tenant by id', async () => {
      const updateInput = { name: '李四' };
      const updatedTenant = { ...sampleTenant, name: '李四' };
      mockTenant.update.mockResolvedValue(updatedTenant);

      const result = await repo.update('01HQTESTTENANT0000001', updateInput);

      expect(mockTenant.update).toHaveBeenCalledWith({
        where: { id: '01HQTESTTENANT0000001' },
        data: updateInput,
      });
      expect(result.name).toBe('李四');
    });
  });

  describe('delete', () => {
    it('should delete tenant by id', async () => {
      mockTenant.delete.mockResolvedValue(sampleTenant);

      await repo.delete('01HQTESTTENANT0000001');

      expect(mockTenant.delete).toHaveBeenCalledWith({
        where: { id: '01HQTESTTENANT0000001' },
      });
    });
  });
});
