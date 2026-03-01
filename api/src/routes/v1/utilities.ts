import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { ulid } from 'ulid';
import { prisma } from '../../lib/prisma.js';
import { requireConsoleAuth } from '../../middlewares/requireAuth.js';
import { requireOrgMembership } from '../../utils/orgContext.js';
import { createAppError } from '../../utils/appError.js';

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
const BatchReadingSchema = z.object({ room_id: z.string(), period_year: z.number(), period_month: z.number(), reading_date: z.string(), readings: z.array(z.object({ water_reading: z.number().optional(), electricity_reading: z.number().optional(), water_previous: z.number().optional(), electricity_previous: z.number().optional(), notes: z.string().optional() })) });

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const rooms = await prisma.room.findMany({
      where: { apartment: { organization_id: orgId } },
      select: { id: true },
    });
    const roomIds = rooms.map((r) => r.id);
    const list = await prisma.utilityReading.findMany({
      where: { room_id: { in: roomIds } },
      include: { room: true },
    });
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.get('/export', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const rooms = await prisma.room.findMany({
      where: { apartment: { organization_id: orgId } },
      include: { apartment: true },
    });
    res.json(rooms.map((r) => ({ id: r.id, room_number: r.room_number, apartment_name: r.apartment.name })));
  } catch (e) {
    next(e);
  }
});

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const parsed = ReadingCreateSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    const room = await prisma.room.findFirst({ where: { id: parsed.data.room_id }, include: { apartment: true } });
    if (!room || room.apartment.organization_id !== orgId) return next(createAppError(404, 'Resource not found'));
    const reading = await prisma.utilityReading.create({
      data: {
        id: ulid().toLowerCase(),
        room_id: parsed.data.room_id,
        period_year: parsed.data.period_year,
        period_month: parsed.data.period_month,
        reading_date: new Date(parsed.data.reading_date),
        water_reading: parsed.data.water_reading ?? undefined,
        electricity_reading: parsed.data.electricity_reading ?? undefined,
        water_previous: parsed.data.water_previous ?? undefined,
        electricity_previous: parsed.data.electricity_previous ?? undefined,
        notes: parsed.data.notes ?? undefined,
      },
    });
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
    const room = await prisma.room.findFirst({ where: { id: parsed.data.room_id }, include: { apartment: true } });
    if (!room || room.apartment.organization_id !== orgId) return next(createAppError(404, 'Resource not found'));
    const created = await Promise.all(
      parsed.data.readings.map((r) =>
        prisma.utilityReading.create({
          data: {
            id: ulid().toLowerCase(),
            room_id: parsed.data!.room_id,
            period_year: parsed.data!.period_year,
            period_month: parsed.data!.period_month,
            reading_date: new Date(parsed.data!.reading_date),
            water_reading: r.water_reading ?? undefined,
            electricity_reading: r.electricity_reading ?? undefined,
            water_previous: r.water_previous ?? undefined,
            electricity_previous: r.electricity_previous ?? undefined,
            notes: r.notes ?? undefined,
          },
        })
      )
    );
    res.json(created);
  } catch (e) {
    next(e);
  }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const reading = await prisma.utilityReading.findFirst({
      where: { id: req.params.id },
      include: { room: { include: { apartment: true } } },
    });
    if (!reading || reading.room.apartment.organization_id !== orgId) {
      res.status(404).json({ code: 40002, message: 'Resource not found' });
      return;
    }
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
    const existing = await prisma.utilityReading.findFirst({ where: { id: req.params.id }, include: { room: { include: { apartment: true } } } });
    if (!existing || existing.room.apartment.organization_id !== orgId) { res.status(404).json({ code: 40002, message: 'Resource not found' }); return; }
    const data: Record<string, unknown> = {};
    if (parsed.data.room_id != null) data.room_id = parsed.data.room_id;
    if (parsed.data.period_year != null) data.period_year = parsed.data.period_year;
    if (parsed.data.period_month != null) data.period_month = parsed.data.period_month;
    if (parsed.data.reading_date != null) data.reading_date = new Date(parsed.data.reading_date);
    if (parsed.data.water_reading !== undefined) data.water_reading = parsed.data.water_reading;
    if (parsed.data.electricity_reading !== undefined) data.electricity_reading = parsed.data.electricity_reading;
    if (parsed.data.water_previous !== undefined) data.water_previous = parsed.data.water_previous;
    if (parsed.data.electricity_previous !== undefined) data.electricity_previous = parsed.data.electricity_previous;
    if (parsed.data.notes !== undefined) data.notes = parsed.data.notes;
    const reading = await prisma.utilityReading.update({ where: { id: req.params.id }, data });
    res.json(reading);
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const existing = await prisma.utilityReading.findFirst({ where: { id: req.params.id }, include: { room: { include: { apartment: true } } } });
    if (!existing || existing.room.apartment.organization_id !== orgId) { res.status(404).json({ code: 40002, message: 'Resource not found' }); return; }
    await prisma.utilityReading.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

export const utilitiesRouter = router;
