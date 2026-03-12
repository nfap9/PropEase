import { ulid } from 'ulid';
import { prisma } from '../lib/prisma.js';

/**
 * 用户注册时创建个人组织
 * 不再自动开通免费套餐，用户需要手动购买套餐
 */
export async function createPersonalOrg(userId: string): Promise<void> {
  const slug = `personal-${userId}`;
  const existing = await prisma.organization.findUnique({ where: { slug } });
  if (existing) return;

  const orgId = ulid().toLowerCase();
  const memberId = ulid().toLowerCase();

  await prisma.$transaction([
    prisma.organization.create({
      data: {
        id: orgId,
        name: '个人',
        slug,
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
  ]);
}

/**
 * @deprecated 使用 createPersonalOrg 代替
 * 保留向后兼容：如果存在免费套餐则自动开通，否则只创建组织
 */
export async function createPersonalOrgWithFreePlan(userId: string): Promise<void> {
  const slug = `personal-${userId}`;
  const existing = await prisma.organization.findUnique({ where: { slug } });
  if (existing) return;

  // 检查是否存在免费套餐
  const freePlan = await prisma.subscriptionPlan.findFirst({
    where: { code: 'free', is_active: true },
  });

  const orgId = ulid().toLowerCase();
  const memberId = ulid().toLowerCase();

  if (freePlan) {
    // 如果存在免费套餐，自动开通（向后兼容）
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

    const subId = ulid().toLowerCase();

    await prisma.$transaction([
      prisma.organization.create({
        data: {
          id: orgId,
          name: '个人',
          slug,
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
          billing_months: 1,
          start_date: startDate,
          end_date: endDate,
          auto_renew: false,
          limits_snapshot: limitsSnapshot,
        },
      }),
    ]);
  } else {
    // 没有免费套餐，只创建组织
    await prisma.$transaction([
      prisma.organization.create({
        data: {
          id: orgId,
          name: '个人',
          slug,
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
    ]);
  }
}
