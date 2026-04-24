import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { requireConsoleAuth } from '../../middlewares/requireAuth.js';
import { requireOrgMembership } from '../../utils/orgContext.js';
import { createAppError } from '../../utils/appError.js';
import { defaultOrgFeeItemService } from '../../services/orgFeeItem.service.js';

const router: Router = Router();
router.use(requireConsoleAuth);

const OrgFeeItemCreateSchema = z.object({
  name: z.string().min(1),
  category: z.enum(['fixed', 'utility', 'optional']),
  amount: z.number().min(0),
  cycle: z.enum(['monthly', 'quarterly', 'yearly', 'one_time']),
});

const OrgFeeItemUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  category: z.enum(['fixed', 'utility', 'optional']).optional(),
  amount: z.number().min(0).optional(),
  cycle: z.enum(['monthly', 'quarterly', 'yearly', 'one_time']).optional(),
  is_active: z.boolean().optional(),
  sort_order: z.number().optional(),
});

router.get('/', async (req: Request, res: Response, _next: NextFunction) => {
  
    const orgId = await requireOrgMembership(req);
    const { category, cycle, search } = req.query;
    const list = await defaultOrgFeeItemService.list(orgId, {
      category: category as string,
      cycle: cycle as string,
      search: search as string,
    });
    res.json(list);
  
});

router.get('/:id', async (req: Request, res: Response, _next: NextFunction) => {
  
    const orgId = await requireOrgMembership(req);
    const item = await defaultOrgFeeItemService.getById(orgId, req.params.id);
    res.json(item);
  
});

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  
    const orgId = await requireOrgMembership(req);
    const parsed = OrgFeeItemCreateSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    const item = await defaultOrgFeeItemService.create(orgId, parsed.data);
    res.status(201).json(item);
  
});

router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  
    const orgId = await requireOrgMembership(req);
    const parsed = OrgFeeItemUpdateSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    const item = await defaultOrgFeeItemService.update(orgId, req.params.id, parsed.data);
    res.json(item);
  
});

router.delete('/:id', async (req: Request, res: Response, _next: NextFunction) => {
  
    const orgId = await requireOrgMembership(req);
    await defaultOrgFeeItemService.delete(orgId, req.params.id);
    res.status(204).send();
  
});

export const feeItemsRouter = router;