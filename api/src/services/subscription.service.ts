import type {
  SubscriptionPlan,
  OrganizationSubscription,
  SubscriptionOrder,
} from '@prisma/client';
import { ulid } from 'ulid';
import {
  createSubscriptionRepository,
  type SubscriptionRepository,
  type SubscriptionWithPlan,
  type OrderWithPlan,
  isSubscriptionActive,
} from '../repositories/subscription.repo.js';
import {
  createPromotionRepository,
  calculatePromotionPrice,
  type PromotionRepository,
} from '../repositories/promotion.repo.js';
import { createAppError } from '../utils/appError.js';
import { NotFoundMessages } from '../messages.js';
import { prisma } from '../lib/prisma.js';

/**
 * 订阅状态响应
 */
export interface SubscriptionStatus {
  has_subscription: boolean;
  plan: SubscriptionPlan | null;
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
  planId: string;
  billingCycle?: 'monthly' | 'yearly';
  billingMonths?: number;
  promotionId?: string;
}

/**
 * Subscription Service 接口
 */
export interface SubscriptionService {
  listPlans(): Promise<SubscriptionPlan[]>;
  getPlanById(id: string): Promise<SubscriptionPlan>;
  getSubscription(orgId: string): Promise<SubscriptionWithPlan | null>;
  getSubscriptionStatus(orgId: string): Promise<SubscriptionStatus>;
  subscribe(orgId: string, planId: string): Promise<OrganizationSubscription>;
  updateSubscription(
    orgId: string,
    planId: string,
    effective: 'immediate' | 'next_cycle'
  ): Promise<OrganizationSubscription>;
  cancelSubscription(orgId: string): Promise<void>;
  createOrder(orgId: string, params: CreateOrderParams): Promise<SubscriptionOrder>;
  getOrder(orgId: string, orderId: string): Promise<OrderWithPlan>;
}

/**
 * 创建 Subscription Service 实例
 */
export function createSubscriptionService(
  getRepo: () => SubscriptionRepository = () => createSubscriptionRepository(prisma),
  getPromotionRepo: () => PromotionRepository = () => createPromotionRepository(prisma)
): SubscriptionService {
  return {
    listPlans: async () => {
      // 返回套餐时包含定价信息
      return prisma.subscriptionPlan.findMany({
        where: { is_active: true, code: { not: 'free' } },
        orderBy: { sort_order: 'asc' },
        include: {
          pricing: {
            where: { is_active: true },
            orderBy: [{ sort_order: 'asc' }, { months: 'asc' }],
          },
        },
      }) as Promise<SubscriptionPlan[]>;
    },

    getPlanById: async (id: string) => {
      const plan = await prisma.subscriptionPlan.findFirst({
        where: { id },
        include: {
          pricing: {
            where: { is_active: true },
            orderBy: [{ sort_order: 'asc' }, { months: 'asc' }],
          },
        },
      });
      if (!plan) {
        throw createAppError(404, NotFoundMessages.PLAN);
      }
      return plan as SubscriptionPlan;
    },

    getSubscription: async (orgId: string) => {
      return getRepo().findSubscriptionByOrgId(orgId);
    },

    getSubscriptionStatus: async (orgId: string) => {
      const sub = await getRepo().findSubscriptionByOrgId(orgId);

      if (!sub) {
        return {
          has_subscription: false,
          plan: null,
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
        plan: sub.plan,
        status: sub.status,
        is_active: active,
        end_date: sub.end_date ? sub.end_date.toISOString().slice(0, 10) : null,
        auto_renew: sub.auto_renew,
        days_remaining: daysRemaining,
      };
    },

    subscribe: async (orgId: string, planId: string) => {
      const plan = await getRepo().findPlanById(planId);
      if (!plan) {
        throw createAppError(404, NotFoundMessages.PLAN);
      }
      if (plan.code === 'free') {
        throw createAppError(400, '免费套餐仅在注册时自动开通，请通过付费套餐订阅');
      }

      const existing = await getRepo().findSubscriptionByOrgId(orgId);
      const start = new Date();
      const end = new Date(start);
      end.setFullYear(end.getFullYear() + 1);

      if (existing && existing.plan && isSubscriptionActive(existing)) {
        if (plan.sort_order < existing.plan.sort_order) {
          throw createAppError(400, '不支持降级到低等级套餐');
        }
      }

      if (existing) {
        return getRepo().updateSubscription(orgId, {
          plan: { connect: { id: plan.id } },
          status: 'active',
          start_date: start,
          end_date: end,
          next_plan: { disconnect: true },
        });
      }

      return getRepo().createSubscription({
        id: ulid().toLowerCase(),
        organization: { connect: { id: orgId } },
        plan: { connect: { id: plan.id } },
        start_date: start,
        end_date: end,
      });
    },

    updateSubscription: async (
      orgId: string,
      planId: string,
      effective: 'immediate' | 'next_cycle'
    ) => {
      const plan = await getRepo().findPlanById(planId);
      if (!plan) {
        throw createAppError(404, NotFoundMessages.PLAN);
      }
      if (plan.code === 'free') {
        throw createAppError(400, '免费套餐不可通过此接口修改');
      }

      const sub = await getRepo().findSubscriptionByOrgId(orgId);
      if (!sub) {
        throw createAppError(404, NotFoundMessages.SUBSCRIPTION);
      }

      if (effective === 'next_cycle') {
        return getRepo().updateSubscription(orgId, {
          next_plan: { connect: { id: plan.id } },
        });
      }

      const currentSort = sub.plan?.sort_order ?? 0;
      if (plan.sort_order < currentSort) {
        throw createAppError(400, '不支持降级，当前套餐等级更高');
      }
      if (plan.sort_order > currentSort) {
        throw createAppError(400, '升级请通过订阅页创建订单并支付差价');
      }

      return getRepo().updateSubscription(orgId, {
        plan: { connect: { id: plan.id } },
        next_plan: { disconnect: true },
      });
    },

    cancelSubscription: async (orgId: string) => {
      const sub = await getRepo().findSubscriptionByOrgId(orgId);
      if (!sub) {
        throw createAppError(404, NotFoundMessages.SUBSCRIPTION);
      }
      await getRepo().updateSubscription(orgId, { status: 'cancelled' });
    },

    createOrder: async (orgId: string, params: CreateOrderParams) => {
      const { planId, billingMonths = 1, promotionId } = params;

      const plan = await getRepo().findPlanById(planId);
      if (!plan) {
        throw createAppError(404, NotFoundMessages.PLAN);
      }
      if (plan.code === 'free') {
        throw createAppError(400, '免费套餐无需购买，注册时已自动开通');
      }

      // 查找周期定价
      const pricing = await getPromotionRepo().findPricingByPlanAndMonths(planId, billingMonths);

      let originalPrice: number;
      if (pricing) {
        originalPrice = Number(pricing.price);
      } else {
        // 如果没有找到对应周期的定价，使用月价 * 月数
        originalPrice = Number(plan.price_monthly) * billingMonths;
      }

      // 获取并计算优惠
      let promotion = null;
      if (promotionId) {
        promotion = await prisma.promotion.findUnique({ where: { id: promotionId } });
      } else {
        promotion = await getPromotionRepo().findActiveForPlan(planId);
      }

      const { finalPrice, giftMonths } = calculatePromotionPrice(originalPrice, promotion);

      const orderNo = `SUB${Date.now()}`;
      const expires = new Date();
      expires.setHours(expires.getHours() + 2);

      // 注意：giftMonths 将在订单履约时使用（见 fulfillSubscription.ts）
      void giftMonths;

      return getRepo().createOrder({
        id: ulid().toLowerCase(),
        order_no: orderNo,
        organization: { connect: { id: orgId } },
        plan: { connect: { id: plan.id } },
        billing_cycle: billingMonths === 12 ? 'yearly' : 'monthly',
        billing_months: billingMonths,
        amount: finalPrice,
        original_amount: originalPrice,
        status: 'pending',
        expires_at: expires,
        promotion: promotion ? { connect: { id: promotion.id } } : undefined,
      });
    },

    getOrder: async (orgId: string, orderId: string) => {
      const order = await prisma.subscriptionOrder.findFirst({
        where: { id: orderId, organization_id: orgId },
        include: {
          plan: true,
          promotion: {
            select: { id: true, name: true, type: true },
          },
        },
      });
      if (!order) {
        throw createAppError(404, NotFoundMessages.ORDER);
      }
      return order as OrderWithPlan;
    },
  };
}

/**
 * 默认实例
 */
export const defaultSubscriptionService = createSubscriptionService();
