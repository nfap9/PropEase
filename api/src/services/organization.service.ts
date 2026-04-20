import type { Organization, OrganizationMember, OrgRole, Prisma } from '@prisma/client';
import { ulid } from 'ulid';
import {
  createOrganizationRepository,
  type OrganizationRepository,
  type MemberWithUser,
} from '../repositories/organization.repo.js';
import { createAppError } from '../utils/appError.js';
import { NotFoundMessages } from '../messages.js';
import { prisma } from '../lib/prisma.js';
import {
  DEFAULT_ORG_ROLES,
} from '../constants/permissionDefaults.js';
import {
  compareBooleanDesc,
  compareDateAsc,
  compareNaturalText,
  compareNumberAsc,
} from '../utils/intuitiveSort.js';

/**
 * 创建组织输入
 */
export interface CreateOrgInput {
  name: string;
  slug?: string;
}

/**
 * 更新组织输入
 */
export interface UpdateOrgInput {
  name?: string;
  settings?: Record<string, unknown>;
  notes?: string;
}

/**
 * 添加成员输入
 */
export interface AddMemberInput {
  phone: string;
  role_id: string;
}

/**
 * 更新成员角色输入
 */
export interface UpdateMemberRoleInput {
  role_id: string;
}

/**
 * Organization Service 接口
 */
export interface OrganizationService {
  listByUser(userId: string): Promise<Array<{ org: Organization; role: OrgRole }>>;
  getById(orgId: string, userId: string): Promise<Organization>;
  getPersonalOrg(userId: string): Promise<Organization>;
  create(userId: string, data: CreateOrgInput): Promise<Organization>;
  update(orgId: string, userId: string, data: UpdateOrgInput): Promise<Organization>;
  delete(orgId: string, userId: string, confirmedName: string): Promise<void>;
  getMembers(orgId: string): Promise<MemberWithUser[]>;
  addMember(orgId: string, data: AddMemberInput): Promise<MemberWithUser>;
  updateMemberRole(
    orgId: string,
    userId: string,
    role_id: string,
    requesterId: string
  ): Promise<MemberWithUser>;
  removeMember(orgId: string, userId: string, requesterId: string): Promise<void>;
  generateUniqueSlug(baseSlug: string): Promise<string>;
}

/**
 * 创建 Organization Service 实例
 */
export function createOrganizationService(
  getRepo: () => OrganizationRepository = () => createOrganizationRepository(prisma)
): OrganizationService {
  return {
    listByUser: async (userId: string) => {
      const orgsWithMembers = await getRepo().findByUserId(userId);
      const result: Array<{ org: Organization; role: OrgRole }> = [];

      for (const org of orgsWithMembers) {
        const member = await getRepo().findMemberWithRole(org.id, userId);
        if (member) {
          result.push({ org, role: member.role });
        }
      }

      return result.sort(
        (left, right) =>
          compareBooleanDesc(left.org.is_personal, right.org.is_personal) ||
          compareBooleanDesc(left.org.is_active, right.org.is_active) ||
          compareNaturalText(left.org.name, right.org.name)
      );
    },

    getById: async (orgId: string, userId: string) => {
      const member = await getRepo().findMember(orgId, userId);
      if (!member) {
        throw createAppError(404, NotFoundMessages.ORGANIZATION);
      }
      const org = await getRepo().findById(orgId);
      if (!org) {
        throw createAppError(404, NotFoundMessages.ORGANIZATION);
      }
      return org;
    },

    getPersonalOrg: async (userId: string) => {
      const org = await getRepo().findPersonalOrgByUserId(userId);
      if (!org) {
        throw createAppError(404, NotFoundMessages.ORGANIZATION);
      }
      return org;
    },

    create: async (userId: string, data: CreateOrgInput) => {
      const baseSlug =
        data.slug ??
        (data.name
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '') ||
          'org');

      // 确保唯一 slug
      let finalSlug = baseSlug;
      let n = 1;
      while (await getRepo().findBySlug(finalSlug)) {
        finalSlug = `${baseSlug}-${n}`;
        n++;
      }

      const orgId = ulid().toLowerCase();

      // 在事务中创建组织和预制角色
      const org = await prisma.$transaction(async (tx) => {
        // 创建组织
        const newOrg = await tx.organization.create({
          data: {
            id: orgId,
            name: data.name,
            slug: finalSlug,
            is_personal: false,
          },
        });

        // 创建三个预制角色
        for (const roleDef of DEFAULT_ORG_ROLES) {
          await tx.orgRole.create({
            data: {
              id: ulid().toLowerCase(),
              organization_id: orgId,
              name: roleDef.name,
              description: roleDef.description,
              is_system: roleDef.is_system,
              permissions: roleDef.permissions,
            },
          });
        }

        // 找到"公寓所有者"角色的 ID
        const ownerRole = await tx.orgRole.findUnique({
          where: { organization_id_name: { organization_id: orgId, name: '组织所有者' } },
        });

        // 创建组织所有者成员
        await tx.organizationMember.create({
          data: {
            id: ulid().toLowerCase(),
            organization_id: orgId,
            user_id: userId,
            role_id: ownerRole!.id,
          },
        });

        return newOrg;
      });

      return org;
    },

    update: async (orgId: string, userId: string, data: UpdateOrgInput) => {
      const member = await getRepo().findMemberWithRole(orgId, userId);
      if (!member || member.role.name !== '组织所有者') {
        throw createAppError(403, '权限不足');
      }

      const updateData: Prisma.OrganizationUpdateInput = {};
      if (data.name != null) updateData.name = data.name;
      if (data.settings != null) updateData.settings = data.settings as Prisma.InputJsonValue;
      if (data.notes != null) updateData.notes = data.notes;

      return getRepo().update(orgId, updateData);
    },

    delete: async (orgId: string, userId: string, confirmedName: string) => {
      const member = await getRepo().findMemberWithRole(orgId, userId);
      if (!member || member.role.name !== '组织所有者') {
        throw createAppError(403, '只有组织所有者可以删除组织');
      }

      const org = await getRepo().findById(orgId);
      if (!org || org.name !== confirmedName) {
        throw createAppError(400, '组织名称不匹配');
      }

      await getRepo().delete(orgId);
    },

    getMembers: async (orgId: string) => {
      const members = await getRepo().findMembersByOrgId(orgId);
      return [...members].sort(
        (left, right) =>
          compareNumberAsc(left.role.is_system ? 0 : 1, right.role.is_system ? 0 : 1) ||
          compareNaturalText(left.user?.full_name, right.user?.full_name) ||
          compareNaturalText(left.user?.phone, right.user?.phone) ||
          compareDateAsc(left.created_at, right.created_at)
      );
    },

    addMember: async (orgId: string, data: AddMemberInput) => {
      const targetUser = await prisma.user.findUnique({ where: { phone: data.phone } });
      if (!targetUser) {
        throw createAppError(400, '用户不存在');
      }

      const existing = await getRepo().findMember(orgId, targetUser.id);
      if (existing) {
        throw createAppError(409, '用户已在组织中');
      }

      // 验证角色是否存在
      const role = await prisma.orgRole.findUnique({
        where: { id: data.role_id },
      });
      if (!role || role.organization_id !== orgId) {
        throw createAppError(400, '无效的角色');
      }

      await getRepo().createMember({
        id: ulid().toLowerCase(),
        organization: { connect: { id: orgId } },
        user: { connect: { id: targetUser.id } },
        role: { connect: { id: data.role_id } },
      });

      const members = await getRepo().findMembersByOrgId(orgId);
      return members.find((m) => m.user_id === targetUser.id)!;
    },

    updateMemberRole: async (
      orgId: string,
      userId: string,
      role_id: string,
      requesterId: string
    ) => {
      const requester = await getRepo().findMemberWithRole(orgId, requesterId);
      if (!requester || requester.role.name !== '组织所有者') {
        throw createAppError(403, '仅所有者可修改角色');
      }

      // 验证角色是否存在
      const role = await prisma.orgRole.findUnique({
        where: { id: role_id },
      });
      if (!role || role.organization_id !== orgId) {
        throw createAppError(400, '无效的角色');
      }

      const count = await getRepo().updateMember(orgId, userId, {
        role_id,
      } as Partial<OrganizationMember>);
      if (count === 0) {
        throw createAppError(404, NotFoundMessages.MEMBER);
      }

      const members = await getRepo().findMembersByOrgId(orgId);
      const updated = members.find((m) => m.user_id === userId);
      return updated!;
    },

    removeMember: async (orgId: string, userId: string, requesterId: string) => {
      const requester = await getRepo().findMemberWithRole(orgId, requesterId);
      if (!requester || requester.role.name !== '组织所有者') {
        throw createAppError(403, '仅所有者可移除成员');
      }

      await getRepo().deleteMember(orgId, userId);
    },

    generateUniqueSlug: async (baseSlug: string) => {
      let slug = baseSlug;
      let n = 1;
      while (await getRepo().findBySlug(slug)) {
        slug = `${baseSlug}-${n}`;
        n++;
      }
      return slug;
    },
  };
}

/**
 * 默认实例
 */
export const defaultOrgService = createOrganizationService();
