import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { ulid } from 'ulid';
import { prisma } from '../../lib/prisma.js';
import { config } from '../../config.js';
import { requireConsoleAuth } from '../../middlewares/requireAuth.js';
import { getConsoleUser } from '../../utils/context.js';
import { createAppError } from '../../utils/appError.js';
import { createWechatPayNativeOrder } from '../../services/wechatPayNative.js';

const router: Router = Router();

router.use(requireConsoleAuth);

router.get('/pricing', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const pricing = await prisma.usagePricing.findFirst({
      where: { is_active: true },
    });
    if (!pricing) {
      res.json({
        price_per_org: 0,
        price_per_apartment: 0,
        price_per_room: 0,
        price_per_member: 0,
      });
      return;
    }
    return res.json({
      price_per_org: Number(pricing.price_per_org),
      price_per_apartment: Number(pricing.price_per_apartment),
      price_per_room: Number(pricing.price_per_room),
      price_per_member: Number(pricing.price_per_member),
    });
  } catch (e) {
    return next(e);
  }
});

router.get('/quota', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = getConsoleUser(req);
    if (!user) return next(createAppError(401, '未授权'));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const quotas = await prisma.usageQuota.findMany({
      where: {
        user_id: user.id,
        valid_from: { lte: today },
        valid_to: { gte: today },
      },
    });
    const total = quotas.reduce(
      (acc, q) => ({
        orgs: acc.orgs + q.orgs,
        apartments: acc.apartments + q.apartments,
        rooms: acc.rooms + q.rooms,
        members: acc.members + q.members,
      }),
      { orgs: 0, apartments: 0, rooms: 0, members: 0 }
    );
    res.json(total);
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
    const { orgs, apartments, rooms, members } = parsed.data;
    if (orgs === 0 && apartments === 0 && rooms === 0 && members === 0) {
      return next(createAppError(400, '至少选择一种对象数量'));
    }
    const pricing = await prisma.usagePricing.findFirst({
      where: { is_active: true },
    });
    if (!pricing) return next(createAppError(400, '按量定价未配置'));
    const amount =
      Number(pricing.price_per_org) * orgs +
      Number(pricing.price_per_apartment) * apartments +
      Number(pricing.price_per_room) * rooms +
      Number(pricing.price_per_member) * members;
    if (amount <= 0) return next(createAppError(400, '订单金额必须大于 0'));
    const orderNo = `USG${Date.now()}`;
    const expires = new Date();
    expires.setHours(expires.getHours() + 2);
    const order = await prisma.usageQuotaOrder.create({
      data: {
        id: ulid().toLowerCase(),
        order_no: orderNo,
        user_id: user.id,
        orgs,
        apartments,
        rooms,
        members,
        amount,
        status: 'pending',
        expires_at: expires,
      },
    });
    const wechatResult = await createWechatPayNativeOrder({
      out_trade_no: orderNo,
      description: `按量购买-组织${orgs}公寓${apartments}房间${rooms}成员${members}`,
      amount_yuan: amount,
      time_expire: expires.toISOString(),
    });
    if (wechatResult?.code_url) {
      await prisma.usageQuotaOrder.update({
        where: { id: order.id },
        data: { code_url: wechatResult.code_url },
      });
      const updated = await prisma.usageQuotaOrder.findUnique({ where: { id: order.id } });
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
    const order = await prisma.usageQuotaOrder.findFirst({
      where: { id: req.params.order_id, user_id: user.id },
    });
    if (!order) return next(createAppError(404, '订单不存在'));
    const payload = order as typeof order & { simulate_pay_available?: boolean };
    if (config.isDev && order.status === 'pending' && !order.code_url) {
      payload.simulate_pay_available = true;
    }
    res.json(payload);
  } catch (e) {
    return next(e);
  }
});

router.post('/orders/:order_id/simulate-pay', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!config.isDev) return next(createAppError(403, '模拟支付仅限开发环境'));
    const user = getConsoleUser(req);
    if (!user) return next(createAppError(401, '未授权'));
    const order = await prisma.usageQuotaOrder.findFirst({
      where: { id: req.params.order_id, user_id: user.id },
    });
    if (!order) return next(createAppError(404, '订单不存在'));
    if (order.status !== 'pending') return next(createAppError(400, '订单状态不允许模拟支付'));
    const { fulfillUsageQuota } = await import('../../services/fulfillUsageQuota.js');
    await prisma.usageQuotaOrder.update({
      where: { id: order.id },
      data: { status: 'paid', paid_at: new Date() },
    });
    await fulfillUsageQuota(order.id);
    const updated = await prisma.usageQuotaOrder.findUnique({ where: { id: order.id } });
    res.json(updated ?? order);
  } catch (e) {
    return next(e);
  }
});

export const usageRouter = router;
