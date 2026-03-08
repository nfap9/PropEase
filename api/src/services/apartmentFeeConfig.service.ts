import type { ApartmentFeeConfig, FeeType, FeeSpecification } from '@prisma/client';
import { ulid } from 'ulid';
import { prisma } from '../lib/prisma.js';
import { createAppError } from '../utils/appError.js';

/**
 * 创建公寓费用配置输入
 */
export interface CreateApartmentFeeConfigInput {
  fee_type_id: string;
  specification_id?: string;
  is_enabled?: boolean;
  allow_lease_override?: boolean;
  effective_from: string;
  effective_to?: string;
  notes?: string;
}

/**
 * 更新公寓费用配置输入
 */
export interface UpdateApartmentFeeConfigInput {
  specification_id?: string;
  is_enabled?: boolean;
  allow_lease_override?: boolean;
  effective_from?: string;
  effective_to?: string;
  notes?: string;
}

/**
 * 公寓费用配置包含类型和规格
 */
export type ApartmentFeeConfigWithDetails = ApartmentFeeConfig & {
  feeType: FeeType & {
    specifications: FeeSpecification[];
  };
  specification?: FeeSpecification | null;
};

/**
 * ApartmentFeeConfig Service 接口
 */
export interface ApartmentFeeConfigService {
  list(apartmentId: string): Promise<ApartmentFeeConfigWithDetails[]>;
  getById(apartmentId: string, configId: string): Promise<ApartmentFeeConfigWithDetails>;
  create(apartmentId: string, data: CreateApartmentFeeConfigInput): Promise<ApartmentFeeConfigWithDetails>;
  update(apartmentId: string, configId: string, data: UpdateApartmentFeeConfigInput): Promise<ApartmentFeeConfig>;
  delete(apartmentId: string, configId: string): Promise<void>;
  getEffectiveConfigs(apartmentId: string, date: Date): Promise<ApartmentFeeConfigWithDetails[]>;
}

/**
 * 验证公寓存在
 */
async function validateApartmentExists(apartmentId: string): Promise<void> {
  const apartment = await prisma.apartment.findUnique({
    where: { id: apartmentId },
  });
  if (!apartment) {
    throw createAppError(404, '公寓不存在');
  }
}

/**
 * 验证配置归属
 */
async function validateConfigOwnership(
  configId: string,
  apartmentId: string
): Promise<ApartmentFeeConfig> {
  const config = await prisma.apartmentFeeConfig.findFirst({
    where: { id: configId, apartment_id: apartmentId },
  });
  if (!config) {
    throw createAppError(404, '费用配置不存在');
  }
  return config;
}

/**
 * 验证费用类型可用性
 */
async function validateFeeTypeAvailable(
  feeTypeId: string,
  apartmentId: string
): Promise<FeeType> {
  const apartment = await prisma.apartment.findUnique({
    where: { id: apartmentId },
    select: { organization_id: true },
  });
  if (!apartment) {
    throw createAppError(404, '公寓不存在');
  }

  const feeType = await prisma.feeType.findFirst({
    where: {
      id: feeTypeId,
      OR: [
        { organization_id: null },
        { organization_id: apartment.organization_id },
      ],
      is_active: true,
    },
  });
  if (!feeType) {
    throw createAppError(400, '费用类型不可用');
  }
  return feeType;
}

/**
 * 创建 ApartmentFeeConfig Service 实例
 */
export function createApartmentFeeConfigService(): ApartmentFeeConfigService {
  return {
    list: async (apartmentId: string) => {
      await validateApartmentExists(apartmentId);
      return prisma.apartmentFeeConfig.findMany({
        where: { apartment_id: apartmentId },
        include: {
          feeType: {
            include: {
              specifications: {
                where: { is_active: true },
                orderBy: { sort_order: 'asc' },
              },
            },
          },
          specification: true,
        },
        orderBy: { created_at: 'desc' },
      });
    },

    getById: async (apartmentId: string, configId: string) => {
      const config = await prisma.apartmentFeeConfig.findFirst({
        where: { id: configId, apartment_id: apartmentId },
        include: {
          feeType: {
            include: {
              specifications: {
                where: { is_active: true },
                orderBy: { sort_order: 'asc' },
              },
            },
          },
          specification: true,
        },
      });
      if (!config) {
        throw createAppError(404, '费用配置不存在');
      }
      return config;
    },

    create: async (apartmentId: string, data: CreateApartmentFeeConfigInput) => {
      await validateApartmentExists(apartmentId);
      await validateFeeTypeAvailable(data.fee_type_id, apartmentId);

      // 检查是否已存在相同费用类型
      const existing = await prisma.apartmentFeeConfig.findFirst({
        where: { apartment_id: apartmentId, fee_type_id: data.fee_type_id },
      });
      if (existing) {
        throw createAppError(400, '该费用类型已配置');
      }

      const config = await prisma.apartmentFeeConfig.create({
        data: {
          id: ulid().toLowerCase(),
          apartment_id: apartmentId,
          fee_type_id: data.fee_type_id,
          specification_id: data.specification_id,
          is_enabled: data.is_enabled ?? true,
          allow_lease_override: data.allow_lease_override ?? false,
          effective_from: new Date(data.effective_from),
          effective_to: data.effective_to ? new Date(data.effective_to) : null,
          notes: data.notes,
        },
        include: {
          feeType: {
            include: {
              specifications: {
                where: { is_active: true },
                orderBy: { sort_order: 'asc' },
              },
            },
          },
          specification: true,
        },
      });

      return config;
    },

    update: async (apartmentId: string, configId: string, data: UpdateApartmentFeeConfigInput) => {
      await validateConfigOwnership(configId, apartmentId);
      return prisma.apartmentFeeConfig.update({
        where: { id: configId },
        data: {
          specification_id: data.specification_id,
          is_enabled: data.is_enabled,
          allow_lease_override: data.allow_lease_override,
          effective_from: data.effective_from ? new Date(data.effective_from) : undefined,
          effective_to: data.effective_to ? new Date(data.effective_to) : null,
          notes: data.notes,
        },
      });
    },

    delete: async (apartmentId: string, configId: string) => {
      await validateConfigOwnership(configId, apartmentId);
      await prisma.apartmentFeeConfig.delete({
        where: { id: configId },
      });
    },

    getEffectiveConfigs: async (apartmentId: string, date: Date) => {
      return prisma.apartmentFeeConfig.findMany({
        where: {
          apartment_id: apartmentId,
          is_enabled: true,
          effective_from: { lte: date },
          OR: [
            { effective_to: null },
            { effective_to: { gte: date } },
          ],
        },
        include: {
          feeType: {
            include: {
              specifications: {
                where: { is_active: true },
                orderBy: { sort_order: 'asc' },
              },
            },
          },
          specification: true,
        },
        orderBy: { created_at: 'asc' },
      });
    },
  };
}

/**
 * 默认 ApartmentFeeConfig Service 实例
 */
export const defaultApartmentFeeConfigService = createApartmentFeeConfigService();
