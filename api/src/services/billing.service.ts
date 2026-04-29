import type { BillingOrder, UsageUnitPricing, ServiceProduct as PrismaServiceProduct, OrganizationSubscription } from '@prisma/client';
import { ulid } from 'ulid';
import { createBillingOrderRepository, type BillingOrderRepository } from '../repositories/billing-order.repo.js';
import { createAppError } from '../utils/appError.js';
import { NotFoundMessages } from '../messages.js';
import { prisma } from '../lib/prisma.js';
import { createWechatPayNativeOrder } from './wechatPayNative.js';
import { isSubscriptionActive } from '../utils/subscription.js';
import type { SubscriptionStatus, ServiceProduct } from '@apartment-ultra/api-contract';

/**
 * 订单类型
 */
export type OrderType = 'subscription' | 'usage';

/**
 * 订阅订单创建参数
 */
export interface CreateSubscriptionOrderParams {
  organizationId: string;
  serviceId: string;
  pricingId?: string;
  billingMonths?: number;
  credit?: number; // 抵扣金额（升级时旧服务剩余价值）
}

/**
 * 用量订单创建参数
 */
export interface CreateUsageOrderParams {
  userId: string;
  organizationId: string;
  usageDetails: {
    orgs: number;
    apartments: number;
    rooms: number;
    members: number;
  };
}

/**
 * 统一订单响应
 */
export interface BillingOrderResponse {
  id: string;
  order_no: string;
  order_type: string;
  organization_id: string | null;
  user_id: string | null;
  service_id: string | null;
  pricing_id: string | null;
  billing_months: number | null;
  usage_details: Record<string, unknown> | null;
  amount: number;
  original_amount: number | null;
  currency: string;
  status: string;
  payment_method: string;
  code_url: string | null;
  wechat_transaction_id: string | null;
  paid_at: string | null;
  expires_at: string;
  created_at: string;
}

/**
 * 用量单价信息
 */
export interface UsageUnitPricingInfo {
  unit_type: string;
  price_per_unit: number;
  is_active: boolean;
}

/**
 * Billing Service 接口
 */
export interface BillingService {
  // 订单操作
  createSubscriptionOrder(params: CreateSubscriptionOrderParams): Promise<BillingOrderResponse>;
  createUsageOrder(params: CreateUsageOrderParams): Promise<BillingOrderResponse>;
  getOrder(orderId: string): Promise<BillingOrderResponse | null>;
  getOrderByOrderNo(orderNo: string): Promise<BillingOrder | null>;
  updateOrderStatus(orderId: string, status: string, wechatTransactionId?: string): Promise<BillingOrder>;
  updateOrderCodeUrl(orderId: string, codeUrl: string): Promise<BillingOrder>;
  listOrders(filters: {
    orderType?: OrderType;
    organizationId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ orders: BillingOrderResponse[]; total: number }>;

  // 用量单价操作
  getUsagePricing(): Promise<UsageUnitPricingInfo[]>;
  updateUsagePricing(pricing: {
    unit_type: string;
    price_per_unit: number;
  }[]): Promise<void>;

  // 用量额度操作
  getUsageAllowance(orgId: string, year: number, month: number): Promise<{
    orgs: number;
    apartments: number;
    rooms: number;
    members: number;
  }>;
  fulfillUsageAllowance(orderId: string, orgId: string): Promise<void>;

  // 订阅管理
  listServices(activeOnly?: boolean): Promise<PrismaServiceProduct[]>;
  getServiceById(id: string): Promise<PrismaServiceProduct>;
  getSubscription(orgId: string): Promise<OrganizationSubscription | null>;
  getSubscriptionStatus(orgId: string): Promise<SubscriptionStatus>;
  subscribe(orgId: string, serviceId: string, billingMonths?: number, autoRenew?: boolean): Promise<OrganizationSubscription>;
  updateSubscription(orgId: string, serviceId: string, effective: 'immediate' | 'next_cycle'): Promise<OrganizationSubscription>;
  cancelSubscription(orgId: string, reason?: string): Promise<void>;
}

/**
 * 创建 Billing Service 实例
 */
export function createBillingService(
  getRepo: () => BillingOrderRepository = () => createBillingOrderRepository(prisma)
): BillingService {
  return {
    createSubscriptionOrder: async (params) => {
      const { organizationId, serviceId, pricingId, billingMonths = 1, credit = 0 } = params;

      // 获取服务产品
      const service = await prisma.serviceProduct.findFirst({ where: { id: serviceId } });
      if (!service) {
        throw createAppError(404, '服务不存在');
      }
      if (service.code === 'free') {
        throw createAppError(400, '免费服务无需购买');
      }

      // 计算价格
      let amount = 0;
      let selectedPricingId = pricingId;

      if (pricingId) {
        const pricing = await prisma.servicePricing.findFirst({ where: { id: pricingId, service_id: serviceId } });
        if (pricing) {
          amount = Number(pricing.price);
        } else {
          throw createAppError(400, '定价不存在');
        }
      } else {
        // 按月数查找定价
        const pricing = await prisma.servicePricing.findFirst({
          where: { service_id: serviceId, months: billingMonths, is_active: true },
        });
        if (pricing) {
          amount = Number(pricing.price);
          selectedPricingId = pricing.id;
        } else {
          // 如果没有找到对应周期的定价，使用月价 * 月数
          const monthlyPricing = await prisma.servicePricing.findFirst({
            where: { service_id: serviceId, months: 1, is_active: true },
          });
          if (monthlyPricing) {
            amount = Number(monthlyPricing.price) * billingMonths;
          } else {
            throw createAppError(400, '未找到合适的定价');
          }
        }
      }

      // 应用抵扣金额
      const originalAmount = amount;
      amount = Math.max(0, amount - credit);

      const orderNo = `SUB${Date.now()}`;
      const expires = new Date();
      expires.setHours(expires.getHours() + 2);

      const order = await getRepo().create({
        id: ulid().toLowerCase(),
        order_no: orderNo,
        order_type: 'subscription',
        organization: { connect: { id: organizationId } },
        service: { connect: { id: serviceId } },
        pricing: selectedPricingId ? { connect: { id: selectedPricingId } } : undefined,
        billing_months: billingMonths,
        amount,
        original_amount: originalAmount,
        total_discount: credit > 0 ? credit : undefined,
        currency: 'CNY',
        status: 'pending',
        payment_method: 'wechat_native',
        expires_at: expires,
      });

      // 创建微信支付订单
      const wechatResult = await createWechatPayNativeOrder({
        out_trade_no: orderNo,
        description: `订阅服务-${service.name}`,
        amount_yuan: amount,
        time_expire: expires.toISOString(),
      });

      if (wechatResult?.code_url) {
        await getRepo().update(order.id, { code_url: wechatResult.code_url });
        order.code_url = wechatResult.code_url;
      }

      return toOrderResponse(order);
    },

    createUsageOrder: async (params) => {
      const { userId, organizationId, usageDetails } = params;
      const { orgs, apartments, rooms, members } = usageDetails;

      if (orgs === 0 && apartments === 0 && rooms === 0 && members === 0) {
        throw createAppError(400, '至少选择一种对象数量');
      }

      // 获取用量单价
      const activePricings = await prisma.usageUnitPricing.findMany({
        where: { is_active: true, valid_to: null },
        orderBy: { valid_from: 'desc' },
      });

      if (activePricings.length === 0) {
        throw createAppError(400, '按量定价未配置');
      }

      // 按 unit_type 聚合最新的单价
      const latestPricingMap = new Map<string, number>();
      for (const p of activePricings) {
        if (!latestPricingMap.has(p.unit_type)) {
          latestPricingMap.set(p.unit_type, Number(p.price_per_unit));
        }
      }

      const amount =
        (latestPricingMap.get('org') ?? 0) * orgs +
        (latestPricingMap.get('apartment') ?? 0) * apartments +
        (latestPricingMap.get('room') ?? 0) * rooms +
        (latestPricingMap.get('member') ?? 0) * members;

      if (amount <= 0) {
        throw createAppError(400, '订单金额必须大于 0');
      }

      const orderNo = `USG${Date.now()}`;
      const expires = new Date();
      expires.setHours(expires.getHours() + 2);

      const order = await getRepo().create({
        id: ulid().toLowerCase(),
        order_no: orderNo,
        order_type: 'usage',
        user_id: userId,
        organization: { connect: { id: organizationId } },
        usage_details: { orgs, apartments, rooms, members },
        amount,
        original_amount: amount,
        currency: 'CNY',
        status: 'pending',
        payment_method: 'wechat_native',
        expires_at: expires,
      });

      // 创建微信支付订单
      const wechatResult = await createWechatPayNativeOrder({
        out_trade_no: orderNo,
        description: `用量购买-组织${orgs}公寓${apartments}房间${rooms}成员${members}`,
        amount_yuan: amount,
        time_expire: expires.toISOString(),
      });

      if (wechatResult?.code_url) {
        await getRepo().update(order.id, { code_url: wechatResult.code_url });
        order.code_url = wechatResult.code_url;
      }

      return toOrderResponse(order);
    },

    getOrder: async (orderId) => {
      const order = await getRepo().findByIdWithRelations(orderId);
      return order ? toOrderResponse(order) : null;
    },

    getOrderByOrderNo: async (orderNo) => {
      return getRepo().findByOrderNo(orderNo);
    },

    updateOrderStatus: async (orderId, status, wechatTransactionId) => {
      const updateData: Record<string, unknown> = { status };
      if (wechatTransactionId) {
        updateData.wechat_transaction_id = wechatTransactionId;
      }
      if (status === 'paid') {
        updateData.paid_at = new Date();
      }
      return getRepo().update(orderId, updateData);
    },

    updateOrderCodeUrl: async (orderId, codeUrl) => {
      return getRepo().update(orderId, { code_url: codeUrl });
    },

    listOrders: async (filters) => {
      const { orders, total } = await getRepo().findAll(filters);
      return {
        orders: orders.map(toOrderResponse),
        total,
      };
    },

    getUsagePricing: async () => {
      // 获取每个 unit_type 的最新有效单价
      const pricings = await prisma.usageUnitPricing.findMany({
        where: { is_active: true, valid_to: null },
        orderBy: { valid_from: 'desc' },
      });

      // 按 unit_type 去重，取最新的
      const latestByType = new Map<string, UsageUnitPricing>();
      for (const p of pricings) {
        if (!latestByType.has(p.unit_type)) {
          latestByType.set(p.unit_type, p);
        }
      }

      return Array.from(latestByType.values()).map((p) => ({
        unit_type: p.unit_type,
        price_per_unit: Number(p.price_per_unit),
        is_active: p.is_active,
      }));
    },

    updateUsagePricing: async (pricing) => {
      const now = new Date();

      // 将所有现有单价设为无效（设置 valid_to）
      await prisma.usageUnitPricing.updateMany({
        where: { is_active: true, valid_to: null },
        data: { valid_to: now },
      });

      // 创建新的单价记录
      for (const p of pricing) {
        await prisma.usageUnitPricing.create({
          data: {
            id: ulid().toLowerCase(),
            unit_type: p.unit_type,
            price_per_unit: p.price_per_unit,
            is_active: true,
            valid_from: now,
          },
        });
      }
    },

    getUsageAllowance: async (orgId, year, month) => {
      const allowance = await getRepo().findAllowance(orgId, year, month);
      if (!allowance) {
        return { orgs: 0, apartments: 0, rooms: 0, members: 0 };
      }
      return {
        orgs: allowance.orgs,
        apartments: allowance.apartments,
        rooms: allowance.rooms,
        members: allowance.members,
      };
    },

    fulfillUsageAllowance: async (orderId, orgId) => {
      const order = await getRepo().findById(orderId);
      if (!order || order.status !== 'paid') {
        throw createAppError(400, '订单不存在或未支付');
      }

      if (order.usage_details) {
        const details = order.usage_details as Record<string, number>;
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;

        await getRepo().upsertAllowance(orgId, year, month, {
          orgs: details.orgs,
          apartments: details.apartments,
          rooms: details.rooms,
          members: details.members,
        });
      }
    },

    listServices: async (activeOnly = true) => {
      return getRepo().findActiveServices(activeOnly);
    },

    getServiceById: async (id): Promise<PrismaServiceProduct> => {
      const service = await getRepo().findServiceByIdWithPricing(id);
      if (!service) {
        throw createAppError(404, NotFoundMessages.PLAN);
      }
      return service;
    },

    getSubscription: async (orgId) => {
      return getRepo().findSubscriptionByOrgId(orgId);
    },

    getSubscriptionStatus: async (orgId) => {
      const sub = await getRepo().findSubscriptionByOrgId(orgId);

      if (!sub) {
        return {
          has_subscription: false,
          service: null,
          status: 'none',
          is_active: false,
          end_date: null,
          auto_renew: false,
          days_remaining: null,
        };
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const active = isSubscriptionActive(sub);

      let daysRemaining: number | null = null;
      if (sub.end_date) {
        const end = new Date(sub.end_date);
        end.setHours(0, 0, 0, 0);
        daysRemaining = Math.max(
          0,
          Math.ceil((end.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))
        );
      }

      // 转换 ServiceProduct 为 API 契约格式
      const serviceProduct = sub.service
        ? {
            id: sub.service.id,
            name: sub.service.name,
            code: sub.service.code,
            description: sub.service.description,
            max_organizations: sub.service.max_organizations,
            max_apartments: sub.service.max_apartments,
            max_rooms: sub.service.max_rooms,
            max_members: sub.service.max_members,
            is_active: sub.service.is_active,
            sort_order: sub.service.sort_order,
            created_at: sub.service.created_at.toISOString(),
            updated_at: sub.service.updated_at.toISOString(),
          }
        : null;

      return {
        has_subscription: true,
        service: serviceProduct as ServiceProduct | null,
        status: sub.status,
        is_active: active,
        end_date: sub.end_date ? sub.end_date.toISOString().slice(0, 10) : null,
        auto_renew: sub.auto_renew,
        days_remaining: daysRemaining,
      };
    },

    subscribe: async (orgId, serviceId, billingMonths = 1, autoRenew = true) => {
      const service = await getRepo().findServiceById(serviceId);
      if (!service) {
        throw createAppError(404, NotFoundMessages.PLAN);
      }
      if (service.code === 'free') {
        throw createAppError(400, '免费服务仅在注册时自动开通，请通过付费服务订阅');
      }

      const existing = await getRepo().findSubscriptionByOrgId(orgId);
      const start = new Date();
      const end = new Date(start);
      end.setMonth(end.getMonth() + billingMonths);

      if (existing && existing.service && isSubscriptionActive(existing)) {
        if (service.sort_order < existing.service.sort_order) {
          throw createAppError(400, '不支持降级到低等级服务');
        }
      }

      if (existing) {
        return getRepo().updateSubscription(orgId, {
          service: { connect: { id: service.id } },
          status: 'active',
          billing_months: billingMonths,
          start_date: start,
          end_date: end,
          auto_renew: autoRenew,
          next_service: { disconnect: true },
        });
      }

      return getRepo().createSubscription({
        id: ulid().toLowerCase(),
        organization: { connect: { id: orgId } },
        service: { connect: { id: service.id } },
        billing_months: billingMonths,
        start_date: start,
        end_date: end,
        auto_renew: autoRenew,
      });
    },

    updateSubscription: async (orgId, serviceId, effective) => {
      const service = await getRepo().findServiceById(serviceId);
      if (!service) {
        throw createAppError(404, NotFoundMessages.PLAN);
      }
      if (service.code === 'free') {
        throw createAppError(400, '免费服务不可通过此接口修改');
      }

      const sub = await getRepo().findSubscriptionByOrgId(orgId);
      if (!sub) {
        throw createAppError(404, NotFoundMessages.SUBSCRIPTION);
      }

      if (effective === 'next_cycle') {
        return getRepo().updateSubscription(orgId, {
          next_service: { connect: { id: service.id } },
        });
      }

      const currentSort = sub.service?.sort_order ?? 0;
      if (service.sort_order < currentSort) {
        throw createAppError(400, '不支持降级，当前服务等级更高');
      }
      if (service.sort_order > currentSort) {
        throw createAppError(400, '升级请通过订阅页创建订单并支付差价');
      }

      return getRepo().updateSubscription(orgId, {
        service: { connect: { id: service.id } },
        next_service: { disconnect: true },
      });
    },

    cancelSubscription: async (orgId, reason) => {
      const sub = await getRepo().findSubscriptionByOrgId(orgId);
      if (!sub) {
        throw createAppError(404, NotFoundMessages.SUBSCRIPTION);
      }
      await getRepo().updateSubscription(orgId, {
        status: 'cancelled',
        cancel_reason: reason,
      });
    },
  };
}

/**
 * 转换订单为响应格式
 */
function toOrderResponse(order: BillingOrder): BillingOrderResponse {
  return {
    id: order.id,
    order_no: order.order_no,
    order_type: order.order_type,
    organization_id: order.organization_id,
    user_id: order.user_id,
    service_id: order.service_id,
    pricing_id: order.pricing_id,
    billing_months: order.billing_months,
    usage_details: (order.usage_details as Record<string, unknown>) ?? null,
    amount: Number(order.amount),
    original_amount: order.original_amount ? Number(order.original_amount) : null,
    currency: order.currency,
    status: order.status,
    payment_method: order.payment_method,
    code_url: order.code_url,
    wechat_transaction_id: order.wechat_transaction_id,
    paid_at: order.paid_at ? order.paid_at.toISOString() : null,
    expires_at: order.expires_at.toISOString(),
    created_at: order.created_at.toISOString(),
  };
}

/**
 * 默认实例
 */
export const defaultBillingService = createBillingService();
