import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { ulid } from 'ulid';
import { prisma } from '../../lib/prisma.js';
import { config } from '../../config.js';
import { requireConsoleAuth } from '../../middlewares/requireAuth.js';
import { requireOrgMembership } from '../../utils/orgContext.js';
import { createAppError } from '../../utils/appError.js';
import { NotFoundMessages } from '../../messages.js';
import { createWechatPayNativeOrder } from '../../services/wechatPayNative.js';
import { fulfillSubscription } from '../../services/fulfillSubscription.js';
import { calculateUpgradeProration } from '../../utils/subscriptionProration.js';

const router: Router = Router();

function isSubscriptionActive(sub: { status: string; end_date: Date | null }): boolean {
  if (sub.status !== 'active') return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (!sub.end_date) return true;
  return new Date(sub.end_date) >= today;
}

router.use(requireConsoleAuth);

router.get('/plans', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const list = await prisma.subscriptionPlan.findMany({
      where: { is_active: true, code: { not: 'free' } },
      orderBy: { sort_order: 'asc' },
    });
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.get('/plans/:plan_id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const plan = await prisma.subscriptionPlan.findFirst({
      where: { id: req.params.plan_id, is_active: true, code: { not: 'free' } },
    });
    if (!plan) return next(createAppError(404, NotFoundMessages.PLAN));
    res.json(plan);
  } catch (e) {
    next(e);
  }
});

router.get('/organizations/:org_id/subscription', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await requireOrgMembership(req, 'org_id');
    const sub = await prisma.organizationSubscription.findUnique({
      where: { organization_id: req.params.org_id },
      include: { plan: true },
    });
    res.json(sub ?? null);
  } catch (e) {
    next(e);
  }
});

router.get('/organizations/:org_id/subscription/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await requireOrgMembership(req, 'org_id');
    const sub = await prisma.organizationSubscription.findUnique({
      where: { organization_id: req.params.org_id },
      include: { plan: true },
    });
    if (!sub) {
      return res.json({
        has_subscription: false,
        plan: null,
        status: 'none',
        is_active: false,
        end_date: null,
        auto_renew: false,
        days_remaining: null,
      });
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const active =
      sub.status === 'active' &&
      (!sub.end_date || new Date(sub.end_date) >= today);
    let daysRemaining: number | null = null;
    if (sub.end_date) {
      const end = new Date(sub.end_date);
      end.setHours(0, 0, 0, 0);
      daysRemaining = Math.max(0, Math.ceil((end.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)));
    }
    return res.json({
      has_subscription: true,
      plan: sub.plan,
      status: sub.status,
      is_active: active,
      end_date: sub.end_date ? sub.end_date.toISOString().slice(0, 10) : null,
      auto_renew: sub.auto_renew,
      days_remaining: daysRemaining,
    });
  } catch (e) {
    return next(e);
  }
});

const SubscribeSchema = z.object({ plan_id: z.string(), billing_cycle: z.enum(['monthly', 'yearly']).optional() });
router.post('/organizations/:org_id/subscription', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await requireOrgMembership(req, 'org_id');
    const parsed = SubscribeSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    const orgId = req.params.org_id;
    const plan = await prisma.subscriptionPlan.findFirst({ where: { id: parsed.data.plan_id } });
    if (!plan) return next(createAppError(404, NotFoundMessages.PLAN));
    if (plan.code === 'free') {
      return next(createAppError(400, '免费套餐仅在注册时自动开通，请通过付费套餐订阅'));
    }
    const existing = await prisma.organizationSubscription.findUnique({
      where: { organization_id: orgId },
      include: { plan: true },
    });
    const start = new Date();
    const end = new Date(start);
    end.setFullYear(end.getFullYear() + 1);
    if (existing && existing.plan && isSubscriptionActive(existing)) {
      if (plan.sort_order < existing.plan.sort_order) {
        return next(createAppError(400, '不支持降级到低等级套餐'));
      }
    }
    if (existing) {
      const updated = await prisma.organizationSubscription.update({
        where: { organization_id: orgId },
        data: { plan_id: plan.id, status: 'active', start_date: start, end_date: end, next_plan_id: null },
      });
      return res.json(updated);
    }
    const sub = await prisma.organizationSubscription.create({
      data: { id: ulid().toLowerCase(), organization_id: orgId, plan_id: plan.id, start_date: start, end_date: end },
    });
    res.status(201).json(sub);
  } catch (e) {
    next(e);
  }
});

router.put('/organizations/:org_id/subscription', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await requireOrgMembership(req, 'org_id');
    const body = req.body as { plan_id?: string; effective?: 'immediate' | 'next_cycle' };
    if (!body?.plan_id) return next(createAppError(400, '缺少 plan_id'));
    const plan = await prisma.subscriptionPlan.findFirst({ where: { id: body.plan_id } });
    if (!plan) return next(createAppError(404, NotFoundMessages.PLAN));
    if (plan.code === 'free') {
      return next(createAppError(400, '免费套餐不可通过此接口修改'));
    }
    const sub = await prisma.organizationSubscription.findUnique({
      where: { organization_id: req.params.org_id },
      include: { plan: true },
    });
    if (!sub) return next(createAppError(404, NotFoundMessages.SUBSCRIPTION));
    const effective = body.effective ?? 'immediate';
    if (effective === 'next_cycle') {
      const updated = await prisma.organizationSubscription.update({
        where: { organization_id: req.params.org_id },
        data: { next_plan_id: plan.id },
      });
      return res.json(updated);
    }
    const currentSort = sub.plan?.sort_order ?? 0;
    if (plan.sort_order < currentSort) {
      return next(createAppError(400, '不支持降级，当前套餐等级更高'));
    }
    if (plan.sort_order > currentSort) {
      return next(createAppError(400, '升级请通过订阅页创建订单并支付差价'));
    }
    const updated = await prisma.organizationSubscription.update({
      where: { organization_id: req.params.org_id },
      data: { plan_id: plan.id, next_plan_id: null },
    });
    res.json(updated);
  } catch (e) {
    next(e);
  }
});

router.post('/organizations/:org_id/subscription/cancel', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await requireOrgMembership(req, 'org_id');
    const sub = await prisma.organizationSubscription.findUnique({ where: { organization_id: req.params.org_id } });
    if (!sub) return next(createAppError(404, NotFoundMessages.SUBSCRIPTION));
    await prisma.organizationSubscription.update({
      where: { organization_id: req.params.org_id },
      data: { status: 'cancelled' },
    });
    res.json({ message: 'ok' });
  } catch (e) {
    next(e);
  }
});

router.post('/organizations/:org_id/orders', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await requireOrgMembership(req, 'org_id');
    const body = req.body as { plan_id?: string; billing_cycle?: string };
    if (!body?.plan_id) return next(createAppError(400, '缺少 plan_id'));
    const plan = await prisma.subscriptionPlan.findFirst({ where: { id: body.plan_id } });
    if (!plan) return next(createAppError(404, NotFoundMessages.PLAN));
    if (plan.code === 'free') {
      return next(createAppError(400, '免费套餐无需购买，注册时已自动开通'));
    }
    const billingCycle = (body.billing_cycle as 'monthly' | 'yearly') ?? 'monthly';
    const orgId = req.params.org_id;
    const sub = await prisma.organizationSubscription.findUnique({
      where: { organization_id: orgId },
      include: { plan: true },
    });
    let amount: number;
    if (sub && isSubscriptionActive(sub) && sub.plan) {
      const currentSort = sub.plan.sort_order;
      if (plan.sort_order < currentSort) {
        return next(createAppError(400, '不支持降级到低等级套餐'));
      }
      if (plan.sort_order > currentSort) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const endDate = sub.end_date ? new Date(sub.end_date) : null;
        if (!endDate || endDate < today) {
          amount = billingCycle === 'yearly' ? Number(plan.price_yearly) : Number(plan.price_monthly);
        } else {
          const totalDays = sub.billing_cycle === 'yearly' ? 365 : 30;
          const remainingDays = Math.ceil((endDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
          const oldMonthly = Number(sub.plan.price_monthly);
          const newMonthly = Number(plan.price_monthly);
          amount = calculateUpgradeProration(newMonthly, oldMonthly, remainingDays, totalDays);
          if (amount <= 0) {
            return next(createAppError(400, '当前套餐剩余价值已覆盖新套餐，无需补差'));
          }
        }
      } else {
        amount = billingCycle === 'yearly' ? Number(plan.price_yearly) : Number(plan.price_monthly);
      }
    } else {
      amount = billingCycle === 'yearly' ? Number(plan.price_yearly) : Number(plan.price_monthly);
    }
    const orderNo = `SUB${Date.now()}`;
    const expires = new Date();
    expires.setHours(expires.getHours() + 2);
    const timeExpireIso = expires.toISOString();
    const order = await prisma.subscriptionOrder.create({
      data: {
        id: ulid().toLowerCase(),
        order_no: orderNo,
        organization_id: orgId,
        plan_id: plan.id,
        billing_cycle: billingCycle,
        amount,
        status: 'pending',
        expires_at: expires,
      },
    });
    const wechatResult = await createWechatPayNativeOrder({
      out_trade_no: orderNo,
      description: `套餐订阅-${plan.name}`,
      amount_yuan: amount,
      time_expire: timeExpireIso,
    });
    if (wechatResult?.code_url) {
      await prisma.subscriptionOrder.update({
        where: { id: order.id },
        data: { code_url: wechatResult.code_url },
      });
      const updated = await prisma.subscriptionOrder.findUnique({ where: { id: order.id } });
      return res.status(201).json(updated ?? order);
    }
    res.status(201).json(order);
  } catch (e) {
    next(e);
  }
});

router.get('/organizations/:org_id/orders/:order_id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await requireOrgMembership(req, 'org_id');
    const order = await prisma.subscriptionOrder.findFirst({
      where: { id: req.params.order_id, organization_id: req.params.org_id },
      include: { plan: true },
    });
    if (!order) return next(createAppError(404, NotFoundMessages.ORDER));
    const payload = order as typeof order & { simulate_pay_available?: boolean };
    if (config.isDev && order.status === 'pending' && !order.code_url) {
      payload.simulate_pay_available = true;
    }
    res.json(payload);
  } catch (e) {
    next(e);
  }
});

/** 开发环境模拟支付：将待支付订单标记为已支付并开通订阅，仅 isDev 时可用 */
router.post('/organizations/:org_id/orders/:order_id/simulate-pay', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!config.isDev) {
      return next(createAppError(403, '模拟支付仅限开发环境'));
    }
    await requireOrgMembership(req, 'org_id');
    const order = await prisma.subscriptionOrder.findFirst({
      where: { id: req.params.order_id, organization_id: req.params.org_id },
      include: { plan: true },
    });
    if (!order) return next(createAppError(404, NotFoundMessages.ORDER));
    if (order.status !== 'pending') {
      return next(createAppError(400, '订单状态不允许模拟支付'));
    }
    await prisma.subscriptionOrder.update({
      where: { id: order.id },
      data: { status: 'paid', paid_at: new Date() },
    });
    await fulfillSubscription(order.id);
    const updated = await prisma.subscriptionOrder.findUnique({
      where: { id: order.id },
      include: { plan: true },
    });
    res.json(updated ?? order);
  } catch (e) {
    next(e);
  }
});

export const subscriptionsRouter = router;
