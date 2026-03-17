import { Router } from 'express';
import { z } from 'zod';
import { adminAuthRouter } from './auth.js';
import { adminInitRouter } from './init.js';
import { adminServiceProductsRouter } from './service-products.js';
import { adminStorefrontsRouter } from './storefronts.js';
import { requireAdmin } from '../../../middlewares/requireAdmin.js';
import { requireSystemInitialized } from '../../../middlewares/requireSystemInitialized.js';
import { getAdminUser } from '../../../utils/context.js';
import { createAppError } from '../../../utils/appError.js';
import { defaultAdminService } from '../../../services/admin.service.js';
import { auditAdminAction } from '../../../utils/audit.js';
import type { Request, Response, NextFunction } from 'express';

const router: Router = Router();

const AdminSubscriptionGiftSchema = z.object({
  organization_id: z.string().min(1),
  service_id: z.string().min(1),
  pricing_id: z.string().min(1).nullable().optional(),
  billing_months: z.coerce.number().int().min(1),
  gift_months: z.coerce.number().int().min(0).optional(),
});

// 初始化路由无需任何认证
router.use('/init', adminInitRouter);

// 认证路由需要系统已初始化
router.use('/auth', requireSystemInitialized, adminAuthRouter);

// 其他路由需要系统已初始化 + 管理员认证
router.use(requireSystemInitialized);
router.use(requireAdmin);

// 服务产品管理
router.use(adminServiceProductsRouter);
// 商店配置管理
router.use(adminStorefrontsRouter);

// --- users (admin 后台管理员) ---
router.get('/users/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const admin = getAdminUser(req);
    if (!admin) return next(createAppError(401, '未授权或登录已过期'));
    const user = await defaultAdminService.getMe(admin.id);
    res.json(user);
  } catch (e) {
    next(e);
  }
});

router.get('/users', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const skip = req.query.skip != null ? Number(req.query.skip) : undefined;
    const limit = req.query.limit != null ? Number(req.query.limit) : undefined;
    const list = await defaultAdminService.listAdmins(skip, limit);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

const AdminUserCreateSchema = z.object({
  username: z.string(),
  password: z.string().min(1),
  name: z.string(),
  email: z.string().optional(),
  role_id: z.string(),
});
router.post('/users', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = AdminUserCreateSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    const user = await defaultAdminService.createAdminUser(parsed.data);
    auditAdminAction(req, 'admin:user:create', user.id, { username: parsed.data.username });
    res.status(201).json(user);
  } catch (e) {
    next(e);
  }
});

router.get('/users/:user_id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await defaultAdminService.getAdminUser(req.params.user_id);
    res.json(user);
  } catch (e) {
    next(e);
  }
});

const AdminUserUpdateSchema = z.object({
  name: z.string().optional(),
  email: z.string().optional(),
  role_id: z.string().optional(),
  is_active: z.boolean().optional(),
});
router.put('/users/:user_id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = AdminUserUpdateSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    const user = await defaultAdminService.updateAdminUser(req.params.user_id, parsed.data);
    auditAdminAction(req, 'admin:user:update', req.params.user_id, parsed.data);
    res.json(user);
  } catch (e) {
    next(e);
  }
});

router.delete('/users/:user_id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await defaultAdminService.deleteAdminUser(req.params.user_id);
    auditAdminAction(req, 'admin:user:delete', req.params.user_id);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

const ResetPasswordSchema = z
  .object({
    password: z.string().min(6).optional(),
    new_password: z.string().min(6).optional(),
  })
  .refine((d) => d.password !== undefined || d.new_password !== undefined, {
    message: '需要 password 或 new_password',
  });
router.post(
  '/users/:user_id/reset-password',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = ResetPasswordSchema.safeParse(req.body);
      if (!parsed.success) return next(createAppError(422, '参数校验失败'));
      const newPassword = parsed.data.new_password ?? parsed.data.password;
      if (!newPassword) return next(createAppError(422, '需要 password 或 new_password'));
      await defaultAdminService.resetAdminPassword(req.params.user_id, newPassword);
      auditAdminAction(req, 'admin:user:reset_password', req.params.user_id);
      res.json({ message: 'ok' });
    } catch (e) {
      next(e);
    }
  }
);

// --- roles ---
router.get('/roles', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const list = await defaultAdminService.listAdminRoles();
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.get('/roles/:role_id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const role = await defaultAdminService.getAdminRole(req.params.role_id);
    res.json(role);
  } catch (e) {
    next(e);
  }
});

const AdminRoleCreateSchema = z.object({
  name: z.string(),
  permissions: z.union([z.array(z.string()), z.record(z.unknown())]).optional(),
  is_system: z.boolean().optional(),
});
router.post('/roles', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = AdminRoleCreateSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    const role = await defaultAdminService.createAdminRole({
      name: parsed.data.name,
      permissions: parsed.data.permissions,
      is_system: parsed.data.is_system,
    });
    auditAdminAction(req, 'admin:role:create', role.id, { name: parsed.data.name });
    res.status(201).json(role);
  } catch (e) {
    next(e);
  }
});

const AdminRoleUpdateSchema = z.object({
  name: z.string().optional(),
  permissions: z.union([z.array(z.string()), z.record(z.unknown())]).optional(),
});
router.put('/roles/:role_id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = AdminRoleUpdateSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    const role = await defaultAdminService.updateAdminRole(req.params.role_id, {
      name: parsed.data.name,
      permissions: parsed.data.permissions,
    });
    auditAdminAction(req, 'admin:role:update', req.params.role_id, parsed.data);
    res.json(role);
  } catch (e) {
    next(e);
  }
});

router.delete('/roles/:role_id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await defaultAdminService.deleteAdminRole(req.params.role_id);
    auditAdminAction(req, 'admin:role:delete', req.params.role_id);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

// --- organizations ---
router.get('/organizations', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const skip = req.query.skip != null ? Number(req.query.skip) : undefined;
    const limit = req.query.limit != null ? Number(req.query.limit) : undefined;
    const isActive =
      req.query.is_active === 'true' ? true : req.query.is_active === 'false' ? false : undefined;
    const list = await defaultAdminService.listOrganizations(skip, limit, isActive);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.get('/organizations/:org_id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const org = await defaultAdminService.getOrganization(req.params.org_id);
    res.json(org);
  } catch (e) {
    next(e);
  }
});

router.patch(
  '/organizations/:org_id/active',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = req.body as { active?: boolean };
      const active = body?.active ?? true;
      const org = await defaultAdminService.setOrganizationActive(req.params.org_id, active);
      auditAdminAction(req, 'admin:organization:set_active', req.params.org_id, { active });
      res.json(org);
    } catch (e) {
      next(e);
    }
  }
);

// --- registered-users (C 端注册用户) ---
router.get('/registered-users/count', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const isActive =
      req.query.is_active === 'true' ? true : req.query.is_active === 'false' ? false : undefined;
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : undefined;
    const count = await defaultAdminService.countRegisteredUsers(isActive, search);
    res.json({ count });
  } catch (e) {
    next(e);
  }
});

router.get('/registered-users', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const skip = req.query.skip != null ? Number(req.query.skip) : undefined;
    const limit = req.query.limit != null ? Number(req.query.limit) : undefined;
    const isActive =
      req.query.is_active === 'true' ? true : req.query.is_active === 'false' ? false : undefined;
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : undefined;
    const list = await defaultAdminService.listRegisteredUsers(skip, limit, isActive, search);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.get(
  '/registered-users/:user_id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await defaultAdminService.getRegisteredUser(req.params.user_id);
      res.json(user);
    } catch (e) {
      next(e);
    }
  }
);

router.patch(
  '/registered-users/:user_id/active',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = req.body as { active?: boolean; is_active?: boolean };
      const active = body?.active ?? body?.is_active ?? true;
      const user = await defaultAdminService.setRegisteredUserActive(req.params.user_id, active);
      auditAdminAction(req, 'admin:registered_user:set_active', req.params.user_id, { active });
      res.json(user);
    } catch (e) {
      next(e);
    }
  }
);

router.delete(
  '/registered-users/:user_id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await defaultAdminService.deleteRegisteredUser(req.params.user_id);
      auditAdminAction(req, 'admin:registered_user:delete', req.params.user_id);
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  }
);

// --- subscriptions ---
router.get('/subscriptions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const skip = req.query.skip != null ? Number(req.query.skip) : undefined;
    const limit = req.query.limit != null ? Number(req.query.limit) : undefined;
    const organizationId =
      typeof req.query.organization_id === 'string' ? req.query.organization_id : undefined;
    const statusFilter =
      typeof req.query.status_filter === 'string' ? req.query.status_filter : undefined;
    const list = await defaultAdminService.listSubscriptions(
      skip,
      limit,
      organizationId,
      statusFilter
    );
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.get(
  '/subscriptions/:subscription_id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sub = await defaultAdminService.getSubscription(req.params.subscription_id);
      res.json(sub);
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  '/subscriptions/:subscription_id/renew',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updated = await defaultAdminService.renewSubscription(req.params.subscription_id);
      auditAdminAction(req, 'admin:subscription:renew', req.params.subscription_id);
      res.json(updated);
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  '/subscriptions/:subscription_id/cancel',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await defaultAdminService.cancelSubscription(req.params.subscription_id);
      auditAdminAction(req, 'admin:subscription:cancel', req.params.subscription_id);
      res.json({ message: 'ok' });
    } catch (e) {
      next(e);
    }
  }
);

router.post('/subscriptions/gift', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = AdminSubscriptionGiftSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    const updated = await defaultAdminService.giftSubscription(parsed.data);
    auditAdminAction(req, 'admin:subscription:gift', undefined, parsed.data);
    res.status(201).json(updated);
  } catch (e) {
    next(e);
  }
});

router.get('/stats', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await defaultAdminService.getStats();
    res.json(stats);
  } catch (e) {
    next(e);
  }
});

const UsagePricingUpdateSchema = z.object({
  price_per_org: z.number().min(0).optional(),
  price_per_apartment: z.number().min(0).optional(),
  price_per_room: z.number().min(0).optional(),
  price_per_member: z.number().min(0).optional(),
  is_active: z.boolean().optional(),
});

router.get('/usage-pricing', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const pricing = await defaultAdminService.getUsagePricing();
    res.json(pricing);
  } catch (e) {
    next(e);
  }
});

router.put('/usage-pricing', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = UsagePricingUpdateSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    const pricing = await defaultAdminService.updateUsagePricing(parsed.data);
    auditAdminAction(req, 'admin:usage_pricing:update', undefined, parsed.data);
    res.json(pricing);
  } catch (e) {
    next(e);
  }
});

router.get('/usage-orders', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const skip = req.query.skip != null ? Number(req.query.skip) : undefined;
    const limit = req.query.limit != null ? Number(req.query.limit) : undefined;
    const list = await defaultAdminService.listUsageOrders(skip, limit);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

// --- platform config (品牌配置) ---
const PlatformBrandSchema = z.object({
  app_name: z.string(),
  app_description: z.string(),
  logo_url: z.string(),
  favicon_url: z.string(),
  login_subtitle: z.string(),
  register_subtitle: z.string(),
});

router.get('/platform-config', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const config = await defaultAdminService.getPlatformConfig();
    res.json(config);
  } catch (e) {
    next(e);
  }
});

router.put('/platform-config', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = PlatformBrandSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    const brand = await defaultAdminService.updatePlatformConfig(parsed.data);
    auditAdminAction(req, 'admin:platform_config:update', undefined, { app_name: parsed.data.app_name });
    res.json(brand);
  } catch (e) {
    next(e);
  }
});

export const adminRouter = router;
