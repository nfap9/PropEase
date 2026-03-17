import { ulid } from 'ulid';
import { prisma } from '../lib/prisma.js';
import {
  createSubscriptionRepository,
  isSubscriptionActive,
  type SubscriptionRepository,
} from '../repositories/subscription.repo.js';
import type { DbClient, RepositoryFactory } from '../types/repository.types.js';

interface FulfillSubscriptionDependencies {
  createId?: () => string;
  getSubscriptionRepo?: RepositoryFactory<SubscriptionRepository>;
  runInTransaction?: <T>(callback: (db: DbClient) => Promise<T>) => Promise<T>;
}

const defaultRunInTransaction = async <T>(callback: (db: DbClient) => Promise<T>) => {
  return prisma.$transaction((tx) => callback(tx as DbClient));
};

function resolveDependencies(deps: FulfillSubscriptionDependencies = {}) {
  return {
    createId: deps.createId ?? (() => ulid().toLowerCase()),
    getSubscriptionRepo: deps.getSubscriptionRepo ?? createSubscriptionRepository,
    runInTransaction: deps.runInTransaction ?? defaultRunInTransaction,
  };
}

/**
 * 计算订阅结束日期
 * @param startDate 开始日期
 * @param months 月数
 * @returns 结束日期
 */
function calculateEndDate(startDate: Date, months: number): Date {
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + months);
  return endDate;
}

export async function fulfillSubscription(
  orderId: string,
  rawDeps: FulfillSubscriptionDependencies = {}
): Promise<void> {
  const deps = resolveDependencies(rawDeps);
  const repo = deps.getSubscriptionRepo(prisma);
  const order = await repo.findOrderByIdOnly(orderId);
  if (!order || order.status !== 'paid') return;

  const orgId = order.organization_id;
  const serviceId = order.service_id;
  const billingMonths = order.billing_months ?? 1;
  const service = order.service;
  if (!service) throw new Error('服务产品不存在');

  // 计算总月数（购买月数 + 赠送月数）
  let totalMonths = billingMonths;
  // 从订单的 total_gift_months 获取赠送时长
  if (order.total_gift_months && order.total_gift_months > 0) {
    totalMonths += order.total_gift_months;
  }

  await deps.runInTransaction(async (db) => {
    const txRepo = deps.getSubscriptionRepo(db);
    const subscription = await txRepo.findSubscriptionByOrgId(orgId);

    if (!subscription || !isSubscriptionActive(subscription)) {
      // 新订阅
      const startDate = new Date();
      const endDate = calculateEndDate(startDate, totalMonths);

      if (subscription) {
        await txRepo.updateSubscription(orgId, {
          service: { connect: { id: serviceId } },
          pricing: order.pricing_id ? { connect: { id: order.pricing_id } } : { disconnect: true },
          status: 'active',
          billing_months: billingMonths,
          start_date: startDate,
          end_date: endDate,
          auto_renew: true,
          next_service: { disconnect: true },
        });
      } else {
        await txRepo.createSubscription({
          id: deps.createId(),
          organization: { connect: { id: orgId } },
          service: { connect: { id: serviceId } },
          pricing: order.pricing_id ? { connect: { id: order.pricing_id } } : undefined,
          status: 'active',
          billing_months: billingMonths,
          start_date: startDate,
          end_date: endDate,
          auto_renew: true,
        });
      }
    } else if (subscription.service_id === serviceId) {
      // 同服务续费：在现有结束日期基础上延长
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const baseDate =
        subscription.end_date && new Date(subscription.end_date) >= today
          ? new Date(subscription.end_date)
          : today;
      const newEnd = calculateEndDate(baseDate, totalMonths);

      await txRepo.updateSubscription(orgId, {
        end_date: newEnd,
        billing_months: billingMonths,
        pricing: order.pricing_id ? { connect: { id: order.pricing_id } } : { disconnect: true },
        next_service: { disconnect: true },
      });
    } else {
      // 升级服务
      const startDate = new Date();
      const endDate = calculateEndDate(startDate, totalMonths);

      await txRepo.updateSubscription(orgId, {
        service: { connect: { id: serviceId } },
        pricing: order.pricing_id ? { connect: { id: order.pricing_id } } : { disconnect: true },
        billing_months: billingMonths,
        start_date: startDate,
        end_date: endDate,
        next_service: { disconnect: true },
      });
    }

    const updatedSubscription = await txRepo.findSubscriptionByOrgId(orgId);
    if (updatedSubscription) {
      await txRepo.updateOrder(orderId, {
        org_subscription: { connect: { id: updatedSubscription.id } },
      });
    }
  });
}
