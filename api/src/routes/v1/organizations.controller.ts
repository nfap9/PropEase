import { type Request, type Response, type NextFunction } from 'express';
import { requireOrgMembership, requirePermission } from '../../utils/orgContext.js';
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
import { defaultOrgRepo } from '../../repositories/organization.repo.js';
import { defaultApartmentRepo } from '../../repositories/apartment.repo.js';
import { defaultRoomRepo } from '../../repositories/room.repo.js';
import { defaultTenantRepo } from '../../repositories/tenant.repo.js';
import { defaultLeaseRepo } from '../../repositories/lease.repo.js';
import { defaultBillRepo } from '../../repositories/bill.repo.js';
import {
  OrganizationCreateSchema,
  OrganizationUpdateSchema,
  ConfirmDeleteSchema,
} from '../../lib/schemas.js';

// Re-export for backward compatibility
export { OrganizationCreateSchema, OrganizationUpdateSchema, ConfirmDeleteSchema };

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
  
    const user = getConsoleUser(req);
    if (!user) return next(createAppError(401, '未授权或登录已过期'));
    const result = await defaultOrgService.listByUser(user.id);
    // Return array of organizations with their role info
    const orgs = result.map(({ org, role }) => ({
      ...toOrgResponse(org),
      role: role.name,
    }));
    res.json(orgs);
  
}

export async function create(req: Request, res: Response, next: NextFunction) {
  
    const user = getConsoleUser(req);
    if (!user) return next(createAppError(401, '未授权或登录已过期'));
    const orgCount = await userOrganizationCount(user.id);
    const maxOrgs = await getMaxOrganizationsForUser(user.id);
    if (orgCount >= maxOrgs)
      return next(createAppError(403, `当前最多可拥有 ${maxOrgs} 个组织，如需更多请升级服务`));
    const parsed = OrganizationCreateSchema.safeParse(req.body);
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
  
}

export async function getPersonal(req: Request, res: Response, next: NextFunction) {
  
    const user = getConsoleUser(req);
    if (!user) return next(createAppError(401, '未授权或登录已过期'));
    const personal = await defaultOrgService.getPersonalOrg(user.id);
    res.json(toOrgResponse(personal));
  
}

export async function get(req: Request, res: Response, _next: NextFunction) {
  
    const user = getConsoleUser(req);
    const org = await defaultOrgService.getById(req.params.orgId, user?.id ?? '');
    res.json(toOrgResponse(org));
  
}

export async function update(req: Request, res: Response, next: NextFunction) {
  
    const orgId = await requireOrgMembership(req, 'orgId');
    await requirePermission(req, orgId, 'settings:edit');
    const user = getConsoleUser(req);
    if (!user) return next(createAppError(401, '未授权或登录已过期'));
    const parsed = OrganizationUpdateSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    const org = await defaultOrgService.update(req.params.orgId, user.id, {
      name: parsed.data.name,
      settings: parsed.data.settings as Record<string, unknown> | undefined,
      notes: parsed.data.notes,
    });
    res.json(toOrgResponse(org));
  
}

export async function deletionPreview(req: Request, res: Response, next: NextFunction) {
  
    await requireOrgMembership(req, 'orgId');
    const orgId = req.params.orgId;
    const org = await defaultOrgRepo.findById(orgId);
    if (!org) return next(createAppError(404, NotFoundMessages.ORGANIZATION));
    const hasActiveSub = await orgHasActiveSubscription(orgId);
    const blockers: string[] = [];
    if (hasActiveSub) blockers.push('当前有有效订阅，需先取消订阅后再删除组织');
    const [apartments, rooms, tenants] = await Promise.all([
      defaultApartmentRepo.countByOrgId(orgId),
      defaultRoomRepo.countByOrgId(orgId),
      defaultTenantRepo.countByOrgId(orgId),
    ]);
    const [leases, bills] = await Promise.all([
      defaultLeaseRepo.countByOrgId(orgId),
      defaultBillRepo.countByOrgId(orgId),
    ]);
    res.json({
      can_delete: !hasActiveSub,
      blockers,
      stats: { apartments, rooms, tenants, leases, bills },
      org_name: org.name,
      is_personal: org.is_personal,
    });
  
}

export async function del(req: Request, res: Response, next: NextFunction) {
  
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
  
}

export async function getMembers(req: Request, res: Response, _next: NextFunction) {
  
    const orgId = await requireOrgMembership(req);
    const members = await defaultOrgService.getMembers(orgId);
    res.json(
      members.map((m) => ({
        id: m.id,
        organization_id: m.organization_id,
        user_id: m.user_id,
        role_id: m.role_id,
        role_name: m.role.name,
        is_system_role: m.role.is_system,
        joined_at: m.created_at,
        created_at: m.created_at,
        user_phone: m.user?.phone ?? null,
        user_full_name: m.user?.full_name ?? '未知用户',
      }))
    );
  
}

export async function addMember(req: Request, res: Response, next: NextFunction) {
  
    const orgId = await requireOrgMembership(req);
    await requirePermission(req, orgId, 'member:create');
    const user = getConsoleUser(req);
    if (!user) return next(createAppError(401, '未授权或登录已过期'));
    const limits = await getEffectivePlanLimits(orgId);
    const members_used = await getMembersUsedForLimitCheck(orgId, user.id);
    if (members_used >= limits.max_members)
      return next(createAppError(403, `当前服务最多允许 ${limits.max_members} 名成员`));
    const { phone, role_id } = req.body as { phone?: string; role_id?: string };
    if (!phone) return next(createAppError(400, '缺少 phone'));
    if (!role_id) return next(createAppError(400, '缺少 role_id'));
    const m = await defaultOrgService.addMember(orgId, { phone, role_id });
    res.status(201).json({
      id: m.id,
      organization_id: m.organization_id,
      user_id: m.user_id,
      role_id: m.role_id,
      role_name: m.role.name,
      joined_at: m.created_at,
      created_at: m.created_at,
      user_phone: m.user?.phone ?? null,
      user_full_name: m.user?.full_name ?? '未知用户',
    });
  
}

export async function updateMember(req: Request, res: Response, next: NextFunction) {
  
    const orgId = await requireOrgMembership(req);
    await requirePermission(req, orgId, 'member:edit');
    const user = getConsoleUser(req);
    if (!user) return next(createAppError(401, '未授权或登录已过期'));
    const { role_id } = req.body as { role_id?: string };
    if (!role_id) return next(createAppError(400, '缺少 role_id'));
    const m = await defaultOrgService.updateMemberRole(orgId, req.params.userId, role_id, user.id);
    res.json({
      id: m.id,
      organization_id: m.organization_id,
      user_id: m.user_id,
      role_id: m.role_id,
      role_name: m.role.name,
      joined_at: m.created_at,
      created_at: m.created_at,
      user_phone: m.user?.phone ?? null,
      user_full_name: m.user?.full_name ?? '未知用户',
    });
  
}

export async function removeMember(req: Request, res: Response, next: NextFunction) {
  
    const orgId = await requireOrgMembership(req);
    await requirePermission(req, orgId, 'member:delete');
    const user = getConsoleUser(req);
    if (!user) return next(createAppError(401, '未授权或登录已过期'));
    await defaultOrgService.removeMember(orgId, req.params.userId, user.id);
    res.locals.successMessage = Messages.MEMBER_REMOVED;
    res.json({});
  
}

export async function getUsage(req: Request, res: Response, next: NextFunction) {
  
    await requireOrgMembership(req, 'orgId');
    const orgId = req.params.orgId;
    const user = getConsoleUser(req);
    if (!user) return next(createAppError(401, '未授权或登录已过期'));
    const org = await defaultOrgRepo.findById(orgId);
    if (!org) return next(createAppError(404, NotFoundMessages.ORGANIZATION));
    const apartments_used = await defaultApartmentRepo.countByOrgId(orgId);
    const [rooms_used, members_used, limits, planRecord, orgCount, maxOrgs] = await Promise.all([
      getRoomsUsedForLimitCheck(orgId, user.id),
      getMembersUsedForLimitCheck(orgId, user.id),
      getEffectivePlanLimits(orgId),
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
  
}
