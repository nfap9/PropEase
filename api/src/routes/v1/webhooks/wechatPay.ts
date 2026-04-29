import { Router, type Request, type Response, type NextFunction } from 'express';
import { config } from '../../../config.js';
import { decryptWechatPayResource } from '../../../utils/wechatPayCallback.js';
import { defaultBillingService } from '../../../services/billing.service.js';
import { defaultBillingOrderRepo } from '../../../repositories/billing-order.repo.js';
import { prisma } from '../../../lib/prisma.js';

const router: Router = Router();

/**
 * 微信支付回调。不包装响应体，返回微信约定格式。
 * 验签可选（需 rawBody）；此处仅解密并处理。
 */
router.post('/', async (req: Request, res: Response, _next: NextFunction) => {
  
    if (!config.wechatPayEnabled || !config.wechatApiv3Key) {
      res.status(500).json({ code: 'FAIL', message: '支付未启用' });
      return;
    }

    const body = req.body as {
      event_type?: string;
      resource?: {
        algorithm?: string;
        ciphertext?: string;
        nonce?: string;
        associated_data?: string;
      };
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

    const order = await defaultBillingOrderRepo.findByOrderNo(outTradeNo);
    if (order) {
      if (order.status === 'paid') {
        res.status(200).json({ code: 'SUCCESS', message: 'already paid' });
        return;
      }

      // 更新订单状态
      await defaultBillingService.updateOrderStatus(order.id, 'paid', transactionId);

      // 履行订单
      if (order.order_type === 'subscription') {
        // 履行订阅
        if (order.organization_id) {
          try {
            const startDate = new Date();
            const billingMonths = order.billing_months ?? 1;
            const totalGiftMonths = order.total_gift_months ?? 0;
            const totalMonths = billingMonths + totalGiftMonths;
            const endDate = new Date(startDate);
            endDate.setMonth(endDate.getMonth() + totalMonths);

            // 获取新订单对应的服务 sort_order，用于判断是否升级
            let newServiceSortOrder = 0;
            if (order.service_id) {
              const newService = await prisma.serviceProduct.findUnique({
                where: { id: order.service_id },
                select: { sort_order: true },
              });
              if (newService) {
                newServiceSortOrder = newService.sort_order;
              }
            }

            const existingSub = await defaultBillingOrderRepo.findSubscriptionByOrgId(order.organization_id);

            if (existingSub) {
              const existingSortOrder = existingSub.service?.sort_order ?? 0;
              const isSameService = existingSub.service_id === order.service_id;
              const isUpgrade = !!order.service_id && newServiceSortOrder > existingSortOrder;

              let effectiveStartDate: Date;
              let effectiveEndDate: Date;

              if (isSameService) {
                // 相同服务：叠加时长 - 从现有到期日继续计算
                effectiveStartDate = new Date(existingSub.end_date!);
                if (effectiveStartDate < new Date()) {
                  effectiveStartDate = new Date();
                }
              } else if (isUpgrade) {
                // 升级服务：从当前时间开始计算新时长
                effectiveStartDate = new Date();
              } else {
                // 降级或同级：保持原有逻辑（按原价不抵扣）
                effectiveStartDate = startDate;
              }

              effectiveEndDate = new Date(effectiveStartDate);
              effectiveEndDate = new Date(effectiveStartDate);
              effectiveEndDate.setMonth(effectiveEndDate.getMonth() + totalMonths);

              const updateData: Record<string, unknown> = {
                status: 'active',
                billing_months: billingMonths,
                start_date: effectiveStartDate,
                end_date: effectiveEndDate,
                auto_renew: true,
                next_service: { disconnect: true },
              };
              if (order.service_id) {
                updateData.service = { connect: { id: order.service_id } };
              }
              await defaultBillingOrderRepo.updateSubscription(order.organization_id, updateData);
            } else {
              const createData: Record<string, unknown> = {
                id: order.subscription_id ?? order.id,
                organization: { connect: { id: order.organization_id } },
                billing_months: billingMonths,
                start_date: startDate,
                end_date: endDate,
                auto_renew: true,
              };
              if (order.service_id) {
                createData.service = { connect: { id: order.service_id } };
              }
              await defaultBillingOrderRepo.createSubscription(createData as Parameters<typeof defaultBillingOrderRepo.createSubscription>[0]);
            }
          } catch (e) {
            console.error('Fulfill subscription failed:', e);
          }
        }
      } else if (order.order_type === 'usage') {
        // 履行用量配额
        if (order.organization_id) {
          try {
            await defaultBillingService.fulfillUsageAllowance(order.id, order.organization_id);
          } catch (e) {
            console.error('Fulfill usage quota failed:', e);
          }
        }
      }

      res.status(200).json({ code: 'SUCCESS', message: 'ok' });
      return;
    }

    res.status(200).json({ code: 'SUCCESS', message: 'ok' });
  
});

export const wechatPayWebhookRouter = router;
