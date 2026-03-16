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

// ==================== 服务产品查询接口 ====================

/**
 * @openapi
 * /subscriptions/plans:
 *   get:
 *     summary: 获取服务产品列表
 *     tags: [订阅管理]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 服务产品列表
 */
router.get('/plans', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const services = await defaultSubscriptionService.listServices();
    res.json(services);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /subscriptions/plans/{service_id}:
 *   get:
 *     summary: 获取服务产品详情
 *     tags: [订阅管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: service_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 服务产品详情
 */
router.get('/plans/:service_id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const service = await defaultSubscriptionService.getServiceById(req.params.service_id);
    res.json(service);
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
 * /subscriptions/organizations/{org_id}/subscription:
 *   post:
 *     summary: 订阅服务
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
 *             required: [service_id]
 *             properties:
 *               service_id:
 *                 type: string
 *                 description: 服务产品ID
 *               billing_cycle:
 *                 type: string
 *                 enum: [monthly, yearly]
 *               auto_renew:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: 订阅成功
 */
router.post(
  '/organizations/:org_id/subscription',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await requireOrgMembership(req, 'org_id');
      const body = req.body as { service_id?: string; billing_cycle?: string; auto_renew?: boolean };
      if (!body?.service_id) {
        return next(createAppError(400, '缺少 service_id'));
      }
      const billingMonths = body.billing_cycle === 'yearly' ? 12 : 1;
      const sub = await defaultSubscriptionService.subscribe(req.params.org_id, body.service_id, billingMonths);
      res.json(sub);
    } catch (e) {
      next(e);
    }
  }
);

/**
 * @openapi
 * /subscriptions/organizations/{org_id}/subscription:
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
 *             required: [service_id]
 *             properties:
 *               service_id:
 *                 type: string
 *               effective:
 *                 type: string
 *                 enum: [immediate, next_cycle]
 *     responses:
 *       200:
 *         description: 更新成功
 */
router.put(
  '/organizations/:org_id/subscription',
  async (req: Request, res: Response, next: NextFunction) => {
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
  service_id: z.string(),
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
 *             required: [service_id]
 *             properties:
 *               service_id:
 *                 type: string
 *                 description: 服务产品ID
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

      const { service_id, billing_months } = parsed.data;

      // 使用 ServiceProduct 查询
      const service = await prisma.serviceProduct.findFirst({
        where: { id: service_id },
        include: {
          pricing: { where: { is_active: true } },
        },
      });

      if (!service) return next(createAppError(404, NotFoundMessages.PLAN));
      if (service.code === 'free') {
        return next(createAppError(400, '免费套餐无需购买，注册时已自动开通'));
      }

      const orgId = req.params.org_id;
      const sub = await prisma.organizationSubscription.findUnique({
        where: { organization_id: orgId },
        include: { service: true },
      });

      // 计算原始价格（周期定价）
      const pricing = service.pricing.find((p) => p.months === billing_months);
      const monthlyPricing = service.pricing.find((p) => p.months === 1);
      let selectedPricingId: string | undefined;
      let originalAmount: number;

      if (pricing) {
        selectedPricingId = pricing.id;
        originalAmount = Number(pricing.price);
      } else if (monthlyPricing) {
        selectedPricingId = billing_months === 1 ? monthlyPricing.id : undefined;
        originalAmount = Number(monthlyPricing.price) * billing_months;
      } else {
        return next(createAppError(400, '未找到合适的定价'));
      }

      const finalAmount = originalAmount;

      // 升级场景的差价计算（可选，暂时简化处理）
      if (sub && isSubscriptionActive(sub) && sub.service) {
        const currentSort = sub.service.sort_order;
        if (service.sort_order < currentSort) {
          return next(createAppError(400, '不支持降级到低等级套餐'));
        }
        // 升级场景可以计算差价，这里简化为直接使用新套餐价格
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
          service_id: service.id,
          pricing_id: selectedPricingId,
          billing_months,
          amount: finalAmount,
          original_amount: originalAmount,
          status: 'pending',
          expires_at: expires,
        },
      });

      const wechatResult = await createWechatPayNativeOrder({
        out_trade_no: orderNo,
        description: `服务订阅-${service.name}`,
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
        include: { service: true },
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
        include: { service: true },
      });
      res.json(updated ?? order);
    } catch (e) {
      next(e);
    }
  }
);

export const subscriptionsRouter = router;
