/**
 * 服务定价模块 - 数据访问层
 */
import type { Prisma, PrismaClient, StorefrontItem as PrismaStorefrontItem } from '@prisma/client';
import { ulid } from 'ulid';
import { prisma } from '../lib/prisma.js';
import { toPrismaInputJsonValue } from '../utils/json.js';

/** 定价折扣配置 */
export interface PricingDiscount {
  months: number;
  discount_type: 'gift' | 'percent' | 'fixed';
  discount_value: number | null;
  gift_months: number | null;
}

export type ServiceProductWithPricing = Prisma.ServiceProductGetPayload<{
  include: { pricing: true };
}>;

type StorefrontItemWithServicePayload = Prisma.StorefrontItemGetPayload<{
  include: { service: { include: { pricing: true } } };
}>;

type StorefrontConfigWithItemsPayload = Prisma.StorefrontConfigGetPayload<{
  include: {
    items: {
      include: { service: { include: { pricing: true } } };
    };
  };
}>;

export interface StorefrontItemRecord
  extends Omit<PrismaStorefrontItem, 'pricing_discounts'> {
  pricing_discounts: PricingDiscount[] | null;
  service?: ServiceProductWithPricing;
}

export interface StorefrontConfigWithItems
  extends Omit<StorefrontConfigWithItemsPayload, 'items'> {
  items: StorefrontItemRecord[];
}

function isJsonObject(value: Prisma.JsonValue): value is Prisma.JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parsePricingDiscounts(value: Prisma.JsonValue | null): PricingDiscount[] | null {
  if (value === null) return null;
  if (!Array.isArray(value)) {
    return null;
  }

  const discounts: PricingDiscount[] = [];

  for (const entry of value) {
    if (!isJsonObject(entry)) return null;

    const months = entry.months;
    const discountType = entry.discount_type;
    const discountValue = entry.discount_value;
    const giftMonths = entry.gift_months;

    if (typeof months !== 'number') return null;
    if (
      discountType !== 'gift' &&
      discountType !== 'percent' &&
      discountType !== 'fixed'
    ) {
      return null;
    }
    if (discountValue !== null && typeof discountValue !== 'number') return null;
    if (giftMonths !== null && typeof giftMonths !== 'number') return null;

    discounts.push({
      months,
      discount_type: discountType,
      discount_value: discountValue,
      gift_months: giftMonths,
    });
  }

  return discounts;
}

function normalizeStorefrontItem(
  item: PrismaStorefrontItem | StorefrontItemWithServicePayload
): StorefrontItemRecord {
  return {
    ...item,
    pricing_discounts: parsePricingDiscounts(item.pricing_discounts),
    service: 'service' in item ? item.service : undefined,
  };
}

function normalizeStorefrontConfig(
  config: StorefrontConfigWithItemsPayload
): StorefrontConfigWithItems {
  return {
    ...config,
    items: config.items.map(normalizeStorefrontItem),
  };
}

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
  listStorefronts(params?: { is_active?: boolean }): Promise<StorefrontConfigWithItems[]>;
  findStorefrontById(id: string): Promise<StorefrontConfigWithItems | null>;
  findStorefrontByCode(code: string): Promise<StorefrontConfigWithItems | null>;
  findDefaultStorefront(): Promise<StorefrontConfigWithItems | null>;
  createStorefront(data: {
    name: string;
    code: string;
    is_active?: boolean;
    is_default?: boolean;
  }): Promise<StorefrontConfigWithItems>;
  updateStorefront(id: string, data: {
    name?: string;
    is_active?: boolean;
    is_default?: boolean;
  }): Promise<StorefrontConfigWithItems>;
  deleteStorefront(id: string): Promise<void>;
  findStorefrontItemByService(storefrontId: string, serviceId: string): Promise<{
    id: string;
    storefront_id: string;
    service_id: string;
    is_visible: boolean;
    sort_order: number;
    pricing_discounts: PricingDiscount[] | null;
  } | null>;
  createStorefrontItem(data: {
    storefront_id: string;
    service_id: string;
    is_visible?: boolean;
    sort_order?: number;
    pricing_discounts?: PricingDiscount[];
  }): Promise<{
    id: string;
    storefront_id: string;
    service_id: string;
    is_visible: boolean;
    sort_order: number;
    pricing_discounts: PricingDiscount[] | null;
    created_at: Date;
    updated_at: Date;
  }>;
  updateStorefrontItem(id: string, data: {
    is_visible?: boolean;
    sort_order?: number;
    pricing_discounts?: PricingDiscount[];
  }): Promise<{
    id: string;
    storefront_id: string;
    service_id: string;
    is_visible: boolean;
    sort_order: number;
    pricing_discounts: PricingDiscount[] | null;
    created_at: Date;
    updated_at: Date;
  }>;
  deleteStorefrontItem(id: string): Promise<void>;
  reorderStorefrontItems(storefrontId: string, itemIds: string[]): Promise<void>;
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

    // ========================
    // 商店配置相关方法
    // ========================

    async listStorefronts(params?: { is_active?: boolean }): Promise<StorefrontConfigWithItems[]> {
      const configs = await db.storefrontConfig.findMany({
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
        orderBy: { created_at: 'desc' },
      });
      return configs.map(normalizeStorefrontConfig);
    },

    async findStorefrontById(id: string): Promise<StorefrontConfigWithItems | null> {
      const config = await db.storefrontConfig.findUnique({
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
      });
      return config ? normalizeStorefrontConfig(config) : null;
    },

    async findStorefrontByCode(code: string): Promise<StorefrontConfigWithItems | null> {
      const config = await db.storefrontConfig.findUnique({
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
      });
      return config ? normalizeStorefrontConfig(config) : null;
    },

    async findDefaultStorefront(): Promise<StorefrontConfigWithItems | null> {
      const config = await db.storefrontConfig.findFirst({
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
      });
      return config ? normalizeStorefrontConfig(config) : null;
    },

    async createStorefront(data: {
      name: string;
      code: string;
      is_active?: boolean;
      is_default?: boolean;
    }): Promise<StorefrontConfigWithItems> {
      // 如果设置为默认，需要先取消其他默认标记
      if (data.is_default) {
        await db.storefrontConfig.updateMany({
          where: { is_default: true },
          data: { is_default: false },
        });
      }

      const config = await db.storefrontConfig.create({
        data: {
          id: ulid(),
          name: data.name,
          code: data.code,
          is_active: data.is_active ?? true,
          is_default: data.is_default ?? false,
        },
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
      });
      return normalizeStorefrontConfig(config);
    },

    async updateStorefront(
      id: string,
      data: { name?: string; is_active?: boolean; is_default?: boolean }
    ): Promise<StorefrontConfigWithItems> {
      // 如果设置为默认，需要先取消其他默认标记
      if (data.is_default) {
        await db.storefrontConfig.updateMany({
          where: { is_default: true, is_active: true },
          data: { is_default: false },
        });
      }

      const config = await db.storefrontConfig.update({
        where: { id },
        data,
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
      });
      return normalizeStorefrontConfig(config);
    },

    async deleteStorefront(id: string): Promise<void> {
      await db.storefrontConfig.delete({ where: { id } });
    },

    // ========================
    // 商店项相关方法
    // ========================

    async findStorefrontItemByService(
      storefrontId: string,
      serviceId: string
    ): Promise<{
      id: string;
      storefront_id: string;
      service_id: string;
      is_visible: boolean;
      sort_order: number;
      pricing_discounts: PricingDiscount[] | null;
    } | null> {
      const item = await db.storefrontItem.findFirst({
        where: { storefront_id: storefrontId, service_id: serviceId },
      });
      return item ? normalizeStorefrontItem(item) : null;
    },

    async createStorefrontItem(data: {
      storefront_id: string;
      service_id: string;
      is_visible?: boolean;
      sort_order?: number;
      pricing_discounts?: PricingDiscount[];
    }): Promise<{
      id: string;
      storefront_id: string;
      service_id: string;
      is_visible: boolean;
      sort_order: number;
      pricing_discounts: PricingDiscount[] | null;
      created_at: Date;
      updated_at: Date;
    }> {
      const item = await db.storefrontItem.create({
        data: {
          id: ulid(),
          storefront_id: data.storefront_id,
          service_id: data.service_id,
          is_visible: data.is_visible ?? true,
          sort_order: data.sort_order ?? 0,
          pricing_discounts:
            data.pricing_discounts === undefined
              ? undefined
              : toPrismaInputJsonValue(data.pricing_discounts),
        },
      });
      return normalizeStorefrontItem(item);
    },

    async updateStorefrontItem(
      id: string,
      data: { is_visible?: boolean; sort_order?: number; pricing_discounts?: PricingDiscount[] }
    ): Promise<{
      id: string;
      storefront_id: string;
      service_id: string;
      is_visible: boolean;
      sort_order: number;
      pricing_discounts: PricingDiscount[] | null;
      created_at: Date;
      updated_at: Date;
    }> {
      const updateData: Prisma.StorefrontItemUpdateInput = {};
      if (data.is_visible !== undefined) updateData.is_visible = data.is_visible;
      if (data.sort_order !== undefined) updateData.sort_order = data.sort_order;
      if (data.pricing_discounts !== undefined) {
        updateData.pricing_discounts = toPrismaInputJsonValue(data.pricing_discounts);
      }

      const item = await db.storefrontItem.update({
        where: { id },
        data: updateData,
      });
      return normalizeStorefrontItem(item);
    },

    async deleteStorefrontItem(id: string): Promise<void> {
      await db.storefrontItem.delete({ where: { id } });
    },

    async reorderStorefrontItems(_storefrontId: string, itemIds: string[]): Promise<void> {
      for (let i = 0; i < itemIds.length; i++) {
        await db.storefrontItem.update({
          where: { id: itemIds[i] },
          data: { sort_order: i },
        });
      }
    },
  };
}

/**
 * 默认服务产品仓库实例
 */
export const defaultServiceProductRepository = createServiceProductRepository();
