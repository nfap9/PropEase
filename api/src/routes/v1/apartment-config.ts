import { Router, type Router as RouterType } from 'express';
import { requireConsoleAuth } from '../../middlewares/requireAuth.js';
import * as ctrl from './apartment-config.controller.js';

const router: RouterType = Router();
router.use(requireConsoleAuth);

// Apartment config
router.get('/:apartmentId/config', ctrl.getConfig);
router.put('/:apartmentId/config', ctrl.upsertConfig);
router.patch('/:apartmentId/config', ctrl.updateConfig);
router.delete('/:apartmentId/config', ctrl.deleteConfig);

// Fee items (sub-resource of apartment config)
router.get('/:apartmentId/config/fee-items', ctrl.listFeeItems);
router.get('/:apartmentId/config/fee-items/:id', ctrl.getFeeItem);
router.post('/:apartmentId/config/fee-items', ctrl.createFeeItem);
router.put('/:apartmentId/config/fee-items/:id', ctrl.updateFeeItem);
router.delete('/:apartmentId/config/fee-items/:id', ctrl.deleteFeeItem);

// Copy config to other apartments
router.post('/:apartmentId/config/apply', ctrl.applyConfig);

export const apartmentConfigRouter = router;
