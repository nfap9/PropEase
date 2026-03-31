import type { FeeType, FeeSpecification } from '@prisma/client';
import { ulid } from 'ulid';
import { prisma } from '../lib/prisma.js';
import { createAppError } from '../utils/appError.js';

/**
 * 创建费用类型输入
 */
export interface CreateFeeTypeInput {
  name: string;
  code: string;
  description?: string;
  category?: string;
  specifications?: CreateFeeSpecificationInput[];
}

/**
 * 更新费用类型输入
 */
export interface UpdateFeeTypeInput {
  name?: string;
  description?: string;
  category?: string;
  is_active?: boolean;
  sort_order?: number;
}

/**
 * 创建费用规格输入
 */
export interface CreateFeeSpecificationInput {
  name: string;
  description?: string;
  price_monthly: number;
  price_yearly?: number;
  unit?: string;
  is_default?: boolean;
  sort_order?: number;
}

/**
 * 更新费用规格输入
 */
export interface UpdateFeeSpecificationInput {
  name?: string;
  description?: string;
  price_monthly?: number;
  price_yearly?: number;
  unit?: string;
  is_default?: boolean;
  is_active?: boolean;
  sort_order?: number;
}

/**
 * 费用类型包含规格
 */
export type FeeTypeWithSpecifications = FeeType & {
  specifications: FeeSpecification[];
};

/**
 * FeeType Service 接口
 */
export interface FeeTypeService {
  list(orgId: string): Promise<FeeTypeWithSpecifications[]>;
  getById(orgId: string, id: string): Promise<FeeTypeWithSpecifications>;
  create(orgId: string, data: CreateFeeTypeInput): Promise<FeeTypeWithSpecifications>;
  update(orgId: string, id: string, data: UpdateFeeTypeInput): Promise<FeeType>;
  delete(orgId: string, id: string): Promise<void>;
  getSpecificationById(orgId: string, specificationId: string): Promise<FeeSpecification>;
  addSpecification(orgId: string, feeTypeId: string, data: CreateFeeSpecificationInput): Promise<FeeSpecification>;
  updateSpecification(orgId: string, specificationId: string, data: UpdateFeeSpecificationInput): Promise<FeeSpecification>;
  deleteSpecification(orgId: string, specificationId: string): Promise<void>;
}

/**
 * 验证费用类型归属
 */
async function validateFeeTypeOwnership(feeTypeId: string, orgId: string): Promise<FeeType> {
  const feeType = await prisma.feeType.findFirst({
    where: { id: feeTypeId, organization_id: orgId },
  });
  if (!feeType) {
    throw createAppError(404, '费用类型不存在');
  }
  return feeType;
}

/**
 * 验证规格归属
 */
async function validateSpecificationOwnership(specificationId: string, orgId: string): Promise<FeeSpecification> {
  const spec = await prisma.feeSpecification.findFirst({
    where: { id: specificationId },
    include: { feeType: true },
  });
  if (!spec || spec.feeType.organization_id !== orgId) {
    throw createAppError(404, '费用规格不存在');
  }
  return spec;
}

/**
 * 创建 FeeType Service 实例
 */
export function createFeeTypeService(): FeeTypeService {
  return {
    list: async (orgId: string) => {
      // 查询系统类型(organization_id为null)和组织自定义类型
      const [systemTypes, orgTypes] = await Promise.all([
        prisma.feeType.findMany({
          where: { organization_id: null, is_active: true },
          include: { specifications: { where: { is_active: true }, orderBy: { sort_order: 'asc' } } },
          orderBy: { sort_order: 'asc' },
        }),
        prisma.feeType.findMany({
          where: { organization_id: orgId, is_active: true },
          include: { specifications: { where: { is_active: true }, orderBy: { sort_order: 'asc' } } },
          orderBy: { sort_order: 'asc' },
        }),
      ]);
      // 系统类型在前，组织类型在后
      return [...systemTypes, ...orgTypes];
    },

    getById: async (orgId: string, id: string) => {
      const feeType = await prisma.feeType.findFirst({
        where: { id, organization_id: orgId, is_active: true },
        include: { specifications: { where: { is_active: true }, orderBy: { sort_order: 'asc' } } },
      });
      if (!feeType) {
        throw createAppError(404, '费用类型不存在');
      }
      return feeType;
    },

    create: async (orgId: string, data: CreateFeeTypeInput) => {
      // 检查 code 是否已存在
      const existing = await prisma.feeType.findFirst({
        where: { organization_id: orgId, code: data.code },
      });
      if (existing) {
        throw createAppError(400, '费用类型编码已存在');
      }

      const feeTypeId = ulid().toLowerCase();
      const specificationsData = (data.specifications || []).map((spec, index) => ({
        id: ulid().toLowerCase(),
        name: spec.name,
        description: spec.description,
        price_monthly: spec.price_monthly,
        price_yearly: spec.price_yearly,
        unit: spec.unit,
        is_default: spec.is_default ?? false,
        is_active: true,
        sort_order: spec.sort_order ?? index,
      }));

      const feeType = await prisma.feeType.create({
        data: {
          id: feeTypeId,
          organization_id: orgId,
          name: data.name,
          code: data.code,
          description: data.description,
          category: data.category ?? 'fixed',
          is_active: true,
          sort_order: 0,
          specifications: {
            create: specificationsData,
          },
        },
        include: {
          specifications: { orderBy: { sort_order: 'asc' } },
        },
      });

      return feeType;
    },

    update: async (orgId: string, id: string, data: UpdateFeeTypeInput) => {
      await validateFeeTypeOwnership(id, orgId);
      return prisma.feeType.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description,
          category: data.category,
          is_active: data.is_active,
          sort_order: data.sort_order,
        },
      });
    },

    delete: async (orgId: string, id: string) => {
      await validateFeeTypeOwnership(id, orgId);
      // 软删除
      await prisma.feeType.update({
        where: { id },
        data: { is_active: false },
      });
    },

    getSpecificationById: async (orgId: string, specificationId: string) => {
      return validateSpecificationOwnership(specificationId, orgId);
    },

    addSpecification: async (orgId: string, feeTypeId: string, data: CreateFeeSpecificationInput) => {
      await validateFeeTypeOwnership(feeTypeId, orgId);
      return prisma.feeSpecification.create({
        data: {
          id: ulid().toLowerCase(),
          fee_type_id: feeTypeId,
          name: data.name,
          description: data.description,
          price_monthly: data.price_monthly,
          price_yearly: data.price_yearly,
          unit: data.unit,
          is_default: data.is_default ?? false,
          is_active: true,
          sort_order: data.sort_order ?? 0,
        },
      });
    },

    updateSpecification: async (orgId: string, specificationId: string, data: UpdateFeeSpecificationInput) => {
      await validateSpecificationOwnership(specificationId, orgId);
      return prisma.feeSpecification.update({
        where: { id: specificationId },
        data: {
          name: data.name,
          description: data.description,
          price_monthly: data.price_monthly,
          price_yearly: data.price_yearly,
          unit: data.unit,
          is_default: data.is_default,
          is_active: data.is_active,
          sort_order: data.sort_order,
        },
      });
    },

    deleteSpecification: async (orgId: string, specificationId: string) => {
      await validateSpecificationOwnership(specificationId, orgId);
      // 软删除
      await prisma.feeSpecification.update({
        where: { id: specificationId },
        data: { is_active: false },
      });
    },
  };
}

/**
 * 默认 FeeType Service 实例
 */
export const defaultFeeTypeService = createFeeTypeService();
