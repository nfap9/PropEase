/**
 * 服务定价模块 - 业务逻辑层
 */
import { singleton, inject } from '@joufe/ts-registry';
import type { PrismaClient } from '@prisma/client';
import { ServiceProductRepo } from './service-product.repo.js';
import type {
  PricingDiscount,
  ServiceProduct,
  ServicePricing,
  StorefrontConfig,
  StorefrontItem,
  StorefrontView,
  StorefrontViewService,
  PriceCalculationRequest,
  PriceCalculationResult,
} from '@apartment-ultra/api-contract';
import { generateId } from '../utils/id.js';
import { AppError } from '../middleware/error.js';

@singleton()
export class ServiceProductService {
  constructor(
    @inject(() => ServiceProductRepo)
    private readonly repo: ServiceProductRepo
  ) {}

  // ========================
  // 服务产品相关方法
  // ========================

  /** 列表查询 */
  async listServiceProducts(params?: { is_active?: boolean; include_pricing?: boolean }) {
    const products = await this.repo.list(params);
    return products.map(this.toServiceProduct);
  }

  /** 根据 ID 查询 */
  async getServiceProductById(id: string) {
    const product = await this.repo.findById(id, true);
    if (!product) return null;
    return this.toServiceProduct(product);
  }

  /** 根据代码查询 */
  async getServiceProductByCode(code: string) {
    const product = await this.repo.findByCode(code);
    if (!product) return null;
    return this.toServiceProduct(product);
  }

  /** 创建 */
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
    // 检查代码是否已存在
    const existing = await this.repo.findByCode(data.code);
    if (existing) {
      throw new AppError(`服务产品代码已存在: ${data.code}`, 400);
    }

    const product = await this.repo.create({
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
      await this.repo.upsertPricing(product.id, data.pricing);
    }

    return this.getServiceProductById(product.id);
  }

  /** 更新 */
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
    const existing = await this.repo.findById(id, false);
    if (!existing) {
      throw new AppError(`服务产品不存在: ${id}`, 404);
    }

    const product = await this.repo.update(id, data);
    return this.toServiceProduct(product);
  }

  /** 删除 */
  async deleteServiceProduct(id: string) {
    const existing = await this.repo.findById(id, false);
    if (!existing) {
      throw new AppError(`服务产品不存在: ${id}`, 404);
    }

    await this.repo.delete(id);
  }

  /** 批量更新服务定价 */
  async batchUpdatePricing(
    serviceId: string,
    pricingData: Array<{
      months: number;
      price: number;
      is_active?: boolean;
      sort_order?: number;
    }>
  ) {
    const existing = await this.repo.findById(serviceId, false);
    if (!existing) {
      throw new AppError(`服务产品不存在: ${serviceId}`, 404);
    }

    await this.repo.upsertPricing(serviceId, pricingData);

    return this.repo.findById(serviceId, true).then((p) => this.toServiceProduct(p!));
  }

  // ========================
  // 商店配置相关方法
  // ========================

  /** 列表查询 */
  async listStorefronts(params?: { is_active?: boolean }) {
    const configs = await this.repo.listStorefronts(params);
    return configs.map(this.toStorefrontConfig);
  }

  /** 根据 ID 查询 */
  async getStorefrontById(id: string) {
    const config = await this.repo.findStorefrontById(id);
    if (!config) return null;
    return this.toStorefrontConfig(config);
  }

  /** 根据代码查询 */
  async getStorefrontByCode(code: string) {
    const config = await this.repo.findStorefrontByCode(code);
    if (!config) return null;
    return this.toStorefrontConfig(config);
  }

  /** 获取默认商店 */
  async getDefaultStorefront() {
    const config = await this.repo.findDefaultStorefront();
    if (!config) return null;
    return this.toStorefrontConfig(config);
  }

  /** 创建商店配置 */
  async createStorefront(data: { name: string; code: string; is_active?: boolean; is_default?: boolean }) {
    // 检查代码是否已存在
    const existing = await this.repo.findStorefrontByCode(data.code);
    if (existing) {
      throw new AppError(`商店配置代码已存在: ${data.code}`, 400);
    }

    const config = await this.repo.createStorefront(data);
    return this.toStorefrontConfig(config);
  }

  /** 更新商店配置 */
  async updateStorefront(
    id: string,
    data: { name?: string; is_active?: boolean; is_default?: boolean }
  ) {
    const existing = await this.repo.findStorefrontById(id);
    if (!existing) {
      throw new AppError(`商店配置不存在: ${id}`, 404);
    }

    const config = await this.repo.updateStorefront(id, data);
    return this.toStorefrontConfig(config);
  }

  /** 删除商店配置 */
  async deleteStorefront(id: string) {
    const existing = await this.repo.findStorefrontById(id);
    if (!existing) {
      throw new AppError(`商店配置不存在: ${id}`, 404);
    }

    await this.repo.deleteStorefront(id);
  }

  // ========================
  // 商店项相关方法
  // ========================

  /** 添加服务到商店 */
  async addServiceToStorefront(
    storefrontId: string,
    data: {
      service_id: string;
      is_visible?: boolean;
      sort_order?: number;
      pricing_discounts?: PricingDiscount[];
    }
  ) {
    // 检查商店是否存在
    const storefront = await this.repo.findStorefrontById(storefrontId);
    if (!storefront) {
      throw new AppError(`商店配置不存在: ${storefrontId}`, 404);
    }

    // 检查服务是否存在
    const service = await this.repo.findById(data.service_id, true);
    if (!service) {
      throw new AppError(`服务产品不存在: ${data.service_id}`, 404);
    }

    // 检查是否已添加
    const existing = await this.repo.findStorefrontItemByService(storefrontId, data.service_id);
    if (existing) {
      throw new AppError(`服务已添加到商店`, 400);
    }

    const item = await this.repo.createStorefrontItem({
      storefront_id: storefrontId,
      service_id: data.service_id,
      is_visible: data.is_visible ?? true,
      sort_order: data.sort_order ?? 0,
      pricing_discounts: data.pricing_discounts,
    });

    return this.toStorefrontItem(item);
  }

  /** 更新商店项 */
  async updateStorefrontItem(
    itemId: string,
    data: { is_visible?: boolean; sort_order?: number; pricing_discounts?: PricingDiscount[] }
  ) {
    const item = await this.repo.updateStorefrontItem(itemId, data);
    return this.toStorefrontItem(item);
  }

  /** 从商店移除服务 */
  async removeServiceFromStorefront(itemId: string) {
    await this.repo.deleteStorefrontItem(itemId);
  }

  /** 重新排序商店项 */
  async reorderStorefrontItems(storefrontId: string, itemIds: string[]) {
    await this.repo.reorderStorefrontItems(storefrontId, itemIds);
  }

  // ========================
  // 商店视图（客户端）
  // ========================

  /** 获取商店视图（用于客户端购买页面） */
  async getStorefrontView(storefrontId?: string): Promise<StorefrontView | null> {
    let storefront;
    if (storefrontId) {
      storefront = await this.repo.findStorefrontById(storefrontId);
    } else {
      storefront = await this.repo.findDefaultStorefront();
    }

    if (!storefront || !storefront.is_active) {
      return null;
    }

    // 过滤出可见的服务
    const visibleItems = storefront.items.filter((item) => item.is_visible);

    const services: StorefrontViewService[] = visibleItems.map((item) => {
      const service = item.service;
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
          const discount = this.findDiscount(item.pricing_discounts, p.months);
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
  }

  /** 计算价格 */
  async calculatePrice(request: PriceCalculationRequest): Promise<PriceCalculationResult> {
    let storefront;
    if (request.storefront_id) {
      storefront = await this.repo.findStorefrontById(request.storefront_id);
    } else {
      storefront = await this.repo.findDefaultStorefront();
    }

    if (!storefront || !storefront.is_active) {
      throw new AppError('商店配置不存在', 404);
    }

    // 查找服务
    const item = storefront.items.find(
      (i) => i.service_id === request.service_id && i.is_visible
    );
    if (!item) {
      throw new AppError('服务不在商店中', 404);
    }

    // 查找定价
    const pricing = item.service.pricing.find((p) => p.months === request.months && p.is_active);
    if (!pricing) {
      throw new AppError('定价不存在', 404);
    }

    const originalPrice = Number(pricing.price);
    let discountAmount = 0;
    let finalPrice = originalPrice;
    let giftMonths = 0;
    let discount: PricingDiscount | undefined;

    // 查找折扣
    if (item.pricing_discounts) {
      discount = this.findDiscount(item.pricing_discounts, request.months);
    }

    if (discount) {
      if (discount.discount_type === 'percent' && discount.discount_value) {
        discountAmount = originalPrice * (1 - discount.discount_value);
        finalPrice = originalPrice - discountAmount;
      } else if (discount.discount_type === 'fixed' && discount.discount_value) {
        discountAmount = discount.discount_value;
        finalPrice = originalPrice - discountAmount;
      } else if (discount.discount_type === 'gift' && discount.gift_months) {
        giftMonths = discount.gift_months;
      }
    }

    return {
      original_price: originalPrice,
      discount_type: discount?.discount_type ?? null,
      discount_value: discount?.discount_value ?? null,
      discount_amount: discountAmount,
      final_price: finalPrice,
      gift_months: giftMonths,
    };
  }

  // ========================
  // 私有辅助方法
  // ========================

  private toServiceProduct(product: any): ServiceProduct {
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
      pricing: product.pricing?.map(this.toServicePricing),
    };
  }

  private toServicePricing(pricing: any): ServicePricing {
    return {
      id: pricing.id,
      service_id: pricing.service_id,
      months: pricing.months,
      price: Number(pricing.price),
      is_active: pricing.is_active,
      sort_order: pricing.sort_order,
      created_at: pricing.created_at.toISOString(),
      updated_at: pricing.updated_at.toISOString(),
    };
  }

  private toStorefrontConfig(config: any): StorefrontConfig {
    return {
      id: config.id,
      name: config.name,
      code: config.code,
      is_active: config.is_active,
      is_default: config.is_default,
      created_at: config.created_at.toISOString(),
      updated_at: config.updated_at.toISOString(),
      items: config.items?.map(this.toStorefrontItem),
    };
  }

  private toStorefrontItem(item: any): StorefrontItem {
    return {
      id: item.id,
      storefront_id: item.storefront_id,
      service_id: item.service_id,
      service: item.service ? this.toServiceProduct(item.service) : undefined,
      is_visible: item.is_visible,
      sort_order: item.sort_order,
      pricing_discounts: item.pricing_discounts,
      created_at: item.created_at.toISOString(),
      updated_at: item.updated_at.toISOString(),
    };
  }

  private findDiscount(
    discounts: PricingDiscount[] | null,
    months: number
  ): PricingDiscount | undefined {
    if (!discounts) return undefined;
    return discounts.find((d) => d.months === months);
  }
}
