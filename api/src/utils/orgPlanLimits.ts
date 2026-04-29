import { prisma } from '../lib/prisma.js';
import type { ServiceProduct } from '@prisma/client';
import { isSubscriptionActive } from './subscription.js';

/** 已废弃：曾经用 -1 表示不限，现已废弃，保留大数值保证向后兼容 */
const UNLIMITED_COUNT = 999999;

const DEFAULT_FREE_LIMITS = {
  max_organizations: 1,
  max_apartments: 1,
  max_rooms: 100,
  max_members: 1,
  rooms_count_scope: 'organization' as const,
  members_count_scope: 'organization' as const,
};

/** 将 -1（曾经表示不限）转换为 UNLIMITED_COUNT，向后兼容旧数据 */
function normalizeLimit(value: number | null | undefined): number {
  if (value === null || value === undefined) return UNLIMITED_COUNT;
  return value < 0 ? UNLIMITED_COUNT : value;
}

export type CountScope = 'organization' | 'user';

/**
 * 返回组织当前应使用的服务产品（有有效订阅用订阅服务，否则用 free 服务）
 */
export async function getEffectiveServiceForOrg(orgId: string): Promise<ServiceProduct | null> {
  const sub = await prisma.organizationSubscription.findUnique({
    where: { organization_id: orgId },
    include: { service: true },
  });
  if (sub && isSubscriptionActive(sub)) return sub.service;

  // 无有效订阅时，返回 free 服务产品
  const freeService = await prisma.serviceProduct.findFirst({
    where: { code: 'free' },
  });
  return freeService;
}

/**
 * @deprecated 使用 getEffectiveServiceForOrg 代替
 */
export const getEffectivePlanForOrg = getEffectiveServiceForOrg;

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
 * 返回组织当前服务产品的额度（组织数/公寓/房间/成员上限及计数范围），无服务时使用兜底值
 * 免费服务订阅若有 limits_snapshot 则优先使用（注册时快照，不受运营后续修改影响）
 * userId 可选：提供时叠加用户按量购买额度（用户级，所有组织共享）
 */
export async function getEffectivePlanLimits(orgId: string): Promise<PlanLimits> {
  const sub = await prisma.organizationSubscription.findUnique({
    where: { organization_id: orgId },
    include: { service: true },
  });
  const service = await getEffectiveServiceForOrg(orgId);
  let base: PlanLimits = {
    max_organizations: DEFAULT_FREE_LIMITS.max_organizations,
    max_apartments: DEFAULT_FREE_LIMITS.max_apartments,
    max_rooms: DEFAULT_FREE_LIMITS.max_rooms,
    max_members: DEFAULT_FREE_LIMITS.max_members,
    rooms_count_scope: DEFAULT_FREE_LIMITS.rooms_count_scope as CountScope,
    members_count_scope: DEFAULT_FREE_LIMITS.members_count_scope as CountScope,
  };
  if (service) {
    const snapshot = sub?.limits_snapshot as LimitsSnapshot | null | undefined;
    const useSnapshot = sub && isSubscriptionActive(sub) && sub.service?.code === 'free' && snapshot;
    base = {
      max_organizations:
        useSnapshot && snapshot.max_organizations !== undefined
          ? normalizeLimit(snapshot.max_organizations)
          : normalizeLimit(service.max_organizations),
      max_apartments:
        useSnapshot && snapshot.max_apartments !== undefined
          ? normalizeLimit(snapshot.max_apartments)
          : normalizeLimit(service.max_apartments),
      max_rooms:
        useSnapshot && snapshot.max_rooms !== undefined
          ? normalizeLimit(snapshot.max_rooms)
          : normalizeLimit(service.max_rooms),
      max_members:
        useSnapshot && snapshot.max_members !== undefined
          ? normalizeLimit(snapshot.max_members)
          : normalizeLimit(service.max_members),
      // ServiceProduct 不再有 rooms_count_scope 和 members_count_scope，使用默认值
      rooms_count_scope: DEFAULT_FREE_LIMITS.rooms_count_scope as CountScope,
      members_count_scope: DEFAULT_FREE_LIMITS.members_count_scope as CountScope,
    };
  }
  return base;
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

/** 无订阅时用户最多 1 个组织；有订阅时取各服务产品 max_organizations 的最大值，null 视为不限制（用较大值表示） */
const UNLIMITED_ORGS = 9999;

/**
 * 用户最多可拥有的组织数：无有效订阅为 1，有订阅时为各所属组织服务产品中 max_organizations 的最大值
 * 免费服务订阅若有 limits_snapshot 则用其中的 max_organizations
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
      include: { service: true },
    });
    const activeSubs = subs.filter((s) => isSubscriptionActive(s));
    if (activeSubs.length > 0) {
      let max = 0;
      for (const s of activeSubs) {
        const snapshot = s.limits_snapshot as LimitsSnapshot | null | undefined;
        const n =
          s.service?.code === 'free' && snapshot?.max_organizations !== undefined
            ? (snapshot.max_organizations ?? UNLIMITED_ORGS)
            : (s.service?.max_organizations ?? UNLIMITED_ORGS);
        if (n > max) max = n;
      }
      baseMax = max === UNLIMITED_ORGS ? UNLIMITED_ORGS : max;
    }
  }
  return baseMax;
}

/**
 * 用于限额校验的"已用房间数"：scope=organization 为当前组织房间数，scope=user 为用户所属全部组织的房间总数
 */
export async function getRoomsUsedForLimitCheck(orgId: string, userId: string): Promise<number> {
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
 * 用于限额校验的"已用成员数"：scope=organization 为当前组织成员数，scope=user 为用户所属全部组织的成员总数
 */
export async function getMembersUsedForLimitCheck(orgId: string, userId: string): Promise<number> {
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
