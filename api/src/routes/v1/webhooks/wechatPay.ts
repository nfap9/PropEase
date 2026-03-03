import { Router, type Request, type Response, type NextFunction } from 'express';
import { prisma } from '../../../lib/prisma.js';
import { config } from '../../../config.js';
import { decryptWechatPayResource } from '../../../utils/wechatPayCallback.js';
import { fulfillSubscription } from '../../../services/fulfillSubscription.js';
import { fulfillUsageQuota } from '../../../services/fulfillUsageQuota.js';

const router: Router = Router();

/**
 * 微信支付回调。不包装响应体，返回微信约定格式。
 * 验签可选（需 rawBody）；此处仅解密并处理。
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!config.wechatPayEnabled || !config.wechatApiv3Key) {
      res.status(500).json({ code: 'FAIL', message: '支付未启用' });
      return;
    }

    const body = req.body as {
      event_type?: string;
      resource?: { algorithm?: string; ciphertext?: string; nonce?: string; associated_data?: string };
    };

    const eventType = body?.event_type;
    const resource = body?.resource;
    if (!resource?.ciphertext || !resource?.nonce) {
      res.status(500).json({ code: 'FAIL', message: '验签或解密失败' });
      return;
    }

    const decrypted = decryptWechatPayResource(
      resource.ciphertext,
      resource.nonce,
      resource.associated_data ?? '',
      config.wechatApiv3Key
    );
    if (!decrypted || typeof decrypted !== 'object') {
      res.status(500).json({ code: 'FAIL', message: '验签或解密失败' });
      return;
    }

    if (eventType !== 'TRANSACTION.SUCCESS') {
      res.status(200).json({ code: 'SUCCESS', message: 'ignored' });
      return;
    }

    const outTradeNo = decrypted.out_trade_no as string | undefined;
    const transactionId = decrypted.transaction_id as string | undefined;
    if (!outTradeNo) {
      res.status(200).json({ code: 'FAIL', message: 'missing out_trade_no' });
      return;
    }

    const subOrder = await prisma.subscriptionOrder.findFirst({
      where: { order_no: outTradeNo },
    });
    if (subOrder) {
      if (subOrder.status === 'paid') {
        res.status(200).json({ code: 'SUCCESS', message: 'already paid' });
        return;
      }
      const now = new Date();
      await prisma.subscriptionOrder.update({
        where: { id: subOrder.id },
        data: {
          status: 'paid',
          wechat_transaction_id: transactionId ?? null,
          paid_at: now,
        },
      });
      try {
        await fulfillSubscription(subOrder.id);
      } catch (e) {
        console.error('Fulfill subscription failed:', e);
      }
      res.status(200).json({ code: 'SUCCESS', message: 'ok' });
      return;
    }

    const usageOrder = await prisma.usageQuotaOrder.findFirst({
      where: { order_no: outTradeNo },
    });
    if (usageOrder) {
      if (usageOrder.status === 'paid') {
        res.status(200).json({ code: 'SUCCESS', message: 'already paid' });
        return;
      }
      const now = new Date();
      await prisma.usageQuotaOrder.update({
        where: { id: usageOrder.id },
        data: {
          status: 'paid',
          wechat_transaction_id: transactionId ?? null,
          paid_at: now,
        },
      });
      try {
        await fulfillUsageQuota(usageOrder.id);
      } catch (e) {
        console.error('Fulfill usage quota failed:', e);
      }
      res.status(200).json({ code: 'SUCCESS', message: 'ok' });
      return;
    }

    res.status(200).json({ code: 'SUCCESS', message: 'ok' });
  } catch (e) {
    next(e);
  }
});

export const wechatPayWebhookRouter = router;
