import { Router } from 'express';
import { z } from 'zod';
import { ulid } from 'ulid';
import { adminAuthRouter } from './auth.js';
import { requireAdmin } from '../../../middlewares/requireAdmin.js';
import { prisma } from '../../../lib/prisma.js';
import { getAdminUser } from '../../../utils/context.js';
import { hashPassword } from '../../../utils/security.js';
import { createAppError } from '../../../utils/appError.js';
import { NotFoundMessages } from '../../../messages.js';
import type { Request, Response, NextFunction } from 'express';

const router: Router = Router();

router.use('/auth', adminAuthRouter);

router.use(requireAdmin);

// --- users (admin 后台管理员) ---
router.get('/users/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const admin = getAdminUser(req);
    if (!admin) return next(createAppError(401, '未授权或登录已过期'));
    const user = await prisma.adminUser.findUnique({ where: { id: admin.id }, include: { role: true } });
    if (!user) return next(createAppError(404, NotFoundMessages.USER));
    res.json(user);
  } catch (e) {
    next(e);
  }
});

router.get('/users', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const skip = req.query.skip != null ? Number(req.query.skip) : undefined;
    const limit = req.query.limit != null ? Number(req.query.limit) : undefined;
    const list = await prisma.adminUser.findMany({
      skip,
      take: limit,
      include: { role: true },
    });
    res.json(list);
  } catch (e) {
    next(e);
  }
});

const AdminUserCreateSchema = z.object({ username: z.string(), password: z.string().min(1), name: z.string(), email: z.string().optional(), role_id: z.string() });
router.post('/users', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = AdminUserCreateSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    const role = await prisma.adminRole.findUnique({ where: { id: parsed.data.role_id } });
    if (!role) return next(createAppError(404, NotFoundMessages.ROLE));
    const existing = await prisma.adminUser.findUnique({ where: { username: parsed.data.username } });
    if (existing) return next(createAppError(409, '用户名已存在'));
    const hash = await hashPassword(parsed.data.password);
    const user = await prisma.adminUser.create({
      data: {
        id: ulid().toLowerCase(),
        username: parsed.data.username,
        password_hash: hash,
        name: parsed.data.name,
        email: parsed.data.email ?? undefined,
        role_id: parsed.data.role_id,
      },
    });
    res.status(201).json(user);
  } catch (e) {
    next(e);
  }
});

router.get('/users/:user_id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.adminUser.findUnique({ where: { id: req.params.user_id }, include: { role: true } });
    if (!user) return next(createAppError(404, NotFoundMessages.USER));
    res.json(user);
  } catch (e) {
    next(e);
  }
});

const AdminUserUpdateSchema = z.object({ name: z.string().optional(), email: z.string().optional(), role_id: z.string().optional(), is_active: z.boolean().optional() });
router.put('/users/:user_id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = AdminUserUpdateSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    const existing = await prisma.adminUser.findUnique({ where: { id: req.params.user_id } });
    if (!existing) return next(createAppError(404, NotFoundMessages.USER));
    const data: Record<string, unknown> = {};
    if (parsed.data.name != null) data.name = parsed.data.name;
    if (parsed.data.email !== undefined) data.email = parsed.data.email;
    if (parsed.data.role_id != null) {
      const role = await prisma.adminRole.findUnique({ where: { id: parsed.data.role_id } });
      if (!role) return next(createAppError(404, NotFoundMessages.ROLE));
      data.role_id = parsed.data.role_id;
    }
    if (parsed.data.is_active !== undefined) data.is_active = parsed.data.is_active;
    const user = await prisma.adminUser.update({ where: { id: req.params.user_id }, data });
    res.json(user);
  } catch (e) {
    next(e);
  }
});

router.delete('/users/:user_id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.adminUser.findUnique({ where: { id: req.params.user_id } });
    if (!existing) return next(createAppError(404, NotFoundMessages.USER));
    if (existing.is_system) return next(createAppError(400, '系统管理员不可删除'));
    await prisma.adminUser.delete({ where: { id: req.params.user_id } });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

const ResetPasswordSchema = z.object({
  password: z.string().min(6).optional(),
  new_password: z.string().min(6).optional(),
}).refine((d) => d.password !== undefined || d.new_password !== undefined, { message: '需要 password 或 new_password' });
router.post('/users/:user_id/reset-password', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = ResetPasswordSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    const newPassword = parsed.data.new_password ?? parsed.data.password;
    if (!newPassword) return next(createAppError(422, '需要 password 或 new_password'));
    const existing = await prisma.adminUser.findUnique({ where: { id: req.params.user_id } });
    if (!existing) return next(createAppError(404, NotFoundMessages.USER));
    const hash = await hashPassword(newPassword);
    await prisma.adminUser.update({ where: { id: req.params.user_id }, data: { password_hash: hash } });
    res.json({ message: 'ok' });
  } catch (e) {
    next(e);
  }
});

// --- roles ---
router.get('/roles', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const list = await prisma.adminRole.findMany();
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.get('/roles/:role_id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const role = await prisma.adminRole.findUnique({ where: { id: req.params.role_id } });
    if (!role) return next(createAppError(404, NotFoundMessages.ROLE));
    res.json(role);
  } catch (e) {
    next(e);
  }
});

const AdminRoleCreateSchema = z.object({ name: z.string(), permissions: z.union([z.array(z.string()), z.record(z.unknown())]).optional(), is_system: z.boolean().optional() });
router.post('/roles', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = AdminRoleCreateSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    const permissions = Array.isArray(parsed.data.permissions) ? parsed.data.permissions : (parsed.data.permissions ?? []);
    const role = await prisma.adminRole.create({
      data: { id: ulid().toLowerCase(), name: parsed.data.name, permissions: permissions as object, is_system: parsed.data.is_system ?? false },
    });
    res.status(201).json(role);
  } catch (e) {
    next(e);
  }
});

const AdminRoleUpdateSchema = z.object({ name: z.string().optional(), permissions: z.union([z.array(z.string()), z.record(z.unknown())]).optional() });
router.put('/roles/:role_id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = AdminRoleUpdateSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    const existing = await prisma.adminRole.findUnique({ where: { id: req.params.role_id } });
    if (!existing) return next(createAppError(404, NotFoundMessages.ROLE));
    const data: Record<string, unknown> = {};
    if (parsed.data.name != null) data.name = parsed.data.name;
    if (parsed.data.permissions !== undefined) data.permissions = Array.isArray(parsed.data.permissions) ? parsed.data.permissions : parsed.data.permissions;
    const role = await prisma.adminRole.update({ where: { id: req.params.role_id }, data });
    res.json(role);
  } catch (e) {
    next(e);
  }
});

router.delete('/roles/:role_id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.adminRole.findUnique({ where: { id: req.params.role_id }, include: { users: true } });
    if (!existing) return next(createAppError(404, NotFoundMessages.ROLE));
    if (existing.is_system) return next(createAppError(400, '系统角色不可删除'));
    if (existing.users.length > 0) return next(createAppError(400, '该角色下仍有用户，无法删除'));
    await prisma.adminRole.delete({ where: { id: req.params.role_id } });
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
    const isActive = req.query.is_active === 'true' ? true : req.query.is_active === 'false' ? false : undefined;
    const where = isActive !== undefined ? { is_active: isActive } : undefined;
    const list = await prisma.organization.findMany({ skip, take: limit, where });
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.get('/organizations/:org_id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const org = await prisma.organization.findUnique({ where: { id: req.params.org_id } });
    if (!org) return next(createAppError(404, NotFoundMessages.ORGANIZATION));
    res.json(org);
  } catch (e) {
    next(e);
  }
});

router.patch('/organizations/:org_id/active', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body as { active?: boolean };
    const active = body?.active ?? true;
    const org = await prisma.organization.findUnique({ where: { id: req.params.org_id } });
    if (!org) return next(createAppError(404, NotFoundMessages.ORGANIZATION));
    await prisma.organization.update({ where: { id: req.params.org_id }, data: { is_active: active } });
    res.json({ ...org, is_active: active });
  } catch (e) {
    next(e);
  }
});

// --- registered-users (C 端注册用户) ---
router.get('/registered-users/count', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const isActive = req.query.is_active === 'true' ? true : req.query.is_active === 'false' ? false : undefined;
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : undefined;
    const where: { is_active?: boolean; OR?: Array<{ phone?: { contains: string; mode: 'insensitive' }; full_name?: { contains: string; mode: 'insensitive' } }> } = {};
    if (isActive !== undefined) where.is_active = isActive;
    if (search && search.length > 0) {
      where.OR = [
        { phone: { contains: search, mode: 'insensitive' } },
        { full_name: { contains: search, mode: 'insensitive' } },
      ];
    }
    const count = await prisma.user.count({ where: Object.keys(where).length ? where : undefined });
    res.json({ count });
  } catch (e) {
    next(e);
  }
});

router.get('/registered-users', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const skip = req.query.skip != null ? Number(req.query.skip) : undefined;
    const limit = req.query.limit != null ? Number(req.query.limit) : undefined;
    const isActive = req.query.is_active === 'true' ? true : req.query.is_active === 'false' ? false : undefined;
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : undefined;
    const where: { is_active?: boolean; OR?: Array<{ phone?: { contains: string; mode: 'insensitive' }; full_name?: { contains: string; mode: 'insensitive' } }> } = {};
    if (isActive !== undefined) where.is_active = isActive;
    if (search && search.length > 0) {
      where.OR = [
        { phone: { contains: search, mode: 'insensitive' } },
        { full_name: { contains: search, mode: 'insensitive' } },
      ];
    }
    const list = await prisma.user.findMany({
      skip,
      take: limit,
      where: Object.keys(where).length ? where : undefined,
      select: { id: true, phone: true, full_name: true, is_active: true, created_at: true },
    });
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.get('/registered-users/:user_id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.user_id },
      include: {
        organization_memberships: { include: { organization: { select: { id: true, name: true, slug: true } } } },
      },
    });
    if (!user) return next(createAppError(404, NotFoundMessages.USER));
    const organizations = user.organization_memberships.map((m) => ({
      id: m.organization.id,
      name: m.organization.name,
      slug: m.organization.slug,
      role: m.role,
    }));
    res.json({
      id: user.id,
      phone: user.phone,
      full_name: user.full_name,
      is_active: user.is_active,
      created_at: user.created_at,
      organizations,
    });
  } catch (e) {
    next(e);
  }
});

router.patch('/registered-users/:user_id/active', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body as { active?: boolean; is_active?: boolean };
    const active = body?.active ?? body?.is_active ?? true;
    const user = await prisma.user.findUnique({ where: { id: req.params.user_id } });
    if (!user) return next(createAppError(404, NotFoundMessages.USER));
    await prisma.user.update({ where: { id: req.params.user_id }, data: { is_active: active } });
    res.json({ ...user, is_active: active });
  } catch (e) {
    next(e);
  }
});

router.delete('/registered-users/:user_id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.user_id } });
    if (!user) return next(createAppError(404, NotFoundMessages.USER));
    await prisma.user.delete({ where: { id: req.params.user_id } });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

// --- plans ---
router.get('/plans', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const activeOnly = req.query.active_only === 'true';
    const list = await prisma.subscriptionPlan.findMany({
      where: activeOnly ? { is_active: true } : undefined,
      orderBy: { sort_order: 'asc' },
    });
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.get('/plans/:plan_id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: req.params.plan_id },
    });
    if (!plan) return next(createAppError(404, NotFoundMessages.PLAN));
    res.json(plan);
  } catch (e) {
    next(e);
  }
});

const CountScopeSchema = z.enum(['organization', 'user']);
const PlanCreateSchema = z.object({
  name: z.string(),
  code: z.string(),
  price_monthly: z.number(),
  price_yearly: z.number().optional(),
  max_organizations: z.number().nullable().optional(),
  max_apartments: z.number().optional(),
  max_rooms: z.number().optional(),
  max_members: z.number().optional(),
  rooms_count_scope: CountScopeSchema.optional(),
  members_count_scope: CountScopeSchema.optional(),
  is_active: z.boolean().optional(),
  sort_order: z.number().optional(),
});
const PlanUpdateSchema = PlanCreateSchema.partial();
router.post('/plans', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = PlanCreateSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    const plan = await prisma.subscriptionPlan.create({
      data: {
        id: ulid().toLowerCase(),
        name: parsed.data.name,
        code: parsed.data.code,
        price_monthly: parsed.data.price_monthly,
        price_yearly: parsed.data.price_yearly ?? parsed.data.price_monthly,
        max_organizations: parsed.data.max_organizations ?? undefined,
        max_apartments: parsed.data.max_apartments ?? 1,
        max_rooms: parsed.data.max_rooms ?? 100,
        max_members: parsed.data.max_members ?? 1,
        rooms_count_scope: parsed.data.rooms_count_scope ?? 'organization',
        members_count_scope: parsed.data.members_count_scope ?? 'organization',
        is_active: parsed.data.is_active ?? true,
        sort_order: parsed.data.sort_order ?? 0,
      },
    });
    res.status(201).json(plan);
  } catch (e) {
    next(e);
  }
});

router.put('/plans/:plan_id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = PlanUpdateSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    const existing = await prisma.subscriptionPlan.findUnique({ where: { id: req.params.plan_id } });
    if (!existing) return next(createAppError(404, NotFoundMessages.PLAN));
    const data: Record<string, unknown> = {};
    if (parsed.data.name != null) data.name = parsed.data.name;
    if (parsed.data.code != null) data.code = parsed.data.code;
    if (parsed.data.price_monthly != null) data.price_monthly = parsed.data.price_monthly;
    if (parsed.data.price_yearly != null) data.price_yearly = parsed.data.price_yearly;
    if (parsed.data.max_organizations !== undefined) data.max_organizations = parsed.data.max_organizations;
    if (parsed.data.max_apartments != null) data.max_apartments = parsed.data.max_apartments;
    if (parsed.data.max_rooms != null) data.max_rooms = parsed.data.max_rooms;
    if (parsed.data.max_members != null) data.max_members = parsed.data.max_members;
    if (parsed.data.rooms_count_scope != null) data.rooms_count_scope = parsed.data.rooms_count_scope;
    if (parsed.data.members_count_scope != null) data.members_count_scope = parsed.data.members_count_scope;
    if (parsed.data.is_active !== undefined) data.is_active = parsed.data.is_active;
    if (parsed.data.sort_order != null) data.sort_order = parsed.data.sort_order;
    const plan = await prisma.subscriptionPlan.update({ where: { id: req.params.plan_id }, data });
    res.json(plan);
  } catch (e) {
    next(e);
  }
});

router.delete('/plans/:plan_id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.subscriptionPlan.findUnique({ where: { id: req.params.plan_id } });
    if (!existing) return next(createAppError(404, NotFoundMessages.PLAN));
    await prisma.subscriptionPlan.delete({ where: { id: req.params.plan_id } });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

// --- subscriptions ---
router.get('/subscriptions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const skip = req.query.skip != null ? Number(req.query.skip) : undefined;
    const limit = req.query.limit != null ? Number(req.query.limit) : undefined;
    const organizationId = typeof req.query.organization_id === 'string' ? req.query.organization_id : undefined;
    const statusFilter = typeof req.query.status_filter === 'string' ? req.query.status_filter : undefined;
    const where: { organization_id?: string; status?: string } = {};
    if (organizationId) where.organization_id = organizationId;
    if (statusFilter) where.status = statusFilter;
    const list = await prisma.organizationSubscription.findMany({
      skip,
      take: limit,
      where: Object.keys(where).length ? where : undefined,
      include: { plan: true, organization: true },
    });
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.get('/subscriptions/:subscription_id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sub = await prisma.organizationSubscription.findUnique({
      where: { id: req.params.subscription_id },
      include: { plan: true, organization: true },
    });
    if (!sub) return next(createAppError(404, NotFoundMessages.SUBSCRIPTION));
    res.json(sub);
  } catch (e) {
    next(e);
  }
});

router.post('/subscriptions/:subscription_id/renew', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sub = await prisma.organizationSubscription.findUnique({ where: { id: req.params.subscription_id } });
    if (!sub) return next(createAppError(404, NotFoundMessages.SUBSCRIPTION));
    const end = sub.end_date ? new Date(sub.end_date) : new Date();
    end.setFullYear(end.getFullYear() + 1);
    const updated = await prisma.organizationSubscription.update({
      where: { id: req.params.subscription_id },
      data: { end_date: end, status: 'active' },
    });
    res.json(updated);
  } catch (e) {
    next(e);
  }
});

router.post('/subscriptions/:subscription_id/cancel', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sub = await prisma.organizationSubscription.findUnique({ where: { id: req.params.subscription_id } });
    if (!sub) return next(createAppError(404, NotFoundMessages.SUBSCRIPTION));
    await prisma.organizationSubscription.update({
      where: { id: req.params.subscription_id },
      data: { status: 'cancelled' },
    });
    res.json({ message: 'ok' });
  } catch (e) {
    next(e);
  }
});

router.get('/stats', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [orgCount, userCount] = await Promise.all([
      prisma.organization.count(),
      prisma.user.count(),
    ]);
    res.json({ organizations: orgCount, users: userCount });
  } catch (e) {
    next(e);
  }
});

export const adminRouter = router;
