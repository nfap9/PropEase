import type {
  AdminUser,
  User,
  Organization,
  ServiceProduct,
  OrganizationSubscription,
  PlatformConfig,
  Prisma,
} from '@prisma/client';

// 使用 Prisma.InputJsonValue 类型
type InputJsonValue = Prisma.InputJsonValue;
import type { DbClient } from '../types/repository.types.js';
import { prisma } from '../lib/prisma.js';

/**
 * User 包含组织成员信息
 */
export type UserWithOrgs = User & {
  organization_memberships: Array<{
    organization: { id: string; name: string; slug: string };
    role_id: string;
  }>;
};

/**
 * Subscription 包含关联信息
 */
export type SubscriptionWithRelations = OrganizationSubscription & {
  service: ServiceProduct | null;
  organization: Organization | null;
};

type UserWithOrgsRecord = Prisma.UserGetPayload<{
  include: {
    organization_memberships: {
      include: {
        organization: {
          select: { id: true; name: true; slug: true };
        };
      };
    };
  };
}>;

type SubscriptionWithRelationsRecord = Prisma.OrganizationSubscriptionGetPayload<{
  include: { service: true; organization: true };
}>;

/**
 * 用户列表项（部分字段）
 */
export type UserListItem = Pick<User, 'id' | 'phone' | 'full_name' | 'is_active' | 'created_at'>;

/**
 * Admin Repository 接口
 */
export interface AdminRepository {
  // Admin Auth
  findAdminByUsername(username: string): Promise<AdminUser | null>;

  // Admin Users
  findAdminById(id: string): Promise<AdminUser | null>;
  listAdmins(skip?: number, limit?: number): Promise<AdminUser[]>;
  findAdminByUsernameOnly(username: string): Promise<AdminUser | null>;
  createAdmin(data: Prisma.AdminUserCreateInput): Promise<AdminUser>;
  updateAdmin(id: string, data: Prisma.AdminUserUpdateInput): Promise<AdminUser>;
  deleteAdmin(id: string): Promise<void>;

  // Organizations
  listOrganizations(
    skip?: number,
    limit?: number,
    where?: Prisma.OrganizationWhereInput
  ): Promise<Organization[]>;
  findOrganizationById(id: string): Promise<Organization | null>;
  updateOrganizationActive(id: string, active: boolean): Promise<Organization>;

  // Registered Users
  countUsers(where?: Prisma.UserWhereInput): Promise<number>;
  listUsers(skip?: number, limit?: number, where?: Prisma.UserWhereInput): Promise<UserListItem[]>;
  findUserWithOrgs(id: string): Promise<UserWithOrgs | null>;
  findUserById(id: string): Promise<User | null>;
  updateUserActive(id: string, active: boolean): Promise<User>;
  deleteUser(id: string): Promise<void>;

  // Services
  listServices(activeOnly?: boolean): Promise<ServiceProduct[]>;
  findServiceById(id: string): Promise<ServiceProduct | null>;

  // Subscriptions
  listSubscriptions(
    skip?: number,
    limit?: number,
    where?: Prisma.OrganizationSubscriptionWhereInput
  ): Promise<SubscriptionWithRelations[]>;
  findSubscriptionById(id: string): Promise<SubscriptionWithRelations | null>;
  renewSubscription(id: string, endDate: Date): Promise<OrganizationSubscription>;
  cancelSubscription(id: string): Promise<void>;

  // Stats
  countOrganizations(): Promise<number>;
  countUsersTotal(): Promise<number>;
  countApartments(): Promise<number>;
  countRooms(): Promise<number>;
  countActiveSubscriptions(): Promise<number>;
  sumMonthlyRevenue(): Promise<number>;

  // Income Reports
  getBillsByYear(
    year: number,
    startMonth?: number,
    endMonth?: number
  ): Promise<
    Array<{
      bill_month: number;
      rent_amount: Prisma.Decimal | null;
      water_amount: Prisma.Decimal | null;
      electricity_amount: Prisma.Decimal | null;
      other_amount: Prisma.Decimal | null;
      total_amount: Prisma.Decimal | null;
      paid_amount: Prisma.Decimal | null;
    }>
  >;

  // Platform Config
  getPlatformConfig(): Promise<PlatformConfig | null>;
  upsertPlatformConfig(brand: InputJsonValue): Promise<PlatformConfig>;
  updateUsagePricingConfig(usagePricing: InputJsonValue): Promise<PlatformConfig>;
}

/**
 * 创建 Admin Repository 实例
 */
export function createAdminRepository(db: DbClient): AdminRepository {
  return {
    findAdminByUsername: async (username: string) => {
      return db.adminUser.findUnique({
        where: { username },
      });
    },

    findAdminById: async (id: string) => {
      return db.adminUser.findUnique({
        where: { id },
      });
    },

    listAdmins: async (skip?: number, limit?: number) => {
      return db.adminUser.findMany({
        skip,
        take: limit,
        orderBy: [{ is_active: 'desc' }, { created_at: 'desc' }],
      });
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

    listOrganizations: async (
      skip?: number,
      limit?: number,
      where?: Prisma.OrganizationWhereInput
    ) => {
      return db.organization.findMany({
        skip,
        take: limit,
        where,
        orderBy: [{ is_active: 'desc' }, { created_at: 'desc' }],
      });
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
        orderBy: [{ is_active: 'desc' }, { created_at: 'desc' }],
        select: { id: true, phone: true, full_name: true, is_active: true, created_at: true },
      }) as Promise<UserListItem[]>;
    },

    findUserWithOrgs: async (id: string) => {
      const user: UserWithOrgsRecord | null = await db.user.findUnique({
        where: { id },
        include: {
          organization_memberships: {
            include: {
              organization: { select: { id: true, name: true, slug: true } },
            },
          },
        },
      });
      return user;
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

    listServices: async (activeOnly?: boolean) => {
      return db.serviceProduct.findMany({
        where: activeOnly ? { is_active: true } : undefined,
        orderBy: { sort_order: 'asc' },
        include: {
          pricing: {
            orderBy: [{ sort_order: 'asc' }, { months: 'asc' }],
          },
        },
      });
    },

    findServiceById: async (id: string) => {
      return db.serviceProduct.findUnique({ where: { id } });
    },

    listSubscriptions: async (
      skip?: number,
      limit?: number,
      where?: Prisma.OrganizationSubscriptionWhereInput
    ) => {
      const subscriptions: SubscriptionWithRelationsRecord[] =
        await db.organizationSubscription.findMany({
        skip,
        take: limit,
        where,
        orderBy: [{ created_at: 'desc' }],
        include: { service: true, organization: true },
      });
      return subscriptions;
    },

    findSubscriptionById: async (id: string) => {
      const subscription: SubscriptionWithRelationsRecord | null =
        await db.organizationSubscription.findUnique({
        where: { id },
        include: { service: true, organization: true },
      });
      return subscription;
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

    sumMonthlyRevenue: async () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;

      // Get start and end of current month
      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

      const result = await db.billingOrder.aggregate({
        where: {
          status: 'paid',
          paid_at: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
        _sum: { amount: true },
      });

      return Number(result._sum.amount ?? 0);
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

    updateUsagePricingConfig: async (usagePricing: InputJsonValue) => {
      return db.platformConfig.upsert({
        where: { id: 'default' },
        create: { id: 'default', usage_pricing: usagePricing },
        update: { usage_pricing: usagePricing },
      });
    },

    getBillsByYear: async (
      year: number,
      startMonth?: number,
      endMonth?: number
    ) => {
      return db.bill.findMany({
        where: {
          bill_year: year,
          ...(startMonth != null ? { bill_month: { gte: startMonth } } : {}),
          ...(endMonth != null ? { bill_month: { lte: endMonth } } : {}),
        },
        select: {
          bill_month: true,
          rent_amount: true,
          water_amount: true,
          electricity_amount: true,
          other_amount: true,
          total_amount: true,
          paid_amount: true,
        },
      });
    },
  };
}

/**
 * 默认实例
 */
export const defaultAdminRepo = createAdminRepository(prisma);
