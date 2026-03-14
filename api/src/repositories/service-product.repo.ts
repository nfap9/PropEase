/**
 * 服务定价模块 - 数据访问层
 */
import type { PrismaClient } from '@prisma/client';
import { singleton, inject } from '@joufe/ts-registry';
import { prisma } from '../lib/prisma.js';

export interface ServiceProductWithPricing {
  id: string;
  name: string;
  code: string;
  description: string | null;
  max_organizations: number | null;
  max_apartments: number;
  max_rooms: number;
  max_members: number;
  is_active: boolean;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
  pricing: Array<{
    id: string;
    service_id: string;
    months: number;
    price: bigint;
    is_active: boolean;
    sort_order: number;
  }>;
}

export interface StorefrontConfigWithItems {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
  is_default: boolean;
  created_at: Date;
  updated_at: Date;
  items: Array<{
    id: string;
    storefront_id: string;
    service_id: string;
    is_visible: boolean;
    sort_order: number;
    pricing_discounts: any;
    service: ServiceProductWithPricing;
  }>;
}

@singleton()
export class ServiceProductRepo {
  constructor(@inject(() => prisma) private readonly prisma: PrismaClient) {}

  // ========================
  // 服务产品相关方法
  // ========================

  /** 列表查询 */
  async list(params?: { is_active?: boolean; include_pricing?: boolean }): Promise<ServiceProductWithPricing[]> {
    return this.prisma.serviceProduct.findMany({
      where: params?.is_active !== undefined ? { is_active: params.is_active } : undefined,
      include: params?.include_pricing ? { pricing: { orderBy: { sort_order: 'asc' } } } : undefined,
      orderBy: { sort_order: 'asc' },
    }) as unknown as ServiceProductWithPricing[];
  }

  /** 根据 ID 查询 */
  async findById(id: string, includePricing = true): Promise<ServiceProductWithPricing | null> {
    return this.prisma.serviceProduct.findUnique({
      where: { id },
      include: includePricing ? { pricing: { orderBy: { sort_order: 'asc' } } } : undefined,
    }) as unknown as ServiceProductWithPricing | null;
  }

  /** 根据代码查询 */
  async findByCode(code: string): Promise<ServiceProductWithPricing | null> {
    return this.prisma.serviceProduct.findUnique({
      where: { code },
      include: { pricing: { orderBy: { sort_order: 'asc' } } },
    }) as unknown as ServiceProductWithPricing | null;
  }

  /** 创建 */
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
    return this.prisma.serviceProduct.create({
      data: {
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
      include: { pricing: true },
    }) as unknown as ServiceProductWithPricing;
  }

  /** 更新 */
  async update(
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
  ): Promise<ServiceProductWithPricing> {
    return this.prisma.serviceProduct.update({
      where: { id },
      data,
      include: { pricing: { orderBy: { sort_order: 'asc' } } },
    }) as unknown as ServiceProductWithPricing;
  }

  /** 删除 */
  async delete(id: string): Promise<void> {
    await this.prisma.serviceProduct.delete({ where: { id } });
  }

  // ========================
  // 服务定价相关方法
  // ========================

  /** 获取服务定价列表 */
  async listPricing(serviceId: string): Promise<
    Array<{
      id: string;
      service_id: string;
      months: number;
      price: bigint;
      is_active: boolean;
      sort_order: number;
    }>
  > {
    return this.prisma.servicePricing.findMany({
      where: { service_id: serviceId },
      orderBy: { sort_order: 'asc' },
    });
  }

  /** 批量更新服务定价 */
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
      const existing = await this.prisma.servicePricing.findFirst({
        where: { service_id: serviceId, months: item.months },
      });

      if (existing) {
        await this.prisma.servicePricing.update({
          where: { id: existing.id },
          data: {
            price: item.price,
            is_active: item.is_active ?? existing.is_active,
            sort_order: item.sort_order ?? existing.sort_order,
          },
        });
      } else {
        await this.prisma.servicePricing.create({
          data: {
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
      await this.prisma.servicePricing.deleteMany({
        where: { service_id: serviceId, months },
      });
    }
  }

  /** 删除单个定价 */
  async deletePricing(id: string): Promise<void> {
    await this.prisma.servicePricing.delete({ where: { id } });
  }

  // ========================
  // 商店配置相关方法
  // ========================

  /** 列表查询 */
  async listStorefronts(params?: { is_active?: boolean }): Promise<StorefrontConfigWithItems[]> {
    return this.prisma.storefrontConfig.findMany({
      where: params?.is_active !== undefined ? { is_active: params.is_active } : undefined,
      include: {
        items: {
          include: {
            service: {
              include: { pricing: { orderBy: { sort_order: 'asc' } } },
            },
          },
          orderBy: { sort_order: 'asc' },
        },
      },
      orderBy: { sort_order: 'asc' },
    }) as unknown as StorefrontConfigWithItems[];
  }

  /** 根据 ID 查询 */
  async findStorefrontById(id: string): Promise<StorefrontConfigWithItems | null> {
    return this.prisma.storefrontConfig.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            service: {
              include: { pricing: { orderBy: { sort_order: 'asc' } } },
            },
          },
          orderBy: { sort_order: 'asc' },
        },
      },
    }) as unknown as StorefrontConfigWithItems | null;
  }

  /** 根据代码查询 */
  async findStorefrontByCode(code: string): Promise<StorefrontConfigWithItems | null> {
    return this.prisma.storefrontConfig.findUnique({
      where: { code },
      include: {
        items: {
          include: {
            service: {
              include: { pricing: { orderBy: { sort_order: 'asc' } } },
            },
          },
          orderBy: { sort_order: 'asc' },
        },
      },
    }) as unknown as StorefrontConfigWithItems | null;
  }

  /** 获取默认商店配置 */
  async findDefaultStorefront(): Promise<StorefrontConfigWithItems | null> {
    return this.prisma.storefrontConfig.findFirst({
      where: { is_default: true, is_active: true },
      include: {
        items: {
          include: {
            service: {
              include: { pricing: { orderBy: { sort_order: 'asc' } } },
            },
          },
          orderBy: { sort_order: 'asc' },
        },
      },
    }) as unknown as StorefrontConfigWithItems | null;
  }

  /** 创建商店配置 */
  async createStorefront(data: {
    name: string;
    code: string;
    is_active?: boolean;
    is_default?: boolean;
  }): Promise<StorefrontConfigWithItems> {
    // 如果设置为默认，需要先取消其他默认标记
    if (data.is_default) {
      await this.prisma.storefrontConfig.updateMany({
        where: { is_default: true },
        data: { is_default: false },
      });
    }

    return this.prisma.storefrontConfig.create({
      data: {
        name: data.name,
        code: data.code,
        is_active: data.is_active ?? true,
        is_default: data.is_default ?? false,
      },
      include: { items: true },
    }) as unknown as StorefrontConfigWithItems;
  }

  /** 更新商店配置 */
  async updateStorefront(
    id: string,
    data: { name?: string; is_active?: boolean; is_default?: boolean }
  ): Promise<StorefrontConfigWithItems> {
    // 如果设置为默认，需要先取消其他默认标记
    if (data.is_default) {
      await this.prisma.storefrontConfig.updateMany({
        where: { is_default: true, is_active: true },
        data: { is_default: false },
      });
    }

    return this.prisma.storefrontConfig.update({
      where: { id },
      data,
      include: { items: true },
    }) as unknown as StorefrontConfigWithItems;
  }

  /** 删除商店配置 */
  async deleteStorefront(id: string): Promise<void> {
    await this.prisma.storefrontConfig.delete({ where: { id } });
  }

  // ========================
  // 商店项相关方法
  // ========================

  /** 根据服务 ID 查询商店项 */
  async findStorefrontItemByService(
    storefrontId: string,
    serviceId: string
  ): Promise<{
    id: string;
    storefront_id: string;
    service_id: string;
    is_visible: boolean;
    sort_order: number;
    pricing_discounts: any;
  } | null> {
    return this.prisma.storefrontItem.findUnique({
      where: { storefront_id: storefrontId, service_id: serviceId },
    });
  }

  /** 创建商店项 */
  async createStorefrontItem(data: {
    storefront_id: string;
    service_id: string;
    is_visible?: boolean;
    sort_order?: number;
    pricing_discounts?: any;
  }): Promise<{
    id: string;
    storefront_id: string;
    service_id: string;
    is_visible: boolean;
    sort_order: number;
    pricing_discounts: any;
  }> {
    return this.prisma.storefrontItem.create({
      data: {
        storefront_id: data.storefront_id,
        service_id: data.service_id,
        is_visible: data.is_visible ?? true,
        sort_order: data.sort_order ?? 0,
        pricing_discounts: data.pricing_discounts,
      },
    });
  }

  /** 更新商店项 */
  async updateStorefrontItem(
    id: string,
    data: { is_visible?: boolean; sort_order?: number; pricing_discounts?: any }
  ): Promise<{
    id: string;
    storefront_id: string;
    service_id: string;
    is_visible: boolean;
    sort_order: number;
    pricing_discounts: any;
  }> {
    return this.prisma.storefrontItem.update({
      where: { id },
      data,
    });
  }

  /** 删除商店项 */
  async deleteStorefrontItem(id: string): Promise<void> {
    await this.prisma.storefrontItem.delete({ where: { id } });
  }

  /** 批量更新商店项排序 */
  async reorderStorefrontItems(storefrontId: string, itemIds: string[]): Promise<void> {
    for (let i = 0; i < itemIds.length; i++) {
      await this.prisma.storefrontItem.update({
        where: { id: itemIds[i] },
        data: { sort_order: i },
      });
    }
  }
}
