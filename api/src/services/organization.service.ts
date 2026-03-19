import type { Organization, OrganizationMember, Prisma } from '@prisma/client';
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
  DEFAULT_ORG_ROLE_PERMISSIONS,
  toPermissionCodes,
} from '../constants/permissionDefaults.js';

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
  role: string;
}

/**
 * Organization Service 接口
 */
export interface OrganizationService {
  listByUser(userId: string): Promise<Array<Organization & { role: string }>>;
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
    role: string,
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
      return orgsWithMembers.map((org) => {
        const member = org.members.find((m) => m.user_id === userId);
        return {
          ...org,
          members: undefined,
          role: member?.role ?? 'member',
        } as Organization & { role: string };
      });
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

      // 初始化组织角色权限
      const rolePermissions: Record<string, string[]> = {
        owner: toPermissionCodes(DEFAULT_ORG_ROLE_PERMISSIONS.admin), // owner 拥有所有权限
        admin: toPermissionCodes(DEFAULT_ORG_ROLE_PERMISSIONS.admin),
        member: toPermissionCodes(DEFAULT_ORG_ROLE_PERMISSIONS.member),
        viewer: toPermissionCodes(DEFAULT_ORG_ROLE_PERMISSIONS.viewer),
      };

      const org = await getRepo().create({
        id: orgId,
        name: data.name,
        slug: finalSlug,
        is_personal: false,
        settings: { role_permissions: rolePermissions } as Prisma.InputJsonValue,
      });

      await getRepo().createMember({
        id: ulid().toLowerCase(),
        organization: { connect: { id: orgId } },
        user: { connect: { id: userId } },
        role: 'owner',
      });

      return org;
    },

    update: async (orgId: string, userId: string, data: UpdateOrgInput) => {
      const member = await getRepo().findMember(orgId, userId);
      if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
        throw createAppError(403, '权限不足');
      }

      const updateData: Prisma.OrganizationUpdateInput = {};
      if (data.name != null) updateData.name = data.name;
      if (data.settings != null) updateData.settings = data.settings as Prisma.InputJsonValue;
      if (data.notes != null) updateData.notes = data.notes;

      return getRepo().update(orgId, updateData);
    },

    delete: async (orgId: string, userId: string, confirmedName: string) => {
      const member = await getRepo().findMember(orgId, userId);
      if (!member || member.role !== 'owner') {
        throw createAppError(403, '只有组织所有者可以删除组织');
      }

      const org = await getRepo().findById(orgId);
      if (!org || org.name !== confirmedName) {
        throw createAppError(400, '组织名称不匹配');
      }

      await getRepo().delete(orgId);
    },

    getMembers: async (orgId: string) => {
      return getRepo().findMembersByOrgId(orgId);
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

      await getRepo().createMember({
        id: ulid().toLowerCase(),
        organization: { connect: { id: orgId } },
        user: { connect: { id: targetUser.id } },
        role: data.role,
      });

      const members = await getRepo().findMembersByOrgId(orgId);
      return members.find((m) => m.user_id === targetUser.id)!;
    },

    updateMemberRole: async (orgId: string, userId: string, role: string, requesterId: string) => {
      const requester = await getRepo().findMember(orgId, requesterId);
      if (!requester || (requester.role !== 'owner' && requester.role !== 'admin')) {
        throw createAppError(403, '仅所有者可修改角色');
      }

      const count = await getRepo().updateMember(orgId, userId, {
        role,
      } as Partial<OrganizationMember>);
      if (count === 0) {
        throw createAppError(404, NotFoundMessages.MEMBER);
      }

      const members = await getRepo().findMembersByOrgId(orgId);
      const updated = members.find((m) => m.user_id === userId);
      return updated!;
    },

    removeMember: async (orgId: string, userId: string, requesterId: string) => {
      const requester = await getRepo().findMember(orgId, requesterId);
      if (!requester || (requester.role !== 'owner' && requester.role !== 'admin')) {
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
