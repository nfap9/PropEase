import type { Prisma, BillingOrder, UsageAllowance, ServiceProduct, OrganizationSubscription } from '@prisma/client';
import { ulid } from 'ulid';
import type { DbClient } from '../types/repository.types.js';
import { prisma } from '../lib/prisma.js';

/**
 * BillingOrder 包含关联信息
 */
export type BillingOrderWithRelations = BillingOrder & {
  organization?: { id: string; name: string } | null;
  service?: { id: string; name: string } | null;
  subscription?: { id: string; status: string } | null;
};

/**
 * 订阅包含服务信息
 */
export type SubscriptionWithService = OrganizationSubscription & {
  service: ServiceProduct | null;
};

/**
 * 用量额度记录
 */
export type UsageAllowanceWithOrg = UsageAllowance & {
  organization?: { id: string; name: string } | null;
};

/**
 * 服务产品含定价
 */
export type ServiceProductWithPricing = Prisma.ServiceProductGetPayload<{
  include: { pricing: true };
}>;

/**
 * Billing Order Repository 接口
 */
export interface BillingOrderRepository {
  // 订单基础操作
  findById(id: string): Promise<BillingOrder | null>;
  findByOrderNo(orderNo: string): Promise<BillingOrder | null>;
  findByIdWithRelations(id: string): Promise<BillingOrderWithRelations | null>;
  create(data: Prisma.BillingOrderCreateInput): Promise<BillingOrder>;
  update(id: string, data: Prisma.BillingOrderUpdateInput): Promise<BillingOrder>;

  // 订单列表查询
  findByOrganization(orgId: string, limit?: number): Promise<BillingOrder[]>;
  findByUser(userId: string, limit?: number): Promise<BillingOrder[]>;
  findByType(type: 'subscription' | 'usage', limit?: number): Promise<BillingOrder[]>;
  findAll(filters: {
    orderType?: 'subscription' | 'usage';
    organizationId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ orders: BillingOrderWithRelations[]; total: number }>;

  // 用量额度操作
  upsertAllowance(
    orgId: string,
    year: number,
    month: number,
    data: { orgs?: number; apartments?: number; rooms?: number; members?: number }
  ): Promise<UsageAllowance>;
  findAllowance(orgId: string, year: number, month: number): Promise<UsageAllowance | null>;
  findAllowancesByOrg(orgId: string): Promise<UsageAllowance[]>;

  // 订阅操作
  findActiveServices(activeOnly?: boolean): Promise<ServiceProduct[]>;
  findActiveServicesWithPricing(activeOnly?: boolean): Promise<ServiceProductWithPricing[]>;
  findServiceById(id: string): Promise<ServiceProduct | null>;
  findServiceByIdWithPricing(id: string): Promise<ServiceProductWithPricing | null>;
  findSubscriptionByOrgId(orgId: string): Promise<SubscriptionWithService | null>;
  createSubscription(data: Prisma.OrganizationSubscriptionCreateInput): Promise<OrganizationSubscription>;
  updateSubscription(orgId: string, data: Prisma.OrganizationSubscriptionUpdateInput): Promise<OrganizationSubscription>;
}

/**
 * 创建 BillingOrder Repository 实例
 */
export function createBillingOrderRepository(db: DbClient): BillingOrderRepository {
  return {
    findById: async (id: string) => {
      return db.billingOrder.findFirst({ where: { id } });
    },

    findByOrderNo: async (orderNo: string) => {
      return db.billingOrder.findFirst({ where: { order_no: orderNo } });
    },

    findByIdWithRelations: async (id: string) => {
      return db.billingOrder.findFirst({
        where: { id },
        include: {
          organization: { select: { id: true, name: true } },
          service: { select: { id: true, name: true } },
          subscription: { select: { id: true, status: true } },
        },
      });
    },

    create: async (data: Prisma.BillingOrderCreateInput) => {
      return db.billingOrder.create({ data });
    },

    update: async (id: string, data: Prisma.BillingOrderUpdateInput) => {
      return db.billingOrder.update({ where: { id }, data });
    },

    findByOrganization: async (orgId: string, limit?: number) => {
      return db.billingOrder.findMany({
        where: { organization_id: orgId },
        orderBy: { created_at: 'desc' },
        take: limit,
      });
    },

    findByUser: async (userId: string, limit?: number) => {
      return db.billingOrder.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
        take: limit,
      });
    },

    findByType: async (type: 'subscription' | 'usage', limit?: number) => {
      return db.billingOrder.findMany({
        where: { order_type: type },
        orderBy: { created_at: 'desc' },
        take: limit,
      });
    },

    findAll: async (filters) => {
      const { orderType, organizationId, status, limit = 50, offset = 0 } = filters;

      const where: Prisma.BillingOrderWhereInput = {};
      if (orderType) where.order_type = orderType;
      if (organizationId) where.organization_id = organizationId;
      if (status) where.status = status;

      const [orders, total] = await Promise.all([
        db.billingOrder.findMany({
          where,
          include: {
            organization: { select: { id: true, name: true } },
            service: { select: { id: true, name: true } },
            subscription: { select: { id: true, status: true } },
          },
          orderBy: { created_at: 'desc' },
          take: limit,
          skip: offset,
        }),
        db.billingOrder.count({ where }),
      ]);

      return { orders, total };
    },

    upsertAllowance: async (orgId, year, month, data) => {
      const existing = await db.usageAllowance.findUnique({
        where: { organization_id_year_month: { organization_id: orgId, year, month } },
      });

      if (existing) {
        return db.usageAllowance.update({
          where: { organization_id_year_month: { organization_id: orgId, year, month } },
          data: {
            ...(data.orgs !== undefined && { orgs: data.orgs }),
            ...(data.apartments !== undefined && { apartments: data.apartments }),
            ...(data.rooms !== undefined && { rooms: data.rooms }),
            ...(data.members !== undefined && { members: data.members }),
          },
        });
      }

      return db.usageAllowance.create({
        data: {
          id: ulid().toLowerCase(),
          organization: { connect: { id: orgId } },
          year,
          month,
          orgs: data.orgs ?? 0,
          apartments: data.apartments ?? 0,
          rooms: data.rooms ?? 0,
          members: data.members ?? 0,
        },
      });
    },

    findAllowance: async (orgId, year, month) => {
      return db.usageAllowance.findUnique({
        where: { organization_id_year_month: { organization_id: orgId, year, month } },
      });
    },

    findAllowancesByOrg: async (orgId) => {
      return db.usageAllowance.findMany({
        where: { organization_id: orgId },
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
      });
    },

    findActiveServices: async (activeOnly = true) => {
      return db.serviceProduct.findMany({
        where: activeOnly ? { is_active: true } : {},
        orderBy: { sort_order: 'asc' },
      });
    },

    findActiveServicesWithPricing: async (activeOnly = true) => {
      return db.serviceProduct.findMany({
        where: activeOnly ? { is_active: true } : {},
        include: { pricing: true },
        orderBy: { sort_order: 'asc' },
      });
    },

    findServiceById: async (id) => {
      return db.serviceProduct.findFirst({ where: { id } });
    },

    findServiceByIdWithPricing: async (id) => {
      return db.serviceProduct.findFirst({
        where: { id },
        include: { pricing: true },
      });
    },

    findSubscriptionByOrgId: async (orgId) => {
      return db.organizationSubscription.findFirst({
        where: { organization_id: orgId },
        include: { service: true },
      });
    },

    createSubscription: async (data) => {
      return db.organizationSubscription.create({ data });
    },

    updateSubscription: async (orgId, data) => {
      return db.organizationSubscription.update({
        where: { organization_id: orgId },
        data,
      });
    },
  };
}

/**
 * 默认实例
 */
export const defaultBillingOrderRepo = createBillingOrderRepository(prisma);
