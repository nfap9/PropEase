import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { ulid } from 'ulid';
import { prisma } from '../../lib/prisma.js';
import { requireConsoleAuth } from '../../middlewares/requireAuth.js';
import { requireOrgMembership } from '../../utils/orgContext.js';
import { createAppError } from '../../utils/appError.js';
import { NotFoundMessages } from '../../messages.js';
import { createWechatPayNativeOrder } from '../../services/wechatPayNative.js';

const router: Router = Router();

router.use(requireConsoleAuth);

router.get('/plans', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const list = await prisma.subscriptionPlan.findMany({ where: { is_active: true } });
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.get('/plans/:plan_id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const plan = await prisma.subscriptionPlan.findFirst({
      where: { id: req.params.plan_id, is_active: true },
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
    res.json(sub ? { status: sub.status, plan: sub.plan.code } : { status: 'none', plan: null });
  } catch (e) {
    next(e);
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
    const existing = await prisma.organizationSubscription.findUnique({ where: { organization_id: orgId } });
    const start = new Date();
    const end = new Date(start);
    end.setFullYear(end.getFullYear() + 1);
    if (existing) {
      const updated = await prisma.organizationSubscription.update({
        where: { organization_id: orgId },
        data: { plan_id: plan.id, status: 'active', start_date: start, end_date: end },
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
    const body = req.body as { plan_id?: string };
    if (!body?.plan_id) return next(createAppError(400, '缺少 plan_id'));
    const plan = await prisma.subscriptionPlan.findFirst({ where: { id: body.plan_id } });
    if (!plan) return next(createAppError(404, NotFoundMessages.PLAN));
    const sub = await prisma.organizationSubscription.findUnique({ where: { organization_id: req.params.org_id } });
    if (!sub) return next(createAppError(404, NotFoundMessages.SUBSCRIPTION));
    const updated = await prisma.organizationSubscription.update({
      where: { organization_id: req.params.org_id },
      data: { plan_id: plan.id },
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
    const billingCycle = (body.billing_cycle as 'monthly' | 'yearly') ?? 'monthly';
    const amount =
      billingCycle === 'yearly' ? Number(plan.price_yearly) : Number(plan.price_monthly);
    const orderNo = `SUB${Date.now()}`;
    const expires = new Date();
    expires.setHours(expires.getHours() + 2);
    const timeExpireIso = expires.toISOString();
    const order = await prisma.subscriptionOrder.create({
      data: {
        id: ulid().toLowerCase(),
        order_no: orderNo,
        organization_id: req.params.org_id,
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
    res.json(order);
  } catch (e) {
    next(e);
  }
});

export const subscriptionsRouter = router;
