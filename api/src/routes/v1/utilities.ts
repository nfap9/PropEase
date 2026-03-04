import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { requireConsoleAuth } from '../../middlewares/requireAuth.js';
import { requireOrgMembership } from '../../utils/orgContext.js';
import { createAppError } from '../../utils/appError.js';
import { defaultUtilityService } from '../../services/utility.service.js';
import type { ReadingFilter } from '../../repositories/utility.repo.js';

const router: Router = Router();

router.use(requireConsoleAuth);

const ReadingCreateSchema = z.object({
  room_id: z.string(),
  period_year: z.number(),
  period_month: z.number(),
  reading_date: z.string(),
  water_reading: z.number().optional(),
  electricity_reading: z.number().optional(),
  water_previous: z.number().optional(),
  electricity_previous: z.number().optional(),
  notes: z.string().optional(),
});
const ReadingUpdateSchema = ReadingCreateSchema.partial();
const BatchReadingSchema = z.object({
  period_year: z.number(),
  period_month: z.number(),
  reading_date: z.string(),
  readings: z.array(z.object({
    room_id: z.string(),
    water_reading: z.number().optional(),
    electricity_reading: z.number().optional(),
    notes: z.string().optional(),
  })),
});

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const filter: ReadingFilter = {
      roomId: typeof req.query.room_id === 'string' ? req.query.room_id : undefined,
      apartmentId: typeof req.query.apartment_id === 'string' ? req.query.apartment_id : undefined,
      periodYear: req.query.period_year != null ? Number(req.query.period_year) : undefined,
      periodMonth: req.query.period_month != null ? Number(req.query.period_month) : undefined,
    };
    const list = await defaultUtilityService.list(orgId, filter);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.get('/rooms-missing-initial', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const result = await defaultUtilityService.getMissingInitialReadings(orgId);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.get('/export', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const periodYear = req.query.period_year != null ? Number(req.query.period_year) : undefined;
    const periodMonth = req.query.period_month != null ? Number(req.query.period_month) : undefined;
    const daysRange = req.query.days_range != null ? Number(req.query.days_range) : undefined;

    const exportList = await defaultUtilityService.getExportList(orgId, periodYear, periodMonth, daysRange);
    res.json(exportList);
  } catch (e) {
    next(e);
  }
});

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const parsed = ReadingCreateSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    const reading = await defaultUtilityService.create(orgId, parsed.data);
    res.status(201).json(reading);
  } catch (e) {
    next(e);
  }
});

router.post('/batch', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const parsed = BatchReadingSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    const created = await defaultUtilityService.batchCreate(orgId, parsed.data);
    res.status(201).json(created);
  } catch (e) {
    next(e);
  }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const reading = await defaultUtilityService.getById(orgId, req.params.id);
    res.json(reading);
  } catch (e) {
    next(e);
  }
});

router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const parsed = ReadingUpdateSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    const reading = await defaultUtilityService.update(orgId, req.params.id, parsed.data);
    res.json(reading);
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    await defaultUtilityService.delete(orgId, req.params.id);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

export const utilitiesRouter = router;
