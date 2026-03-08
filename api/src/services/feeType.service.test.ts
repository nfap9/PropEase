/**
 * FeeType Service 单元测试
 *
 * 覆盖场景：
 * - 获取费用类型列表（含系统预设和自定义）
 * - 获取单个费用类型
 * - 创建费用类型
 * - 更新费用类型
 * - 删除费用类型（软删除）
 * - 添加/更新/删除费用规格
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createFeeTypeService } from './feeType.service.js';

// Mock prisma
vi.mock('../lib/prisma.js', () => ({
  prisma: {
    feeType: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    feeSpecification: {
      create: vi.fn(),
      update: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}));

import { prisma } from '../lib/prisma.js';

describe('FeeTypeService', () => {
  let service: ReturnType<typeof createFeeTypeService>;

  const orgId = '01HQTESTORG000000001';

  const systemFeeType = {
    id: '01HQFEETYPE_SYSTEM001',
    organization_id: null,
    name: '物业费',
    code: 'property_fee',
    description: '物业费',
    category: 'fixed',
    is_active: true,
    sort_order: 0,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const customFeeType = {
    id: '01HQFEETYPE_CUSTOM001',
    organization_id: orgId,
    name: '网费',
    code: 'internet',
    description: '网络费用',
    category: 'optional',
    is_active: true,
    sort_order: 1,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const specification = {
    id: '01HQSPEC001',
    fee_type_id: customFeeType.id,
    name: '100M宽带',
    description: '100M光纤宽带',
    price_monthly: 100,
    price_yearly: 1000,
    unit: '月',
    is_default: true,
    is_active: true,
    sort_order: 0,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const feeTypeWithSpecs = {
    ...customFeeType,
    specifications: [specification],
  };

  beforeEach(() => {
    vi.resetAllMocks();
    service = createFeeTypeService();
  });

  describe('list', () => {
    it('should return system and organization fee types', async () => {
      vi.mocked(prisma.feeType.findMany)
        .mockResolvedValueOnce([systemFeeType] as any) // system types
        .mockResolvedValueOnce([customFeeType] as any); // org types

      const result = await service.list(orgId);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(systemFeeType);
      expect(result[1]).toEqual(customFeeType);
    });

    it('should return only system types when no custom types exist', async () => {
      vi.mocked(prisma.feeType.findMany)
        .mockResolvedValueOnce([systemFeeType] as any)
        .mockResolvedValueOnce([]);

      const result = await service.list(orgId);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(systemFeeType);
    });
  });

  describe('getById', () => {
    it('should return fee type with specifications', async () => {
      vi.mocked(prisma.feeType.findFirst).mockResolvedValue(feeTypeWithSpecs as any);

      const result = await service.getById(orgId, customFeeType.id);

      expect(result).toEqual(feeTypeWithSpecs);
    });

    it('should throw 404 when fee type not found', async () => {
      vi.mocked(prisma.feeType.findFirst).mockResolvedValue(null);

      await expect(service.getById(orgId, 'non-existent')).rejects.toMatchObject({
        statusCode: 404,
        message: '费用类型不存在',
      });
    });

    it('should throw 404 when fee type belongs to different org', async () => {
      vi.mocked(prisma.feeType.findFirst).mockResolvedValue(null);

      await expect(service.getById('different-org', customFeeType.id)).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe('create', () => {
    it('should create fee type with specifications', async () => {
      vi.mocked(prisma.feeType.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.feeType.create).mockResolvedValue(feeTypeWithSpecs as any);

      const input = {
        name: '网费',
        code: 'internet',
        description: '网络费用',
        category: 'optional' as const,
        specifications: [
          {
            name: '100M宽带',
            price_monthly: 100,
            price_yearly: 1000,
          },
        ],
      };

      const result = await service.create(orgId, input);

      expect(result).toEqual(feeTypeWithSpecs);
      expect(prisma.feeType.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            organization_id: orgId,
            name: '网费',
            code: 'internet',
          }),
        })
      );
    });

    it('should throw 400 when code already exists', async () => {
      vi.mocked(prisma.feeType.findFirst).mockResolvedValue(customFeeType as any);

      const input = {
        name: '网费2',
        code: 'internet',
      };

      await expect(service.create(orgId, input)).rejects.toMatchObject({
        statusCode: 400,
        message: '费用类型编码已存在',
      });
    });
  });

  describe('update', () => {
    it('should update fee type', async () => {
      vi.mocked(prisma.feeType.findFirst).mockResolvedValue(customFeeType as any);
      vi.mocked(prisma.feeType.update).mockResolvedValue({
        ...customFeeType,
        name: '更新后的名称',
      } as any);

      const result = await service.update(orgId, customFeeType.id, {
        name: '更新后的名称',
      });

      expect(result.name).toBe('更新后的名称');
      expect(prisma.feeType.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: customFeeType.id },
          data: { name: '更新后的名称', description: undefined, category: undefined, is_active: undefined, sort_order: undefined },
        })
      );
    });

    it('should throw 404 when updating non-existent fee type', async () => {
      vi.mocked(prisma.feeType.findFirst).mockResolvedValue(null);

      await expect(
        service.update(orgId, 'non-existent', { name: '测试' })
      ).rejects.toMatchObject({
        statusCode: 404,
        message: '费用类型不存在',
      });
    });
  });

  describe('delete', () => {
    it('should soft delete fee type', async () => {
      vi.mocked(prisma.feeType.findFirst).mockResolvedValue(customFeeType as any);
      vi.mocked(prisma.feeType.update).mockResolvedValue({
        ...customFeeType,
        is_active: false,
      } as any);

      await service.delete(orgId, customFeeType.id);

      expect(prisma.feeType.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: customFeeType.id },
          data: { is_active: false },
        })
      );
    });

    it('should throw 404 when deleting non-existent fee type', async () => {
      vi.mocked(prisma.feeType.findFirst).mockResolvedValue(null);

      await expect(service.delete(orgId, 'non-existent')).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe('addSpecification', () => {
    it('should add specification to fee type', async () => {
      vi.mocked(prisma.feeType.findFirst).mockResolvedValue(customFeeType as any);
      vi.mocked(prisma.feeSpecification.create).mockResolvedValue(specification as any);

      const input = {
        name: '100M宽带',
        price_monthly: 100,
      };

      const result = await service.addSpecification(orgId, customFeeType.id, input);

      expect(result).toEqual(specification);
    });

    it('should throw 404 when fee type not found', async () => {
      vi.mocked(prisma.feeType.findFirst).mockResolvedValue(null);

      await expect(
        service.addSpecification(orgId, 'non-existent', { name: '测试', price_monthly: 100 })
      ).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe('updateSpecification', () => {
    it('should update specification', async () => {
      const specWithFeeType = {
        ...specification,
        feeType: customFeeType,
      };

      vi.mocked(prisma.feeSpecification.findFirst).mockResolvedValue(specWithFeeType as any);
      vi.mocked(prisma.feeSpecification.update).mockResolvedValue({
        ...specification,
        price_monthly: 150,
      } as any);

      const result = await service.updateSpecification(orgId, specification.id, {
        price_monthly: 150,
      });

      expect(result.price_monthly).toBe(150);
    });

    it('should throw 404 when specification not found', async () => {
      vi.mocked(prisma.feeSpecification.findFirst).mockResolvedValue(null);

      await expect(
        service.updateSpecification(orgId, 'non-existent', { price_monthly: 150 })
      ).rejects.toMatchObject({
        statusCode: 404,
        message: '费用规格不存在',
      });
    });
  });

  describe('deleteSpecification', () => {
    it('should soft delete specification', async () => {
      const specWithFeeType = {
        ...specification,
        feeType: customFeeType,
      };

      vi.mocked(prisma.feeSpecification.findFirst).mockResolvedValue(specWithFeeType as any);
      vi.mocked(prisma.feeSpecification.update).mockResolvedValue({
        ...specification,
        is_active: false,
      } as any);

      await service.deleteSpecification(orgId, specification.id);

      expect(prisma.feeSpecification.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: specification.id },
          data: { is_active: false },
        })
      );
    });

    it('should throw 404 when specification not found', async () => {
      vi.mocked(prisma.feeSpecification.findFirst).mockResolvedValue(null);

      await expect(service.deleteSpecification(orgId, 'non-existent')).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });
});
