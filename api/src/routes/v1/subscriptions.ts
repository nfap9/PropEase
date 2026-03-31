import { Router, type Router as RouterType } from 'express';
import { requireConsoleAuth } from '../../middlewares/requireAuth.js';
import { createAppError } from '../../utils/appError.js';
import * as ctrl from './subscriptions.controller.js';

const router: RouterType = Router();

// 显式拦截已删除路径，在 auth 之前拦截，避免未授权用户看到 404
router.all('/organizations/:org_id/orders/:order_id/simulate-pay', (_req, _res, next) =>
  next(createAppError(404, 'Not Found'))
);

router.use(requireConsoleAuth);

// storefront
router.get('/storefront', ctrl.getStorefront);
router.post('/storefront/calculate-price', ctrl.calculatePrice);

// plans
router.get('/plans', ctrl.listPlans);
router.get('/plans/:service_id', ctrl.getPlan);

// organization subscription
router.get('/organizations/:org_id/subscription', ctrl.getSubscription);
router.get('/organizations/:org_id/subscription/status', ctrl.getSubscriptionStatus);
router.post('/organizations/:org_id/subscription', ctrl.subscribe);
router.put('/organizations/:org_id/subscription', ctrl.updateSubscription);
router.post('/organizations/:org_id/subscription/cancel', ctrl.cancelSubscription);

// orders
router.post('/organizations/:org_id/orders', ctrl.createOrder);
router.get('/organizations/:org_id/orders/:order_id', ctrl.getOrder);

export const subscriptionsRouter = router;
