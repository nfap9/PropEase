import { Router } from 'express';
import { wechatPayWebhookRouter } from './wechatPay.js';

const router: Router = Router();

router.use('/wechat-pay', wechatPayWebhookRouter);

export const webhooksRouter = router;
