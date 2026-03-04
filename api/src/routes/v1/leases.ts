import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { requireConsoleAuth } from '../../middlewares/requireAuth.js';
import { requireOrgMembership } from '../../utils/orgContext.js';
import { createAppError } from '../../utils/appError.js';
import { Messages } from '../../messages.js';
import { defaultLeaseService } from '../../services/lease.service.js';

const router: Router = Router();

router.use(requireConsoleAuth);

const LeaseCreateSchema = z.object({
  room_id: z.string(),
  tenant_id: z.string(),
  start_date: z.string(),
  end_date: z.string().optional(),
  billing_day: z.number().min(1).max(28).optional(),
  monthly_rent: z.number(),
  deposit: z.number().optional(),
  water_rate: z.number().optional(),
  electricity_rate: z.number().optional(),
  notes: z.string().optional(),
});
const LeaseUpdateSchema = LeaseCreateSchema.partial();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const isActive =
      req.query.is_active === 'true' ? true : req.query.is_active === 'false' ? false : undefined;
    const list = await defaultLeaseService.list(orgId, isActive);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const parsed = LeaseCreateSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    const lease = await defaultLeaseService.create(orgId, parsed.data);
    res.status(201).json(lease);
  } catch (e) {
    next(e);
  }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const lease = await defaultLeaseService.getById(orgId, req.params.id);
    res.json(lease);
  } catch (e) {
    next(e);
  }
});

router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const parsed = LeaseUpdateSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    const lease = await defaultLeaseService.update(orgId, req.params.id, parsed.data);
    res.json(lease);
  } catch (e) {
    next(e);
  }
});

router.post('/:id/terminate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    await defaultLeaseService.terminate(orgId, req.params.id);
    res.locals.successMessage = Messages.LEASE_TERMINATED;
    res.json({});
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    await defaultLeaseService.delete(orgId, req.params.id);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

export const leasesRouter = router;
