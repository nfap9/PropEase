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
  role: z.enum(SYSTEM_ROLES),
});
const RevokeSystemRoleSchema = z.object({
  user_id: z.string(),
  role: z.enum(SYSTEM_ROLES),
});

router.use(requireConsoleAuth);

/**
 * @openapi
 * /permissions:
 *   get:
 *     summary: 获取所有权限列表
 *     tags: [权限管理]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 权限列表
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Permission'
 */
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const list = await defaultPermissionService.listAll();
    res.json(list);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /permissions/grouped:
 *   get:
 *     summary: 获取分组权限列表
 *     tags: [权限管理]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 按模块分组的权限列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Permission'
 */
router.get('/grouped', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const grouped = await defaultPermissionService.listGrouped();
    res.json(grouped);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /permissions/organization/{org_id}/roles/{role}:
 *   get:
 *     summary: 获取组织角色的权限
 *     tags: [权限管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: org_id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: role
 *         required: true
 *         schema:
 *           type: string
 *           enum: [owner, admin, member]
 *     responses:
 *       200:
 *         description: 角色权限列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 role:
 *                   type: string
 *                 permissions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Permission'
 */
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

/**
 * @openapi
 * /permissions/organization/{org_id}/roles/{role}:
 *   put:
 *     summary: 更新组织角色的权限
 *     tags: [权限管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: org_id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: role
 *         required: true
 *         schema:
 *           type: string
 *           enum: [owner, admin, member]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [permission_codes]
 *             properties:
 *               permission_codes:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: 更新成功
 */
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

/**
 * @openapi
 * /permissions/me:
 *   get:
 *     summary: 获取当前用户的权限
 *     tags: [权限管理]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 当前用户的权限列表
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 */
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

/**
 * @openapi
 * /permissions/system-roles:
 *   get:
 *     summary: 获取系统角色配置列表
 *     tags: [权限管理]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 系统角色配置列表
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   role:
 *                     type: string
 *                   name:
 *                     type: string
 *                   permissions:
 *                     type: array
 *                     items:
 *                       type: string
 */
router.get('/system-roles', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const list = await defaultPermissionService.listSystemRoleConfigs();
    res.json(list);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /permissions/system-roles/grant:
 *   post:
 *     summary: 授予系统角色
 *     tags: [权限管理]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [user_id, role]
 *             properties:
 *               user_id:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [super_admin, platform_admin]
 *     responses:
 *       200:
 *         description: 授予成功
 *       403:
 *         description: 需要超级管理员权限
 */
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

/**
 * @openapi
 * /permissions/system-roles/revoke:
 *   post:
 *     summary: 撤销系统角色
 *     tags: [权限管理]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [user_id, role]
 *             properties:
 *               user_id:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [super_admin, platform_admin]
 *     responses:
 *       200:
 *         description: 撤销成功
 *       403:
 *         description: 需要超级管理员权限
 */
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

/**
 * @openapi
 * /permissions/system-roles/me:
 *   get:
 *     summary: 获取当前用户的系统角色
 *     tags: [权限管理]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 系统角色列表
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 */
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
