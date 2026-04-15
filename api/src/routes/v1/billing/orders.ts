import { Router, type Request, type Response, type NextFunction } from 'express';
import type { Router as RouterType } from 'express';
import { defaultBillingService } from '../../../services/billing.service.js';
import { createAppError } from '../../../utils/appError.js';
import { requireConsoleAuth } from '../../../middlewares/requireAuth.js';
import { getConsoleUser } from '../../../utils/context.js';

export const billingOrdersRouter: RouterType = Router();

const billingService = defaultBillingService;

// 所有路由需要用户认证
billingOrdersRouter.use(requireConsoleAuth);

/**
 * POST /billing/orders
 * 创建统一订单
 */
billingOrdersRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = getConsoleUser(req);
    if (!user) return next(createAppError(401, '未授权'));
    const { order_type, organization_id, service_id, pricing_id, billing_months, usage_details } = req.body;

    let order;

    if (order_type === 'subscription') {
      if (!organization_id || !service_id) {
        throw createAppError(400, 'subscription 订单需要 organization_id 和 service_id');
      }

      order = await billingService.createSubscriptionOrder({
        organizationId: organization_id,
        serviceId: service_id,
        pricingId: pricing_id,
        billingMonths: billing_months,
      });
    } else if (order_type === 'usage') {
      if (!organization_id || !usage_details) {
        throw createAppError(400, 'usage 订单需要 organization_id 和 usage_details');
      }

      order = await billingService.createUsageOrder({
        userId: user.id,
        organizationId: organization_id,
        usageDetails: usage_details,
      });
    } else {
      throw createAppError(400, 'order_type 必须是 subscription 或 usage');
    }

    res.json({
      code: 0,
      data: order,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /billing/orders/:id
 * 获取订单详情
 */
billingOrdersRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = getConsoleUser(req);
    if (!user) return next(createAppError(401, '未授权'));

    const order = await billingService.getOrder(req.params.id);

    if (!order) {
      throw createAppError(404, '订单不存在');
    }

    // 验证用户有权查看该订单
    if (order.user_id && order.user_id !== user.id) {
      throw createAppError(403, '无权查看此订单');
    }

    res.json({
      code: 0,
      data: order,
    });
  } catch (error) {
    next(error);
  }
});
