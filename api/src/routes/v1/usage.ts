import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { requireConsoleAuth } from '../../middlewares/requireAuth.js';
import { getConsoleUser } from '../../utils/context.js';
import { createAppError } from '../../utils/appError.js';
import { defaultBillingService } from '../../services/billing.service.js';
import { prisma } from '../../lib/prisma.js';

const router: Router = Router();

// 显式拦截已删除路径，在 auth 之前拦截，避免未授权用户看到 404
router.all('/orders/:order_id/simulate-pay', (_req, _res, next) =>
  next(createAppError(404, 'Not Found'))
);

router.use(requireConsoleAuth);

router.get('/pricing', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const pricing = await defaultBillingService.getUsagePricing();
    res.json(pricing);
  } catch (e) {
    return next(e);
  }
});

router.get('/quota', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = getConsoleUser(req);
    if (!user) return next(createAppError(401, '未授权'));

    // 获取用户的组织
    const membership = await prisma.organizationMember.findFirst({
      where: { user_id: user.id, role: 'owner' },
    });

    if (!membership) {
      return res.json({ orgs: 0, apartments: 0, rooms: 0, members: 0 });
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const quota = await defaultBillingService.getUsageAllowance(membership.organization_id, year, month);
    res.json(quota);
  } catch (e) {
    return next(e);
  }
});

const CreateUsageOrderSchema = z.object({
  orgs: z.number().int().min(0),
  apartments: z.number().int().min(0),
  rooms: z.number().int().min(0),
  members: z.number().int().min(0),
});

router.post('/orders', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = getConsoleUser(req);
    if (!user) return next(createAppError(401, '未授权'));
    const parsed = CreateUsageOrderSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));

    // 获取用户的组织
    const membership = await prisma.organizationMember.findFirst({
      where: { user_id: user.id, role: 'owner' },
    });

    if (!membership) {
      return next(createAppError(400, '用户没有关联组织'));
    }

    const order = await defaultBillingService.createUsageOrder({
      userId: user.id,
      organizationId: membership.organization_id,
      usageDetails: parsed.data,
    });

    res.status(201).json(order);
  } catch (e) {
    return next(e);
  }
});

router.get('/orders/:order_id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = getConsoleUser(req);
    if (!user) return next(createAppError(401, '未授权'));
    const order = await defaultBillingService.getOrder(req.params.order_id);

    if (!order || order.user_id !== user.id) {
      return next(createAppError(404, '订单不存在'));
    }

    res.json(order);
  } catch (e) {
    return next(e);
  }
});

export const usageRouter = router;
