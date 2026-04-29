/**
 * 服务定价模块 - 业务逻辑层
 */
import type {
  ServiceProduct,
} from '@apartment-ultra/api-contract';
import {
  createServiceProductRepository,
  type ServiceProductRepository,
  type ServiceProductWithPricing,
} from '../repositories/service-product.repo.js';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../errors/index.js';

/** 服务产品服务接口 */
export interface ServiceProductService {
  // 服务产品
  listServiceProducts(params?: { is_active?: boolean; include_pricing?: boolean }): Promise<ServiceProduct[]>;
  getServiceProductById(id: string): Promise<ServiceProduct | null>;
  getServiceProductByCode(code: string): Promise<ServiceProduct | null>;
  createServiceProduct(data: {
    name: string;
    code: string;
    description?: string;
    max_organizations?: number | null;
    max_apartments?: number;
    max_rooms?: number;
    max_members?: number;
    is_active?: boolean;
    sort_order?: number;
    pricing?: Array<{
      months: number;
      price: number;
      is_active?: boolean;
      sort_order?: number;
    }>;
  }): Promise<ServiceProduct | null>;
  updateServiceProduct(id: string, data: {
    name?: string;
    description?: string | null;
    max_organizations?: number | null;
    max_apartments?: number;
    max_rooms?: number;
    max_members?: number;
    is_active?: boolean;
    sort_order?: number;
  }): Promise<ServiceProduct>;
  deleteServiceProduct(id: string): Promise<void>;
  batchUpdatePricing(serviceId: string, pricingData: Array<{
    months: number;
    price: number;
    is_active?: boolean;
    sort_order?: number;
  }>): Promise<ServiceProduct>;
}

/**
 * 创建服务产品服务实例
 */
export function createServiceProductService(
  getRepo: () => ServiceProductRepository = () => createServiceProductRepository(prisma)
): ServiceProductService {
  // 私有辅助方法
  function toServiceProduct(product: ServiceProductWithPricing): ServiceProduct {
    return {
      id: product.id,
      name: product.name,
      code: product.code,
      description: product.description,
      max_organizations: product.max_organizations,
      max_apartments: product.max_apartments,
      max_rooms: product.max_rooms,
      max_members: product.max_members,
      is_active: product.is_active,
      sort_order: product.sort_order,
      created_at: product.created_at.toISOString(),
      updated_at: product.updated_at.toISOString(),
      pricing: product.pricing?.map((p) => ({
        id: p.id,
        service_id: p.service_id,
        months: p.months,
        price: Number(p.price),
        is_active: p.is_active,
        sort_order: p.sort_order,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })),
    };
  }

  return {
    // ========================
    // 服务产品相关方法
    // ========================

    async listServiceProducts(params?: { is_active?: boolean; include_pricing?: boolean }) {
      const products = await getRepo().list(params);
      return products.map(toServiceProduct);
    },

    async getServiceProductById(id: string) {
      const product = await getRepo().findById(id, true);
      if (!product) return null;
      return toServiceProduct(product);
    },

    async getServiceProductByCode(code: string) {
      const product = await getRepo().findByCode(code);
      if (!product) return null;
      return toServiceProduct(product);
    },

    async createServiceProduct(data: {
      name: string;
      code: string;
      description?: string;
      max_organizations?: number;
      max_apartments?: number;
      max_rooms?: number;
      max_members?: number;
      is_active?: boolean;
      sort_order?: number;
      pricing?: Array<{
        months: number;
        price: number;
        is_active?: boolean;
        sort_order?: number;
      }>;
    }) {
      const repo = getRepo();
      // 检查代码是否已存在
      const existing = await repo.findByCode(data.code);
      if (existing) {
        throw new AppError({ message: `服务产品代码已存在: ${data.code}`, statusCode: 400 });
      }

      const product = await repo.create({
        name: data.name,
        code: data.code,
        description: data.description,
        max_organizations: data.max_organizations,
        max_apartments: data.max_apartments ?? 1,
        max_rooms: data.max_rooms ?? 100,
        max_members: data.max_members ?? 1,
        is_active: data.is_active ?? true,
        sort_order: data.sort_order ?? 0,
      });

      // 创建定价
      if (data.pricing && data.pricing.length > 0) {
        await repo.upsertPricing(product.id, data.pricing);
      }

      return this.getServiceProductById(product.id);
    },

    async updateServiceProduct(
      id: string,
      data: {
        name?: string;
        description?: string | null;
        max_organizations?: number | null;
        max_apartments?: number;
        max_rooms?: number;
        max_members?: number;
        is_active?: boolean;
        sort_order?: number;
      }
    ) {
      const repo = getRepo();
      const existing = await repo.findById(id, false);
      if (!existing) {
        throw new AppError({ message: `服务产品不存在: ${id}`, statusCode: 404 });
      }

      const product = await repo.update(id, data);
      return toServiceProduct(product);
    },

    async deleteServiceProduct(id: string) {
      const repo = getRepo();
      const existing = await repo.findById(id, false);
      if (!existing) {
        throw new AppError({ message: `服务产品不存在: ${id}`, statusCode: 404 });
      }

      await repo.delete(id);
    },

    async batchUpdatePricing(
      serviceId: string,
      pricingData: Array<{
        months: number;
        price: number;
        is_active?: boolean;
        sort_order?: number;
      }>
    ) {
      const repo = getRepo();
      const existing = await repo.findById(serviceId, false);
      if (!existing) {
        throw new AppError({ message: `服务产品不存在: ${serviceId}`, statusCode: 404 });
      }

      await repo.upsertPricing(serviceId, pricingData);

      const product = await repo.findById(serviceId, true);
      return toServiceProduct(product!);
    },
  };
}

/**
 * 默认服务产品服务实例
 */
export const defaultServiceProductService = createServiceProductService();
