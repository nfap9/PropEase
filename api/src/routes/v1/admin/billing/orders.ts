import { Router, type Request, type Response, type NextFunction } from 'express';
import type { Router as RouterType } from 'express';
import { defaultBillingService } from '../../../../services/billing.service.js';
import { createAppError } from '../../../../utils/appError.js';

export const billingAdminOrdersRouter: RouterType = Router();

const billingService = defaultBillingService;

/**
 * GET /admin/billing/orders
 * 获取订单列表
 */
billingAdminOrdersRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { order_type, organization_id, status, limit, offset } = req.query;

    const result = await billingService.listOrders({
      orderType: order_type as 'subscription' | 'usage' | undefined,
      organizationId: organization_id as string | undefined,
      status: status as string | undefined,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });

    res.json({
      code: 0,
      data: {
        orders: result.orders,
        total: result.total,
        limit: limit ? Number(limit) : 50,
        offset: offset ? Number(offset) : 0,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /admin/billing/orders/:id
 * 获取订单详情
 */
billingAdminOrdersRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await billingService.getOrder(req.params.id);

    if (!order) {
      throw createAppError(404, '订单不存在');
    }

    res.json({
      code: 0,
      data: order,
    });
  } catch (error) {
    next(error);
  }
});
