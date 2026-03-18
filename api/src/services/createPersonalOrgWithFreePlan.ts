import { ulid } from 'ulid';
import { prisma } from '../lib/prisma.js';
import {
  createOrganizationRepository,
  type OrganizationRepository,
} from '../repositories/organization.repo.js';
import {
  createSubscriptionRepository,
  type SubscriptionRepository,
} from '../repositories/subscription.repo.js';
import type { DbClient, RepositoryFactory } from '../types/repository.types.js';

interface PersonalOrgDependencies {
  createId?: () => string;
  getOrgRepo?: RepositoryFactory<OrganizationRepository>;
  getSubscriptionRepo?: RepositoryFactory<SubscriptionRepository>;
  runInTransaction?: <T>(callback: (db: DbClient) => Promise<T>) => Promise<T>;
}

const defaultRunInTransaction = async <T>(callback: (db: DbClient) => Promise<T>) => {
  return prisma.$transaction((tx) => callback(tx as DbClient));
};

function resolveDependencies(deps: PersonalOrgDependencies = {}) {
  return {
    createId: deps.createId ?? (() => ulid().toLowerCase()),
    getOrgRepo: deps.getOrgRepo ?? createOrganizationRepository,
    getSubscriptionRepo: deps.getSubscriptionRepo ?? createSubscriptionRepository,
    runInTransaction: deps.runInTransaction ?? defaultRunInTransaction,
  };
}

async function createPersonalOrgRecords(
  userId: string,
  slug: string,
  deps: ReturnType<typeof resolveDependencies>
): Promise<void> {
  const orgId = deps.createId();
  const memberId = deps.createId();

  await deps.runInTransaction(async (db) => {
    const orgRepo = deps.getOrgRepo(db);

    await orgRepo.create({
      id: orgId,
      name: '个人',
      slug,
      is_personal: true,
    });

    await orgRepo.createMember({
      id: memberId,
      organization: { connect: { id: orgId } },
      user: { connect: { id: userId } },
      role: 'owner',
    });
  });
}

/**
 * 用户注册时创建个人组织
 * 不再自动开通免费服务，用户需要手动购买服务
 */
export async function createPersonalOrg(
  userId: string,
  rawDeps: PersonalOrgDependencies = {}
): Promise<void> {
  const deps = resolveDependencies(rawDeps);
  const slug = `personal-${userId}`;
  const existing = await deps.getOrgRepo(prisma).findBySlug(slug);
  if (existing) return;

  await createPersonalOrgRecords(userId, slug, deps);
}

/**
 * @deprecated 使用 createPersonalOrg 代替
 * 保留向后兼容：如果存在免费服务则自动开通，否则只创建组织
 */
export async function createPersonalOrgWithFreePlan(
  userId: string,
  rawDeps: PersonalOrgDependencies = {}
): Promise<void> {
  const deps = resolveDependencies(rawDeps);
  const slug = `personal-${userId}`;
  const orgRepo = deps.getOrgRepo(prisma);
  const subscriptionRepo = deps.getSubscriptionRepo(prisma);
  const existing = await orgRepo.findBySlug(slug);
  if (existing) return;

  // 检查是否存在免费服务产品
  const freeService = await subscriptionRepo.findActiveServiceByCode('free');

  if (freeService) {
    // 如果存在免费服务，自动开通（向后兼容）
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    // 免费服务没有有效期限制
    const endDate: Date | null = null;

    const limitsSnapshot = {
      max_organizations: freeService.max_organizations,
      max_apartments: freeService.max_apartments,
      max_rooms: freeService.max_rooms,
      max_members: freeService.max_members,
    };

    const orgId = deps.createId();
    const memberId = deps.createId();
    const subId = deps.createId();

    await deps.runInTransaction(async (db) => {
      const txOrgRepo = deps.getOrgRepo(db);
      const txSubscriptionRepo = deps.getSubscriptionRepo(db);

      await txOrgRepo.create({
        id: orgId,
        name: '个人',
        slug,
        is_personal: true,
      });

      await txOrgRepo.createMember({
        id: memberId,
        organization: { connect: { id: orgId } },
        user: { connect: { id: userId } },
        role: 'owner',
      });

      await txSubscriptionRepo.createSubscription({
        id: subId,
        organization: { connect: { id: orgId } },
        service: { connect: { id: freeService.id } },
        status: 'active',
        billing_months: 1,
        start_date: startDate,
        end_date: endDate,
        auto_renew: false,
        limits_snapshot: limitsSnapshot,
      });
    });
  } else {
    // 没有免费服务，只创建组织
    await createPersonalOrgRecords(userId, slug, deps);
  }
}
