import { ulid } from 'ulid';
import { prisma } from '../lib/prisma.js';

const FREE_PLAN_CODE = 'free';

/**
 * 用户注册时创建个人组织并开通免费套餐（快照：额度与期限以注册时运营配置为准）
 */
export async function createPersonalOrgWithFreePlan(userId: string): Promise<void> {
  const freePlan = await prisma.subscriptionPlan.findFirst({
    where: { code: FREE_PLAN_CODE, is_active: true },
  });
  if (!freePlan) {
    throw new Error('免费套餐未配置，无法创建个人组织');
  }

  const slug = `personal-${userId}`;
  const existing = await prisma.organization.findUnique({ where: { slug } });
  if (existing) return;

  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);

  let endDate: Date | null = null;
  if (freePlan.free_validity_days != null && freePlan.free_validity_days > 0) {
    endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + freePlan.free_validity_days);
    endDate.setHours(0, 0, 0, 0);
  }

  const limitsSnapshot = {
    max_organizations: freePlan.max_organizations,
    max_apartments: freePlan.max_apartments,
    max_rooms: freePlan.max_rooms,
    max_members: freePlan.max_members,
  };

  const orgId = ulid().toLowerCase();
  const subId = ulid().toLowerCase();
  const memberId = ulid().toLowerCase();

  await prisma.$transaction([
    prisma.organization.create({
      data: {
        id: orgId,
        name: '个人',
        slug,
        plan: FREE_PLAN_CODE,
        is_personal: true,
      },
    }),
    prisma.organizationMember.create({
      data: {
        id: memberId,
        organization_id: orgId,
        user_id: userId,
        role: 'owner',
      },
    }),
    prisma.organizationSubscription.create({
      data: {
        id: subId,
        organization_id: orgId,
        plan_id: freePlan.id,
        status: 'active',
        billing_cycle: 'monthly',
        start_date: startDate,
        end_date: endDate,
        auto_renew: false,
        limits_snapshot: limitsSnapshot,
      },
    }),
  ]);
}
