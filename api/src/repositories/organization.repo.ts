import type { Prisma, Organization, OrganizationMember, User } from '@prisma/client';
import type { DbClient } from '../types/repository.types.js';
import { prisma } from '../lib/prisma.js';

/**
 * 组织成员包含用户信息
 */
export type MemberWithUser = OrganizationMember & {
  user: User | null;
};

/**
 * Organization Repository 接口
 */
export interface OrganizationRepository {
  findById(id: string): Promise<Organization | null>;
  findBySlug(slug: string): Promise<Organization | null>;
  findPersonalOrgByUserId(userId: string): Promise<Organization | null>;
  findByUserId(userId: string): Promise<(Organization & { members: OrganizationMember[] })[]>;
  create(data: Prisma.OrganizationCreateInput): Promise<Organization>;
  update(id: string, data: Prisma.OrganizationUpdateInput): Promise<Organization>;
  delete(id: string): Promise<void>;
  findMember(orgId: string, userId: string): Promise<OrganizationMember | null>;
  findMembersByOrgId(orgId: string): Promise<MemberWithUser[]>;
  createMember(data: Prisma.OrganizationMemberCreateInput): Promise<OrganizationMember>;
  updateMember(orgId: string, userId: string, data: Partial<OrganizationMember>): Promise<number>;
  deleteMember(orgId: string, userId: string): Promise<number>;
}

/**
 * 创建 Organization Repository 实例
 */
export function createOrganizationRepository(db: DbClient): OrganizationRepository {
  return {
    findById: async (id: string) => {
      return db.organization.findUnique({ where: { id } });
    },

    findBySlug: async (slug: string) => {
      return db.organization.findUnique({ where: { slug } });
    },

    findPersonalOrgByUserId: async (userId: string) => {
      return db.organization.findFirst({
        where: {
          is_personal: true,
          members: { some: { user_id: userId } },
        },
      });
    },

    findByUserId: async (userId: string) => {
      const members = await db.organizationMember.findMany({
        where: { user_id: userId },
        include: { organization: { include: { members: true } } },
      });
      return members.map((m) => m.organization);
    },

    create: async (data: Prisma.OrganizationCreateInput) => {
      return db.organization.create({ data });
    },

    update: async (id: string, data: Prisma.OrganizationUpdateInput) => {
      return db.organization.update({ where: { id }, data });
    },

    delete: async (id: string) => {
      await db.organization.delete({ where: { id } });
    },

    findMember: async (orgId: string, userId: string) => {
      return db.organizationMember.findFirst({
        where: { organization_id: orgId, user_id: userId },
      });
    },

    findMembersByOrgId: async (orgId: string) => {
      return db.organizationMember.findMany({
        where: { organization_id: orgId },
        include: { user: true },
      }) as Promise<MemberWithUser[]>;
    },

    createMember: async (data: Prisma.OrganizationMemberCreateInput) => {
      return db.organizationMember.create({ data });
    },

    updateMember: async (orgId: string, userId: string, data: Partial<OrganizationMember>) => {
      const result = await db.organizationMember.updateMany({
        where: { organization_id: orgId, user_id: userId },
        data,
      });
      return result.count;
    },

    deleteMember: async (orgId: string, userId: string) => {
      const result = await db.organizationMember.deleteMany({
        where: { organization_id: orgId, user_id: userId },
      });
      return result.count;
    },
  };
}

/**
 * 默认实例
 */
export const defaultOrgRepo = createOrganizationRepository(prisma);
