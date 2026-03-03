import { Router } from 'express';
import { createAppError } from '../../utils/appError.js';
import { authRouter } from './auth.js';
import { organizationsRouter } from './organizations.js';
import { apartmentsRouter } from './apartments.js';
import { tenantsRouter } from './tenants.js';
import { leasesRouter } from './leases.js';
import { utilitiesRouter } from './utilities.js';
import { billsRouter } from './bills.js';
import { reportsRouter } from './reports.js';
import { permissionsRouter } from './permissions.js';
import { subscriptionsRouter } from './subscriptions.js';
import { usageRouter } from './usage.js';
import { notificationsRouter } from './notifications.js';
import { customRolesRouter } from './customRoles.js';
import { adminRouter } from './admin/index.js';
import { webhooksRouter } from './webhooks/index.js';

const router: Router = Router();

router.use('/auth', authRouter);
router.use('/organizations', organizationsRouter);
router.use('/apartments', apartmentsRouter);
router.use('/tenants', tenantsRouter);
router.use('/leases', leasesRouter);
router.use('/utilities', utilitiesRouter);
router.use('/bills', billsRouter);
router.use('/reports', reportsRouter);
router.use('/permissions', permissionsRouter);
router.use('/subscriptions', subscriptionsRouter);
router.use('/usage', usageRouter);
router.use('/notifications', notificationsRouter);
router.use('/custom-roles', customRolesRouter);
router.use('/admin', adminRouter);
router.use('/webhooks', webhooksRouter);

router.get('/', (_req, res) => {
  res.json({ message: 'API v1' });
});

router.use((_req, _res, next) => {
  next(createAppError(404, 'Not Found'));
});

export const v1Router = router;
