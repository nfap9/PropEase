import type {
  AdminUser,
  AdminRole,
  User,
  Organization,
  SubscriptionPlan,
  OrganizationSubscription,
  UsagePricing,
  UsageQuotaOrder,
  Prisma,
} from '../generated/client/index.js';

// 使用 Prisma.InputJsonValue 类型
type InputJsonValue = Prisma.InputJsonValue;
import type {
  AdminRepository,
  AdminUserWithRole,
  SubscriptionWithRelations,
} from '../repositories/admin.repo.js';
import { defaultAdminRepo } from '../repositories/admin.repo.js';
import { createAppError } from '../utils/appError.js';
import { NotFoundMessages } from '../messages.js';
import { hashPassword, verifyPassword } from '../utils/security.js';
import { createAdminAccessToken } from '../utils/jwt.js';
import { ulid } from 'ulid';

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
  role_id: string;
}

/**
 * 更新管理员输入
 */
export interface UpdateAdminUserInput {
  name?: string;
  email?: string;
  role_id?: string;
  is_active?: boolean;
}

/**
 * 创建角色输入
 */
export interface CreateAdminRoleInput {
  name: string;
  permissions?: string[] | Record<string, unknown>;
  is_system?: boolean;
}

/**
 * 更新角色输入
 */
export interface UpdateAdminRoleInput {
  name?: string;
  permissions?: string[] | Record<string, unknown>;
}

/**
 * 创建套餐输入
 */
export interface CreatePlanInput {
  name: string;
  code: string;
  price_monthly: number;
  price_yearly?: number;
  max_organizations?: number | null;
  max_apartments?: number;
  max_rooms?: number;
  max_members?: number;
  rooms_count_scope?: 'organization' | 'user';
  members_count_scope?: 'organization' | 'user';
  is_active?: boolean;
  sort_order?: number;
  free_validity_days?: number | null;
}

/**
 * 更新套餐输入
 */
export type UpdatePlanInput = Partial<CreatePlanInput>;

/**
 * 使用量定价更新输入
 */
export interface UpdateUsagePricingInput {
  price_per_org?: number;
  price_per_apartment?: number;
  price_per_room?: number;
  price_per_member?: number;
  is_active?: boolean;
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
}

/**
 * Admin Service 接口
 */
export interface AdminService {
  // Auth
  login(username: string, password: string): Promise<AdminLoginResult>;

  // Admin Users
  getMe(adminId: string): Promise<AdminUserWithRole>;
  listAdmins(skip?: number, limit?: number): Promise<AdminUserWithRole[]>;
  createAdminUser(data: CreateAdminUserInput): Promise<AdminUser>;
  getAdminUser(userId: string): Promise<AdminUserWithRole>;
  updateAdminUser(userId: string, data: UpdateAdminUserInput): Promise<AdminUser>;
  deleteAdminUser(userId: string): Promise<void>;
  resetAdminPassword(userId: string, newPassword: string): Promise<void>;

  // Admin Roles
  listAdminRoles(): Promise<AdminRole[]>;
  getAdminRole(roleId: string): Promise<AdminRole>;
  createAdminRole(data: CreateAdminRoleInput): Promise<AdminRole>;
  updateAdminRole(roleId: string, data: UpdateAdminRoleInput): Promise<AdminRole>;
  deleteAdminRole(roleId: string): Promise<void>;

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

  // Plans
  listPlans(activeOnly?: boolean): Promise<SubscriptionPlan[]>;
  getPlan(planId: string): Promise<SubscriptionPlan>;
  createPlan(data: CreatePlanInput): Promise<SubscriptionPlan>;
  updatePlan(planId: string, data: UpdatePlanInput): Promise<SubscriptionPlan>;
  deletePlan(planId: string): Promise<void>;

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

  // Stats
  getStats(): Promise<AdminStats>;

  // Usage Pricing
  getUsagePricing(): Promise<UsagePricing>;
  updateUsagePricing(data: UpdateUsagePricingInput): Promise<UsagePricing>;

  // Usage Orders
  listUsageOrders(
    skip?: number,
    limit?: number
  ): Promise<
    Array<
      UsageQuotaOrder & {
        user: { id: string; phone: string | null; full_name: string | null } | null;
      }
    >
  >;

  // Platform Config
  getPlatformConfig(): Promise<PlatformBrand>;
  updatePlatformConfig(brand: PlatformBrand): Promise<PlatformBrand>;
}

/**
 * 创建 Admin Service 实例
 */
export function createAdminService(
  getRepo: () => AdminRepository = () => defaultAdminRepo
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
      const ok = await verifyPassword(password, admin.password_hash);
      if (!ok) {
        throw createAppError(401, '用户名或密码错误');
      }
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
      const role = await getRepo().findAdminRoleById(data.role_id);
      if (!role) {
        throw createAppError(404, NotFoundMessages.ROLE);
      }
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
        role: { connect: { id: data.role_id } },
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
      if (data.role_id != null) {
        const role = await getRepo().findAdminRoleById(data.role_id);
        if (!role) {
          throw createAppError(404, NotFoundMessages.ROLE);
        }
        updateData.role = { connect: { id: data.role_id } };
      }
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

    listAdminRoles: async () => {
      return getRepo().listAdminRoles();
    },

    getAdminRole: async (roleId: string) => {
      const role = await getRepo().findAdminRoleById(roleId);
      if (!role) {
        throw createAppError(404, NotFoundMessages.ROLE);
      }
      return role;
    },

    createAdminRole: async (data: CreateAdminRoleInput) => {
      const permissions = Array.isArray(data.permissions)
        ? data.permissions
        : (data.permissions ?? []);
      return getRepo().createAdminRole({
        id: ulid().toLowerCase(),
        name: data.name,
        permissions: permissions as unknown as Prisma.InputJsonValue,
        is_system: data.is_system ?? false,
      });
    },

    updateAdminRole: async (roleId: string, data: UpdateAdminRoleInput) => {
      const existing = await getRepo().findAdminRoleById(roleId);
      if (!existing) {
        throw createAppError(404, NotFoundMessages.ROLE);
      }
      const updateData: Prisma.AdminRoleUpdateInput = {};
      if (data.name != null) updateData.name = data.name;
      if (data.permissions !== undefined) {
        updateData.permissions = data.permissions as unknown as Prisma.InputJsonValue;
      }
      return getRepo().updateAdminRole(roleId, updateData);
    },

    deleteAdminRole: async (roleId: string) => {
      const existing = await getRepo().findAdminRoleWithUsers(roleId);
      if (!existing) {
        throw createAppError(404, NotFoundMessages.ROLE);
      }
      if (existing.is_system) {
        throw createAppError(400, '系统角色不可删除');
      }
      if (existing.users.length > 0) {
        throw createAppError(400, '该角色下仍有用户，无法删除');
      }
      await getRepo().deleteAdminRole(roleId);
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
          role: m.role,
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

    listPlans: async (activeOnly?: boolean) => {
      return getRepo().listPlans(activeOnly);
    },

    getPlan: async (planId: string) => {
      const plan = await getRepo().findPlanById(planId);
      if (!plan) {
        throw createAppError(404, NotFoundMessages.PLAN);
      }
      return plan;
    },

    createPlan: async (data: CreatePlanInput) => {
      return getRepo().createPlan({
        id: ulid().toLowerCase(),
        name: data.name,
        code: data.code,
        price_monthly: data.price_monthly,
        price_yearly: data.price_yearly ?? data.price_monthly,
        max_organizations: data.max_organizations,
        max_apartments: data.max_apartments ?? 1,
        max_rooms: data.max_rooms ?? 100,
        max_members: data.max_members ?? 1,
        rooms_count_scope: data.rooms_count_scope ?? 'organization',
        members_count_scope: data.members_count_scope ?? 'organization',
        is_active: data.is_active ?? true,
        sort_order: data.sort_order ?? 0,
        free_validity_days: data.free_validity_days,
      });
    },

    updatePlan: async (planId: string, data: UpdatePlanInput) => {
      const existing = await getRepo().findPlanById(planId);
      if (!existing) {
        throw createAppError(404, NotFoundMessages.PLAN);
      }
      const isFree = existing.code === 'free';
      const updateData: Prisma.SubscriptionPlanUpdateInput = {};
      if (data.name != null) updateData.name = data.name;
      if (data.code != null) updateData.code = data.code;
      if (!isFree) {
        if (data.price_monthly != null) updateData.price_monthly = data.price_monthly;
        if (data.price_yearly != null) updateData.price_yearly = data.price_yearly;
      }
      if (data.max_organizations !== undefined)
        updateData.max_organizations = data.max_organizations;
      if (data.max_apartments != null) updateData.max_apartments = data.max_apartments;
      if (data.max_rooms != null) updateData.max_rooms = data.max_rooms;
      if (data.max_members != null) updateData.max_members = data.max_members;
      if (data.rooms_count_scope != null) updateData.rooms_count_scope = data.rooms_count_scope;
      if (data.members_count_scope != null)
        updateData.members_count_scope = data.members_count_scope;
      if (data.is_active !== undefined) updateData.is_active = data.is_active;
      if (data.sort_order != null) updateData.sort_order = data.sort_order;
      if (data.free_validity_days !== undefined)
        updateData.free_validity_days = data.free_validity_days;
      return getRepo().updatePlan(planId, updateData);
    },

    deletePlan: async (planId: string) => {
      const existing = await getRepo().findPlanById(planId);
      if (!existing) {
        throw createAppError(404, NotFoundMessages.PLAN);
      }
      await getRepo().deletePlan(planId);
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

    getStats: async () => {
      const [
        organizations_count,
        users_count,
        apartments_count,
        rooms_count,
        active_subscriptions_count,
      ] = await Promise.all([
        getRepo().countOrganizations(),
        getRepo().countUsersTotal(),
        getRepo().countApartments(),
        getRepo().countRooms(),
        getRepo().countActiveSubscriptions(),
      ]);
      return {
        organizations_count,
        users_count,
        apartments_count,
        rooms_count,
        active_subscriptions_count,
      };
    },

    getUsagePricing: async () => {
      const pricing = await getRepo().findActiveUsagePricing();
      if (!pricing) {
        throw createAppError(404, '按量定价未配置');
      }
      return pricing;
    },

    updateUsagePricing: async (data: UpdateUsagePricingInput) => {
      let pricing = await getRepo().findActiveUsagePricing();
      if (!pricing) {
        pricing = await getRepo().createUsagePricing({
          id: ulid().toLowerCase(),
          price_per_org: data.price_per_org ?? 0,
          price_per_apartment: data.price_per_apartment ?? 0,
          price_per_room: data.price_per_room ?? 0,
          price_per_member: data.price_per_member ?? 0,
          is_active: data.is_active ?? true,
        });
        return pricing;
      }
      const updateData: Prisma.UsagePricingUpdateInput = {};
      if (data.price_per_org !== undefined) updateData.price_per_org = data.price_per_org;
      if (data.price_per_apartment !== undefined)
        updateData.price_per_apartment = data.price_per_apartment;
      if (data.price_per_room !== undefined) updateData.price_per_room = data.price_per_room;
      if (data.price_per_member !== undefined) updateData.price_per_member = data.price_per_member;
      if (data.is_active !== undefined) updateData.is_active = data.is_active;
      return getRepo().updateUsagePricing(pricing.id, updateData);
    },

    listUsageOrders: async (skip?: number, limit?: number) => {
      return getRepo().listUsageOrders(skip, limit);
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
      await getRepo().upsertPlatformConfig(brand as unknown as InputJsonValue);
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
