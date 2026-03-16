import type {
  Prisma,
  ServiceProduct,
  OrganizationSubscription,
  SubscriptionOrder,
} from '@prisma/client';
import type { DbClient } from '../types/repository.types.js';
import { prisma } from '../lib/prisma.js';

/**
 * 订阅包含服务信息
 */
export type SubscriptionWithService = OrganizationSubscription & {
  service: ServiceProduct | null;
};

/**
 * 订单包含服务信息
 */
export type OrderWithService = SubscriptionOrder & {
  service: ServiceProduct | null;
};

type SubscriptionWithServiceRecord = Prisma.OrganizationSubscriptionGetPayload<{
  include: { service: true };
}>;

type OrderWithServiceRecord = Prisma.SubscriptionOrderGetPayload<{
  include: { service: true };
}>;

/**
 * Subscription Repository 接口
 */
export interface SubscriptionRepository {
  // 服务产品
  findActiveServices(): Promise<ServiceProduct[]>;
  findServiceById(id: string): Promise<ServiceProduct | null>;

  // 组织订阅
  findSubscriptionByOrgId(orgId: string): Promise<SubscriptionWithService | null>;
  createSubscription(
    data: Prisma.OrganizationSubscriptionCreateInput
  ): Promise<OrganizationSubscription>;
  updateSubscription(
    orgId: string,
    data: Prisma.OrganizationSubscriptionUpdateInput
  ): Promise<OrganizationSubscription>;

  // 订单
  findOrderById(orderId: string, orgId: string): Promise<OrderWithService | null>;
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
    findActiveServices: async () => {
      return db.serviceProduct.findMany({
        where: { is_active: true, code: { not: 'free' } },
        orderBy: { sort_order: 'asc' },
      });
    },

    findServiceById: async (id: string) => {
      return db.serviceProduct.findFirst({ where: { id } });
    },

    findSubscriptionByOrgId: async (orgId: string) => {
      const subscription: SubscriptionWithServiceRecord | null =
        await db.organizationSubscription.findUnique({
        where: { organization_id: orgId },
        include: { service: true },
      });
      return subscription;
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
      const order: OrderWithServiceRecord | null = await db.subscriptionOrder.findFirst({
        where: { id: orderId, organization_id: orgId },
        include: { service: true },
      });
      return order;
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
 * 默认实例
 */
export const defaultSubscriptionRepo = createSubscriptionRepository(prisma);
