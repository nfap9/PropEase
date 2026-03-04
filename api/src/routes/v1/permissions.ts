import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { requireConsoleAuth } from '../../middlewares/requireAuth.js';
import { getConsoleUser } from '../../utils/context.js';
import { requireOrgMembership } from '../../utils/orgContext.js';
import { createAppError } from '../../utils/appError.js';
import { defaultPermissionService } from '../../services/permission.service.js';
import {
  SYSTEM_ROLES,
  type SystemRole,
  type OrgMemberRole,
} from '../../constants/permissionDefaults.js';

const UpdateRolePermissionsSchema = z.object({
  permission_codes: z.array(z.string().min(1)).max(200),
});

const router: Router = Router();

const GrantSystemRoleSchema = z.object({
  user_id: z.string(),
  role: z.enum(SYSTEM_ROLES as unknown as [string, ...string[]]),
});
const RevokeSystemRoleSchema = z.object({
  user_id: z.string(),
  role: z.enum(SYSTEM_ROLES as unknown as [string, ...string[]]),
});

router.use(requireConsoleAuth);

router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const list = await defaultPermissionService.listAll();
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.get('/grouped', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const grouped = await defaultPermissionService.listGrouped();
    res.json(grouped);
  } catch (e) {
    next(e);
  }
});

router.get(
  '/organization/:org_id/roles/:role',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await requireOrgMembership(req, 'org_id');
      const role = req.params.role as OrgMemberRole;
      const result = await defaultPermissionService.getRolePermissions(req.params.org_id, role);
      res.json(result);
    } catch (e) {
      next(e);
    }
  }
);

router.put(
  '/organization/:org_id/roles/:role',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = getConsoleUser(req);
      if (!user) return next(createAppError(401, '未授权或登录已过期'));
      await requireOrgMembership(req, 'org_id');
      const role = req.params.role as OrgMemberRole;
      const parsed = UpdateRolePermissionsSchema.safeParse(req.body);
      if (!parsed.success) {
        const fieldErrors = parsed.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        return next(createAppError(422, '参数校验失败', { fieldErrors }));
      }
      await defaultPermissionService.updateRolePermissions(
        req.params.org_id,
        role,
        parsed.data.permission_codes,
        user.id
      );
      res.json({ message: 'ok' });
    } catch (e) {
      next(e);
    }
  }
);

router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = getConsoleUser(req);
    if (!user) return next(createAppError(401, '未授权或登录已过期'));
    const result = await defaultPermissionService.getMyPermissions();
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.get('/system-roles', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const list = await defaultPermissionService.listSystemRoleConfigs();
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.post('/system-roles/grant', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = getConsoleUser(req);
    if (!user) return next(createAppError(401, '未授权或登录已过期'));
    if (!(await defaultPermissionService.isSuperAdmin(user.id))) {
      return next(createAppError(403, '需要超级管理员权限'));
    }
    const parsed = GrantSystemRoleSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    await defaultPermissionService.grantSystemRole(
      parsed.data.user_id,
      parsed.data.role as SystemRole,
      user.id
    );
    res.json({ message: '角色授予成功' });
  } catch (e) {
    next(e);
  }
});

router.post('/system-roles/revoke', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = getConsoleUser(req);
    if (!user) return next(createAppError(401, '未授权或登录已过期'));
    if (!(await defaultPermissionService.isSuperAdmin(user.id))) {
      return next(createAppError(403, '需要超级管理员权限'));
    }
    const parsed = RevokeSystemRoleSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    await defaultPermissionService.revokeSystemRole(
      parsed.data.user_id,
      parsed.data.role as SystemRole
    );
    res.json({ message: '角色撤销成功' });
  } catch (e) {
    next(e);
  }
});

router.get('/system-roles/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = getConsoleUser(req);
    if (!user) return next(createAppError(401, '未授权或登录已过期'));
    const roles = await defaultPermissionService.getMySystemRoles(user.id);
    res.json(roles);
  } catch (e) {
    next(e);
  }
});

export const permissionsRouter = router;
