import { prisma } from '../lib/prisma.js';
import type { SubscriptionPlan } from '../generated/client/index.js';

const DEFAULT_FREE_LIMITS = {
  max_organizations: 1,
  max_apartments: 1,
  max_rooms: 100,
  max_members: 1,
  rooms_count_scope: 'organization' as const,
  members_count_scope: 'organization' as const,
};

export type CountScope = 'organization' | 'user';

/**
 * 判断组织的订阅是否有效：存在且 status=active 且 end_date 为空或 >= 今天
 */
function isSubscriptionActive(
  sub: { status: string; end_date: Date | null } | null
): boolean {
  if (!sub || sub.status !== 'active') return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (!sub.end_date) return true;
  const end = new Date(sub.end_date);
  end.setHours(0, 0, 0, 0);
  return end >= today;
}

/**
 * 返回组织当前应使用的套餐（有有效订阅用订阅套餐，否则用 org.plan 对应的套餐）
 */
export async function getEffectivePlanForOrg(
  orgId: string
): Promise<SubscriptionPlan | null> {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { plan: true },
  });
  if (!org) return null;

  const sub = await prisma.organizationSubscription.findUnique({
    where: { organization_id: orgId },
    include: { plan: true },
  });
  if (sub && isSubscriptionActive(sub)) return sub.plan;

  const planCode = org.plan || 'free';
  const plan = await prisma.subscriptionPlan.findFirst({
    where: { code: planCode },
  });
  return plan;
}

export interface PlanLimits {
  max_organizations: number | null;
  max_apartments: number;
  max_rooms: number;
  max_members: number;
  rooms_count_scope: CountScope;
  members_count_scope: CountScope;
}

interface LimitsSnapshot {
  max_organizations?: number | null;
  max_apartments?: number;
  max_rooms?: number;
  max_members?: number;
}

/**
 * 返回组织当前套餐的额度（组织数/公寓/房间/成员上限及计数范围），无套餐时使用兜底值
 * 免费套餐订阅若有 limits_snapshot 则优先使用（注册时快照，不受运营后续修改影响）
 * userId 可选：提供时叠加用户按量购买额度（用户级，所有组织共享）
 */
export async function getEffectivePlanLimits(
  orgId: string,
  userId?: string
): Promise<PlanLimits> {
  const sub = await prisma.organizationSubscription.findUnique({
    where: { organization_id: orgId },
    include: { plan: true },
  });
  const plan = await getEffectivePlanForOrg(orgId);
  const scope = (s: string | null): CountScope =>
    s === 'user' ? 'user' : 'organization';
  let base: PlanLimits = {
    max_organizations: DEFAULT_FREE_LIMITS.max_organizations,
    max_apartments: DEFAULT_FREE_LIMITS.max_apartments,
    max_rooms: DEFAULT_FREE_LIMITS.max_rooms,
    max_members: DEFAULT_FREE_LIMITS.max_members,
    rooms_count_scope: DEFAULT_FREE_LIMITS.rooms_count_scope as CountScope,
    members_count_scope: DEFAULT_FREE_LIMITS.members_count_scope as CountScope,
  };
  if (plan) {
    const snapshot = sub?.limits_snapshot as LimitsSnapshot | null | undefined;
    const useSnapshot =
      sub && isSubscriptionActive(sub) && sub.plan?.code === 'free' && snapshot;
    base = {
      max_organizations: useSnapshot && snapshot.max_organizations !== undefined
        ? snapshot.max_organizations
        : plan.max_organizations,
      max_apartments: useSnapshot && snapshot.max_apartments !== undefined
        ? snapshot.max_apartments
        : plan.max_apartments,
      max_rooms: useSnapshot && snapshot.max_rooms !== undefined
        ? snapshot.max_rooms
        : plan.max_rooms,
      max_members: useSnapshot && snapshot.max_members !== undefined
        ? snapshot.max_members
        : plan.max_members,
      rooms_count_scope: scope(plan.rooms_count_scope),
      members_count_scope: scope(plan.members_count_scope),
    };
  }
  if (!userId) return base;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const quotas = await prisma.usageQuota.findMany({
    where: {
      user_id: userId,
      valid_from: { lte: today },
      valid_to: { gte: today },
    },
  });
  const usageBonus = quotas.reduce(
    (acc, q) => ({
      orgs: acc.orgs + q.orgs,
      apartments: acc.apartments + q.apartments,
      rooms: acc.rooms + q.rooms,
      members: acc.members + q.members,
    }),
    { orgs: 0, apartments: 0, rooms: 0, members: 0 }
  );
  if (usageBonus.orgs === 0 && usageBonus.apartments === 0 && usageBonus.rooms === 0 && usageBonus.members === 0) {
    return base;
  }
  const resultOrgs =
    base.max_organizations === null
      ? null
      : base.max_organizations + usageBonus.orgs;
  return {
    ...base,
    max_organizations: resultOrgs,
    max_apartments: base.max_apartments + usageBonus.apartments,
    max_rooms: base.max_rooms + usageBonus.rooms,
    max_members: base.max_members + usageBonus.members,
  };
}

/**
 * 用户是否至少属于一个具有有效订阅的组织
 */
export async function userHasActiveSubscription(userId: string): Promise<boolean> {
  const members = await prisma.organizationMember.findMany({
    where: { user_id: userId },
    select: { organization_id: true },
  });
  const orgIds = members.map((m) => m.organization_id);
  if (orgIds.length === 0) return false;
  const subs = await prisma.organizationSubscription.findMany({
    where: { organization_id: { in: orgIds } },
    select: { status: true, end_date: true },
  });
  return subs.some((s) => isSubscriptionActive(s));
}

/**
 * 用户当前所属组织数量
 */
export async function userOrganizationCount(userId: string): Promise<number> {
  return prisma.organizationMember.count({
    where: { user_id: userId },
  });
}

/**
 * 组织是否存在有效订阅（用于删除前置校验）
 */
export async function orgHasActiveSubscription(orgId: string): Promise<boolean> {
  const sub = await prisma.organizationSubscription.findUnique({
    where: { organization_id: orgId },
    select: { status: true, end_date: true },
  });
  return isSubscriptionActive(sub);
}

/** 无订阅时用户最多 1 个组织；有订阅时取各套餐 max_organizations 的最大值，null 视为不限制（用较大值表示） */
const UNLIMITED_ORGS = 9999;

/**
 * 用户最多可拥有的组织数：无有效订阅为 1，有订阅时为各所属组织套餐中 max_organizations 的最大值
 * 免费套餐订阅若有 limits_snapshot 则用其中的 max_organizations
 * 叠加用户按量购买的组织额度
 */
export async function getMaxOrganizationsForUser(userId: string): Promise<number> {
  const members = await prisma.organizationMember.findMany({
    where: { user_id: userId },
    select: { organization_id: true },
  });
  const orgIds = members.map((m) => m.organization_id);
  let baseMax = DEFAULT_FREE_LIMITS.max_organizations;
  if (orgIds.length > 0) {
    const subs = await prisma.organizationSubscription.findMany({
      where: { organization_id: { in: orgIds } },
      include: { plan: true },
    });
    const activeSubs = subs.filter((s) => isSubscriptionActive(s));
    if (activeSubs.length > 0) {
      let max = 0;
      for (const s of activeSubs) {
        const snapshot = s.limits_snapshot as LimitsSnapshot | null | undefined;
        const n =
          s.plan?.code === 'free' && snapshot?.max_organizations !== undefined
            ? (snapshot.max_organizations ?? UNLIMITED_ORGS)
            : (s.plan.max_organizations ?? UNLIMITED_ORGS);
        if (n > max) max = n;
      }
      baseMax = max === UNLIMITED_ORGS ? UNLIMITED_ORGS : max;
    }
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const quotas = await prisma.usageQuota.findMany({
    where: {
      user_id: userId,
      valid_from: { lte: today },
      valid_to: { gte: today },
      orgs: { gt: 0 },
    },
  });
  const usageOrgs = quotas.reduce((s, q) => s + q.orgs, 0);
  if (usageOrgs === 0) return baseMax;
  if (baseMax === UNLIMITED_ORGS) return baseMax;
  return baseMax + usageOrgs;
}

/**
 * 用于限额校验的“已用房间数”：scope=organization 为当前组织房间数，scope=user 为用户所属全部组织的房间总数
 */
export async function getRoomsUsedForLimitCheck(
  orgId: string,
  userId: string
): Promise<number> {
  const limits = await getEffectivePlanLimits(orgId);
  if (limits.rooms_count_scope === 'user') {
    const memberOrgs = await prisma.organizationMember.findMany({
      where: { user_id: userId },
      select: { organization_id: true },
    });
    const ids = memberOrgs.map((m) => m.organization_id);
    if (ids.length === 0) return 0;
    return prisma.room.count({
      where: { apartment: { organization_id: { in: ids } } },
    });
  }
  return prisma.room.count({
    where: { apartment: { organization_id: orgId } },
  });
}

/**
 * 用于限额校验的“已用成员数”：scope=organization 为当前组织成员数，scope=user 为用户所属全部组织的成员总数
 */
export async function getMembersUsedForLimitCheck(
  orgId: string,
  userId: string
): Promise<number> {
  const limits = await getEffectivePlanLimits(orgId);
  if (limits.members_count_scope === 'user') {
    const memberOrgs = await prisma.organizationMember.findMany({
      where: { user_id: userId },
      select: { organization_id: true },
    });
    const ids = memberOrgs.map((m) => m.organization_id);
    if (ids.length === 0) return 0;
    return prisma.organizationMember.count({
      where: { organization_id: { in: ids } },
    });
  }
  return prisma.organizationMember.count({
    where: { organization_id: orgId },
  });
}
