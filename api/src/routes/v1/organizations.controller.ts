import { type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { requireOrgMembership } from '../../utils/orgContext.js';
import { getConsoleUser } from '../../utils/context.js';
import { createAppError } from '../../utils/appError.js';
import { Messages, NotFoundMessages } from '../../messages.js';
import {
  getEffectivePlanLimits,
  getEffectivePlanForOrg,
  getMaxOrganizationsForUser,
  getRoomsUsedForLimitCheck,
  getMembersUsedForLimitCheck,
  userOrganizationCount,
  orgHasActiveSubscription,
} from '../../utils/orgPlanLimits.js';
import { defaultOrgService } from '../../services/organization.service.js';

// ==================== Schemas ====================

export const CreateOrgSchema = z.object({
  name: z.string().min(1),
  slug: z.string().optional(),
  notes: z.string().max(1000).optional(),
});

export const UpdateOrgSchema = z.object({
  name: z.string().min(1).optional(),
  settings: z.record(z.unknown()).optional(),
  notes: z.string().max(1000).optional(),
});

export const MigrateSchema = z.object({ target_org_id: z.string().min(1) });

export const ConfirmDeleteSchema = z.object({ confirmed_name: z.string().min(1) });

// ==================== Helpers ====================

function toOrgResponse(o: {
  id: string;
  name: string;
  slug: string;
  settings: unknown;
  is_personal: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  notes: string | null;
}) {
  return {
    id: o.id,
    name: o.name,
    slug: o.slug,
    settings: o.settings,
    is_personal: o.is_personal,
    is_active: o.is_active,
    created_at: o.created_at,
    updated_at: o.updated_at,
    notes: o.notes,
  };
}

// ==================== Handlers ====================

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const user = getConsoleUser(req);
    if (!user) return next(createAppError(401, '未授权或登录已过期'));
    const result = await defaultOrgService.listByUser(user.id);
    res.json(result);
  } catch (e) {
    next(e);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const user = getConsoleUser(req);
    if (!user) return next(createAppError(401, '未授权或登录已过期'));
    const orgCount = await userOrganizationCount(user.id);
    const maxOrgs = await getMaxOrganizationsForUser(user.id);
    if (orgCount >= maxOrgs)
      return next(createAppError(403, `当前最多可拥有 ${maxOrgs} 个组织，如需更多请升级服务`));
    const parsed = CreateOrgSchema.safeParse(req.body);
    if (!parsed.success)
      return next(
        createAppError(422, '参数校验失败', {
          fieldErrors: parsed.error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        })
      );
    const org = await defaultOrgService.create(user.id, parsed.data);
    res.status(201).json(toOrgResponse(org));
  } catch (e) {
    next(e);
  }
}

export async function getPersonal(req: Request, res: Response, next: NextFunction) {
  try {
    const user = getConsoleUser(req);
    if (!user) return next(createAppError(401, '未授权或登录已过期'));
    const personal = await defaultOrgService.getPersonalOrg(user.id);
    res.json(toOrgResponse(personal));
  } catch (e) {
    next(e);
  }
}

export async function migrate(req: Request, res: Response, next: NextFunction) {
  try {
    const user = getConsoleUser(req);
    if (!user) return next(createAppError(401, '未授权或登录已过期'));
    const parsed = MigrateSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    const personal = await prisma.organization.findFirst({
      where: { is_personal: true, members: { some: { user_id: user.id, role: 'owner' } } },
    });
    if (!personal) return next(createAppError(400, '您没有个人团队'));
    const targetMember = await prisma.organizationMember.findFirst({
      where: { organization_id: parsed.data.target_org_id, user_id: user.id },
    });
    if (!targetMember) return next(createAppError(403, '无目标组织权限'));
    const [apts, rooms, tenants, leases, bills, readings] = await Promise.all([
      prisma.apartment.count({ where: { organization_id: personal.id } }),
      prisma.room.count({ where: { apartment: { organization_id: personal.id } } }),
      prisma.tenant.count({ where: { organization_id: personal.id } }),
      prisma.lease.count({ where: { room: { apartment: { organization_id: personal.id } } } }),
      prisma.bill.count({
        where: { lease: { room: { apartment: { organization_id: personal.id } } } },
      }),
      prisma.utilityReading.count({
        where: { room: { apartment: { organization_id: personal.id } } },
      }),
    ]);
    const targetId = parsed.data.target_org_id;
    await prisma.$transaction(async (tx) => {
      const aptsToMove = await tx.apartment.findMany({
        where: { organization_id: personal!.id },
        include: { rooms: true },
      });
      for (const apt of aptsToMove) {
        await tx.apartment.update({ where: { id: apt.id }, data: { organization_id: targetId } });
      }
      await tx.tenant.updateMany({
        where: { organization_id: personal!.id },
        data: { organization_id: targetId },
      });
      await tx.organization.delete({ where: { id: personal!.id } });
    });
    res.locals.successMessage = Messages.TEAM_MIGRATED;
    res.json({ apartments: apts, rooms, tenants, leases, bills, utility_readings: readings });
  } catch (e) {
    next(e);
  }
}

export async function get(req: Request, res: Response, next: NextFunction) {
  try {
    const user = getConsoleUser(req);
    const org = await defaultOrgService.getById(req.params.orgId, user?.id ?? '');
    res.json(toOrgResponse(org));
  } catch (e) {
    next(e);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    await requireOrgMembership(req, 'orgId');
    const user = getConsoleUser(req);
    if (!user) return next(createAppError(401, '未授权或登录已过期'));
    const parsed = UpdateOrgSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    const org = await defaultOrgService.update(req.params.orgId, user.id, {
      name: parsed.data.name,
      settings: parsed.data.settings as Record<string, unknown> | undefined,
      notes: parsed.data.notes,
    });
    res.json(toOrgResponse(org));
  } catch (e) {
    next(e);
  }
}

export async function deletionPreview(req: Request, res: Response, next: NextFunction) {
  try {
    await requireOrgMembership(req, 'orgId');
    const orgId = req.params.orgId;
    const org = await prisma.organization.findUnique({ where: { id: orgId } });
    if (!org) return next(createAppError(404, NotFoundMessages.ORGANIZATION));
    const hasActiveSub = await orgHasActiveSubscription(orgId);
    const blockers: string[] = [];
    if (hasActiveSub) blockers.push('当前有有效订阅，需先取消订阅后再删除组织');
    const [apartments, rooms, tenants, leases, bills] = await Promise.all([
      prisma.apartment.count({ where: { organization_id: orgId } }),
      prisma.room.count({ where: { apartment: { organization_id: orgId } } }),
      prisma.tenant.count({ where: { organization_id: orgId } }),
      prisma.lease.count({ where: { room: { apartment: { organization_id: orgId } } } }),
      prisma.bill.count({ where: { lease: { room: { apartment: { organization_id: orgId } } } } }),
    ]);
    res.json({
      can_delete: !hasActiveSub,
      blockers,
      stats: { apartments, rooms, tenants, leases, bills },
      org_name: org.name,
      is_personal: org.is_personal,
    });
  } catch (e) {
    next(e);
  }
}

export async function del(req: Request, res: Response, next: NextFunction) {
  try {
    const user = getConsoleUser(req);
    if (!user) return next(createAppError(401, '未授权或登录已过期'));
    const orgId = req.params.orgId;
    const hasActiveSub = await orgHasActiveSubscription(orgId);
    if (hasActiveSub) return next(createAppError(403, '当前有有效订阅，需先取消订阅后再删除组织'));
    const parsed = ConfirmDeleteSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(400, '请提供组织名称以确认删除'));
    await defaultOrgService.delete(orgId, user.id, parsed.data.confirmed_name);
    res.locals.successMessage = Messages.TEAM_DELETED;
    res.json({});
  } catch (e) {
    next(e);
  }
}

export async function getMembers(req: Request, res: Response, next: NextFunction) {
  try {
    await requireOrgMembership(req, 'orgId');
    const members = await defaultOrgService.getMembers(req.params.orgId);
    res.json(
      members.map((m) => ({
        id: m.id,
        organization_id: m.organization_id,
        user_id: m.user_id,
        role: m.role,
        joined_at: m.created_at,
        created_at: m.created_at,
        user_phone: m.user?.phone ?? null,
        user_full_name: m.user?.full_name ?? '未知用户',
      }))
    );
  } catch (e) {
    next(e);
  }
}

export async function addMember(req: Request, res: Response, next: NextFunction) {
  try {
    await requireOrgMembership(req, 'orgId');
    const orgId = req.params.orgId;
    const user = getConsoleUser(req);
    if (!user) return next(createAppError(401, '未授权或登录已过期'));
    const limits = await getEffectivePlanLimits(orgId, user.id);
    const members_used = await getMembersUsedForLimitCheck(orgId, user.id);
    if (members_used >= limits.max_members)
      return next(createAppError(403, `当前服务最多允许 ${limits.max_members} 名成员`));
    const phone = (req.query.phone as string) ?? (req.body?.phone as string);
    const role = ((req.query.role as string) ?? req.body?.role ?? 'member') as string;
    if (!phone) return next(createAppError(400, '缺少 phone'));
    const m = await defaultOrgService.addMember(orgId, { phone, role });
    res.status(201).json({
      id: m.id,
      organization_id: m.organization_id,
      user_id: m.user_id,
      role: m.role,
      joined_at: m.created_at,
      created_at: m.created_at,
      user_phone: m.user?.phone ?? null,
      user_full_name: m.user?.full_name ?? '未知用户',
    });
  } catch (e) {
    next(e);
  }
}

export async function updateMember(req: Request, res: Response, next: NextFunction) {
  try {
    const orgId = req.params.orgId;
    await requireOrgMembership(req, 'orgId');
    const user = getConsoleUser(req);
    if (!user) return next(createAppError(401, '未授权或登录已过期'));
    const role = (req.query.role as string) ?? req.body?.role;
    if (!role) return next(createAppError(400, '缺少 role'));
    const m = await defaultOrgService.updateMemberRole(orgId, req.params.userId, role, user.id);
    res.json({
      id: m.id,
      organization_id: m.organization_id,
      user_id: m.user_id,
      role: m.role,
      joined_at: m.created_at,
      created_at: m.created_at,
      user_phone: m.user?.phone ?? null,
      user_full_name: m.user?.full_name ?? '未知用户',
    });
  } catch (e) {
    next(e);
  }
}

export async function removeMember(req: Request, res: Response, next: NextFunction) {
  try {
    await requireOrgMembership(req, 'orgId');
    const user = getConsoleUser(req);
    if (!user) return next(createAppError(401, '未授权或登录已过期'));
    await defaultOrgService.removeMember(req.params.orgId, req.params.userId, user.id);
    res.locals.successMessage = Messages.MEMBER_REMOVED;
    res.json({});
  } catch (e) {
    next(e);
  }
}

export async function getUsage(req: Request, res: Response, next: NextFunction) {
  try {
    await requireOrgMembership(req, 'orgId');
    const orgId = req.params.orgId;
    const user = getConsoleUser(req);
    if (!user) return next(createAppError(401, '未授权或登录已过期'));
    const org = await prisma.organization.findUnique({ where: { id: orgId } });
    if (!org) return next(createAppError(404, NotFoundMessages.ORGANIZATION));
    const apartments_used = await prisma.apartment.count({ where: { organization_id: orgId } });
    const [rooms_used, members_used, limits, planRecord, orgCount, maxOrgs] = await Promise.all([
      getRoomsUsedForLimitCheck(orgId, user.id),
      getMembersUsedForLimitCheck(orgId, user.id),
      getEffectivePlanLimits(orgId, user.id),
      getEffectivePlanForOrg(orgId),
      userOrganizationCount(user.id),
      getMaxOrganizationsForUser(user.id),
    ]);
    const plan = planRecord?.code ?? 'free';
    const maxA = limits.max_apartments;
    const maxR = limits.max_rooms;
    const maxM = limits.max_members;
    res.json({
      plan,
      apartments_used,
      rooms_used,
      members_used,
      max_organizations: maxOrgs,
      max_apartments: maxA,
      max_rooms: maxR,
      max_members: maxM,
      rooms_count_scope: limits.rooms_count_scope,
      members_count_scope: limits.members_count_scope,
      apartments_remaining: maxA < 0 ? -1 : Math.max(0, maxA - apartments_used),
      rooms_remaining: maxR < 0 ? -1 : Math.max(0, maxR - rooms_used),
      members_remaining: maxM < 0 ? -1 : Math.max(0, maxM - members_used),
      organizations_used: orgCount,
      organizations_remaining: maxOrgs < 0 ? -1 : Math.max(0, maxOrgs - orgCount),
      can_invite_members: members_used < maxM,
      can_create_team: orgCount < maxOrgs,
    });
  } catch (e) {
    next(e);
  }
}
