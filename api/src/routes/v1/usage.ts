import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { requireConsoleAuth } from '../../middlewares/requireAuth.js';
import { getConsoleUser } from '../../utils/context.js';
import { createAppError } from '../../utils/appError.js';
import { defaultUsageService } from '../../services/usage.service.js';
import { createWechatPayNativeOrder } from '../../services/wechatPayNative.js';
import { defaultUsageRepo } from '../../repositories/usage.repo.js';

const router: Router = Router();

// 显式拦截已删除路径，在 auth 之前拦截，避免未授权用户看到 404
router.all('/orders/:order_id/simulate-pay', (_req, _res, next) =>
  next(createAppError(404, 'Not Found'))
);

router.use(requireConsoleAuth);

router.get('/pricing', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const pricing = await defaultUsageService.getPricing();
    res.json(pricing);
  } catch (e) {
    return next(e);
  }
});

router.get('/quota', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = getConsoleUser(req);
    if (!user) return next(createAppError(401, '未授权'));
    const quota = await defaultUsageService.getQuota(user.id);
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

    const order = await defaultUsageService.createOrder(user.id, parsed.data);

    // 创建微信支付订单
    const expires = order.expires_at;
    const wechatResult = await createWechatPayNativeOrder({
      out_trade_no: order.order_no,
      description: `按量购买-组织${parsed.data.orgs}公寓${parsed.data.apartments}房间${parsed.data.rooms}成员${parsed.data.members}`,
      amount_yuan: Number(order.amount),
      time_expire: expires
        ? expires.toISOString()
        : new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    });

    if (wechatResult?.code_url) {
      await defaultUsageRepo.updateOrder(order.id, { code_url: wechatResult.code_url });
      const updated = await defaultUsageRepo.findOrderByIdOnly(order.id);
      return res.status(201).json(updated ?? order);
    }
    res.status(201).json(order);
  } catch (e) {
    return next(e);
  }
});

router.get('/orders/:order_id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = getConsoleUser(req);
    if (!user) return next(createAppError(401, '未授权'));
    const order = await defaultUsageService.getOrder(user.id, req.params.order_id);
    res.json(order);
  } catch (e) {
    return next(e);
  }
});

export const usageRouter = router;
