import type {
  Prisma,
  SubscriptionPlan,
  OrganizationSubscription,
  SubscriptionOrder,
} from '../generated/client/index.js';
import type { DbClient } from '../types/repository.types.js';
import { prisma } from '../lib/prisma.js';

/**
 * 订阅包含套餐信息
 */
export type SubscriptionWithPlan = OrganizationSubscription & {
  plan: SubscriptionPlan | null;
};

/**
 * 订单包含套餐信息
 */
export type OrderWithPlan = SubscriptionOrder & {
  plan: SubscriptionPlan | null;
};

/**
 * Subscription Repository 接口
 */
export interface SubscriptionRepository {
  // 套餐
  findActivePlans(): Promise<SubscriptionPlan[]>;
  findPlanById(id: string): Promise<SubscriptionPlan | null>;

  // 组织订阅
  findSubscriptionByOrgId(orgId: string): Promise<SubscriptionWithPlan | null>;
  createSubscription(
    data: Prisma.OrganizationSubscriptionCreateInput
  ): Promise<OrganizationSubscription>;
  updateSubscription(
    orgId: string,
    data: Prisma.OrganizationSubscriptionUpdateInput
  ): Promise<OrganizationSubscription>;

  // 订单
  findOrderById(orderId: string, orgId: string): Promise<OrderWithPlan | null>;
  createOrder(data: Prisma.SubscriptionOrderCreateInput): Promise<SubscriptionOrder>;
  updateOrder(
    orderId: string,
    data: Prisma.SubscriptionOrderUpdateInput
  ): Promise<SubscriptionOrder>;
}

/**
 * 创建 Subscription Repository 实例
 */
export function createSubscriptionRepository(db: DbClient): SubscriptionRepository {
  return {
    findActivePlans: async () => {
      return db.subscriptionPlan.findMany({
        where: { is_active: true, code: { not: 'free' } },
        orderBy: { sort_order: 'asc' },
      });
    },

    findPlanById: async (id: string) => {
      return db.subscriptionPlan.findFirst({ where: { id } });
    },

    findSubscriptionByOrgId: async (orgId: string) => {
      return db.organizationSubscription.findUnique({
        where: { organization_id: orgId },
        include: { plan: true },
      }) as Promise<SubscriptionWithPlan | null>;
    },

    createSubscription: async (data: Prisma.OrganizationSubscriptionCreateInput) => {
      return db.organizationSubscription.create({ data });
    },

    updateSubscription: async (orgId: string, data: Prisma.OrganizationSubscriptionUpdateInput) => {
      return db.organizationSubscription.update({
        where: { organization_id: orgId },
        data,
      });
    },

    findOrderById: async (orderId: string, orgId: string) => {
      return db.subscriptionOrder.findFirst({
        where: { id: orderId, organization_id: orgId },
        include: { plan: true },
      }) as Promise<OrderWithPlan | null>;
    },

    createOrder: async (data: Prisma.SubscriptionOrderCreateInput) => {
      return db.subscriptionOrder.create({ data });
    },

    updateOrder: async (orderId: string, data: Prisma.SubscriptionOrderUpdateInput) => {
      return db.subscriptionOrder.update({
        where: { id: orderId },
        data,
      });
    },
  };
}

/**
 * 判断订阅是否有效
 */
export function isSubscriptionActive(sub: { status: string; end_date: Date | null }): boolean {
  if (sub.status !== 'active') return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (!sub.end_date) return true;
  return new Date(sub.end_date) >= today;
}

/**
 * 默认实例
 */
export const defaultSubscriptionRepo = createSubscriptionRepository(prisma);
