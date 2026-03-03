import { ulid } from 'ulid';
import { prisma } from '../lib/prisma.js';

/**
 * 按量订单支付成功后创建/叠加用户额度
 */
export async function fulfillUsageQuota(orderId: string): Promise<void> {
  const order = await prisma.usageQuotaOrder.findUnique({
    where: { id: orderId },
  });
  if (!order || order.status !== 'paid') return;

  const validFrom = new Date(order.paid_at ?? order.created_at);
  validFrom.setHours(0, 0, 0, 0);
  const validTo = new Date(validFrom);
  validTo.setFullYear(validTo.getFullYear() + 1);
  validTo.setHours(0, 0, 0, 0);

  const quotaId = ulid().toLowerCase();
  await prisma.usageQuota.create({
    data: {
      id: quotaId,
      user_id: order.user_id,
      orgs: order.orgs,
      apartments: order.apartments,
      rooms: order.rooms,
      members: order.members,
      valid_from: validFrom,
      valid_to: validTo,
      usage_quota_order_id: orderId,
    },
  });
}
