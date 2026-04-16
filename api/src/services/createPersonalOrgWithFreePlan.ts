import { ulid } from 'ulid';
import { prisma } from '../lib/prisma.js';
import {
  createOrganizationRepository,
  type OrganizationRepository,
} from '../repositories/organization.repo.js';
import type { DbClient, RepositoryFactory } from '../types/repository.types.js';

interface PersonalOrgDependencies {
  createId?: () => string;
  getOrgRepo?: RepositoryFactory<OrganizationRepository>;
  runInTransaction?: <T>(callback: (db: DbClient) => Promise<T>) => Promise<T>;
}

const defaultRunInTransaction = async <T>(callback: (db: DbClient) => Promise<T>) => {
  return prisma.$transaction((tx) => callback(tx as DbClient));
};

function resolveDependencies(deps: PersonalOrgDependencies = {}) {
  return {
    createId: deps.createId ?? (() => ulid().toLowerCase()),
    getOrgRepo: deps.getOrgRepo ?? createOrganizationRepository,
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
  const existing = await orgRepo.findBySlug(slug);
  if (existing) return;

  // 使用 billingOrderRepo 查找免费服务
  const freeService = await prisma.serviceProduct.findFirst({
    where: { code: 'free', is_active: true },
  });

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

      // 使用 prisma 直接创建 subscription（因为在事务中）
      await db.organizationSubscription.create({
        data: {
          id: subId,
          organization_id: orgId,
          service_id: freeService.id,
          status: 'active',
          billing_months: 1,
          start_date: startDate,
          end_date: endDate,
          auto_renew: false,
          limits_snapshot: limitsSnapshot as object,
        },
      });
    });
  } else {
    // 没有免费服务，只创建组织
    await createPersonalOrgRecords(userId, slug, deps);
  }
}
