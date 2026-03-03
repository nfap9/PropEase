import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { ulid } from 'ulid';
import { prisma } from '../../lib/prisma.js';
import { requireConsoleAuth } from '../../middlewares/requireAuth.js';
import { requireOrgMembership } from '../../utils/orgContext.js';
import { createAppError } from '../../utils/appError.js';
import { NotFoundMessages } from '../../messages.js';

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
    const roomId = typeof req.query.room_id === 'string' ? req.query.room_id : undefined;
    const periodYear = req.query.period_year != null ? Number(req.query.period_year) : undefined;
    const periodMonth = req.query.period_month != null ? Number(req.query.period_month) : undefined;

    const rooms = await prisma.room.findMany({
      where: { apartment: { organization_id: orgId } },
      select: { id: true },
    });
    const roomIds = rooms.map((r) => r.id);
    const where: { room_id: { in: string[] }; period_year?: number; period_month?: number } = {
      room_id: { in: roomIds },
    };
    if (roomId && roomIds.includes(roomId)) where.room_id = { in: [roomId] };
    if (periodYear != null) where.period_year = periodYear;
    if (periodMonth != null) where.period_month = periodMonth;

    const list = await prisma.utilityReading.findMany({
      where,
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
    const periodYear = req.query.period_year != null ? Number(req.query.period_year) : undefined;
    const periodMonth = req.query.period_month != null ? Number(req.query.period_month) : undefined;
    const daysRange = req.query.days_range != null ? Number(req.query.days_range) : undefined;

    const rooms = await prisma.room.findMany({
      where: { apartment: { organization_id: orgId } },
      include: {
        apartment: true,
        leases: { where: { is_active: true }, include: { tenant: true }, take: 1, orderBy: { start_date: 'desc' } },
      },
    });

    let roomsToExport = rooms;
    if (periodYear != null && periodMonth != null && daysRange != null && daysRange > 0) {
      const today = new Date();
      const currentDay = today.getDate();
      const daysInMonth = new Date(periodYear, periodMonth, 0).getDate();
      const billingDays = new Set<number>();
      for (let i = 0; i < daysRange; i++) {
        let d = currentDay + i;
        if (d > daysInMonth) d -= daysInMonth;
        billingDays.add(d);
      }
      roomsToExport = rooms.filter((r) => {
        const lease = r.leases[0];
        return lease && billingDays.has(lease.billing_day);
      });
    }

    // 仅导出待录入房间：排除该月已有读数的房间
    if (periodYear != null && periodMonth != null && roomsToExport.length > 0) {
      const roomIdsWithReadings = new Set(
        (
          await prisma.utilityReading.findMany({
            where: {
              room_id: { in: roomsToExport.map((r) => r.id) },
              period_year: periodYear,
              period_month: periodMonth,
            },
            select: { room_id: true },
          })
        ).map((r) => r.room_id)
      );
      roomsToExport = roomsToExport.filter((r) => !roomIdsWithReadings.has(r.id));
    }

    const period = periodYear != null && periodMonth != null ? { year: periodYear, month: periodMonth } : null;
    const exportList = await Promise.all(
      roomsToExport.map(async (r) => {
        const lease = r.leases[0];
        let waterPrevious: number | null = null;
        let electricityPrevious: number | null = null;
        if (period) {
          const prev = await prisma.utilityReading.findFirst({
            where: { room_id: r.id, period_year: period.year, period_month: period.month },
            orderBy: { reading_date: 'desc' },
          });
          if (prev) {
            waterPrevious = prev.water_reading != null ? Number(prev.water_reading) : null;
            electricityPrevious = prev.electricity_reading != null ? Number(prev.electricity_reading) : null;
          }
        }
        return {
          room_id: r.id,
          apartment_name: r.apartment.name,
          room_number: r.room_number,
          tenant_name: lease?.tenant?.name ?? '',
          billing_day: lease?.billing_day ?? 1,
          water_previous: waterPrevious,
          electricity_previous: electricityPrevious,
        };
      })
    );
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
    const room = await prisma.room.findFirst({ where: { id: parsed.data.room_id }, include: { apartment: true } });
    if (!room || room.apartment.organization_id !== orgId) return next(createAppError(404, NotFoundMessages.ROOM));
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

    const { period_year, period_month, reading_date, readings } = parsed.data;
    const readingDate = new Date(reading_date);

    const orgRoomIds = new Set(
      (await prisma.room.findMany({ where: { apartment: { organization_id: orgId } }, select: { id: true } })).map(
        (r) => r.id
      )
    );

    const created = await prisma.$transaction(async (tx) => {
      const results: Awaited<ReturnType<typeof prisma.utilityReading.create>>[] = [];
      for (const r of readings) {
        if (!orgRoomIds.has(r.room_id)) {
          throw createAppError(404, NotFoundMessages.ROOM);
        }
        results.push(
          await tx.utilityReading.create({
            data: {
              id: ulid().toLowerCase(),
              room_id: r.room_id,
              period_year,
              period_month,
              reading_date: readingDate,
              water_reading: r.water_reading ?? undefined,
              electricity_reading: r.electricity_reading ?? undefined,
              notes: r.notes ?? undefined,
            },
          })
        );
      }
      return results;
    });

    res.status(201).json(created);
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
    if (!reading || reading.room.apartment.organization_id !== orgId) return next(createAppError(404, NotFoundMessages.READING));
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
    if (!existing || existing.room.apartment.organization_id !== orgId) return next(createAppError(404, NotFoundMessages.READING));
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
    if (!existing || existing.room.apartment.organization_id !== orgId) return next(createAppError(404, NotFoundMessages.READING));
    await prisma.utilityReading.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

export const utilitiesRouter = router;
