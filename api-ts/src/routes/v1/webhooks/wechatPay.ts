import { Router, type Request, type Response, type NextFunction } from 'express';

const router: Router = Router();

/**
 * 微信支付回调。不包装响应体，返回微信约定格式。
 */
router.post('/', (req: Request, res: Response, _next: NextFunction) => {
  void req.body;
  res.json({ code: 'SUCCESS', message: '成功' });
});

export const wechatPayWebhookRouter = router;
