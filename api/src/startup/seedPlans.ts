import { ulid } from 'ulid';
import { prisma } from '../lib/prisma.js';

const FREE_PLAN_CODE = 'free';

export async function seedPlans(): Promise<void> {
  const existing = await prisma.subscriptionPlan.findFirst({
    where: { code: FREE_PLAN_CODE },
  });
  if (existing) return;
  await prisma.subscriptionPlan.create({
    data: {
      id: ulid().toLowerCase(),
      name: '免费版',
      code: FREE_PLAN_CODE,
      description: '免费组织，公寓、房间、成员数量受限，可在运营后台配置',
      price_monthly: 0,
      price_yearly: 0,
      max_organizations: 1,
      max_apartments: 1,
      max_rooms: 100,
      max_members: 1,
      rooms_count_scope: 'organization',
      members_count_scope: 'organization',
      is_active: true,
      sort_order: 0,
    },
  });
  console.log('Created subscription plan:', FREE_PLAN_CODE);
}
