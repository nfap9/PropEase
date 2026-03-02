import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { requireConsoleAuth } from '../../middlewares/requireAuth.js';
import { getConsoleUser } from '../../utils/context.js';
import { requireOrgMembership } from '../../utils/orgContext.js';
import { createAppError } from '../../utils/appError.js';
import {
  SYSTEM_ROLES,
  ORG_MEMBER_ROLES,
  DEFAULT_ORG_ROLE_PERMISSIONS,
  toPermissionCodes,
  type SystemRole,
  type OrgMemberRole,
} from '../../constants/permissionDefaults.js';

const UpdateRolePermissionsSchema = z.object({
  permission_codes: z.array(z.string().min(1)).max(200),
});

const router: Router = Router();

async function isSuperAdmin(userId: string): Promise<boolean> {
  const r = await prisma.userSystemRole.findFirst({
    where: { user_id: userId, role: 'super_admin' },
  });
  return !!r;
}

const GrantSystemRoleSchema = z.object({ user_id: z.string(), role: z.enum(SYSTEM_ROLES as unknown as [string, ...string[]]) });
const RevokeSystemRoleSchema = z.object({ user_id: z.string(), role: z.enum(SYSTEM_ROLES as unknown as [string, ...string[]]) });

router.use(requireConsoleAuth);

router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const list = await prisma.permission.findMany();
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.get('/grouped', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const list = await prisma.permission.findMany();
    const grouped: Record<string, typeof list> = {};
    for (const p of list) {
      const key = p.resource;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(p);
    }
    res.json(grouped);
  } catch (e) {
    next(e);
  }
});

router.get('/organization/:org_id/roles/:role', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req, 'org_id');
    const role = req.params.role as OrgMemberRole;
    if (!ORG_MEMBER_ROLES.includes(role)) {
      return next(createAppError(400, '无效的角色'));
    }
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { settings: true },
    });
    if (!org) return next(createAppError(404, '组织不存在'));
    const settings = (org.settings as Record<string, unknown> | null) ?? {};
    const rolePermissions = (settings.role_permissions as Record<string, string[] | undefined> | undefined)?.[role];
    const codes =
      Array.isArray(rolePermissions) && rolePermissions.length > 0
        ? rolePermissions
        : toPermissionCodes(DEFAULT_ORG_ROLE_PERMISSIONS[role]);
    const permissions = await prisma.permission.findMany({
      where: { code: { in: codes } },
    });
    res.json({
      role,
      permissions: permissions.map((p) => ({
        id: p.id,
        resource: p.resource,
        action: p.action,
        code: p.code,
        name: p.name,
        description: p.description,
        created_at: p.created_at.toISOString(),
      })),
    });
  } catch (e) {
    next(e);
  }
});

router.put('/organization/:org_id/roles/:role', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = getConsoleUser(req);
    if (!user) return next(createAppError(401, '未授权或登录已过期'));
    const orgId = await requireOrgMembership(req, 'org_id');
    const role = req.params.role as OrgMemberRole;
    if (!ORG_MEMBER_ROLES.includes(role)) {
      return next(createAppError(400, '无效的角色'));
    }
    const member = await prisma.organizationMember.findFirst({
      where: { organization_id: orgId, user_id: user.id },
      select: { role: true },
    });
    if (!member || member.role !== 'owner') {
      return next(createAppError(403, '仅组织所有者可修改角色权限'));
    }
    const parsed = UpdateRolePermissionsSchema.safeParse(req.body);
    if (!parsed.success) {
      const fieldErrors = parsed.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return next(createAppError(422, '参数校验失败', { fieldErrors }));
    }
    const { permission_codes } = parsed.data;
    const validCodes = await prisma.permission.findMany({
      where: { code: { in: permission_codes } },
      select: { code: true },
    });
    const validSet = new Set(validCodes.map((p) => p.code));
    const codes = permission_codes.filter((c) => validSet.has(c));
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { settings: true },
    });
    if (!org) return next(createAppError(404, '组织不存在'));
    const settings = (org.settings as Record<string, unknown> | null) ?? {};
    const rolePermissions = (settings.role_permissions as Record<string, string[]> | undefined) ?? {};
    rolePermissions[role] = codes;
    await prisma.organization.update({
      where: { id: orgId },
      data: { settings: { ...settings, role_permissions: rolePermissions } },
    });
    res.json({ message: 'ok' });
  } catch (e) {
    next(e);
  }
});

router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = getConsoleUser(req);
    if (!user) return next(createAppError(401, '未授权或登录已过期'));
    const perms = await prisma.permission.findMany();
    res.json({ permissions: perms.map((p) => p.code) });
  } catch (e) {
    next(e);
  }
});

router.get('/system-roles', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const list = await prisma.systemRoleConfig.findMany();
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.post('/system-roles/grant', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = getConsoleUser(req);
    if (!user) return next(createAppError(401, '未授权或登录已过期'));
    if (!(await isSuperAdmin(user.id))) return next(createAppError(403, '需要超级管理员权限'));
    const parsed = GrantSystemRoleSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    const { ulid } = await import('ulid');
    await prisma.userSystemRole.upsert({
      where: {
        user_id_role: { user_id: parsed.data.user_id, role: parsed.data.role as SystemRole },
      },
      create: {
        id: ulid().toLowerCase(),
        user_id: parsed.data.user_id,
        role: parsed.data.role as SystemRole,
        granted_by: user.id,
        granted_at: new Date(),
      },
      update: { granted_by: user.id, granted_at: new Date() },
    });
    res.json({ message: '角色授予成功' });
  } catch (e) {
    next(e);
  }
});

router.post('/system-roles/revoke', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = getConsoleUser(req);
    if (!user) return next(createAppError(401, '未授权或登录已过期'));
    if (!(await isSuperAdmin(user.id))) return next(createAppError(403, '需要超级管理员权限'));
    const parsed = RevokeSystemRoleSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    await prisma.userSystemRole.deleteMany({
      where: { user_id: parsed.data.user_id, role: parsed.data.role as SystemRole },
    });
    res.json({ message: '角色撤销成功' });
  } catch (e) {
    next(e);
  }
});

router.get('/system-roles/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = getConsoleUser(req);
    if (!user) return next(createAppError(401, '未授权或登录已过期'));
    const roles = await prisma.userSystemRole.findMany({
      where: { user_id: user.id },
      select: { role: true },
    });
    res.json(roles.map((r) => r.role));
  } catch (e) {
    next(e);
  }
});

export const permissionsRouter = router;
