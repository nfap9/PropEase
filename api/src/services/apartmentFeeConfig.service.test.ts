/**
 * ApartmentFeeConfig Service 单元测试
 *
 * 覆盖场景：
 * - 获取公寓费用配置列表
 * - 获取单个配置
 * - 创建费用配置
 * - 更新费用配置
 * - 删除费用配置
 * - 获取有效配置
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createApartmentFeeConfigService } from './apartmentFeeConfig.service.js';

// Mock prisma
vi.mock('../lib/prisma.js', () => ({
  prisma: {
    apartment: {
      findUnique: vi.fn(),
    },
    apartmentFeeConfig: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    feeType: {
      findFirst: vi.fn(),
    },
  },
}));

import { prisma } from '../lib/prisma.js';

describe('ApartmentFeeConfigService', () => {
  let service: ReturnType<typeof createApartmentFeeConfigService>;

  const orgId = '01HQTESTORG000000001';
  const apartmentId = '01HQAAPARTMENT001';

  const mockApartment = {
    id: apartmentId,
    organization_id: orgId,
    name: '测试公寓',
    address: '测试地址',
    floors: null,
    land_area: null,
    total_area: null,
    landlord_name: null,
    landlord_contact: null,
    contract_start: null,
    contract_end: null,
    landlord_rent: null,
    operating_cost: null,
    description: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockFeeType = {
    id: '01HQFEETYPE001',
    organization_id: orgId,
    name: '网费',
    code: 'internet',
    description: '网络费用',
    category: 'optional',
    is_active: true,
    sort_order: 0,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockSpecification = {
    id: '01HQSPEC001',
    fee_type_id: mockFeeType.id,
    name: '100M宽带',
    description: '100M光纤',
    price_monthly: 100,
    price_yearly: 1000,
    unit: '月',
    is_default: true,
    is_active: true,
    sort_order: 0,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockFeeConfig = {
    id: '01HQFEECONFIG001',
    apartment_id: apartmentId,
    fee_type_id: mockFeeType.id,
    specification_id: mockSpecification.id,
    is_enabled: true,
    allow_lease_override: false,
    effective_from: new Date('2024-01-01'),
    effective_to: null,
    notes: '测试配置',
    created_at: new Date(),
    updated_at: new Date(),
  };

  const feeConfigWithDetails = {
    ...mockFeeConfig,
    feeType: {
      ...mockFeeType,
      specifications: [mockSpecification],
    },
    specification: mockSpecification,
  };

  beforeEach(() => {
    vi.resetAllMocks();
    service = createApartmentFeeConfigService();
  });

  describe('list', () => {
    it('should return fee configs for apartment', async () => {
      vi.mocked(prisma.apartment.findUnique).mockResolvedValue(mockApartment as any);
      vi.mocked(prisma.apartmentFeeConfig.findMany).mockResolvedValue([feeConfigWithDetails] as any);

      const result = await service.list(apartmentId);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(feeConfigWithDetails);
    });

    it('should throw 404 when apartment not found', async () => {
      vi.mocked(prisma.apartment.findUnique).mockResolvedValue(null);

      await expect(service.list('non-existent')).rejects.toMatchObject({
        statusCode: 404,
        message: '公寓不存在',
      });
    });
  });

  describe('getById', () => {
    it('should return fee config with details', async () => {
      vi.mocked(prisma.apartmentFeeConfig.findFirst).mockResolvedValue(feeConfigWithDetails as any);

      const result = await service.getById(apartmentId, mockFeeConfig.id);

      expect(result).toEqual(feeConfigWithDetails);
    });

    it('should throw 404 when config not found', async () => {
      vi.mocked(prisma.apartmentFeeConfig.findFirst).mockResolvedValue(null);

      await expect(service.getById(apartmentId, 'non-existent')).rejects.toMatchObject({
        statusCode: 404,
        message: '费用配置不存在',
      });
    });
  });

  describe('create', () => {
    it('should create fee config successfully', async () => {
      vi.mocked(prisma.apartment.findUnique).mockResolvedValue(mockApartment as any);
      vi.mocked(prisma.feeType.findFirst).mockResolvedValue(mockFeeType as any);
      vi.mocked(prisma.apartmentFeeConfig.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.apartmentFeeConfig.create).mockResolvedValue(feeConfigWithDetails as any);

      const input = {
        fee_type_id: mockFeeType.id,
        specification_id: mockSpecification.id,
        effective_from: '2024-01-01',
        notes: '测试配置',
      };

      const result = await service.create(apartmentId, input);

      expect(result).toEqual(feeConfigWithDetails);
    });

    it('should throw 404 when apartment not found', async () => {
      vi.mocked(prisma.apartment.findUnique).mockResolvedValue(null);

      const input = {
        fee_type_id: mockFeeType.id,
        effective_from: '2024-01-01',
      };

      await expect(service.create('non-existent', input)).rejects.toMatchObject({
        statusCode: 404,
        message: '公寓不存在',
      });
    });

    it('should throw 400 when fee type not available', async () => {
      vi.mocked(prisma.apartment.findUnique).mockResolvedValue(mockApartment as any);
      vi.mocked(prisma.feeType.findFirst).mockResolvedValue(null);

      const input = {
        fee_type_id: 'non-existent',
        effective_from: '2024-01-01',
      };

      await expect(service.create(apartmentId, input)).rejects.toMatchObject({
        statusCode: 400,
        message: '费用类型不可用',
      });
    });

    it('should throw 400 when fee type already configured', async () => {
      vi.mocked(prisma.apartment.findUnique).mockResolvedValue(mockApartment as any);
      vi.mocked(prisma.feeType.findFirst).mockResolvedValue(mockFeeType as any);
      vi.mocked(prisma.apartmentFeeConfig.findFirst).mockResolvedValue(mockFeeConfig as any);

      const input = {
        fee_type_id: mockFeeType.id,
        effective_from: '2024-01-01',
      };

      await expect(service.create(apartmentId, input)).rejects.toMatchObject({
        statusCode: 400,
        message: '该费用类型已配置',
      });
    });
  });

  describe('update', () => {
    it('should update fee config', async () => {
      vi.mocked(prisma.apartmentFeeConfig.findFirst).mockResolvedValue(mockFeeConfig as any);
      vi.mocked(prisma.apartmentFeeConfig.update).mockResolvedValue({
        ...mockFeeConfig,
        notes: '更新后的备注',
      } as any);

      const result = await service.update(apartmentId, mockFeeConfig.id, {
        notes: '更新后的备注',
      });

      expect(result.notes).toBe('更新后的备注');
    });

    it('should throw 404 when config not found', async () => {
      vi.mocked(prisma.apartmentFeeConfig.findFirst).mockResolvedValue(null);

      await expect(
        service.update(apartmentId, 'non-existent', { notes: '测试' })
      ).rejects.toMatchObject({
        statusCode: 404,
        message: '费用配置不存在',
      });
    });
  });

  describe('delete', () => {
    it('should delete fee config', async () => {
      vi.mocked(prisma.apartmentFeeConfig.findFirst).mockResolvedValue(mockFeeConfig as any);
      vi.mocked(prisma.apartmentFeeConfig.delete).mockResolvedValue(mockFeeConfig as any);

      await service.delete(apartmentId, mockFeeConfig.id);

      expect(prisma.apartmentFeeConfig.delete).toHaveBeenCalledWith({
        where: { id: mockFeeConfig.id },
      });
    });

    it('should throw 404 when config not found', async () => {
      vi.mocked(prisma.apartmentFeeConfig.findFirst).mockResolvedValue(null);

      await expect(service.delete(apartmentId, 'non-existent')).rejects.toMatchObject({
        statusCode: 404,
        message: '费用配置不存在',
      });
    });
  });

  describe('getEffectiveConfigs', () => {
    it('should return enabled configs within effective date range', async () => {
      vi.mocked(prisma.apartmentFeeConfig.findMany).mockResolvedValue([feeConfigWithDetails] as any);

      const testDate = new Date('2024-06-01');
      const result = await service.getEffectiveConfigs(apartmentId, testDate);

      expect(result).toHaveLength(1);
      expect(prisma.apartmentFeeConfig.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            apartment_id: apartmentId,
            is_enabled: true,
            effective_from: { lte: testDate },
          }),
        })
      );
    });

    it('should return empty array when no effective configs', async () => {
      vi.mocked(prisma.apartmentFeeConfig.findMany).mockResolvedValue([]);

      const result = await service.getEffectiveConfigs(apartmentId, new Date());

      expect(result).toHaveLength(0);
    });
  });
});
