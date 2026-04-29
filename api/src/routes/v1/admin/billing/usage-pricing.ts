import { Router, type Request, type Response, type NextFunction } from 'express';
import type { Router as RouterType } from 'express';
import { defaultBillingService } from '../../../../services/billing.service.js';
import { createAppError } from '../../../../utils/appError.js';

export const billingAdminUsagePricingRouter: RouterType = Router();

const billingService = defaultBillingService;

/**
 * GET /admin/billing/usage-pricing
 * 获取用量单价配置
 */
billingAdminUsagePricingRouter.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const pricing = await billingService.getUsagePricing();

    // 转换为平面结构
    const result: Record<string, number> = {};
    for (const p of pricing) {
      const key = `price_per_${p.unit_type}`;
      result[key] = p.price_per_unit;
    }

    res.json({
      code: 0,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /admin/billing/usage-pricing
 * 更新用量单价配置
 */
billingAdminUsagePricingRouter.put('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { price_per_org, price_per_apartment, price_per_room, price_per_member } = req.body;

    const pricing = [];
    if (price_per_org !== undefined) {
      pricing.push({ unit_type: 'org', price_per_unit: price_per_org });
    }
    if (price_per_apartment !== undefined) {
      pricing.push({ unit_type: 'apartment', price_per_unit: price_per_apartment });
    }
    if (price_per_room !== undefined) {
      pricing.push({ unit_type: 'room', price_per_unit: price_per_room });
    }
    if (price_per_member !== undefined) {
      pricing.push({ unit_type: 'member', price_per_unit: price_per_member });
    }

    if (pricing.length === 0) {
      throw createAppError(400, '至少需要提供一个价格字段');
    }

    await billingService.updateUsagePricing(pricing);

    res.json({
      code: 0,
      message: '用量单价更新成功',
    });
  } catch (error) {
    next(error);
  }
});
