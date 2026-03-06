import type { UsageQuotaOrder, } from '../generated/client/index.js';
import type { UsageRepository } from '../repositories/usage.repo.js';
import { defaultUsageRepo } from '../repositories/usage.repo.js';
import { prisma } from '../lib/prisma.js';
import { createAppError } from '../utils/appError.js';
import { ulid } from 'ulid';
import { config } from '../config.js';

/**
 * 定价信息
 */
export interface PricingInfo {
  price_per_org: number;
  price_per_apartment: number;
  price_per_room: number;
  price_per_member: number;
}

/**
 * 配额统计
 */
export interface QuotaSummary {
  orgs: number;
  apartments: number;
  rooms: number;
  members: number;
}

/**
 * 创建订单输入
 */
export interface CreateOrderInput {
  orgs: number;
  apartments: number;
  rooms: number;
  members: number;
}

/**
 * Usage Service 接口
 */
export interface UsageService {
  getPricing(): Promise<PricingInfo>;
  getQuota(userId: string): Promise<QuotaSummary>;
  createOrder(userId: string, data: CreateOrderInput): Promise<UsageQuotaOrder>;
  getOrder(
    userId: string,
    orderId: string
  ): Promise<UsageQuotaOrder & { simulate_pay_available?: boolean }>;
  simulatePay(userId: string, orderId: string): Promise<UsageQuotaOrder>;
}

/**
 * 创建 Usage Service 实例
 */
export function createUsageService(
  getRepo: () => UsageRepository = () => defaultUsageRepo
): UsageService {
  return {
    getPricing: async () => {
      const platformConfig = await prisma.platformConfig.findUnique({ where: { id: 'default' } });
      const pricing = (platformConfig?.usage_pricing as Record<string, unknown>) ?? {};
      return {
        price_per_org: (pricing.price_per_org as number) ?? 0,
        price_per_apartment: (pricing.price_per_apartment as number) ?? 0,
        price_per_room: (pricing.price_per_room as number) ?? 0,
        price_per_member: (pricing.price_per_member as number) ?? 0,
      };
    },

    getQuota: async (userId: string) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const quotas = await getRepo().findValidQuotas(userId, today);
      return quotas.reduce(
        (acc, q) => ({
          orgs: acc.orgs + q.orgs,
          apartments: acc.apartments + q.apartments,
          rooms: acc.rooms + q.rooms,
          members: acc.members + q.members,
        }),
        { orgs: 0, apartments: 0, rooms: 0, members: 0 }
      );
    },

    createOrder: async (userId: string, data: CreateOrderInput) => {
      const { orgs, apartments, rooms, members } = data;

      if (orgs === 0 && apartments === 0 && rooms === 0 && members === 0) {
        throw createAppError(400, '至少选择一种对象数量');
      }

      const platformConfig = await prisma.platformConfig.findUnique({ where: { id: 'default' } });
      const usagePricing = (platformConfig?.usage_pricing as Record<string, unknown>) ?? {};
      if (
        usagePricing.price_per_org == null &&
        usagePricing.price_per_apartment == null &&
        usagePricing.price_per_room == null &&
        usagePricing.price_per_member == null
      ) {
        throw createAppError(400, '按量定价未配置');
      }

      const amount =
        Number(usagePricing.price_per_org ?? 0) * orgs +
        Number(usagePricing.price_per_apartment ?? 0) * apartments +
        Number(usagePricing.price_per_room ?? 0) * rooms +
        Number(usagePricing.price_per_member ?? 0) * members;

      if (amount <= 0) {
        throw createAppError(400, '订单金额必须大于 0');
      }

      const orderNo = `USG${Date.now()}`;
      const expires = new Date();
      expires.setHours(expires.getHours() + 2);

      const order = await getRepo().createOrder({
        id: ulid().toLowerCase(),
        order_no: orderNo,
        user: { connect: { id: userId } },
        orgs,
        apartments,
        rooms,
        members,
        amount,
        status: 'pending',
        expires_at: expires,
      });

      return order;
    },

    getOrder: async (userId: string, orderId: string) => {
      const order = await getRepo().findOrderById(orderId, userId);
      if (!order) {
        throw createAppError(404, '订单不存在');
      }

      const payload = order as UsageQuotaOrder & { simulate_pay_available?: boolean };
      if (config.isDev && order.status === 'pending' && !order.code_url) {
        payload.simulate_pay_available = true;
      }
      return payload;
    },

    simulatePay: async (userId: string, orderId: string) => {
      if (!config.isDev) {
        throw createAppError(403, '模拟支付仅限开发环境');
      }

      const order = await getRepo().findOrderById(orderId, userId);
      if (!order) {
        throw createAppError(404, '订单不存在');
      }
      if (order.status !== 'pending') {
        throw createAppError(400, '订单状态不允许模拟支付');
      }

      await getRepo().updateOrder(order.id, { status: 'paid', paid_at: new Date() });

      // 履约
      const { fulfillUsageQuota } = await import('../services/fulfillUsageQuota.js');
      await fulfillUsageQuota(order.id);

      const updated = await getRepo().findOrderByIdOnly(order.id);
      return updated ?? order;
    },
  };
}

/**
 * 默认实例
 */
export const defaultUsageService = createUsageService();
