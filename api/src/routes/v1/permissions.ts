import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { requireConsoleAuth } from '../../middlewares/requireAuth.js';
import { getConsoleUser } from '../../utils/context.js';
import { requireOrgMembership } from '../../utils/orgContext.js';
import { createAppError } from '../../utils/appError.js';
import { defaultPermissionService } from '../../services/permission.service.js';
import { prisma } from '../../lib/prisma.js';

const router: Router = Router();

const CreateOrgRoleSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().max(255).optional(),
});

const UpdateOrgRoleSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  description: z.string().max(255).optional(),
  permissions: z.array(z.string()).optional(),
});

const UpdatePermissionsSchema = z.object({
  permission_codes: z.array(z.string()).max(200),
});

router.use(requireConsoleAuth);

/**
 * GET /permissions
 * 获取所有权限列表（静态定义）
 */
router.get('/', (_req: Request, res: Response, next: NextFunction) => {
  try {
    const list = defaultPermissionService.listAll();
    res.json(list);
  } catch (e) {
    next(e);
  }
});

/**
 * GET /permissions/grouped
 * 获取分组权限列表
 */
router.get('/grouped', (_req: Request, res: Response, next: NextFunction) => {
  try {
    const grouped = defaultPermissionService.listGrouped();
    res.json(grouped);
  } catch (e) {
    next(e);
  }
});

/**
 * GET /permissions/org-roles
 * 获取组织角色列表
 */
router.get(
  '/org-roles',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orgId = await requireOrgMembership(req);
      const roles = await defaultPermissionService.listOrgRoles(orgId);
      res.json(roles);
    } catch (e) {
      next(e);
    }
  }
);

/**
 * POST /permissions/org-roles
 * 创建角色
 */
router.post(
  '/org-roles',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = getConsoleUser(req);
      if (!user) return next(createAppError(401, '未授权或登录已过期'));

      const orgId = await requireOrgMembership(req);

      // 检查用户是否是所有者
      const member = await prisma.organizationMember.findFirst({
        where: { organization_id: orgId, user_id: user.id },
        include: { role: true },
      });

      if (!member || member.role.name !== '组织所有者') {
        return next(createAppError(403, '仅所有者可创建角色'));
      }

      const parsed = CreateOrgRoleSchema.safeParse(req.body);
      if (!parsed.success) {
        return next(createAppError(422, '参数校验失败'));
      }

      const role = await defaultPermissionService.createOrgRole(
        orgId,
        parsed.data.name,
        parsed.data.description
      );

      res.status(201).json(role);
    } catch (e) {
      next(e);
    }
  }
);

/**
 * GET /permissions/org-roles/:role_id
 * 获取角色详情
 */
router.get(
  '/org-roles/:role_id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await requireOrgMembership(req);
      const role = await defaultPermissionService.getOrgRole(req.params.role_id);
      if (!role) {
        return next(createAppError(404, '角色不存在'));
      }
      res.json(role);
    } catch (e) {
      next(e);
    }
  }
);

/**
 * PUT /permissions/org-roles/:role_id
 * 更新角色
 */
router.put(
  '/org-roles/:role_id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = getConsoleUser(req);
      if (!user) return next(createAppError(401, '未授权或登录已过期'));

      const orgId = await requireOrgMembership(req);

      // 检查用户是否是所有者
      const member = await prisma.organizationMember.findFirst({
        where: { organization_id: orgId, user_id: user.id },
        include: { role: true },
      });

      if (!member || member.role.name !== '组织所有者') {
        return next(createAppError(403, '仅所有者可修改角色'));
      }

      const parsed = UpdateOrgRoleSchema.safeParse(req.body);
      if (!parsed.success) {
        return next(createAppError(422, '参数校验失败'));
      }

      const role = await defaultPermissionService.updateOrgRole(
        req.params.role_id,
        parsed.data
      );

      res.json(role);
    } catch (e) {
      next(e);
    }
  }
);

/**
 * DELETE /permissions/org-roles/:role_id
 * 删除角色
 */
router.delete(
  '/org-roles/:role_id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = getConsoleUser(req);
      if (!user) return next(createAppError(401, '未授权或登录已过期'));

      const orgId = await requireOrgMembership(req);

      // 检查用户是否是所有者
      const member = await prisma.organizationMember.findFirst({
        where: { organization_id: orgId, user_id: user.id },
        include: { role: true },
      });

      if (!member || member.role.name !== '组织所有者') {
        return next(createAppError(403, '仅所有者可删除角色'));
      }

      await defaultPermissionService.deleteOrgRole(req.params.role_id, user.id);
      res.json({ message: 'ok' });
    } catch (e) {
      next(e);
    }
  }
);

/**
 * GET /permissions/org-roles/:role_id/permissions
 * 获取角色权限
 */
router.get(
  '/org-roles/:role_id/permissions',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await requireOrgMembership(req);
      const permissions = await defaultPermissionService.getRolePermissions(
        req.params.role_id
      );
      res.json(permissions);
    } catch (e) {
      next(e);
    }
  }
);

/**
 * PUT /permissions/org-roles/:role_id/permissions
 * 更新角色权限
 */
router.put(
  '/org-roles/:role_id/permissions',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = getConsoleUser(req);
      if (!user) return next(createAppError(401, '未授权或登录已过期'));

      const orgId = await requireOrgMembership(req);

      // 检查用户是否是所有者
      const member = await prisma.organizationMember.findFirst({
        where: { organization_id: orgId, user_id: user.id },
        include: { role: true },
      });

      if (!member || member.role.name !== '组织所有者') {
        return next(createAppError(403, '仅所有者可修改角色权限'));
      }

      // 检查目标角色是否是"组织所有者"，不允许修改
      const targetRole = await defaultPermissionService.getOrgRole(req.params.role_id);
      if (targetRole?.name === '组织所有者') {
        return next(createAppError(403, '无法修改组织所有者的权限'));
      }

      const parsed = UpdatePermissionsSchema.safeParse(req.body);
      if (!parsed.success) {
        return next(createAppError(422, '参数校验失败'));
      }

      await defaultPermissionService.updateRolePermissions(
        req.params.role_id,
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
 * GET /permissions/me
 * 获取当前用户的权限
 */
router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = getConsoleUser(req);
    if (!user) return next(createAppError(401, '未授权或登录已过期'));

    const orgId = await requireOrgMembership(req);
    const permissions = await defaultPermissionService.getMyPermissions(
      user.id,
      orgId
    );
    res.json(permissions);
  } catch (e) {
    next(e);
  }
});

export const permissionsRouter = router;
