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
import { defaultSubscriptionService } from '../../services/subscription.service.js';
import { isSubscriptionActive } from '../../repositories/subscription.repo.js';

const router: Router = Router();

router.use(requireConsoleAuth);

/**
 * @openapi
 * /subscriptions/plans:
 *   get:
 *     summary: 获取套餐列表
 *     tags: [订阅管理]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 套餐列表
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/SubscriptionPlan'
 */
router.get('/plans', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const list = await defaultSubscriptionService.listPlans();
    res.json(list);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /subscriptions/plans/{plan_id}:
 *   get:
 *     summary: 获取套餐详情
 *     tags: [订阅管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: plan_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 套餐信息
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SubscriptionPlan'
 *       404:
 *         description: 套餐不存在
 */
router.get('/plans/:plan_id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const plan = await defaultSubscriptionService.getPlanById(req.params.plan_id);
    res.json(plan);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /subscriptions/organizations/{org_id}/subscription:
 *   get:
 *     summary: 获取组织的订阅信息
 *     tags: [订阅管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: org_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 订阅信息
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrganizationSubscription'
 */
router.get(
  '/organizations/:org_id/subscription',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await requireOrgMembership(req, 'org_id');
      const sub = await defaultSubscriptionService.getSubscription(req.params.org_id);
      res.json(sub ?? null);
    } catch (e) {
      next(e);
    }
  }
);

/**
 * @openapi
 * /subscriptions/organizations/{org_id}/subscription/status:
 *   get:
 *     summary: 获取组织的订阅状态
 *     tags: [订阅管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: org_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 订阅状态
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 is_active:
 *                   type: boolean
 *                 plan_code:
 *                   type: string
 *                 end_date:
 *                   type: string
 *                   format: date
 */
router.get(
  '/organizations/:org_id/subscription/status',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await requireOrgMembership(req, 'org_id');
      const status = await defaultSubscriptionService.getSubscriptionStatus(req.params.org_id);
      res.json(status);
    } catch (e) {
      next(e);
    }
  }
);

const SubscribeSchema = z.object({
  plan_id: z.string(),
  billing_cycle: z.enum(['monthly', 'yearly']).optional(),
});

/**
 * @openapi
 * /subscriptions/organizations/{org_id}/subscription:
 *   post:
 *     summary: 订阅套餐
 *     tags: [订阅管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: org_id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [plan_id]
 *             properties:
 *               plan_id:
 *                 type: string
 *               billing_cycle:
 *                 type: string
 *                 enum: [monthly, yearly]
 *     responses:
 *       201:
 *         description: 订阅成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrganizationSubscription'
 */
router.post(
  '/organizations/:org_id/subscription',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await requireOrgMembership(req, 'org_id');
      const parsed = SubscribeSchema.safeParse(req.body);
      if (!parsed.success) return next(createAppError(422, '参数校验失败'));
      const sub = await defaultSubscriptionService.subscribe(
        req.params.org_id,
        parsed.data.plan_id
      );
      res.status(201).json(sub);
    } catch (e) {
      next(e);
    }
  }
);

/**
 * @openapi
 * /subscriptions/organizations/{org_id}/subscription:
 *   put:
 *     summary: 更新订阅套餐
 *     tags: [订阅管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: org_id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [plan_id]
 *             properties:
 *               plan_id:
 *                 type: string
 *               effective:
 *                 type: string
 *                 enum: [immediate, next_cycle]
 *     responses:
 *       200:
 *         description: 更新成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrganizationSubscription'
 */
router.put(
  '/organizations/:org_id/subscription',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await requireOrgMembership(req, 'org_id');
      const body = req.body as { plan_id?: string; effective?: 'immediate' | 'next_cycle' };
      if (!body?.plan_id) return next(createAppError(400, '缺少 plan_id'));
      const effective = body.effective ?? 'immediate';
      const sub = await defaultSubscriptionService.updateSubscription(
        req.params.org_id,
        body.plan_id,
        effective
      );
      res.json(sub);
    } catch (e) {
      next(e);
    }
  }
);

/**
 * @openapi
 * /subscriptions/organizations/{org_id}/subscription/cancel:
 *   post:
 *     summary: 取消订阅
 *     tags: [订阅管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: org_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 取消成功
 */
router.post(
  '/organizations/:org_id/subscription/cancel',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await requireOrgMembership(req, 'org_id');
      await defaultSubscriptionService.cancelSubscription(req.params.org_id);
      res.json({ message: 'ok' });
    } catch (e) {
      next(e);
    }
  }
);

/**
 * @openapi
 * /subscriptions/organizations/{org_id}/orders:
 *   post:
 *     summary: 创建订阅订单
 *     tags: [订阅管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: org_id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [plan_id]
 *             properties:
 *               plan_id:
 *                 type: string
 *               billing_cycle:
 *                 type: string
 *                 enum: [monthly, yearly]
 *     responses:
 *       201:
 *         description: 订单创建成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SubscriptionOrder'
 */
router.post(
  '/organizations/:org_id/orders',
  async (req: Request, res: Response, next: NextFunction) => {
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
            amount =
              billingCycle === 'yearly' ? Number(plan.price_yearly) : Number(plan.price_monthly);
          } else {
            const totalDays = sub.billing_cycle === 'yearly' ? 365 : 30;
            const remainingDays = Math.ceil(
              (endDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)
            );
            const oldMonthly = Number(sub.plan.price_monthly);
            const newMonthly = Number(plan.price_monthly);
            amount = calculateUpgradeProration(newMonthly, oldMonthly, remainingDays, totalDays);
            if (amount <= 0) {
              return next(createAppError(400, '当前套餐剩余价值已覆盖新套餐，无需补差'));
            }
          }
        } else {
          amount =
            billingCycle === 'yearly' ? Number(plan.price_yearly) : Number(plan.price_monthly);
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
  }
);

/**
 * @openapi
 * /subscriptions/organizations/{org_id}/orders/{order_id}:
 *   get:
 *     summary: 获取订单详情
 *     tags: [订阅管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: org_id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: order_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 订单信息
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SubscriptionOrder'
 *       404:
 *         description: 订单不存在
 */
router.get(
  '/organizations/:org_id/orders/:order_id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await requireOrgMembership(req, 'org_id');
      const order = await defaultSubscriptionService.getOrder(
        req.params.org_id,
        req.params.order_id
      );
      const payload = order as typeof order & { simulate_pay_available?: boolean };
      if (config.isDev && order.status === 'pending' && !order.code_url) {
        payload.simulate_pay_available = true;
      }
      res.json(payload);
    } catch (e) {
      next(e);
    }
  }
);

/**
 * @openapi
 * /subscriptions/organizations/{org_id}/orders/{order_id}/simulate-pay:
 *   post:
 *     summary: 模拟支付（仅开发环境）
 *     tags: [订阅管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: org_id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: order_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 模拟支付成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SubscriptionOrder'
 *       403:
 *         description: 非开发环境
 */
router.post(
  '/organizations/:org_id/orders/:order_id/simulate-pay',
  async (req: Request, res: Response, next: NextFunction) => {
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
  }
);

export const subscriptionsRouter = router;
