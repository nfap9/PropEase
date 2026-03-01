import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { requireConsoleAuth } from '../../middlewares/requireAuth.js';
import { getConsoleUser } from '../../utils/context.js';
import { requireOrgMembership } from '../../utils/orgContext.js';
import { createAppError } from '../../utils/appError.js';
import { SYSTEM_ROLES, type SystemRole } from '../../constants/permissionDefaults.js';

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
    await requireOrgMembership(req, 'org_id');
    res.json({ role: req.params.role, permissions: [] });
  } catch (e) {
    next(e);
  }
});

router.put('/organization/:org_id/roles/:role', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await requireOrgMembership(req, 'org_id');
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
