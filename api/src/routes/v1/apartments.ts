import { Router, type Router as RouterType } from 'express';
import { requireConsoleAuth } from '../../middlewares/requireAuth.js';
import * as ctrl from './apartments.controller.js';

const router: RouterType = Router();
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

export const apartmentsRouter = router;
