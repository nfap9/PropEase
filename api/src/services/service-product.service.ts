/**
 * 服务定价模块 - 业务逻辑层
 */
import type {
  PricingDiscount,
  ServiceProduct,
  StorefrontConfig,
  StorefrontItem,
  StorefrontView,
  StorefrontViewService,
} from '@apartment-ultra/api-contract';
import {
  createServiceProductRepository,
  type ServiceProductRepository,
  type ServiceProductWithPricing,
  type StorefrontConfigWithItems,
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

  // 商店配置
  listStorefronts(params?: { is_active?: boolean }): Promise<StorefrontConfig[]>;
  getStorefrontById(id: string): Promise<StorefrontConfig | null>;
  getStorefrontByCode(code: string): Promise<StorefrontConfig | null>;
  getDefaultStorefront(): Promise<StorefrontConfig | null>;
  createStorefront(data: { name: string; code: string; is_active?: boolean; is_default?: boolean }): Promise<StorefrontConfig>;
  updateStorefront(id: string, data: { name?: string; is_active?: boolean; is_default?: boolean }): Promise<StorefrontConfig>;
  deleteStorefront(id: string): Promise<void>;

  // 商店项
  addServiceToStorefront(storefrontId: string, data: {
    service_id: string;
    is_visible?: boolean;
    sort_order?: number;
    pricing_discounts?: PricingDiscount[];
  }): Promise<StorefrontItem>;
  updateStorefrontItem(itemId: string, data: {
    is_visible?: boolean;
    sort_order?: number;
    pricing_discounts?: PricingDiscount[];
  }): Promise<StorefrontItem>;
  removeServiceFromStorefront(itemId: string): Promise<void>;
  reorderStorefrontItems(storefrontId: string, itemIds: string[]): Promise<void>;

  // 商店视图
  getStorefrontView(storefrontId?: string): Promise<StorefrontView | null>;
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

  function toStorefrontConfig(config: StorefrontConfigWithItems): StorefrontConfig {
    return {
      id: config.id,
      name: config.name,
      code: config.code,
      is_active: config.is_active,
      is_default: config.is_default,
      created_at: config.created_at.toISOString(),
      updated_at: config.updated_at.toISOString(),
      items: config.items?.map(toStorefrontItem),
    };
  }

  function toStorefrontItem(item: StorefrontConfigWithItems['items'][0]): StorefrontItem {
    return {
      id: item.id,
      storefront_id: item.storefront_id,
      service_id: item.service_id,
      service: item.service ? toServiceProduct(item.service) : undefined,
      is_visible: item.is_visible,
      sort_order: item.sort_order,
      pricing_discounts: item.pricing_discounts,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  function findDiscount(
    discounts: PricingDiscount[] | null,
    months: number
  ): PricingDiscount | undefined {
    if (!discounts) return undefined;
    return discounts.find((d) => d.months === months);
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
        description?: string;
        max_organizations?: number;
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

    // ========================
    // 商店配置相关方法
    // ========================

    async listStorefronts(params?: { is_active?: boolean }) {
      const configs = await getRepo().listStorefronts(params);
      return configs.map(toStorefrontConfig);
    },

    async getStorefrontById(id: string) {
      const config = await getRepo().findStorefrontById(id);
      if (!config) return null;
      return toStorefrontConfig(config);
    },

    async getStorefrontByCode(code: string) {
      const config = await getRepo().findStorefrontByCode(code);
      if (!config) return null;
      return toStorefrontConfig(config);
    },

    async getDefaultStorefront() {
      const config = await getRepo().findDefaultStorefront();
      if (!config) return null;
      return toStorefrontConfig(config);
    },

    async createStorefront(data: { name: string; code: string; is_active?: boolean; is_default?: boolean }) {
      const repo = getRepo();
      // 检查代码是否已存在
      const existing = await repo.findStorefrontByCode(data.code);
      if (existing) {
        throw new AppError({ message: `商店配置代码已存在: ${data.code}`, statusCode: 400 });
      }

      const config = await repo.createStorefront(data);
      return toStorefrontConfig(config);
    },

    async updateStorefront(
      id: string,
      data: { name?: string; is_active?: boolean; is_default?: boolean }
    ) {
      const repo = getRepo();
      const existing = await repo.findStorefrontById(id);
      if (!existing) {
        throw new AppError({ message: `商店配置不存在: ${id}`, statusCode: 404 });
      }

      const config = await repo.updateStorefront(id, data);
      return toStorefrontConfig(config);
    },

    async deleteStorefront(id: string) {
      const repo = getRepo();
      const existing = await repo.findStorefrontById(id);
      if (!existing) {
        throw new AppError({ message: `商店配置不存在: ${id}`, statusCode: 404 });
      }

      await repo.deleteStorefront(id);
    },

    // ========================
    // 商店项相关方法
    // ========================

    async addServiceToStorefront(
      storefrontId: string,
      data: {
        service_id: string;
        is_visible?: boolean;
        sort_order?: number;
        pricing_discounts?: PricingDiscount[];
      }
    ) {
      const repo = getRepo();
      // 检查商店是否存在
      const storefront = await repo.findStorefrontById(storefrontId);
      if (!storefront) {
        throw new AppError({ message: `商店配置不存在: ${storefrontId}`, statusCode: 404 });
      }

      // 检查服务是否存在
      const service = await repo.findById(data.service_id, true);
      if (!service) {
        throw new AppError({ message: `服务产品不存在: ${data.service_id}`, statusCode: 404 });
      }

      // 检查是否已添加
      const existing = await repo.findStorefrontItemByService(storefrontId, data.service_id);
      if (existing) {
        throw new AppError({ message: `服务已添加到商店`, statusCode: 400 });
      }

      const item = await repo.createStorefrontItem({
        storefront_id: storefrontId,
        service_id: data.service_id,
        is_visible: data.is_visible ?? true,
        sort_order: data.sort_order ?? 0,
        pricing_discounts: data.pricing_discounts,
      });

      return toStorefrontItem(item);
    },

    async updateStorefrontItem(
      itemId: string,
      data: { is_visible?: boolean; sort_order?: number; pricing_discounts?: PricingDiscount[] }
    ) {
      const item = await getRepo().updateStorefrontItem(itemId, data);
      return toStorefrontItem(item);
    },

    async removeServiceFromStorefront(itemId: string) {
      await getRepo().deleteStorefrontItem(itemId);
    },

    async reorderStorefrontItems(storefrontId: string, itemIds: string[]) {
      await getRepo().reorderStorefrontItems(storefrontId, itemIds);
    },

    // ========================
    // 商店视图（客户端）
    // ========================

    async getStorefrontView(storefrontId?: string): Promise<StorefrontView | null> {
      const repo = getRepo();
      let storefront;
      if (storefrontId) {
        storefront = await repo.findStorefrontById(storefrontId);
      } else {
        storefront = await repo.findDefaultStorefront();
      }

      if (!storefront || !storefront.is_active) {
        return null;
      }

      // 过滤出可见且有服务的项目
      const visibleItems = storefront.items.filter((item) => item.is_visible && item.service);

      const services: StorefrontViewService[] = visibleItems.map((item) => {
        const service = item.service!;
        const activePricing = service.pricing.filter((p) => p.is_active);

        return {
          id: service.id,
          name: service.name,
          code: service.code,
          description: service.description,
          max_organizations: service.max_organizations,
          max_apartments: service.max_apartments,
          max_rooms: service.max_rooms,
          max_members: service.max_members,
          pricing: activePricing.map((p) => {
            const discount = findDiscount(item.pricing_discounts, p.months);
            const price = Number(p.price);
            let finalPrice = price;

            if (discount) {
              if (discount.discount_type === 'percent' && discount.discount_value) {
                finalPrice = price * discount.discount_value;
              } else if (discount.discount_type === 'fixed' && discount.discount_value) {
                finalPrice = price - discount.discount_value;
              }
            }

            return {
              id: p.id,
              months: p.months,
              price,
              discount: discount
                ? {
                    discount_type: discount.discount_type,
                    discount_value: discount.discount_value,
                    gift_months: discount.gift_months,
                  }
                : undefined,
              final_price: finalPrice !== price ? finalPrice : undefined,
            };
          }),
        };
      });

      return {
        id: storefront.id,
        name: storefront.name,
        code: storefront.code,
        is_default: storefront.is_default,
        services,
      };
    },
  };
}

/**
 * 默认服务产品服务实例
 */
export const defaultServiceProductService = createServiceProductService();
