import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { requireConsoleAuth } from '../../middlewares/requireAuth.js';
import { requireOrgMembership } from '../../utils/orgContext.js';
import { createAppError } from '../../utils/appError.js';
import { defaultTenantService } from '../../services/tenant.service.js';

const router: Router = Router();

router.use(requireConsoleAuth);

const TenantCreateSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional(),
  id_card: z.string().optional(),
  emergency_contact: z.string().optional(),
  emergency_phone: z.string().optional(),
  notes: z.string().optional(),
});
const TenantUpdateSchema = TenantCreateSchema.partial();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : undefined;
    const list = await defaultTenantService.list(orgId, search);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const parsed = TenantCreateSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    const tenant = await defaultTenantService.create(orgId, parsed.data);
    res.status(201).json(tenant);
  } catch (e) {
    next(e);
  }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const tenant = await defaultTenantService.getById(orgId, req.params.id);
    res.json(tenant);
  } catch (e) {
    next(e);
  }
});

router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const parsed = TenantUpdateSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    const tenant = await defaultTenantService.update(orgId, req.params.id, parsed.data);
    res.json(tenant);
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    await defaultTenantService.delete(orgId, req.params.id);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

export const tenantsRouter = router;
