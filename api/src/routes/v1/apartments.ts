import { Router } from 'express';
import { requireConsoleAuth } from '../../middlewares/requireAuth.js';
import * as ctrl from './apartments.controller.js';

const router = Router();
router.use(requireConsoleAuth);

// apartments
router.get('/', ctrl.list);
router.get('/:id', ctrl.get);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.del);

// rooms sub-resource
router.get('/:apartmentId/rooms', ctrl.listRooms);
router.get('/rooms/:roomId', ctrl.getRoom);
router.post('/:apartmentId/rooms', ctrl.createRoom);
router.put('/rooms/:roomId', ctrl.updateRoom);
router.delete('/rooms/:roomId', ctrl.deleteRoom);
router.post('/:apartmentId/rooms/batch', ctrl.batchCreateRooms);

// utility config
router.get('/:apartmentId/utility-config', ctrl.getUtilityConfig);
router.post('/:apartmentId/utility-config', ctrl.createUtilityConfig);
router.put('/:apartmentId/utility-config', ctrl.updateUtilityConfig);
router.delete('/:apartmentId/utility-config', ctrl.deleteUtilityConfig);

// fee configs
router.get('/:apartmentId/fee-configs', ctrl.listFeeConfigs);
router.post('/:apartmentId/fee-configs', ctrl.createFeeConfig);
router.get('/:apartmentId/fee-configs/:configId', ctrl.getFeeConfig);
router.put('/:apartmentId/fee-configs/:configId', ctrl.updateFeeConfig);
router.delete('/:apartmentId/fee-configs/:configId', ctrl.deleteFeeConfig);

export const apartmentsRouter = router;
