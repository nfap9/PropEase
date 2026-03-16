import { ulid } from 'ulid';
import { prisma } from '../lib/prisma.js';

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

/**
 * 根据已支付订单开通/续费/升级组织订阅。
 * 支持任意月数周期和商店配置的赠送时长。
 */
export async function fulfillSubscription(orderId: string): Promise<void> {
  const order = await prisma.subscriptionOrder.findUnique({
    where: { id: orderId },
    include: {
      service: true,
    },
  });
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

  const subscription = await prisma.organizationSubscription.findUnique({
    where: { organization_id: orgId },
    include: { service: true },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const active =
    subscription &&
    subscription.status === 'active' &&
    (!subscription.end_date || new Date(subscription.end_date) >= today);

  if (!active || !subscription) {
    // 新订阅
    const startDate = new Date();
    const endDate = calculateEndDate(startDate, totalMonths);

    await prisma.organizationSubscription.upsert({
      where: { organization_id: orgId },
      create: {
        id: ulid().toLowerCase(),
        organization_id: orgId,
        service_id: serviceId,
        pricing_id: order.pricing_id,
        status: 'active',
        billing_months: billingMonths,
        start_date: startDate,
        end_date: endDate,
        auto_renew: true,
      },
      update: {
        service_id: serviceId,
        pricing_id: order.pricing_id,
        status: 'active',
        billing_months: billingMonths,
        start_date: startDate,
        end_date: endDate,
        next_service_id: null,
      },
    });
  } else if (subscription.service_id === serviceId) {
    // 同服务续费：在现有结束日期基础上延长
    const baseDate =
      subscription.end_date && new Date(subscription.end_date) >= today
        ? new Date(subscription.end_date)
        : today;
    const newEnd = calculateEndDate(baseDate, totalMonths);

    await prisma.organizationSubscription.update({
      where: { organization_id: orgId },
      data: {
        end_date: newEnd,
        billing_months: billingMonths,
        pricing_id: order.pricing_id,
        next_service_id: null,
      },
    });
  } else {
    // 升级服务
    const startDate = new Date();
    const endDate = calculateEndDate(startDate, totalMonths);

    await prisma.organizationSubscription.update({
      where: { organization_id: orgId },
      data: {
        service_id: serviceId,
        pricing_id: order.pricing_id,
        billing_months: billingMonths,
        start_date: startDate,
        end_date: endDate,
        next_service_id: null,
      },
    });
  }

  // 关联订单到订阅
  const sub = await prisma.organizationSubscription.findUnique({
    where: { organization_id: orgId },
  });
  if (sub) {
    await prisma.subscriptionOrder.update({
      where: { id: orderId },
      data: { organization_subscription_id: sub.id },
    });
  }
}
