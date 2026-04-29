import type {
  AdminUser,
  User,
  Organization,
  OrganizationSubscription,
  Prisma,
} from '@prisma/client';
import type { ServiceProduct } from '@apartment-ultra/api-contract';
import type {
  AdminRepository,
  SubscriptionWithRelations,
} from '../repositories/admin.repo.js';
import { defaultAdminRepo } from '../repositories/admin.repo.js';
import { createAppError } from '../utils/appError.js';
import { NotFoundMessages } from '../messages.js';
import { hashPassword, verifyPassword } from '../utils/security.js';
import { createAdminAccessToken } from '../utils/jwt.js';
import { toPrismaInputJsonValue } from '../utils/json.js';
import { defaultBillingService } from './billing.service.js';
import { ulid } from 'ulid';
import {
  defaultServiceProductService,
  type ServiceProductService,
} from './service-product.service.js';
import { defaultBillingOrderRepo } from '../repositories/billing-order.repo.js';
import { prisma } from '../lib/prisma.js';

/**
 * 登录结果
 */
export interface AdminLoginResult {
  access_token: string;
  token_type: string;
}

/**
 * 创建管理员输入
 */
export interface CreateAdminUserInput {
  username: string;
  password: string;
  name: string;
  email?: string;
}

/**
 * 更新管理员输入
 */
export interface UpdateAdminUserInput {
  name?: string;
  email?: string;
  is_active?: boolean;
}

/**
 * 使用量定价
 */
export interface UsagePricing {
  price_per_org: number;
  price_per_apartment: number;
  price_per_room: number;
  price_per_member: number;
}

/**
 * 使用量定价更新输入
 */
export interface UpdateUsagePricingInput {
  price_per_org?: number;
  price_per_apartment?: number;
  price_per_room?: number;
  price_per_member?: number;
}

export interface GiftSubscriptionInput {
  organization_id: string;
  service_id: string;
  pricing_id?: string | null;
  billing_months: number;
  gift_months?: number;
}

/**
 * 平台品牌配置
 */
export interface PlatformBrand {
  app_name: string;
  app_description: string;
  logo_url: string;
  favicon_url: string;
  login_subtitle: string;
  register_subtitle: string;
}

/**
 * 统计信息
 */
export interface AdminStats {
  organizations_count: number;
  users_count: number;
  apartments_count: number;
  rooms_count: number;
  active_subscriptions_count: number;
  monthly_revenue: number;
}

/**
 * Admin Service 接口
 */
export interface AdminService {
  // Auth
  login(username: string, password: string): Promise<AdminLoginResult>;

  // Admin Users
  getMe(adminId: string): Promise<AdminUser>;
  listAdmins(skip?: number, limit?: number): Promise<AdminUser[]>;
  createAdminUser(data: CreateAdminUserInput): Promise<AdminUser>;
  getAdminUser(userId: string): Promise<AdminUser>;
  updateAdminUser(userId: string, data: UpdateAdminUserInput): Promise<AdminUser>;
  deleteAdminUser(userId: string): Promise<void>;
  resetAdminPassword(userId: string, newPassword: string): Promise<void>;

  // Organizations
  listOrganizations(skip?: number, limit?: number, isActive?: boolean): Promise<Organization[]>;
  getOrganization(orgId: string): Promise<Organization>;
  setOrganizationActive(orgId: string, active: boolean): Promise<Organization>;

  // Registered Users
  countRegisteredUsers(isActive?: boolean, search?: string): Promise<number>;
  listRegisteredUsers(
    skip?: number,
    limit?: number,
    isActive?: boolean,
    search?: string
  ): Promise<Partial<User>[]>;
  getRegisteredUser(userId: string): Promise<{
    id: string;
    phone: string | null;
    full_name: string | null;
    is_active: boolean;
    created_at: Date;
    organizations: Array<{ id: string; name: string; slug: string; role: string }>;
  }>;
  setRegisteredUserActive(userId: string, active: boolean): Promise<User>;
  deleteRegisteredUser(userId: string): Promise<void>;

  // Services (使用新的服务定价模块)
  listServices(activeOnly?: boolean): Promise<ServiceProduct[]>;
  getService(serviceId: string): Promise<ServiceProduct>;

  // Subscriptions
  listSubscriptions(
    skip?: number,
    limit?: number,
    organizationId?: string,
    statusFilter?: string
  ): Promise<SubscriptionWithRelations[]>;
  getSubscription(subscriptionId: string): Promise<SubscriptionWithRelations>;
  renewSubscription(subscriptionId: string): Promise<OrganizationSubscription>;
  cancelSubscription(subscriptionId: string): Promise<void>;
  giftSubscription(data: GiftSubscriptionInput): Promise<SubscriptionWithRelations>;

  // Stats
  getStats(): Promise<AdminStats>;
  getAdminIncome(
    year: number,
    startMonth?: number,
    endMonth?: number
  ): Promise<
    Array<{
      period: string;
      total_rent: number;
      total_water: number;
      total_electricity: number;
      total_other: number;
      total_amount: number;
      collected_amount: number;
      collection_rate: number;
    }>
  >;

  // Usage Pricing
  getUsagePricing(): Promise<UsagePricing>;
  updateUsagePricing(data: UpdateUsagePricingInput): Promise<UsagePricing>;

  // Platform Config
  getPlatformConfig(): Promise<PlatformBrand>;
  updatePlatformConfig(brand: PlatformBrand): Promise<PlatformBrand>;
}

/**
 * 创建 Admin Service 实例
 */
export function createAdminService(
  getRepo: () => AdminRepository = () => defaultAdminRepo,
  getServiceProductSvc: () => ServiceProductService = () => defaultServiceProductService
): AdminService {
  return {
    login: async (username: string, password: string) => {
      const admin = await getRepo().findAdminByUsername(username);
      if (!admin) {
        throw createAppError(401, '用户名或密码错误');
      }
      if (!admin.is_active) {
        throw createAppError(401, '账号已停用');
      }

      // 检查账户是否被锁定
      if (admin.locked_until && admin.locked_until > new Date()) {
        throw createAppError(423, '账户已被锁定，请稍后再试');
      }

      const ok = await verifyPassword(password, admin.password_hash);
      if (!ok) {
        // 登录失败，增加失败计数
        const failedAttempts = (admin.failed_login_attempts || 0) + 1;
        const LOCK_THRESHOLD = 5;
        const LOCK_MINUTES = 30;

        if (failedAttempts >= LOCK_THRESHOLD) {
          // 达到锁定阈值，锁定账户
          const lockedUntil = new Date();
          lockedUntil.setMinutes(lockedUntil.getMinutes() + LOCK_MINUTES);
          await getRepo().updateAdmin(admin.id, {
            failed_login_attempts: failedAttempts,
            locked_until: lockedUntil,
          });
          throw createAppError(423, `密码错误次数过多，账户已锁定${LOCK_MINUTES}分钟`);
        }

        // 未达阈值，仅增加失败计数
        await getRepo().updateAdmin(admin.id, {
          failed_login_attempts: failedAttempts,
        });
        throw createAppError(401, `用户名或密码错误（剩余${LOCK_THRESHOLD - failedAttempts}次）`);
      }

      // 登录成功，重置失败计数，解锁账户
      if (admin.failed_login_attempts > 0 || admin.locked_until) {
        await getRepo().updateAdmin(admin.id, {
          failed_login_attempts: 0,
          locked_until: null,
        });
      }

      // 更新最后登录时间
      await getRepo().updateAdmin(admin.id, {
        last_login_at: new Date(),
      });

      const access_token = createAdminAccessToken(admin.id);
      return { access_token, token_type: 'bearer' };
    },

    getMe: async (adminId: string) => {
      const user = await getRepo().findAdminById(adminId);
      if (!user) {
        throw createAppError(404, NotFoundMessages.USER);
      }
      return user;
    },

    listAdmins: async (skip?: number, limit?: number) => {
      return getRepo().listAdmins(skip, limit);
    },

    createAdminUser: async (data: CreateAdminUserInput) => {
      const existing = await getRepo().findAdminByUsernameOnly(data.username);
      if (existing) {
        throw createAppError(409, '用户名已存在');
      }
      const hash = await hashPassword(data.password);
      return getRepo().createAdmin({
        id: ulid().toLowerCase(),
        username: data.username,
        password_hash: hash,
        name: data.name,
        email: data.email,
      });
    },

    getAdminUser: async (userId: string) => {
      const user = await getRepo().findAdminById(userId);
      if (!user) {
        throw createAppError(404, NotFoundMessages.USER);
      }
      return user;
    },

    updateAdminUser: async (userId: string, data: UpdateAdminUserInput) => {
      const existing = await getRepo().findAdminById(userId);
      if (!existing) {
        throw createAppError(404, NotFoundMessages.USER);
      }
      const updateData: Prisma.AdminUserUpdateInput = {};
      if (data.name != null) updateData.name = data.name;
      if (data.email !== undefined) updateData.email = data.email;
      if (data.is_active !== undefined) updateData.is_active = data.is_active;
      return getRepo().updateAdmin(userId, updateData);
    },

    deleteAdminUser: async (userId: string) => {
      const existing = await getRepo().findAdminById(userId);
      if (!existing) {
        throw createAppError(404, NotFoundMessages.USER);
      }
      if (existing.is_system) {
        throw createAppError(400, '系统管理员不可删除');
      }
      await getRepo().deleteAdmin(userId);
    },

    resetAdminPassword: async (userId: string, newPassword: string) => {
      const existing = await getRepo().findAdminById(userId);
      if (!existing) {
        throw createAppError(404, NotFoundMessages.USER);
      }
      const hash = await hashPassword(newPassword);
      await getRepo().updateAdmin(userId, { password_hash: hash });
    },

    listOrganizations: async (skip?: number, limit?: number, isActive?: boolean) => {
      const where = isActive !== undefined ? { is_active: isActive } : undefined;
      return getRepo().listOrganizations(skip, limit, where);
    },

    getOrganization: async (orgId: string) => {
      const org = await getRepo().findOrganizationById(orgId);
      if (!org) {
        throw createAppError(404, NotFoundMessages.ORGANIZATION);
      }
      return org;
    },

    setOrganizationActive: async (orgId: string, active: boolean) => {
      const org = await getRepo().findOrganizationById(orgId);
      if (!org) {
        throw createAppError(404, NotFoundMessages.ORGANIZATION);
      }
      return getRepo().updateOrganizationActive(orgId, active);
    },

    countRegisteredUsers: async (isActive?: boolean, search?: string) => {
      const where = buildUserWhere(isActive, search);
      return getRepo().countUsers(Object.keys(where).length ? where : undefined);
    },

    listRegisteredUsers: async (
      skip?: number,
      limit?: number,
      isActive?: boolean,
      search?: string
    ) => {
      const where = buildUserWhere(isActive, search);
      return getRepo().listUsers(
        skip,
        limit,
        Object.keys(where).length ? where : undefined
      ) as Promise<Partial<User>[]>;
    },

    getRegisteredUser: async (userId: string) => {
      const user = await getRepo().findUserWithOrgs(userId);
      if (!user) {
        throw createAppError(404, NotFoundMessages.USER);
      }
      return {
        id: user.id,
        phone: user.phone,
        full_name: user.full_name,
        is_active: user.is_active,
        created_at: user.created_at,
        organizations: user.organization_memberships.map((m) => ({
          id: m.organization.id,
          name: m.organization.name,
          slug: m.organization.slug,
          role: (m as { role_id?: string }).role_id ?? '',
        })),
      };
    },

    setRegisteredUserActive: async (userId: string, active: boolean) => {
      const user = await getRepo().findUserById(userId);
      if (!user) {
        throw createAppError(404, NotFoundMessages.USER);
      }
      return getRepo().updateUserActive(userId, active);
    },

    deleteRegisteredUser: async (userId: string) => {
      const user = await getRepo().findUserById(userId);
      if (!user) {
        throw createAppError(404, NotFoundMessages.USER);
      }
      await getRepo().deleteUser(userId);
    },

    listServices: async (activeOnly?: boolean) => {
      const products = await getServiceProductSvc().listServiceProducts({
        is_active: activeOnly ? true : undefined,
        include_pricing: true,
      });
      return products;
    },

    getService: async (serviceId: string) => {
      const service = await getServiceProductSvc().getServiceProductById(serviceId);
      if (!service) {
        throw createAppError(404, NotFoundMessages.PLAN);
      }
      return service;
    },

    listSubscriptions: async (
      skip?: number,
      limit?: number,
      organizationId?: string,
      statusFilter?: string
    ) => {
      const where: Prisma.OrganizationSubscriptionWhereInput = {};
      if (organizationId) where.organization_id = organizationId;
      if (statusFilter) where.status = statusFilter;
      return getRepo().listSubscriptions(
        skip,
        limit,
        Object.keys(where).length ? where : undefined
      );
    },

    getSubscription: async (subscriptionId: string) => {
      const sub = await getRepo().findSubscriptionById(subscriptionId);
      if (!sub) {
        throw createAppError(404, NotFoundMessages.SUBSCRIPTION);
      }
      return sub;
    },

    renewSubscription: async (subscriptionId: string) => {
      const sub = await getRepo().findSubscriptionById(subscriptionId);
      if (!sub) {
        throw createAppError(404, NotFoundMessages.SUBSCRIPTION);
      }
      const end = sub.end_date ? new Date(sub.end_date) : new Date();
      end.setFullYear(end.getFullYear() + 1);
      return getRepo().renewSubscription(subscriptionId, end);
    },

    cancelSubscription: async (subscriptionId: string) => {
      const sub = await getRepo().findSubscriptionById(subscriptionId);
      if (!sub) {
        throw createAppError(404, NotFoundMessages.SUBSCRIPTION);
      }
      await getRepo().cancelSubscription(subscriptionId);
    },

    giftSubscription: async (data: GiftSubscriptionInput) => {
      const org = await getRepo().findOrganizationById(data.organization_id);
      if (!org) {
        throw createAppError(404, NotFoundMessages.ORGANIZATION);
      }
      if (!org.is_active) {
        throw createAppError(400, '组织已停用，无法赠送服务');
      }
      if (data.billing_months < 1) {
        throw createAppError(422, '赠送周期至少为 1 个月');
      }

      const giftMonths = data.gift_months ?? 0;
      if (giftMonths < 0) {
        throw createAppError(422, '附加赠送月数不能小于 0');
      }

      const currentSubscriptions = await getRepo().listSubscriptions(0, 1, {
        organization_id: data.organization_id,
      });
      const currentSubscription = currentSubscriptions[0] ?? null;

      if (
        currentSubscription &&
        currentSubscription.status === 'active' &&
        currentSubscription.service_id !== data.service_id
      ) {
        throw createAppError(
          400,
          '当前组织已有生效订阅，赠送仅支持延长当前服务；变更服务请走正常订阅调整流程'
        );
      }

      // 计算原始价格
      let originalAmount = 0;
      if (data.pricing_id) {
        const pricing = await prisma.servicePricing.findFirst({
          where: { id: data.pricing_id, service_id: data.service_id },
        });
        if (pricing) {
          originalAmount = Number(pricing.price);
        }
      } else {
        const pricing = await prisma.servicePricing.findFirst({
          where: { service_id: data.service_id, months: data.billing_months, is_active: true },
        });
        if (pricing) {
          originalAmount = Number(pricing.price);
        } else {
          const monthlyPricing = await prisma.servicePricing.findFirst({
            where: { service_id: data.service_id, months: 1, is_active: true },
          });
          if (monthlyPricing) {
            originalAmount = Number(monthlyPricing.price) * data.billing_months;
          }
        }
      }

      const paidAt = new Date();

      // 创建0元订单并立即标记为已支付
      const orderNo = `ADM${Date.now()}`;
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      // 创建订单记录
      await defaultBillingOrderRepo.create({
        id: ulid().toLowerCase(),
        order_no: orderNo,
        order_type: 'subscription',
        organization: { connect: { id: data.organization_id } },
        service: { connect: { id: data.service_id } },
        pricing: data.pricing_id ? { connect: { id: data.pricing_id } } : undefined,
        billing_months: data.billing_months,
        amount: 0,
        original_amount: originalAmount,
        currency: 'CNY',
        status: 'paid',
        payment_method: 'admin_grant',
        paid_at: paidAt,
        expires_at: expiresAt,
        total_discount: originalAmount,
        total_gift_months: giftMonths,
        applied_discounts: toPrismaInputJsonValue([
          {
            discount_type: 'fixed',
            discount_value: originalAmount,
            gift_months: giftMonths,
            source: 'admin_gift',
          },
        ]),
      });

      // 履行订阅 - 创建或更新subscription
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + data.billing_months + giftMonths);

      const existingSub = await defaultBillingOrderRepo.findSubscriptionByOrgId(data.organization_id);

      if (existingSub) {
        // 更新现有订阅
        const updated = await defaultBillingOrderRepo.updateSubscription(data.organization_id, {
          service: { connect: { id: data.service_id } },
          status: 'active',
          billing_months: data.billing_months,
          start_date: startDate,
          end_date: endDate,
          auto_renew: true,
          next_service: { disconnect: true },
        });
        return updated as unknown as SubscriptionWithRelations;
      } else {
        // 创建新订阅
        const newSub = await defaultBillingOrderRepo.createSubscription({
          id: ulid().toLowerCase(),
          organization: { connect: { id: data.organization_id } },
          service: { connect: { id: data.service_id } },
          billing_months: data.billing_months,
          start_date: startDate,
          end_date: endDate,
          auto_renew: true,
        });
        return newSub as unknown as SubscriptionWithRelations;
      }
    },

    getStats: async () => {
      const [
        organizations_count,
        users_count,
        apartments_count,
        rooms_count,
        active_subscriptions_count,
        monthly_revenue,
      ] = await Promise.all([
        getRepo().countOrganizations(),
        getRepo().countUsersTotal(),
        getRepo().countApartments(),
        getRepo().countRooms(),
        getRepo().countActiveSubscriptions(),
        getRepo().sumMonthlyRevenue(),
      ]);
      return {
        organizations_count,
        users_count,
        apartments_count,
        rooms_count,
        active_subscriptions_count,
        monthly_revenue,
      };
    },

    getAdminIncome: async (year: number, startMonth?: number, endMonth?: number) => {
      const bills = await getRepo().getBillsByYear(year, startMonth, endMonth);

      const byMonth = new Map<
        number,
        {
          total_rent: number;
          total_water: number;
          total_electricity: number;
          total_other: number;
          total_amount: number;
          collected_amount: number;
        }
      >();

      for (const b of bills) {
        const m = b.bill_month;
        if (!byMonth.has(m)) {
          byMonth.set(m, {
            total_rent: 0,
            total_water: 0,
            total_electricity: 0,
            total_other: 0,
            total_amount: 0,
            collected_amount: 0,
          });
        }
        const row = byMonth.get(m)!;
        row.total_rent += Number(b.rent_amount);
        row.total_water += Number(b.water_amount);
        row.total_electricity += Number(b.electricity_amount);
        row.total_other += Number(b.other_amount);
        row.total_amount += Number(b.total_amount);
        row.collected_amount += Number(b.paid_amount);
      }

      const sortedMonths = Array.from(byMonth.entries()).sort((a, b) => a[0] - b[0]);
      return sortedMonths.map(([month, row]) => ({
        period: `${year}-${String(month).padStart(2, '0')}`,
        total_rent: row.total_rent,
        total_water: row.total_water,
        total_electricity: row.total_electricity,
        total_other: row.total_other,
        total_amount: row.total_amount,
        collected_amount: row.collected_amount,
        collection_rate:
          row.total_amount > 0
            ? Math.round((row.collected_amount / row.total_amount) * 1000) / 10
            : 0,
      }));
    },

    getUsagePricing: async () => {
      const pricings = await defaultBillingService.getUsagePricing();
      const result: Record<string, number> = {};
      for (const p of pricings) {
        result[`price_per_${p.unit_type}`] = p.price_per_unit;
      }
      return {
        price_per_org: result.price_per_org ?? 0,
        price_per_apartment: result.price_per_apartment ?? 0,
        price_per_room: result.price_per_room ?? 0,
        price_per_member: result.price_per_member ?? 0,
      };
    },

    updateUsagePricing: async (data: UpdateUsagePricingInput) => {
      const pricing = [];
      if (data.price_per_org !== undefined) {
        pricing.push({ unit_type: 'org', price_per_unit: data.price_per_org });
      }
      if (data.price_per_apartment !== undefined) {
        pricing.push({ unit_type: 'apartment', price_per_unit: data.price_per_apartment });
      }
      if (data.price_per_room !== undefined) {
        pricing.push({ unit_type: 'room', price_per_unit: data.price_per_room });
      }
      if (data.price_per_member !== undefined) {
        pricing.push({ unit_type: 'member', price_per_unit: data.price_per_member });
      }
      if (pricing.length === 0) {
        throw createAppError(400, '至少需要提供一个价格字段');
      }
      await defaultBillingService.updateUsagePricing(pricing);
      return {
        price_per_org: data.price_per_org ?? 0,
        price_per_apartment: data.price_per_apartment ?? 0,
        price_per_room: data.price_per_room ?? 0,
        price_per_member: data.price_per_member ?? 0,
      };
    },

    getPlatformConfig: async () => {
      const row = await getRepo().getPlatformConfig();
      const brand = (row?.brand as Record<string, unknown>) ?? {};
      return {
        app_name: (brand.app_name as string) ?? '公寓管理系统',
        app_description: (brand.app_description as string) ?? '多租户 SaaS 公寓/物业管理系统',
        logo_url: (brand.logo_url as string) ?? '',
        favicon_url: (brand.favicon_url as string) ?? '',
        login_subtitle: (brand.login_subtitle as string) ?? '用户登录，管理公寓、租客与账单',
        register_subtitle: (brand.register_subtitle as string) ?? '创建新账户',
      };
    },

    updatePlatformConfig: async (brand: PlatformBrand) => {
      await getRepo().upsertPlatformConfig(toPrismaInputJsonValue(brand));
      return brand;
    },
  };
}

/**
 * 构建用户查询条件
 */
function buildUserWhere(isActive?: boolean, search?: string): Prisma.UserWhereInput {
  const where: Prisma.UserWhereInput = {};
  if (isActive !== undefined) where.is_active = isActive;
  if (search && search.length > 0) {
    where.OR = [
      { phone: { contains: search, mode: 'insensitive' } },
      { full_name: { contains: search, mode: 'insensitive' } },
    ];
  }
  return where;
}

/**
 * 默认实例
 */
export const defaultAdminService = createAdminService();
