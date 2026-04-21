import { Router, type Router as RouterType } from 'express';
import { requireConsoleAuth } from '../../middlewares/requireAuth.js';
import * as ctrl from './organizations.controller.js';

const router: RouterType = Router();
router.use(requireConsoleAuth);

router.get('/', ctrl.list);
router.post('/', ctrl.create);
router.get('/personal', ctrl.getPersonal);
router.get('/:orgId', ctrl.get);
router.put('/:orgId', ctrl.update);
router.get('/:orgId/deletion-preview', ctrl.deletionPreview);
router.delete('/:orgId', ctrl.del);
router.get('/members', ctrl.getMembers);
router.post('/members', ctrl.addMember);
router.put('/members/:userId', ctrl.updateMember);
router.delete('/members/:userId', ctrl.removeMember);
router.get('/:orgId/usage', ctrl.getUsage);

export const organizationsRouter = router;
