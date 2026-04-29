/**
 * 服务定价模块 - 数据访问层
 */
import type { Prisma, PrismaClient } from '@prisma/client';
import { ulid } from 'ulid';
import { prisma } from '../lib/prisma.js';

export type ServiceProductWithPricing = Prisma.ServiceProductGetPayload<{
  include: { pricing: true };
}>;

/** 服务产品仓库接口 */
export interface ServiceProductRepository {
  list(params?: { is_active?: boolean; include_pricing?: boolean }): Promise<ServiceProductWithPricing[]>;
  findById(id: string, includePricing?: boolean): Promise<ServiceProductWithPricing | null>;
  findByCode(code: string): Promise<ServiceProductWithPricing | null>;
  create(data: {
    name: string;
    code: string;
    description?: string;
    max_organizations?: number | null;
    max_apartments?: number;
    max_rooms?: number;
    max_members?: number;
    is_active?: boolean;
    sort_order?: number;
  }): Promise<ServiceProductWithPricing>;
  update(id: string, data: {
    name?: string;
    description?: string | null;
    max_organizations?: number | null;
    max_apartments?: number;
    max_rooms?: number;
    max_members?: number;
    is_active?: boolean;
    sort_order?: number;
  }): Promise<ServiceProductWithPricing>;
  delete(id: string): Promise<void>;
  listPricing(serviceId: string): Promise<Array<{
    id: string;
    service_id: string;
    months: number;
    price: number;
    is_active: boolean;
    sort_order: number;
  }>>;
  upsertPricing(serviceId: string, pricingData: Array<{
    months: number;
    price: number;
    is_active?: boolean;
    sort_order?: number;
  }>): Promise<void>;
  deletePricing(id: string): Promise<void>;
}

/**
 * 创建服务产品仓库实例
 */
export function createServiceProductRepository(db: PrismaClient = prisma): ServiceProductRepository {
  return {
    // ========================
    // 服务产品相关方法
    // ========================

    async list(params?: { is_active?: boolean; include_pricing?: boolean }): Promise<ServiceProductWithPricing[]> {
      return db.serviceProduct.findMany({
        where: params?.is_active !== undefined ? { is_active: params.is_active } : undefined,
        include: { pricing: { orderBy: { sort_order: 'asc' } } },
        orderBy: { sort_order: 'asc' },
      });
    },

    async findById(id: string, includePricing = true): Promise<ServiceProductWithPricing | null> {
      void includePricing;
      return db.serviceProduct.findUnique({
        where: { id },
        include: { pricing: { orderBy: { sort_order: 'asc' } } },
      });
    },

    async findByCode(code: string): Promise<ServiceProductWithPricing | null> {
      return db.serviceProduct.findUnique({
        where: { code },
        include: { pricing: { orderBy: { sort_order: 'asc' } } },
      });
    },

    async create(data: {
      name: string;
      code: string;
      description?: string;
      max_organizations?: number | null;
      max_apartments?: number;
      max_rooms?: number;
      max_members?: number;
      is_active?: boolean;
      sort_order?: number;
    }): Promise<ServiceProductWithPricing> {
      return db.serviceProduct.create({
        data: {
          id: ulid(),
          name: data.name,
          code: data.code,
          description: data.description,
          max_organizations: data.max_organizations,
          max_apartments: data.max_apartments ?? 1,
          max_rooms: data.max_rooms ?? 100,
          max_members: data.max_members ?? 1,
          is_active: data.is_active ?? true,
          sort_order: data.sort_order ?? 0,
        },
        include: { pricing: { orderBy: { sort_order: 'asc' } } },
      });
    },

    async update(id: string, data: {
      name?: string;
      description?: string | null;
      max_organizations?: number | null;
      max_apartments?: number;
      max_rooms?: number;
      max_members?: number;
      is_active?: boolean;
      sort_order?: number;
    }): Promise<ServiceProductWithPricing> {
      return db.serviceProduct.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description ?? undefined,
          max_organizations: data.max_organizations ?? undefined,
          max_apartments: data.max_apartments,
          max_rooms: data.max_rooms,
          max_members: data.max_members,
          is_active: data.is_active,
          sort_order: data.sort_order,
        },
        include: { pricing: { orderBy: { sort_order: 'asc' } } },
      });
    },

    async delete(id: string): Promise<void> {
      await db.serviceProduct.delete({ where: { id } });
    },

    // ========================
    // 服务定价相关方法
    // ========================

    async listPricing(serviceId: string): Promise<Array<{
      id: string;
      service_id: string;
      months: number;
      price: number;
      is_active: boolean;
      sort_order: number;
    }>> {
      const result = await db.servicePricing.findMany({
        where: { service_id: serviceId },
        orderBy: { sort_order: 'asc' },
      });
      return result.map(p => ({
        ...p,
        price: Number(p.price),
      }));
    },

    async upsertPricing(
      serviceId: string,
      pricingData: Array<{
        months: number;
        price: number;
        is_active?: boolean;
        sort_order?: number;
      }>
    ): Promise<void> {
      for (const item of pricingData) {
        const existing = await db.servicePricing.findFirst({
          where: { service_id: serviceId, months: item.months },
        });

        if (existing) {
          await db.servicePricing.update({
            where: { id: existing.id },
            data: {
              price: item.price,
              is_active: item.is_active ?? existing.is_active,
              sort_order: item.sort_order ?? existing.sort_order,
            },
          });
        } else {
          await db.servicePricing.create({
            data: {
              id: ulid(),
              service_id: serviceId,
              months: item.months,
              price: item.price,
              is_active: item.is_active ?? true,
              sort_order: item.sort_order ?? 0,
            },
          });
        }
      }

      // 删除不再需要的定价
      const existingPricing = await this.listPricing(serviceId);
      const existingMonths = existingPricing.map((p) => p.months);
      const newMonths = pricingData.map((p) => p.months);
      const toDelete = existingMonths.filter((m) => !newMonths.includes(m));

      for (const months of toDelete) {
        await db.servicePricing.deleteMany({
          where: { service_id: serviceId, months },
        });
      }
    },

    async deletePricing(id: string): Promise<void> {
      await db.servicePricing.delete({ where: { id } });
    },
  };
}

/**
 * 默认服务产品仓库实例
 */
export const defaultServiceProductRepository = createServiceProductRepository();
