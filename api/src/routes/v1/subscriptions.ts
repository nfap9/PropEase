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
  createPromotionEngineService,
  type PromotionCalculationInput,
} from '../../services/promotion-engine.service.js';
import {
  createReferralService,
} from '../../services/referral.service.js';
import { createUserGiftService } from '../../services/user-gift.service.js';

const router: Router = Router();
const promotionEngineService = createPromotionEngineService();
const referralService = createReferralService();
const userGiftService = createUserGiftService();

router.use(requireConsoleAuth);

// ==================== 优惠相关接口 ====================

/**
 * @openapi
 * /subscriptions/validate-coupon:
 *   post:
 *     summary: 验证优惠码
 *     tags: [订阅管理]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, plan_id]
 *             properties:
 *               code:
 *                 type: string
 *               plan_id:
 *                 type: string
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: 验证结果
 */
router.post(
  '/validate-coupon',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.consoleUser?.id;
      if (!userId) {
        return next(createAppError(401, '未登录'));
      }

      const body = req.body as {
        code?: string;
        plan_id?: string;
        organization_id?: string;
        amount?: number;
      };

      if (!body?.code || !body?.plan_id) {
        return next(createAppError(400, '缺少优惠码或套餐ID'));
      }

      const orgId = body.organization_id ??
        (typeof req.headers['x-org-id'] === 'string' ? req.headers['x-org-id'] : undefined);
      if (!orgId) {
        return next(createAppError(400, '缺少组织ID'));
      }

      const result = await promotionEngineService.validateCouponCode({
        code: body.code,
        plan_id: body.plan_id,
        organization_id: orgId,
        user_id: userId,
        amount: body.amount ?? 0,
      });

      res.json({
        valid: result.valid,
        message: result.message,
        promotion: result.promotion
          ? {
              id: result.promotion.id,
              name: result.promotion.name,
              type: result.promotion.type,
              discount_value: result.promotion.discount_value
                ? Number(result.promotion.discount_value)
                : null,
              gift_months: result.promotion.gift_months,
            }
          : null,
      });
    } catch (e) {
      next(e);
    }
  }
);

/**
 * @openapi
 * /subscriptions/organizations/{org_id}/available-promotions:
 *   get:
 *     summary: 获取可用优惠列表
 *     tags: [订阅管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: org_id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: plan_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 可用优惠列表
 */
router.get(
  '/organizations/:org_id/available-promotions',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await requireOrgMembership(req, 'org_id');
      const userId = req.consoleUser?.id;
      if (!userId) {
        return next(createAppError(401, '未登录'));
      }

      const planId = req.query.plan_id as string;
      if (!planId) {
        return next(createAppError(400, '缺少套餐ID'));
      }

      // 检查是否是首次购买
      const existingSub = await prisma.organizationSubscription.findUnique({
        where: { organization_id: req.params.org_id },
      });
      const isFirstPurchase = !existingSub || !isSubscriptionActive(existingSub);

      const promotions = await promotionEngineService.getAvailablePromotions({
        plan_id: planId,
        organization_id: req.params.org_id,
        user_id: userId,
        is_first_purchase: isFirstPurchase,
      });

      // 获取用户余额
      const balance = await promotionEngineService.getUserBalance(req.params.org_id);

      res.json({
        promotions: promotions.map((p) => ({
          id: p.id,
          name: p.name,
          code: p.code,
          type: p.type,
          discount_value: p.discount_value ? Number(p.discount_value) : null,
          gift_months: p.gift_months,
          is_stackable: p.is_stackable,
        })),
        balance_available: balance,
      });
    } catch (e) {
      next(e);
    }
  }
);

/**
 * @openapi
 * /subscriptions/calculate-price:
 *   post:
 *     summary: 计算优惠价格
 *     tags: [订阅管理]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [plan_id, billing_months]
 *             properties:
 *               plan_id:
 *                 type: string
 *               billing_months:
 *                 type: integer
 *               coupon_code:
 *                 type: string
 *               use_balance:
 *                 type: boolean
 *               referral_code:
 *                 type: string
 *               organization_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: 价格计算结果
 */
router.post(
  '/calculate-price',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.consoleUser?.id;
      if (!userId) {
        return next(createAppError(401, '未登录'));
      }

      const body = req.body as {
        plan_id?: string;
        billing_months?: number;
        coupon_code?: string;
        use_balance?: boolean;
        referral_code?: string;
        organization_id?: string;
      };

      if (!body?.plan_id || !body?.billing_months) {
        return next(createAppError(400, '缺少套餐ID或购买月数'));
      }

      const orgId = body.organization_id ??
        (typeof req.headers['x-org-id'] === 'string' ? req.headers['x-org-id'] : undefined);
      if (!orgId) {
        return next(createAppError(400, '缺少组织ID'));
      }

      // 获取套餐和周期定价
      const plan = await prisma.subscriptionPlan.findFirst({
        where: { id: body.plan_id },
        include: {
          pricing: { where: { is_active: true } },
        },
      });
      if (!plan) {
        return next(createAppError(404, NotFoundMessages.PLAN));
      }

      // 计算原价
      const pricing = plan.pricing.find((p) => p.months === body.billing_months);
      const originalPrice = pricing ? Number(pricing.price) : Number(plan.price_monthly) * body.billing_months!;

      // 检查是否是首次购买
      const existingSub = await prisma.organizationSubscription.findUnique({
        where: { organization_id: orgId },
      });
      const isFirstPurchase = !existingSub || !isSubscriptionActive(existingSub);

      const input: PromotionCalculationInput = {
        plan_id: body.plan_id,
        billing_months: body.billing_months!,
        original_price: originalPrice,
        organization_id: orgId,
        user_id: userId,
        coupon_code: body.coupon_code,
        use_balance: body.use_balance,
        referral_code: body.referral_code,
        is_first_purchase: isFirstPurchase,
      };

      const result = await promotionEngineService.calculatePromotions(input);

      res.json({
        original_price: result.original_price,
        final_price: result.final_price,
        total_discount: result.total_discount,
        total_gift_months: result.total_gift_months,
        balance_deduction: result.balance_deduction,
        applied_promotions: result.applied_promotions,
        balance_available: result.balance_available,
        coupon_valid: result.coupon_valid,
        coupon_message: result.coupon_message,
        referral_valid: result.referral_valid,
        referral_message: result.referral_message,
      });
    } catch (e) {
      next(e);
    }
  }
);

// ==================== 推荐相关接口 ====================

/**
 * @openapi
 * /subscriptions/referrals/my-code:
 *   get:
 *     summary: 获取我的推荐码
 *     tags: [订阅管理]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 推荐码信息
 */
router.get(
  '/referrals/my-code',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.consoleUser?.id;
      if (!userId) {
        return next(createAppError(401, '未登录'));
      }

      const code = await referralService.getMyReferralCode(userId);
      const stats = await referralService.getReferralStats(userId);

      res.json({
        referral_code: code,
        stats,
      });
    } catch (e) {
      next(e);
    }
  }
);

/**
 * @openapi
 * /subscriptions/referrals/records:
 *   get:
 *     summary: 获取推荐记录列表
 *     tags: [订阅管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [referrer, referee]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 推荐记录列表
 */
router.get(
  '/referrals/records',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.consoleUser?.id;
      if (!userId) {
        return next(createAppError(401, '未登录'));
      }

      const type = (req.query.type as 'referrer' | 'referee') ?? 'referrer';
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = Math.min(parseInt(req.query.pageSize as string) || 20, 100);

      const result = await referralService.getReferralRecords({
        userId,
        type,
        page,
        pageSize,
      });

      res.json({
        records: result.records,
        total: result.total,
        page,
        pageSize,
      });
    } catch (e) {
      next(e);
    }
  }
);

// ==================== 余额相关接口 ====================

/**
 * @openapi
 * /subscriptions/organizations/{org_id}/balance:
 *   get:
 *     summary: 获取用户余额
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
 *         description: 余额信息
 */
router.get(
  '/organizations/:org_id/balance',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await requireOrgMembership(req, 'org_id');

      const balance = await userGiftService.getUserBalance(req.params.org_id);
      const giftMonths = await userGiftService.getAvailableGiftMonths(req.params.org_id);

      res.json({
        balance: balance ? Number(balance.balance) : 0,
        total_gifted: balance ? Number(balance.total_gifted) : 0,
        total_used: balance ? Number(balance.total_used) : 0,
        available_gift_months: giftMonths,
      });
    } catch (e) {
      next(e);
    }
  }
);

// ==================== 原有接口 ====================

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

// 创建订单的请求体验证 Schema
const CreateOrderSchema = z.object({
  plan_id: z.string(),
  billing_months: z.number().int().min(1).max(36).optional().default(1),
  coupon_code: z.string().optional(),
  use_balance: z.boolean().optional().default(false),
  referral_code: z.string().optional(),
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
 *               coupon_code:
 *                 type: string
 *               use_balance:
 *                 type: boolean
 *               referral_code:
 *                 type: string
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
      const userId = req.consoleUser?.id;
      if (!userId) {
        return next(createAppError(401, '未登录'));
      }

      const parsed = CreateOrderSchema.safeParse(req.body);
      if (!parsed.success) {
        return next(createAppError(422, '参数校验失败'));
      }

      const { plan_id, billing_months, coupon_code, use_balance, referral_code } = parsed.data;

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
            if (originalAmount <= 0) {
              return next(createAppError(400, '当前套餐剩余价值已覆盖新套餐，无需补差'));
            }
          }
        }
      }

      // 检查是否是首次购买
      const isFirstPurchase = !sub || !isSubscriptionActive(sub);

      // 绑定推荐关系
      let referralRecordId: string | null = null;
      if (referral_code && isFirstPurchase) {
        const referralRecord = await referralService.bindReferral({
          referralCode: referral_code,
          refereeUserId: userId,
          refereeOrgId: orgId,
        });
        if (referralRecord) {
          referralRecordId = referralRecord.id;
        }
      }

      // 计算优惠价格
      const calcInput: PromotionCalculationInput = {
        plan_id: plan.id,
        billing_months,
        original_price: originalAmount,
        organization_id: orgId,
        user_id: userId,
        coupon_code,
        use_balance,
        referral_code,
        is_first_purchase: isFirstPurchase,
      };

      const calcResult = await promotionEngineService.calculatePromotions(calcInput);
      const finalAmount = calcResult.final_price;

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
          applied_promotions: calcResult.applied_promotions.length > 0
            ? JSON.parse(JSON.stringify(calcResult.applied_promotions))
            : null,
          total_discount: calcResult.total_discount > 0 ? calcResult.total_discount : null,
          total_gift_months: calcResult.total_gift_months,
          coupon_code: coupon_code ?? null,
          balance_deduction: calcResult.balance_deduction > 0 ? calcResult.balance_deduction : null,
          referral_record_id: referralRecordId,
        },
      });

      // 如果使用了余额，扣减余额
      if (use_balance && calcResult.balance_deduction > 0) {
        await promotionEngineService.useUserBalance(orgId, calcResult.balance_deduction, order.id);
      }

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
        return res.status(201).json({
          ...(updated ?? order),
          promotion_details: {
            original_price: calcResult.original_price,
            total_discount: calcResult.total_discount,
            balance_deduction: calcResult.balance_deduction,
            applied_promotions: calcResult.applied_promotions,
            gift_months: calcResult.total_gift_months,
          },
        });
      }

      // 无 code_url 且微信支付未启用时，标记为可模拟支付
      const payload = order as typeof order & {
        simulate_pay_available?: boolean;
        promotion_details?: {
          original_price: number;
          total_discount: number;
          balance_deduction: number;
          applied_promotions: typeof calcResult.applied_promotions;
          gift_months: number;
        };
      };

      if (!config.wechatPayEnabled) {
        payload.simulate_pay_available = true;
      }

      payload.promotion_details = {
        original_price: calcResult.original_price,
        total_discount: calcResult.total_discount,
        balance_deduction: calcResult.balance_deduction,
        applied_promotions: calcResult.applied_promotions,
        gift_months: calcResult.total_gift_months,
      };

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

      // 处理推荐奖励
      await referralService.processReferralReward(order.id);

      // 应用优惠券使用记录
      const orderWithPromotions = await prisma.subscriptionOrder.findUnique({
        where: { id: order.id },
        select: { id: true, applied_promotions: true },
      });
      if (orderWithPromotions?.applied_promotions) {
        const appliedPromotions = orderWithPromotions.applied_promotions as Array<{
          id: string;
          code: string;
          name: string;
          type: string;
          discount_amount: number;
          gift_months: number;
          balance_deduction: number;
        }>;
        await promotionEngineService.applyPromotionsToOrder(order, appliedPromotions);
      }

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
