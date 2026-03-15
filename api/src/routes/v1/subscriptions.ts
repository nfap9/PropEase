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
import {
  defaultServiceProductService,
} from '../../services/service-product.service.js';

const router: Router = Router();

router.use(requireConsoleAuth);

// ==================== 商店视图接口 ====================

/**
 * @openapi
 * /subscriptions/storefront:
 *   get:
 *     summary: 获取商店视图
 *     description: 获取商店配置及可购买的服务列表
 *     tags: [订阅管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: storefront_id
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 商店视图数据
 */
router.get('/storefront', async (req: Request, res: Response, next: NextFunction) => {
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
});

/**
 * @openapi
 * /subscriptions/storefront/calculate-price:
 *   post:
 *     summary: 计算服务价格
 *     description: 根据服务ID、购买时长和商店配置计算最终价格
 *     tags: [订阅管理]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [service_id, months]
 *             properties:
 *               service_id:
 *                 type: string
 *               months:
 *                 type: integer
 *               storefront_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: 价格计算结果
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 original_price:
 *                   type: number
 *                 discount_type:
 *                   type: string
 *                   enum: [percent, fixed, gift, null]
 *                 discount_value:
 *                   type: number
 *                 discount_amount:
 *                   type: number
 *                 final_price:
 *                   type: number
 *                 gift_months:
 *                   type: integer
 *       404:
 *         description: 服务或定价不存在
 */
router.post(
  '/storefront/calculate-price',
  async (req: Request, res: Response, next: NextFunction) => {
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
);

// ==================== 套餐查询接口 ====================

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
 */
router.get('/plans', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const plans = await defaultSubscriptionService.listPlans();
    res.json(plans);
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
 *         description: 套餐详情
 */
router.get('/plans/:plan_id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const plan = await defaultSubscriptionService.getPlanById(req.params.plan_id);
    res.json(plan);
  } catch (e) {
    next(e);
  }
});

// ==================== 订阅信息接口 ====================

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

/**
 * @openapi
 * /subscriptions/organizations/{org_id}/subscription/subscribe:
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
 *     responses:
 *       200:
 *         description: 订阅成功
 */
router.post(
  '/organizations/:org_id/subscription/subscribe',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await requireOrgMembership(req, 'org_id');
      const body = req.body as { plan_id?: string };
      if (!body?.plan_id) {
        return next(createAppError(400, '缺少 plan_id'));
      }
      const sub = await defaultSubscriptionService.subscribe(req.params.org_id, body.plan_id);
      res.json(sub);
    } catch (e) {
      next(e);
    }
  }
);

/**
 * @openapi
 * /subscriptions/organizations/{org_id}/subscription/update:
 *   put:
 *     summary: 更新订阅
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
 *             required: [plan_id, effective]
 *             properties:
 *               plan_id:
 *                 type: string
 *               effective:
 *                 type: string
 *                 enum: [immediate, next_cycle]
 *     responses:
 *       200:
 *         description: 更新成功
 */
router.put(
  '/organizations/:org_id/subscription/update',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await requireOrgMembership(req, 'org_id');
      const body = req.body as { plan_id?: string; effective?: 'immediate' | 'next_cycle' };
      if (!body?.plan_id || !body?.effective) {
        return next(createAppError(400, '缺少 plan_id 或 effective'));
      }
      const sub = await defaultSubscriptionService.updateSubscription(
        req.params.org_id,
        body.plan_id,
        body.effective
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

// ==================== 订单接口 ====================

// 创建订单的请求体验证 Schema
const CreateOrderSchema = z.object({
  plan_id: z.string(),
  billing_months: z.number().int().min(1).max(36).optional().default(1),
});

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
 *               billing_months:
 *                 type: integer
 *     responses:
 *       201:
 *         description: 订单创建成功
 */
router.post(
  '/organizations/:org_id/orders',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await requireOrgMembership(req, 'org_id');

      const parsed = CreateOrderSchema.safeParse(req.body);
      if (!parsed.success) {
        return next(createAppError(422, '参数校验失败'));
      }

      const { plan_id, billing_months } = parsed.data;

      const plan = await prisma.subscriptionPlan.findFirst({
        where: { id: plan_id },
        include: {
          pricing: { where: { is_active: true } },
        },
      });

      if (!plan) return next(createAppError(404, NotFoundMessages.PLAN));
      if (plan.code === 'free') {
        return next(createAppError(400, '免费套餐无需购买，注册时已自动开通'));
      }

      const orgId = req.params.org_id;
      const sub = await prisma.organizationSubscription.findUnique({
        where: { organization_id: orgId },
        include: { plan: true },
      });

      // 计算原始价格（周期定价）
      const pricing = plan.pricing.find((p) => p.months === billing_months);
      let originalAmount = pricing ? Number(pricing.price) : Number(plan.price_monthly) * billing_months;
      let finalAmount = originalAmount;

      // 升级场景的差价计算
      if (sub && isSubscriptionActive(sub) && sub.plan) {
        const currentSort = sub.plan.sort_order;
        if (plan.sort_order < currentSort) {
          return next(createAppError(400, '不支持降级到低等级套餐'));
        }
        if (plan.sort_order > currentSort) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const endDate = sub.end_date ? new Date(sub.end_date) : null;
          if (endDate && endDate >= today) {
            const totalDays = sub.billing_cycle === 'yearly' ? 365 : 30;
            const remainingDays = Math.ceil(
              (endDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)
            );
            const oldMonthly = Number(sub.plan.price_monthly);
            const newMonthly = Number(plan.price_monthly);
            originalAmount = calculateUpgradeProration(newMonthly, oldMonthly, remainingDays, totalDays);
            finalAmount = originalAmount;
            if (originalAmount <= 0) {
              return next(createAppError(400, '当前套餐剩余价值已覆盖新套餐，无需补差'));
            }
          }
        }
      }

      const orderNo = `SUB${Date.now()}`;
      const expires = new Date();
      expires.setHours(expires.getHours() + 2);
      const timeExpireIso = expires.toISOString();

      // 创建订单
      const order = await prisma.subscriptionOrder.create({
        data: {
          id: ulid().toLowerCase(),
          order_no: orderNo,
          organization_id: orgId,
          plan_id: plan.id,
          billing_cycle: billing_months === 12 ? 'yearly' : 'monthly',
          billing_months,
          amount: finalAmount,
          original_amount: originalAmount,
          status: 'pending',
          expires_at: expires,
        },
      });

      const wechatResult = await createWechatPayNativeOrder({
        out_trade_no: orderNo,
        description: `套餐订阅-${plan.name}`,
        amount_yuan: finalAmount,
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

      // 无 code_url 且微信支付未启用时，标记为可模拟支付
      const payload = order as typeof order & { simulate_pay_available?: boolean };

      if (!config.wechatPayEnabled) {
        payload.simulate_pay_available = true;
      }

      res.status(201).json(payload);
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
      if (!config.wechatPayEnabled && order.status === 'pending' && !order.code_url) {
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
 *       403:
 *         description: 非开发环境
 */
router.post(
  '/organizations/:org_id/orders/:order_id/simulate-pay',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (config.wechatPayEnabled) {
        return next(createAppError(403, '模拟支付仅在未配置微信支付时可用'));
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
