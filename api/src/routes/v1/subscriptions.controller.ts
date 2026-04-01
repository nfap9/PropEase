import { type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { requireOrgMembership } from '../../utils/orgContext.js';
import { createAppError } from '../../utils/appError.js';
import { createWechatPayNativeOrder } from '../../services/wechatPayNative.js';
import { defaultSubscriptionService } from '../../services/subscription.service.js';
import { isSubscriptionActive } from '../../utils/subscription.js';
import { defaultServiceProductService } from '../../services/service-product.service.js';

// ==================== Schemas ====================

export const CreateOrderSchema = z.object({
  service_id: z.string(),
  billing_months: z.number().int().min(1).max(36).optional().default(1),
});

// ==================== Handlers ====================

export async function getStorefront(req: Request, res: Response, next: NextFunction) {
  try {
    const storefrontId = req.query.storefront_id as string | undefined;
    const view = await defaultServiceProductService.getStorefrontView(storefrontId);
    if (!view) {
      return next(createAppError(404, '商店配置不存在或未启用'));
    }
    res.json(view);
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

    const result = await defaultServiceProductService.calculatePrice({
      service_id: body.service_id,
      months: body.months,
      storefront_id: body.storefront_id,
    });

    res.json(result);
  } catch (e) {
    next(e);
  }
}

export async function listPlans(req: Request, res: Response, next: NextFunction) {
  try {
    const activeOnly = req.query.active_only !== 'false';
    const services = await defaultSubscriptionService.listServices(activeOnly);
    res.json(services);
  } catch (e) {
    next(e);
  }
}

export async function getPlan(req: Request, res: Response, next: NextFunction) {
  try {
    const service = await defaultSubscriptionService.getServiceById(req.params.service_id);
    res.json(service);
  } catch (e) {
    next(e);
  }
}

export async function getSubscription(req: Request, res: Response, next: NextFunction) {
  try {
    await requireOrgMembership(req, 'org_id');
    const sub = await defaultSubscriptionService.getSubscription(req.params.org_id);
    res.json(sub ?? null);
  } catch (e) {
    next(e);
  }
}

export async function getSubscriptionStatus(req: Request, res: Response, next: NextFunction) {
  try {
    await requireOrgMembership(req, 'org_id');
    const status = await defaultSubscriptionService.getSubscriptionStatus(req.params.org_id);
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
    const sub = await defaultSubscriptionService.subscribe(req.params.org_id, body.service_id, billingMonths, autoRenew);
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
    const sub = await defaultSubscriptionService.updateSubscription(
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
    await defaultSubscriptionService.cancelSubscription(req.params.org_id, body.reason);
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

    const service = await defaultSubscriptionService.getServiceById(service_id);

    if (service.code === 'free') {
      return next(createAppError(400, '免费服务无需购买，注册时已自动开通'));
    }

    const orgId = req.params.org_id;
    const sub = await defaultSubscriptionService.getSubscription(orgId);

    if (sub && isSubscriptionActive(sub) && sub.service) {
      const currentSort = sub.service.sort_order;
      if (service.sort_order < currentSort) {
        return next(createAppError(400, '不支持降级到低等级服务'));
      }
    }

    const order = await defaultSubscriptionService.createOrder(orgId, {
      serviceId: service.id,
      billingMonths: billing_months,
    });

    const wechatResult = await createWechatPayNativeOrder({
      out_trade_no: order.order_no,
      description: `服务订阅-${service.name}`,
      amount_yuan: Number(order.amount),
      time_expire: order.expires_at.toISOString(),
    });

    if (wechatResult?.code_url) {
      await defaultSubscriptionService.updateOrderCodeUrl(order.id, wechatResult.code_url);
      return res.status(201).json(order);
    }

    res.status(201).json(order);
  } catch (e) {
    next(e);
  }
}

export async function getOrder(req: Request, res: Response, next: NextFunction) {
  try {
    await requireOrgMembership(req, 'org_id');
    const order = await defaultSubscriptionService.getOrder(
      req.params.org_id,
      req.params.order_id
    );
    res.json(order);
  } catch (e) {
    next(e);
  }
}
