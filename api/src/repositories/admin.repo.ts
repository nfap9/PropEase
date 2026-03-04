import type { AdminUser, AdminRole, User, Organization, SubscriptionPlan, OrganizationSubscription, UsagePricing, UsageQuotaOrder, PlatformConfig, Prisma } from '@prisma/client';
import type { InputJsonValue } from '@prisma/client/runtime/library.js';
import type { DbClient } from '../types/repository.types.js';
import { prisma } from '../lib/prisma.js';

/**
 * AdminUser 包含角色信息
 */
export type AdminUserWithRole = AdminUser & { role: AdminRole | null };

/**
 * User 包含组织成员信息
 */
export type UserWithOrgs = User & {
  organization_memberships: Array<{
    organization: { id: string; name: string; slug: string };
    role: string;
  }>;
};

/**
 * Subscription 包含关联信息
 */
export type SubscriptionWithRelations = OrganizationSubscription & {
  plan: SubscriptionPlan | null;
  organization: Organization | null;
};

/**
 * 用户列表项（部分字段）
 */
export type UserListItem = Pick<User, 'id' | 'phone' | 'full_name' | 'is_active' | 'created_at'>;

/**
 * Admin Repository 接口
 */
export interface AdminRepository {
  // Admin Auth
  findAdminByUsername(username: string): Promise<AdminUserWithRole | null>;

  // Admin Users
  findAdminById(id: string): Promise<AdminUserWithRole | null>;
  listAdmins(skip?: number, limit?: number): Promise<AdminUserWithRole[]>;
  findAdminByUsernameOnly(username: string): Promise<AdminUser | null>;
  createAdmin(data: Prisma.AdminUserCreateInput): Promise<AdminUser>;
  updateAdmin(id: string, data: Prisma.AdminUserUpdateInput): Promise<AdminUser>;
  deleteAdmin(id: string): Promise<void>;

  // Admin Roles
  findAdminRoleById(id: string): Promise<AdminRole | null>;
  listAdminRoles(): Promise<AdminRole[]>;
  createAdminRole(data: Prisma.AdminRoleCreateInput): Promise<AdminRole>;
  updateAdminRole(id: string, data: Prisma.AdminRoleUpdateInput): Promise<AdminRole>;
  deleteAdminRole(id: string): Promise<void>;
  findAdminRoleWithUsers(id: string): Promise<AdminRole & { users: AdminUser[] } | null>;

  // Organizations
  listOrganizations(skip?: number, limit?: number, where?: Prisma.OrganizationWhereInput): Promise<Organization[]>;
  findOrganizationById(id: string): Promise<Organization | null>;
  updateOrganizationActive(id: string, active: boolean): Promise<Organization>;

  // Registered Users
  countUsers(where?: Prisma.UserWhereInput): Promise<number>;
  listUsers(skip?: number, limit?: number, where?: Prisma.UserWhereInput): Promise<UserListItem[]>;
  findUserWithOrgs(id: string): Promise<UserWithOrgs | null>;
  findUserById(id: string): Promise<User | null>;
  updateUserActive(id: string, active: boolean): Promise<User>;
  deleteUser(id: string): Promise<void>;

  // Plans
  listPlans(activeOnly?: boolean): Promise<SubscriptionPlan[]>;
  findPlanById(id: string): Promise<SubscriptionPlan | null>;
  createPlan(data: Prisma.SubscriptionPlanCreateInput): Promise<SubscriptionPlan>;
  updatePlan(id: string, data: Prisma.SubscriptionPlanUpdateInput): Promise<SubscriptionPlan>;
  deletePlan(id: string): Promise<void>;

  // Subscriptions
  listSubscriptions(skip?: number, limit?: number, where?: Prisma.OrganizationSubscriptionWhereInput): Promise<SubscriptionWithRelations[]>;
  findSubscriptionById(id: string): Promise<SubscriptionWithRelations | null>;
  renewSubscription(id: string, endDate: Date): Promise<OrganizationSubscription>;
  cancelSubscription(id: string): Promise<void>;

  // Stats
  countOrganizations(): Promise<number>;
  countUsersTotal(): Promise<number>;
  countApartments(): Promise<number>;
  countRooms(): Promise<number>;
  countActiveSubscriptions(): Promise<number>;

  // Usage Pricing
  findActiveUsagePricing(): Promise<UsagePricing | null>;
  createUsagePricing(data: Prisma.UsagePricingCreateInput): Promise<UsagePricing>;
  updateUsagePricing(id: string, data: Prisma.UsagePricingUpdateInput): Promise<UsagePricing>;

  // Usage Orders
  listUsageOrders(skip?: number, limit?: number): Promise<Array<UsageQuotaOrder & { user: { id: string; phone: string | null; full_name: string | null } | null }>>;

  // Platform Config
  getPlatformConfig(): Promise<PlatformConfig | null>;
  upsertPlatformConfig(brand: InputJsonValue): Promise<PlatformConfig>;
}

/**
 * 创建 Admin Repository 实例
 */
export function createAdminRepository(db: DbClient): AdminRepository {
  return {
    findAdminByUsername: async (username: string) => {
      return db.adminUser.findUnique({
        where: { username },
        include: { role: true },
      }) as Promise<AdminUserWithRole | null>;
    },

    findAdminById: async (id: string) => {
      return db.adminUser.findUnique({
        where: { id },
        include: { role: true },
      }) as Promise<AdminUserWithRole | null>;
    },

    listAdmins: async (skip?: number, limit?: number) => {
      return db.adminUser.findMany({
        skip,
        take: limit,
        include: { role: true },
      }) as Promise<AdminUserWithRole[]>;
    },

    findAdminByUsernameOnly: async (username: string) => {
      return db.adminUser.findUnique({ where: { username } });
    },

    createAdmin: async (data: Prisma.AdminUserCreateInput) => {
      return db.adminUser.create({ data });
    },

    updateAdmin: async (id: string, data: Prisma.AdminUserUpdateInput) => {
      return db.adminUser.update({ where: { id }, data });
    },

    deleteAdmin: async (id: string) => {
      await db.adminUser.delete({ where: { id } });
    },

    findAdminRoleById: async (id: string) => {
      return db.adminRole.findUnique({ where: { id } });
    },

    listAdminRoles: async () => {
      return db.adminRole.findMany();
    },

    createAdminRole: async (data: Prisma.AdminRoleCreateInput) => {
      return db.adminRole.create({ data });
    },

    updateAdminRole: async (id: string, data: Prisma.AdminRoleUpdateInput) => {
      return db.adminRole.update({ where: { id }, data });
    },

    deleteAdminRole: async (id: string) => {
      await db.adminRole.delete({ where: { id } });
    },

    findAdminRoleWithUsers: async (id: string) => {
      return db.adminRole.findUnique({
        where: { id },
        include: { users: true },
      });
    },

    listOrganizations: async (skip?: number, limit?: number, where?: Prisma.OrganizationWhereInput) => {
      return db.organization.findMany({ skip, take: limit, where });
    },

    findOrganizationById: async (id: string) => {
      return db.organization.findUnique({ where: { id } });
    },

    updateOrganizationActive: async (id: string, active: boolean) => {
      return db.organization.update({
        where: { id },
        data: { is_active: active },
      });
    },

    countUsers: async (where?: Prisma.UserWhereInput) => {
      return db.user.count({ where });
    },

    listUsers: async (skip?: number, limit?: number, where?: Prisma.UserWhereInput) => {
      return db.user.findMany({
        skip,
        take: limit,
        where,
        select: { id: true, phone: true, full_name: true, is_active: true, created_at: true },
      }) as Promise<UserListItem[]>;
    },

    findUserWithOrgs: async (id: string) => {
      return db.user.findUnique({
        where: { id },
        include: {
          organization_memberships: {
            include: {
              organization: { select: { id: true, name: true, slug: true } },
            },
          },
        },
      }) as Promise<UserWithOrgs | null>;
    },

    findUserById: async (id: string) => {
      return db.user.findUnique({ where: { id } });
    },

    updateUserActive: async (id: string, active: boolean) => {
      return db.user.update({
        where: { id },
        data: { is_active: active },
      });
    },

    deleteUser: async (id: string) => {
      await db.user.delete({ where: { id } });
    },

    listPlans: async (activeOnly?: boolean) => {
      return db.subscriptionPlan.findMany({
        where: activeOnly ? { is_active: true } : undefined,
        orderBy: { sort_order: 'asc' },
      });
    },

    findPlanById: async (id: string) => {
      return db.subscriptionPlan.findUnique({ where: { id } });
    },

    createPlan: async (data: Prisma.SubscriptionPlanCreateInput) => {
      return db.subscriptionPlan.create({ data });
    },

    updatePlan: async (id: string, data: Prisma.SubscriptionPlanUpdateInput) => {
      return db.subscriptionPlan.update({ where: { id }, data });
    },

    deletePlan: async (id: string) => {
      await db.subscriptionPlan.delete({ where: { id } });
    },

    listSubscriptions: async (skip?: number, limit?: number, where?: Prisma.OrganizationSubscriptionWhereInput) => {
      return db.organizationSubscription.findMany({
        skip,
        take: limit,
        where,
        include: { plan: true, organization: true },
      }) as Promise<SubscriptionWithRelations[]>;
    },

    findSubscriptionById: async (id: string) => {
      return db.organizationSubscription.findUnique({
        where: { id },
        include: { plan: true, organization: true },
      }) as Promise<SubscriptionWithRelations | null>;
    },

    renewSubscription: async (id: string, endDate: Date) => {
      return db.organizationSubscription.update({
        where: { id },
        data: { end_date: endDate, status: 'active' },
      });
    },

    cancelSubscription: async (id: string) => {
      await db.organizationSubscription.update({
        where: { id },
        data: { status: 'cancelled' },
      });
    },

    countOrganizations: async () => {
      return db.organization.count();
    },

    countUsersTotal: async () => {
      return db.user.count();
    },

    countApartments: async () => {
      return db.apartment.count();
    },

    countRooms: async () => {
      return db.room.count();
    },

    countActiveSubscriptions: async () => {
      return db.organizationSubscription.count({
        where: {
          status: 'active',
          OR: [
            { end_date: null },
            { end_date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
          ],
        },
      });
    },

    findActiveUsagePricing: async () => {
      return db.usagePricing.findFirst({ where: { is_active: true } });
    },

    createUsagePricing: async (data: Prisma.UsagePricingCreateInput) => {
      return db.usagePricing.create({ data });
    },

    updateUsagePricing: async (id: string, data: Prisma.UsagePricingUpdateInput) => {
      return db.usagePricing.update({ where: { id }, data });
    },

    listUsageOrders: async (skip?: number, limit?: number) => {
      return db.usageQuotaOrder.findMany({
        skip,
        take: limit ?? 50,
        orderBy: { created_at: 'desc' },
        include: { user: { select: { id: true, phone: true, full_name: true } } },
      });
    },

    getPlatformConfig: async () => {
      return db.platformConfig.findUnique({ where: { id: 'default' } });
    },

    upsertPlatformConfig: async (brand: InputJsonValue) => {
      return db.platformConfig.upsert({
        where: { id: 'default' },
        create: { id: 'default', brand },
        update: { brand },
      });
    },
  };
}

/**
 * 默认实例
 */
export const defaultAdminRepo = createAdminRepository(prisma);
