import { ulid } from 'ulid';
import { prisma } from '../lib/prisma.js';

/**
 * 根据已支付订单开通/续费/升级组织订阅。
 */
export async function fulfillSubscription(orderId: string): Promise<void> {
  const order = await prisma.subscriptionOrder.findUnique({
    where: { id: orderId },
    include: { plan: true },
  });
  if (!order || order.status !== 'paid') return;

  const orgId = order.organization_id;
  const planId = order.plan_id;
  const billingCycle = order.billing_cycle;
  const plan = order.plan;
  if (!plan) throw new Error('套餐不存在');

  const subscription = await prisma.organizationSubscription.findUnique({
    where: { organization_id: orgId },
    include: { plan: true },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const active =
    subscription &&
    subscription.status === 'active' &&
    (!subscription.end_date || new Date(subscription.end_date) >= today);

  if (!active || !subscription) {
    const startDate = new Date();
    const endDate = new Date(startDate);
    if (billingCycle === 'yearly') endDate.setFullYear(endDate.getFullYear() + 1);
    else endDate.setMonth(endDate.getMonth() + 1);
    await prisma.organizationSubscription.upsert({
      where: { organization_id: orgId },
      create: {
        id: ulid().toLowerCase(),
        organization_id: orgId,
        plan_id: planId,
        status: 'active',
        billing_cycle: billingCycle,
        start_date: startDate,
        end_date: endDate,
        auto_renew: true,
      },
      update: {
        plan_id: planId,
        status: 'active',
        start_date: startDate,
        end_date: endDate,
        next_plan_id: null,
      },
    });
    await prisma.organization.update({
      where: { id: orgId },
      data: { plan: plan.code },
    });
  } else if (subscription.plan_id === planId) {
    const baseDate = subscription.end_date && new Date(subscription.end_date) >= today
      ? new Date(subscription.end_date)
      : today;
    const newEnd = new Date(baseDate);
    if (billingCycle === 'yearly') newEnd.setFullYear(newEnd.getFullYear() + 1);
    else newEnd.setMonth(newEnd.getMonth() + 1);
    await prisma.organizationSubscription.update({
      where: { organization_id: orgId },
      data: { end_date: newEnd, next_plan_id: null },
    });
    await prisma.organization.update({
      where: { id: orgId },
      data: { plan: plan.code },
    });
  } else {
    await prisma.organizationSubscription.update({
      where: { organization_id: orgId },
      data: { plan_id: planId, billing_cycle: billingCycle, next_plan_id: null },
    });
    await prisma.organization.update({
      where: { id: orgId },
      data: { plan: plan.code },
    });
  }

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
