import { type Request, type Response, type NextFunction } from 'express';
import { requireOrgMembership } from '../../utils/orgContext.js';
import { createAppError } from '../../utils/appError.js';
import { defaultBillingService } from '../../services/billing.service.js';
import { defaultBillingOrderRepo } from '../../repositories/billing-order.repo.js';
import { prisma } from '../../lib/prisma.js';
import { CreateOrderSchema, PreviewOrderSchema } from '../../lib/schemas.js';

// Re-export for backward compatibility
export { CreateOrderSchema, PreviewOrderSchema };

// ==================== Handlers ====================

export async function getStorefront(_req: Request, res: Response, next: NextFunction) {
  try {
    const services = await defaultBillingOrderRepo.findActiveServicesWithPricing(true);
    if (!services || services.length === 0) {
      return next(createAppError(404, '商店配置不存在或未启用'));
    }

    // 转换为 StorefrontView 格式
    const storefrontView = {
      id: 'default',
      name: '默认商店',
      code: 'default',
      is_default: true,
      services: services.map((service) => ({
        id: service.id,
        name: service.name,
        code: service.code,
        description: service.description,
        max_organizations: service.max_organizations,
        max_apartments: service.max_apartments,
        max_rooms: service.max_rooms,
        max_members: service.max_members,
        pricing: (service.pricing || [])
          .filter((p: { is_active: boolean }) => p.is_active)
          .map((p: { id: string; months: number; price: { toNumber: () => number } }) => ({
            id: p.id,
            months: p.months,
            price: p.price.toNumber(),
          })),
      })),
    };

    res.json(storefrontView);
  } catch (e) {
    next(e);
  }
}

export async function previewOrder(req: Request, res: Response, next: NextFunction) {
  try {
    await requireOrgMembership(req, 'org_id');

    const parsed = PreviewOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(createAppError(422, '参数校验失败'));
    }

    const { service_id, billing_months } = parsed.data;
    const orgId = req.params.org_id;

    const service = await defaultBillingService.getServiceById(service_id);
    if (service.code === 'free') {
      return next(createAppError(400, '免费服务无需购买'));
    }

    // 查找当前订阅
    const sub = await defaultBillingOrderRepo.findSubscriptionByOrgId(orgId);

    // 计算价格
    const pricing = await prisma.servicePricing.findFirst({
      where: { service_id: service_id, months: billing_months, is_active: true },
    });
    let originalPrice = 0;
    if (pricing) {
      originalPrice = Number(pricing.price);
    } else {
      const monthlyPricing = await prisma.servicePricing.findFirst({
        where: { service_id: service_id, months: 1, is_active: true },
      });
      if (monthlyPricing) {
        originalPrice = Number(monthlyPricing.price) * billing_months;
      }
    }

    // 确定操作类型和抵扣
    let actionType: 'purchase' | 'renew' | 'upgrade' | 'downgrade' = 'purchase';
    let credit = 0;
    let currentServiceName: string | null = null;

    if (sub && sub.service && sub.status === 'active') {
      currentServiceName = sub.service.name;
      const currentSort = sub.service.sort_order;

      if (service.sort_order < currentSort) {
        actionType = 'downgrade';
      } else if (service.sort_order === currentSort) {
        actionType = 'renew';
      } else {
        actionType = 'upgrade';
      }

      // 计算升级抵扣
      if (actionType === 'upgrade' && sub.end_date) {
        const now = new Date();
        const endDate = new Date(sub.end_date);
        if (endDate > now) {
          const dailyPrice = await calculateDailyPrice(sub.service.id, sub.billing_months);
          const remainingMs = endDate.getTime() - now.getTime();
          const remainingDays = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
          credit = Math.floor(remainingDays * dailyPrice);
        }
      }
    }

    const finalPrice = Math.max(0, originalPrice - credit);

    res.json({
      action_type: actionType,
      service_name: service.name,
      current_service_name: currentServiceName,
      original_price: originalPrice,
      credit,
      final_price: finalPrice,
      billing_months,
    });
  } catch (e) {
    next(e);
  }
}

export async function getSubscription(req: Request, res: Response, next: NextFunction) {
  try {
    await requireOrgMembership(req, 'org_id');
    const sub = await defaultBillingService.getSubscription(req.params.org_id);
    res.json(sub ?? null);
  } catch (e) {
    next(e);
  }
}

export async function getSubscriptionStatus(req: Request, res: Response, next: NextFunction) {
  try {
    await requireOrgMembership(req, 'org_id');
    const status = await defaultBillingService.getSubscriptionStatus(req.params.org_id);
    res.json(status);
  } catch (e) {
    next(e);
  }
}

export async function subscribe(req: Request, res: Response, next: NextFunction) {
  try {
    await requireOrgMembership(req, 'org_id');
    const body = req.body as { service_id?: string; billing_cycle?: string; auto_renew?: boolean };
    if (!body?.service_id) {
      return next(createAppError(400, '缺少 service_id'));
    }
    const billingMonths = body.billing_cycle === 'yearly' ? 12 : 1;
    const autoRenew = body.auto_renew ?? true;
    const sub = await defaultBillingService.subscribe(req.params.org_id, body.service_id, billingMonths, autoRenew);
    res.json(sub);
  } catch (e) {
    next(e);
  }
}

export async function updateSubscription(req: Request, res: Response, next: NextFunction) {
  try {
    await requireOrgMembership(req, 'org_id');
    const body = req.body as { service_id?: string; effective?: 'immediate' | 'next_cycle' };
    if (!body?.service_id) {
      return next(createAppError(400, '缺少 service_id'));
    }
    const effective = body.effective ?? 'immediate';
    const sub = await defaultBillingService.updateSubscription(
      req.params.org_id,
      body.service_id,
      effective
    );
    res.json(sub);
  } catch (e) {
    next(e);
  }
}

export async function cancelSubscription(req: Request, res: Response, next: NextFunction) {
  try {
    await requireOrgMembership(req, 'org_id');
    const body = req.body as { reason?: string };
    await defaultBillingService.cancelSubscription(req.params.org_id, body.reason);
    res.json({ message: 'ok' });
  } catch (e) {
    next(e);
  }
}

export async function createOrder(req: Request, res: Response, next: NextFunction) {
  try {
    await requireOrgMembership(req, 'org_id');

    const parsed = CreateOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(createAppError(422, '参数校验失败'));
    }

    const { service_id, billing_months } = parsed.data;

    const service = await defaultBillingService.getServiceById(service_id);

    if (service.code === 'free') {
      return next(createAppError(400, '免费服务无需购买，注册时已自动开通'));
    }

    const orgId = req.params.org_id;
    const sub = await defaultBillingOrderRepo.findSubscriptionByOrgId(orgId);

    // 计算升级抵扣金额
    let credit = 0;
    if (sub && sub.service && sub.status === 'active' && sub.end_date) {
      const currentSort = sub.service.sort_order;
      if (service.sort_order < currentSort) {
        return next(createAppError(400, '不支持降级到低等级服务'));
      }
      if (service.sort_order > currentSort) {
        // 升级：计算旧服务剩余价值作为抵扣
        const now = new Date();
        const endDate = new Date(sub.end_date);
        if (endDate > now) {
          // 获取旧服务的月均价格
          const dailyPrice = await calculateDailyPrice(sub.service.id, sub.billing_months);
          const remainingMs = endDate.getTime() - now.getTime();
          const remainingDays = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
          credit = Math.floor(remainingDays * dailyPrice);
        }
      }
    }

    const order = await defaultBillingService.createSubscriptionOrder({
      organizationId: orgId,
      serviceId: service.id,
      billingMonths: billing_months,
      credit,
    });

    res.status(201).json(order);
  } catch (e) {
    next(e);
  }
}

/**
 * 计算服务的每日价格
 */
async function calculateDailyPrice(serviceId: string, billingMonths: number): Promise<number> {
  // 优先使用对应周期的定价
  const pricing = await prisma.servicePricing.findFirst({
    where: { service_id: serviceId, months: billingMonths, is_active: true },
  });
  if (pricing) {
    return Number(pricing.price) / 30 / billingMonths;
  }
  // 回退到月价
  const monthlyPricing = await prisma.servicePricing.findFirst({
    where: { service_id: serviceId, months: 1, is_active: true },
  });
  return monthlyPricing ? Number(monthlyPricing.price) / 30 : 0;
}

export async function getOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const orgId = await requireOrgMembership(req);
    const order = await defaultBillingService.getOrder(req.params.order_id);
    if (!order || order.organization_id !== orgId) {
      return next(createAppError(404, '订单不存在'));
    }
    res.json(order);
  } catch (e) {
    next(e);
  }
}

/**
 * 开发环境：模拟支付完成，直接履行订阅订单
 * 仅用于开发测试，生产环境不应存在此接口
 */
export async function simulatePay(req: Request, res: Response, next: NextFunction) {
  try {
    const orgId = await requireOrgMembership(req);

    const order = await defaultBillingService.getOrder(req.params.order_id);
    if (!order || order.organization_id !== orgId) {
      return next(createAppError(404, '订单不存在'));
    }

    if (order.status === 'paid') {
      return res.json({ message: 'already paid', order });
    }

    if (order.status !== 'pending') {
      return next(createAppError(400, `订单状态不允许模拟支付: ${order.status}`));
    }

    // 更新订单状态为已支付
    await defaultBillingService.updateOrderStatus(order.id, 'paid');

    // 履行订阅订单
    if (order.order_type === 'subscription' && order.organization_id) {
      const startDate = new Date();
      const billingMonths = order.billing_months ?? 1;
      const totalGiftMonths = (order as { total_gift_months?: number }).total_gift_months ?? 0;
      const totalMonths = billingMonths + totalGiftMonths;
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + totalMonths);

      // 获取新订单对应的服务 sort_order
      let newServiceSortOrder = 0;
      if (order.service_id) {
        const newService = await prisma.serviceProduct.findUnique({
          where: { id: order.service_id },
          select: { sort_order: true },
        });
        if (newService) {
          newServiceSortOrder = newService.sort_order;
        }
      }

      const existingSub = await defaultBillingOrderRepo.findSubscriptionByOrgId(order.organization_id);

      if (existingSub) {
        const existingSortOrder = existingSub.service?.sort_order ?? 0;
        const isSameService = existingSub.service_id === order.service_id;
        const isUpgrade = !!order.service_id && newServiceSortOrder > existingSortOrder;

        let effectiveStartDate: Date;
        let effectiveEndDate: Date;

        if (isSameService) {
          effectiveStartDate = new Date(existingSub.end_date!);
          if (effectiveStartDate < new Date()) {
            effectiveStartDate = new Date();
          }
        } else if (isUpgrade) {
          effectiveStartDate = new Date();
        } else {
          effectiveStartDate = startDate;
        }

        effectiveEndDate = new Date(effectiveStartDate);
        effectiveEndDate.setMonth(effectiveEndDate.getMonth() + totalMonths);

        await defaultBillingOrderRepo.updateSubscription(order.organization_id, {
          status: 'active',
          billing_months: billingMonths,
          start_date: effectiveStartDate,
          end_date: effectiveEndDate,
          auto_renew: true,
          next_service: { disconnect: true },
          ...(order.service_id ? { service: { connect: { id: order.service_id as string } } } : {}),
        });
      } else {
        if (!order.service_id) {
          return next(createAppError(400, '订阅订单缺少服务信息'));
        }
        await defaultBillingOrderRepo.createSubscription({
          id: (order as { subscription_id?: string }).subscription_id ?? order.id,
          organization: { connect: { id: order.organization_id } },
          billing_months: billingMonths,
          start_date: startDate,
          end_date: endDate,
          auto_renew: true,
          service: { connect: { id: order.service_id } },
        });
      }
    }

    res.json({ message: 'ok', order_id: order.id });
  } catch (e) {
    next(e);
  }
}
