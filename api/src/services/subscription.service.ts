import type {
  ServiceProduct,
  OrganizationSubscription,
  SubscriptionOrder,
} from '@prisma/client';
import { ulid } from 'ulid';
import {
  createSubscriptionRepository,
  type SubscriptionRepository,
  type SubscriptionWithService,
  type OrderWithService,
} from '../repositories/subscription.repo.js';
import { createAppError } from '../utils/appError.js';
import { NotFoundMessages } from '../messages.js';
import { prisma } from '../lib/prisma.js';
import { isSubscriptionActive } from '../utils/subscription.js';

/**
 * 订阅状态响应
 */
export interface SubscriptionStatus {
  has_subscription: boolean;
  service: ServiceProduct | null;
  status: string;
  is_active: boolean;
  end_date: string | null;
  auto_renew: boolean;
  days_remaining: number | null;
}

/**
 * 创建订单参数
 */
export interface CreateOrderParams {
  serviceId: string;
  billingMonths?: number;
  pricingId?: string;
}

/**
 * Subscription Service 接口
 */
export interface SubscriptionService {
  listServices(activeOnly?: boolean): Promise<ServiceProduct[]>;
  getServiceById(id: string): Promise<ServiceProduct>;
  getSubscription(orgId: string): Promise<SubscriptionWithService | null>;
  getSubscriptionStatus(orgId: string): Promise<SubscriptionStatus>;
  subscribe(orgId: string, serviceId: string, billingMonths?: number, autoRenew?: boolean): Promise<OrganizationSubscription>;
  updateSubscription(
    orgId: string,
    serviceId: string,
    effective: 'immediate' | 'next_cycle'
  ): Promise<OrganizationSubscription>;
  cancelSubscription(orgId: string, reason?: string): Promise<void>;
  createOrder(orgId: string, params: CreateOrderParams): Promise<SubscriptionOrder>;
  getOrder(orgId: string, orderId: string): Promise<OrderWithService>;
}

/**
 * 创建 Subscription Service 实例
 */
export function createSubscriptionService(
  getRepo: () => SubscriptionRepository = () => createSubscriptionRepository(prisma)
): SubscriptionService {
  return {
    listServices: async (activeOnly = true) => {
      return getRepo().findActiveServicesWithPricing(activeOnly);
    },

    getServiceById: async (id: string) => {
      const service = await getRepo().findServiceByIdWithPricing(id);
      if (!service) {
        throw createAppError(404, NotFoundMessages.PLAN);
      }
      return service;
    },

    getSubscription: async (orgId: string) => {
      return getRepo().findSubscriptionByOrgId(orgId);
    },

    getSubscriptionStatus: async (orgId: string) => {
      const sub = await getRepo().findSubscriptionByOrgId(orgId);

      if (!sub) {
        return {
          has_subscription: false,
          service: null,
          status: 'none',
          is_active: false,
          end_date: null,
          auto_renew: false,
          days_remaining: null,
        };
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const active = isSubscriptionActive(sub);

      let daysRemaining: number | null = null;
      if (sub.end_date) {
        const end = new Date(sub.end_date);
        end.setHours(0, 0, 0, 0);
        daysRemaining = Math.max(
          0,
          Math.ceil((end.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))
        );
      }

      return {
        has_subscription: true,
        service: sub.service,
        status: sub.status,
        is_active: active,
        end_date: sub.end_date ? sub.end_date.toISOString().slice(0, 10) : null,
        auto_renew: sub.auto_renew,
        days_remaining: daysRemaining,
      };
    },

    subscribe: async (orgId: string, serviceId: string, billingMonths = 1, autoRenew = true) => {
      const service = await getRepo().findServiceById(serviceId);
      if (!service) {
        throw createAppError(404, NotFoundMessages.PLAN);
      }
      if (service.code === 'free') {
        throw createAppError(400, '免费套餐仅在注册时自动开通，请通过付费套餐订阅');
      }

      const existing = await getRepo().findSubscriptionByOrgId(orgId);
      const start = new Date();
      const end = new Date(start);
      end.setMonth(end.getMonth() + billingMonths);

      if (existing && existing.service && isSubscriptionActive(existing)) {
        if (service.sort_order < existing.service.sort_order) {
          throw createAppError(400, '不支持降级到低等级套餐');
        }
      }

      if (existing) {
        return getRepo().updateSubscription(orgId, {
          service: { connect: { id: service.id } },
          status: 'active',
          billing_months: billingMonths,
          start_date: start,
          end_date: end,
          auto_renew: autoRenew,
          next_service: { disconnect: true },
        });
      }

      return getRepo().createSubscription({
        id: ulid().toLowerCase(),
        organization: { connect: { id: orgId } },
        service: { connect: { id: service.id } },
        billing_months: billingMonths,
        start_date: start,
        end_date: end,
        auto_renew: autoRenew,
      });
    },

    updateSubscription: async (
      orgId: string,
      serviceId: string,
      effective: 'immediate' | 'next_cycle'
    ) => {
      const service = await getRepo().findServiceById(serviceId);
      if (!service) {
        throw createAppError(404, NotFoundMessages.PLAN);
      }
      if (service.code === 'free') {
        throw createAppError(400, '免费套餐不可通过此接口修改');
      }

      const sub = await getRepo().findSubscriptionByOrgId(orgId);
      if (!sub) {
        throw createAppError(404, NotFoundMessages.SUBSCRIPTION);
      }

      if (effective === 'next_cycle') {
        return getRepo().updateSubscription(orgId, {
          next_service: { connect: { id: service.id } },
        });
      }

      const currentSort = sub.service?.sort_order ?? 0;
      if (service.sort_order < currentSort) {
        throw createAppError(400, '不支持降级，当前套餐等级更高');
      }
      if (service.sort_order > currentSort) {
        throw createAppError(400, '升级请通过订阅页创建订单并支付差价');
      }

      return getRepo().updateSubscription(orgId, {
        service: { connect: { id: service.id } },
        next_service: { disconnect: true },
      });
    },

    cancelSubscription: async (orgId: string, reason?: string) => {
      const sub = await getRepo().findSubscriptionByOrgId(orgId);
      if (!sub) {
        throw createAppError(404, NotFoundMessages.SUBSCRIPTION);
      }
      await getRepo().updateSubscription(orgId, {
        status: 'cancelled',
        cancel_reason: reason,
      });
    },

    createOrder: async (orgId: string, params: CreateOrderParams) => {
      const { serviceId, billingMonths = 1, pricingId } = params;

      const service = await getRepo().findServiceByIdWithPricing(serviceId);
      if (!service) {
        throw createAppError(404, NotFoundMessages.PLAN);
      }
      if (service.code === 'free') {
        throw createAppError(400, '免费套餐无需购买，注册时已自动开通');
      }

      // 查找周期定价
      let originalPrice: number;
      let selectedPricingId = pricingId;

      if (pricingId) {
        // 使用指定的定价 ID
        const pricing = service.pricing?.find((p: { id: string }) => p.id === pricingId);
        if (pricing) {
          originalPrice = Number(pricing.price);
        } else {
          throw createAppError(400, '定价不存在');
        }
      } else {
        // 按月数查找定价
        const pricing = service.pricing?.find((p: { months: number; is_active: boolean }) => p.months === billingMonths && p.is_active);
        if (pricing) {
          originalPrice = Number(pricing.price);
          selectedPricingId = pricing.id;
        } else {
          // 如果没有找到对应周期的定价，使用月价 * 月数
          const monthlyPricing = service.pricing?.find((p: { months: number }) => p.months === 1);
          if (monthlyPricing) {
            originalPrice = Number(monthlyPricing.price) * billingMonths;
          } else {
            throw createAppError(400, '未找到合适的定价');
          }
        }
      }

      const finalPrice = originalPrice;

      const orderNo = `SUB${Date.now()}`;
      const expires = new Date();
      expires.setHours(expires.getHours() + 2);

      return getRepo().createOrder({
        id: ulid().toLowerCase(),
        order_no: orderNo,
        organization: { connect: { id: orgId } },
        service: { connect: { id: service.id } },
        pricing: selectedPricingId ? { connect: { id: selectedPricingId } } : undefined,
        billing_months: billingMonths,
        amount: finalPrice,
        original_amount: originalPrice,
        status: 'pending',
        expires_at: expires,
      });
    },

    getOrder: async (orgId: string, orderId: string) => {
      const order = await getRepo().findOrderById(orderId, orgId);
      if (!order) {
        throw createAppError(404, NotFoundMessages.ORDER);
      }
      return order as OrderWithService;
    },
  };
}

/**
 * 默认实例
 */
export const defaultSubscriptionService = createSubscriptionService();
