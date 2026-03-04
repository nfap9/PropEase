import type {
  UsagePricing,
  UsageQuota,
  UsageQuotaOrder,
  Prisma,
} from '../generated/client/index.js';
import type { DbClient } from '../types/repository.types.js';
import { prisma } from '../lib/prisma.js';

/**
 * Usage Repository 接口
 */
export interface UsageRepository {
  // 定价
  findActivePricing(): Promise<UsagePricing | null>;

  // 配额
  findValidQuotas(userId: string, today: Date): Promise<UsageQuota[]>;

  // 订单
  findOrderById(orderId: string, userId: string): Promise<UsageQuotaOrder | null>;
  findOrderByIdOnly(orderId: string): Promise<UsageQuotaOrder | null>;
  createOrder(data: Prisma.UsageQuotaOrderCreateInput): Promise<UsageQuotaOrder>;
  updateOrder(orderId: string, data: Prisma.UsageQuotaOrderUpdateInput): Promise<UsageQuotaOrder>;
}

/**
 * 创建 Usage Repository 实例
 */
export function createUsageRepository(db: DbClient): UsageRepository {
  return {
    findActivePricing: async () => {
      return db.usagePricing.findFirst({ where: { is_active: true } });
    },

    findValidQuotas: async (userId: string, today: Date) => {
      return db.usageQuota.findMany({
        where: {
          user_id: userId,
          valid_from: { lte: today },
          valid_to: { gte: today },
        },
      });
    },

    findOrderById: async (orderId: string, userId: string) => {
      return db.usageQuotaOrder.findFirst({
        where: { id: orderId, user_id: userId },
      });
    },

    findOrderByIdOnly: async (orderId: string) => {
      return db.usageQuotaOrder.findUnique({ where: { id: orderId } });
    },

    createOrder: async (data: Prisma.UsageQuotaOrderCreateInput) => {
      return db.usageQuotaOrder.create({ data });
    },

    updateOrder: async (orderId: string, data: Prisma.UsageQuotaOrderUpdateInput) => {
      return db.usageQuotaOrder.update({ where: { id: orderId }, data });
    },
  };
}

/**
 * 默认实例
 */
export const defaultUsageRepo = createUsageRepository(prisma);
