import { z } from 'zod';
import type { Request, Response, NextFunction } from 'express';
import { getAdminUser } from '../../../utils/context.js';
import { createAppError } from '../../../utils/appError.js';
import { defaultAdminService } from '../../../services/admin.service.js';
import { auditAdminAction } from '../../../utils/audit.js';

// ==================== Schemas ====================

export const AdminSubscriptionGiftSchema = z.object({
  organization_id: z.string().min(1),
  service_id: z.string().min(1),
  pricing_id: z.string().min(1).nullable().optional(),
  billing_months: z.coerce.number().int().min(1),
  gift_months: z.coerce.number().int().min(0).optional(),
});

export const AdminUserCreateSchema = z.object({
  username: z.string(),
  password: z.string().min(1),
  name: z.string(),
  email: z.string().optional(),
});

export const AdminUserUpdateSchema = z.object({
  name: z.string().optional(),
  email: z.string().optional(),
  is_active: z.boolean().optional(),
});

export const ResetPasswordSchema = z
  .object({
    password: z.string().min(6).optional(),
    new_password: z.string().min(6).optional(),
  })
  .refine((d) => d.password !== undefined || d.new_password !== undefined, {
    message: '需要 password 或 new_password',
  });

export const UsagePricingUpdateSchema = z.object({
  price_per_org: z.number().min(0).optional(),
  price_per_apartment: z.number().min(0).optional(),
  price_per_room: z.number().min(0).optional(),
  price_per_member: z.number().min(0).optional(),
  is_active: z.boolean().optional(),
});

export const PlatformBrandSchema = z.object({
  app_name: z.string(),
  app_description: z.string(),
  logo_url: z.string(),
  favicon_url: z.string(),
  login_subtitle: z.string(),
  register_subtitle: z.string(),
});

// ==================== Handlers ====================

// --- users (admin 后台管理员) ---
export async function getMe(req: Request, res: Response, next: NextFunction) {
  
    const admin = getAdminUser(req);
    if (!admin) return next(createAppError(401, '未授权或登录已过期'));
    const user = await defaultAdminService.getMe(admin.id);
    res.json(user);
  
}

export async function listUsers(req: Request, res: Response, _next: NextFunction) {
  
    const skip = req.query.skip != null ? Number(req.query.skip) : undefined;
    const limit = req.query.limit != null ? Number(req.query.limit) : undefined;
    const list = await defaultAdminService.listAdmins(skip, limit);
    res.json(list);
  
}

export async function createUser(req: Request, res: Response, next: NextFunction) {
  
    const parsed = AdminUserCreateSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    const user = await defaultAdminService.createAdminUser(parsed.data);
    auditAdminAction(req, 'admin:user:create', user.id, { username: parsed.data.username });
    res.status(201).json(user);
  
}

export async function getUser(req: Request, res: Response, _next: NextFunction) {
  
    const user = await defaultAdminService.getAdminUser(req.params.user_id);
    res.json(user);
  
}

export async function updateUser(req: Request, res: Response, next: NextFunction) {
  
    const parsed = AdminUserUpdateSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    const user = await defaultAdminService.updateAdminUser(req.params.user_id, parsed.data);
    auditAdminAction(req, 'admin:user:update', req.params.user_id, parsed.data);
    res.json(user);
  
}

export async function deleteUser(req: Request, res: Response, _next: NextFunction) {
  
    await defaultAdminService.deleteAdminUser(req.params.user_id);
    auditAdminAction(req, 'admin:user:delete', req.params.user_id);
    res.status(204).send();
  
}

export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  
    const parsed = ResetPasswordSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    const newPassword = parsed.data.new_password ?? parsed.data.password;
    if (!newPassword) return next(createAppError(422, '需要 password 或 new_password'));
    await defaultAdminService.resetAdminPassword(req.params.user_id, newPassword);
    auditAdminAction(req, 'admin:user:reset_password', req.params.user_id);
    res.json({ message: 'ok' });
  
}

// --- organizations ---
export async function listOrganizations(req: Request, res: Response, _next: NextFunction) {
  
    const skip = req.query.skip != null ? Number(req.query.skip) : undefined;
    const limit = req.query.limit != null ? Number(req.query.limit) : undefined;
    const isActive =
      req.query.is_active === 'true' ? true : req.query.is_active === 'false' ? false : undefined;
    const list = await defaultAdminService.listOrganizations(skip, limit, isActive);
    res.json(list);
  
}

export async function getOrganization(req: Request, res: Response, _next: NextFunction) {
  
    const org = await defaultAdminService.getOrganization(req.params.org_id);
    res.json(org);
  
}

export async function setOrganizationActive(req: Request, res: Response, _next: NextFunction) {
  
    const body = req.body as { active?: boolean };
    const active = body?.active ?? true;
    const org = await defaultAdminService.setOrganizationActive(req.params.org_id, active);
    auditAdminAction(req, 'admin:organization:set_active', req.params.org_id, { active });
    res.json(org);
  
}

// --- registered-users (C 端注册用户) ---
export async function countRegisteredUsers(req: Request, res: Response, _next: NextFunction) {
  
    const isActive =
      req.query.is_active === 'true' ? true : req.query.is_active === 'false' ? false : undefined;
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : undefined;
    const count = await defaultAdminService.countRegisteredUsers(isActive, search);
    res.json({ count });
  
}

export async function listRegisteredUsers(req: Request, res: Response, _next: NextFunction) {
  
    const skip = req.query.skip != null ? Number(req.query.skip) : undefined;
    const limit = req.query.limit != null ? Number(req.query.limit) : undefined;
    const isActive =
      req.query.is_active === 'true' ? true : req.query.is_active === 'false' ? false : undefined;
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : undefined;
    const list = await defaultAdminService.listRegisteredUsers(skip, limit, isActive, search);
    res.json(list);
  
}

export async function getRegisteredUser(req: Request, res: Response, _next: NextFunction) {
  
    const user = await defaultAdminService.getRegisteredUser(req.params.user_id);
    res.json(user);
  
}

export async function setRegisteredUserActive(req: Request, res: Response, _next: NextFunction) {
  
    const body = req.body as { active?: boolean; is_active?: boolean };
    const active = body?.active ?? body?.is_active ?? true;
    const user = await defaultAdminService.setRegisteredUserActive(req.params.user_id, active);
    auditAdminAction(req, 'admin:registered_user:set_active', req.params.user_id, { active });
    res.json(user);
  
}

export async function deleteRegisteredUser(req: Request, res: Response, _next: NextFunction) {
  
    await defaultAdminService.deleteRegisteredUser(req.params.user_id);
    auditAdminAction(req, 'admin:registered_user:delete', req.params.user_id);
    res.status(204).send();
  
}

// --- subscriptions ---
export async function listSubscriptions(req: Request, res: Response, _next: NextFunction) {
  
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
  
}

export async function getSubscription(req: Request, res: Response, _next: NextFunction) {
  
    const sub = await defaultAdminService.getSubscription(req.params.subscription_id);
    res.json(sub);
  
}

export async function renewSubscription(req: Request, res: Response, _next: NextFunction) {
  
    const updated = await defaultAdminService.renewSubscription(req.params.subscription_id);
    auditAdminAction(req, 'admin:subscription:renew', req.params.subscription_id);
    res.json(updated);
  
}

export async function cancelSubscription(req: Request, res: Response, _next: NextFunction) {
  
    await defaultAdminService.cancelSubscription(req.params.subscription_id);
    auditAdminAction(req, 'admin:subscription:cancel', req.params.subscription_id);
    res.json({ message: 'ok' });
  
}

export async function giftSubscription(req: Request, res: Response, next: NextFunction) {
  
    const parsed = AdminSubscriptionGiftSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    const updated = await defaultAdminService.giftSubscription(parsed.data);
    auditAdminAction(req, 'admin:subscription:gift', undefined, parsed.data);
    res.status(201).json(updated);
  
}

// --- stats ---
export async function getStats(_req: Request, res: Response, _next: NextFunction) {
  
    const stats = await defaultAdminService.getStats();
    res.json(stats);
  
}

// --- income reports ---
export async function getAdminIncome(req: Request, res: Response, _next: NextFunction) {
  
    const year = req.query.year != null ? Number(req.query.year) : new Date().getFullYear();
    const startMonth = req.query.start_month != null ? Number(req.query.start_month) : undefined;
    const endMonth = req.query.end_month != null ? Number(req.query.end_month) : undefined;
    const income = await defaultAdminService.getAdminIncome(year, startMonth, endMonth);
    res.json(income);
  
}

// --- usage pricing ---
export async function getUsagePricing(_req: Request, res: Response, _next: NextFunction) {
  
    const pricing = await defaultAdminService.getUsagePricing();
    res.json(pricing);
  
}

export async function updateUsagePricing(req: Request, res: Response, next: NextFunction) {
  
    const parsed = UsagePricingUpdateSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    const pricing = await defaultAdminService.updateUsagePricing(parsed.data);
    auditAdminAction(req, 'admin:usage_pricing:update', undefined, parsed.data);
    res.json(pricing);
  
}

// --- platform config ---
export async function getPlatformConfig(_req: Request, res: Response, _next: NextFunction) {
  
    const config = await defaultAdminService.getPlatformConfig();
    res.json(config);
  
}

export async function updatePlatformConfig(req: Request, res: Response, next: NextFunction) {
  
    const parsed = PlatformBrandSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    const brand = await defaultAdminService.updatePlatformConfig(parsed.data);
    auditAdminAction(req, 'admin:platform_config:update', undefined, { app_name: parsed.data.app_name });
    res.json(brand);
  
}
