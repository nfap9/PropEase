import { type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { requireOrgMembership } from '../../utils/orgContext.js';
import { createAppError } from '../../utils/appError.js';
import { defaultBillingService } from '../../services/billing.service.js';
import { defaultBillingOrderRepo } from '../../repositories/billing-order.repo.js';
import { prisma } from '../../lib/prisma.js';

// ==================== Schemas ====================

export const CreateOrderSchema = z.object({
  service_id: z.string(),
  billing_months: z.number().int().min(1).max(36).optional().default(1),
});

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

export async function calculatePrice(req: Request, res: Response, next: NextFunction) {
  try {
    const body = req.body as {
      service_id?: string;
      months?: number;
      storefront_id?: string;
    };

    if (!body?.service_id || !body?.months) {
      return next(createAppError(400, '缺少 service_id 或 months'));
    }

    const service = await defaultBillingService.getServiceById(body.service_id);

    // 查找对应周期的定价
    const pricing = await prisma.servicePricing.findFirst({
      where: { service_id: body.service_id, months: body.months, is_active: true },
    });

    let price = 0;
    let pricingId: string | undefined;

    if (pricing) {
      price = Number(pricing.price);
      pricingId = pricing.id;
    } else {
      // 如果没有找到对应周期的定价，使用月价 * 月数
      const monthlyPricing = await prisma.servicePricing.findFirst({
        where: { service_id: body.service_id, months: 1, is_active: true },
      });
      if (monthlyPricing) {
        price = Number(monthlyPricing.price) * body.months;
        pricingId = monthlyPricing.id;
      }
    }

    res.json({
      service_id: body.service_id,
      months: body.months,
      price,
      pricing_id: pricingId,
      service_name: (service as { name?: string }).name,
    });
  } catch (e) {
    next(e);
  }
}

export async function listPlans(req: Request, res: Response, next: NextFunction) {
  try {
    const activeOnly = req.query.active_only !== 'false';
    const services = await defaultBillingService.listServices(activeOnly);
    res.json(services);
  } catch (e) {
    next(e);
  }
}

export async function getPlan(req: Request, res: Response, next: NextFunction) {
  try {
    const service = await defaultBillingService.getServiceById(req.params.service_id);
    res.json(service);
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

    // 检查是否支持降级
    if (sub && sub.service && sub.status === 'active') {
      const currentSort = sub.service.sort_order;
      if (service.sort_order < currentSort) {
        return next(createAppError(400, '不支持降级到低等级服务'));
      }
    }

    const order = await defaultBillingService.createSubscriptionOrder({
      organizationId: orgId,
      serviceId: service.id,
      billingMonths: billing_months,
    });

    res.status(201).json(order);
  } catch (e) {
    next(e);
  }
}

export async function getOrder(req: Request, res: Response, next: NextFunction) {
  try {
    await requireOrgMembership(req, 'org_id');
    const order = await defaultBillingService.getOrder(req.params.order_id);
    if (!order || order.organization_id !== req.params.org_id) {
      return next(createAppError(404, '订单不存在'));
    }
    res.json(order);
  } catch (e) {
    next(e);
  }
}
