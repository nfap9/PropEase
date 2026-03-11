import { Router } from 'express';
import { z } from 'zod';
import { requireAdmin } from '../../../middlewares/requireAdmin.js';
import { createAppError } from '../../../utils/appError.js';
import { defaultPromotionService } from '../../../services/promotion.service.js';
import { auditAdminAction } from '../../../utils/audit.js';
import type { Request, Response, NextFunction } from 'express';

const router: Router = Router();

router.use(requireAdmin);

// --- 优惠活动管理 ---

// 优惠活动列表
router.get('/promotions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const isActive = req.query.is_active === 'true' ? true : req.query.is_active === 'false' ? false : undefined;
    const planId = typeof req.query.plan_id === 'string' ? req.query.plan_id : undefined;

    const list = await defaultPromotionService.listPromotions({
      is_active: isActive,
      plan_id: planId,
    });
    res.json(list);
  } catch (e) {
    next(e);
  }
});

// 获取单个优惠活动
router.get('/promotions/:promotion_id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const promotion = await defaultPromotionService.getPromotionById(req.params.promotion_id);
    res.json(promotion);
  } catch (e) {
    next(e);
  }
});

// 创建优惠活动 Schema
const PromotionCreateSchema = z.object({
  name: z.string().min(1).max(100),
  code: z.string().min(1).max(50),
  description: z.string().max(500).optional().nullable(),
  type: z.enum(['discount', 'gift', 'mixed']),
  discount_value: z.number().min(0).optional().nullable(),
  gift_months: z.number().int().min(0).optional().nullable(),
  start_date: z.string().transform((v) => new Date(v)),
  end_date: z.string().transform((v) => new Date(v)).optional().nullable(),
  is_active: z.boolean().optional(),
  plan_ids: z.array(z.string()).optional(),
});

// 创建优惠活动
router.post('/promotions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = PromotionCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(createAppError(422, '参数校验失败'));
    }

    const promotion = await defaultPromotionService.createPromotion({
      name: parsed.data.name,
      code: parsed.data.code,
      description: parsed.data.description,
      type: parsed.data.type,
      discount_value: parsed.data.discount_value,
      gift_months: parsed.data.gift_months,
      start_date: parsed.data.start_date,
      end_date: parsed.data.end_date,
      is_active: parsed.data.is_active,
      plan_ids: parsed.data.plan_ids,
    });

    auditAdminAction(req, 'admin:promotion:create', promotion.id, {
      name: parsed.data.name,
      code: parsed.data.code,
    });

    res.status(201).json(promotion);
  } catch (e) {
    next(e);
  }
});

// 更新优惠活动 Schema
const PromotionUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  type: z.enum(['discount', 'gift', 'mixed']).optional(),
  discount_value: z.number().min(0).optional().nullable(),
  gift_months: z.number().int().min(0).optional().nullable(),
  start_date: z.string().transform((v) => new Date(v)).optional(),
  end_date: z.string().transform((v) => new Date(v)).optional().nullable(),
  is_active: z.boolean().optional(),
});

// 更新优惠活动
router.put('/promotions/:promotion_id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = PromotionUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(createAppError(422, '参数校验失败'));
    }

    const promotion = await defaultPromotionService.updatePromotion(
      req.params.promotion_id,
      {
        name: parsed.data.name,
        description: parsed.data.description,
        type: parsed.data.type,
        discount_value: parsed.data.discount_value,
        gift_months: parsed.data.gift_months,
        start_date: parsed.data.start_date,
        end_date: parsed.data.end_date,
        is_active: parsed.data.is_active,
      }
    );

    auditAdminAction(req, 'admin:promotion:update', req.params.promotion_id, parsed.data);

    res.json(promotion);
  } catch (e) {
    next(e);
  }
});

// 删除优惠活动
router.delete('/promotions/:promotion_id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await defaultPromotionService.deletePromotion(req.params.promotion_id);
    auditAdminAction(req, 'admin:promotion:delete', req.params.promotion_id);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

// 关联套餐到优惠活动
router.post(
  '/promotions/:promotion_id/plans',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const schema = z.object({ plan_id: z.string() });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return next(createAppError(422, '参数校验失败'));
      }

      await defaultPromotionService.addPlanToPromotion(
        req.params.promotion_id,
        parsed.data.plan_id
      );

      auditAdminAction(req, 'admin:promotion:add_plan', req.params.promotion_id, {
        plan_id: parsed.data.plan_id,
      });

      res.status(200).json({ message: '已关联' });
    } catch (e) {
      next(e);
    }
  }
);

// 取消关联套餐
router.delete(
  '/promotions/:promotion_id/plans/:plan_id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await defaultPromotionService.removePlanFromPromotion(
        req.params.promotion_id,
        req.params.plan_id
      );

      auditAdminAction(req, 'admin:promotion:remove_plan', req.params.promotion_id, {
        plan_id: req.params.plan_id,
      });

      res.status(204).send();
    } catch (e) {
      next(e);
    }
  }
);

// --- 套餐定价管理 ---

// 获取套餐定价列表
router.get('/plans/:plan_id/pricing', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pricing = await defaultPromotionService.listPlanPricing(req.params.plan_id);
    res.json(pricing);
  } catch (e) {
    next(e);
  }
});

// 批量更新套餐定价 Schema
const PlanPricingBatchSchema = z.object({
  pricing: z.array(
    z.object({
      months: z.number().int().min(1),
      price: z.number().min(0),
      is_active: z.boolean().optional(),
      sort_order: z.number().int().optional(),
    })
  ),
});

// 批量更新套餐定价
router.put('/plans/:plan_id/pricing', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = PlanPricingBatchSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(createAppError(422, '参数校验失败'));
    }

    const pricing = await defaultPromotionService.batchUpsertPlanPricing(
      req.params.plan_id,
      parsed.data.pricing
    );

    auditAdminAction(req, 'admin:plan:pricing:update', req.params.plan_id, {
      count: parsed.data.pricing.length,
    });

    res.json(pricing);
  } catch (e) {
    next(e);
  }
});

// 删除单个定价
router.delete(
  '/plans/:plan_id/pricing/:pricing_id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await defaultPromotionService.deletePlanPricing(req.params.pricing_id);

      auditAdminAction(req, 'admin:plan:pricing:delete', req.params.plan_id, {
        pricing_id: req.params.pricing_id,
      });

      res.status(204).send();
    } catch (e) {
      next(e);
    }
  }
);

export { router as adminPromotionsRouter };
