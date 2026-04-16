import { Router, type Router as RouterType } from 'express';
import { requireConsoleAuth } from '../../middlewares/requireAuth.js';
import * as ctrl from './subscriptions.controller.js';

const router: RouterType = Router();

router.use(requireConsoleAuth);

// storefront
router.get('/storefront', ctrl.getStorefront);

// organization subscription
router.get('/organizations/:org_id/subscription', ctrl.getSubscription);
router.get('/organizations/:org_id/subscription/status', ctrl.getSubscriptionStatus);
router.post('/organizations/:org_id/subscription', ctrl.subscribe);
router.put('/organizations/:org_id/subscription', ctrl.updateSubscription);
router.post('/organizations/:org_id/subscription/cancel', ctrl.cancelSubscription);

// orders
router.post('/organizations/:org_id/orders', ctrl.createOrder);
router.post('/organizations/:org_id/orders/preview', ctrl.previewOrder);
router.get('/organizations/:org_id/orders/:order_id', ctrl.getOrder);
router.post('/organizations/:org_id/orders/:order_id/simulate-pay', ctrl.simulatePay);

export const subscriptionsRouter = router;
