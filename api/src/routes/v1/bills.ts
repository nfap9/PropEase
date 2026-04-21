import { Router, type Router as RouterType } from 'express';
import { requireConsoleAuth } from '../../middlewares/requireAuth.js';
import * as ctrl from './bills.controller.js';

const router: RouterType = Router();
router.use(requireConsoleAuth);

router.post('/query', ctrl.query);
router.post('/generate', ctrl.generate);
router.post('/', ctrl.create);
router.post('/export', ctrl.exportExcel);
router.get('/:id', ctrl.get);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.del);
router.get('/:id/payments', ctrl.listPayments);
router.post('/:id/payments', ctrl.addPayment);
router.get('/:id/fee-items', ctrl.listFeeItems);
router.get('/:id/pdf', ctrl.exportPdf);

export const billsRouter = router;
