import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { ulid } from 'ulid';
import { prisma } from '../../lib/prisma.js';
import { requireConsoleAuth } from '../../middlewares/requireAuth.js';
import { requireOrgMembership } from '../../utils/orgContext.js';
import { createAppError } from '../../utils/appError.js';
import { Messages, NotFoundMessages } from '../../messages.js';

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
    const isActive = req.query.is_active === 'true' ? true : req.query.is_active === 'false' ? false : undefined;

    const rooms = await prisma.room.findMany({
      where: { apartment: { organization_id: orgId } },
      select: { id: true },
    });
    const roomIds = rooms.map((r) => r.id);
    const where: { room_id: { in: string[] }; is_active?: boolean } = { room_id: { in: roomIds } };
    if (isActive !== undefined) where.is_active = isActive;

    const list = await prisma.lease.findMany({
      where,
      include: { room: true, tenant: true },
    });
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
    const room = await prisma.room.findFirst({ where: { id: parsed.data.room_id }, include: { apartment: true } });
    if (!room || room.apartment.organization_id !== orgId) return next(createAppError(404, NotFoundMessages.ROOM));
    const tenant = await prisma.tenant.findFirst({ where: { id: parsed.data.tenant_id, organization_id: orgId } });
    if (!tenant) return next(createAppError(404, NotFoundMessages.TENANT));
    const leaseId = ulid().toLowerCase();
    const [lease] = await prisma.$transaction([
      prisma.lease.create({
        data: {
          id: leaseId,
          room_id: parsed.data.room_id,
          tenant_id: parsed.data.tenant_id,
          start_date: new Date(parsed.data.start_date),
          end_date: parsed.data.end_date ? new Date(parsed.data.end_date) : undefined,
          billing_day: parsed.data.billing_day ?? 1,
          monthly_rent: parsed.data.monthly_rent,
          deposit: parsed.data.deposit ?? 0,
          water_rate: parsed.data.water_rate ?? 0,
          electricity_rate: parsed.data.electricity_rate ?? 0,
          notes: parsed.data.notes ?? undefined,
        },
      }),
      prisma.room.update({
        where: { id: parsed.data.room_id },
        data: { status: 'occupied' },
      }),
    ]);
    res.status(201).json(lease);
  } catch (e) {
    next(e);
  }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const lease = await prisma.lease.findFirst({
      where: { id: req.params.id },
      include: { room: { include: { apartment: true } }, tenant: true },
    });
    if (!lease || lease.room.apartment.organization_id !== orgId) return next(createAppError(404, NotFoundMessages.LEASE));
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
    const existing = await prisma.lease.findFirst({ where: { id: req.params.id }, include: { room: { include: { apartment: true } } } });
    if (!existing || existing.room.apartment.organization_id !== orgId) return next(createAppError(404, NotFoundMessages.LEASE));
    const data: Record<string, unknown> = {};
    if (parsed.data.room_id != null) data.room_id = parsed.data.room_id;
    if (parsed.data.tenant_id != null) data.tenant_id = parsed.data.tenant_id;
    if (parsed.data.start_date != null) data.start_date = new Date(parsed.data.start_date);
    if (parsed.data.end_date !== undefined) data.end_date = parsed.data.end_date ? new Date(parsed.data.end_date) : null;
    if (parsed.data.billing_day != null) data.billing_day = parsed.data.billing_day;
    if (parsed.data.monthly_rent != null) data.monthly_rent = parsed.data.monthly_rent;
    if (parsed.data.deposit != null) data.deposit = parsed.data.deposit;
    if (parsed.data.water_rate != null) data.water_rate = parsed.data.water_rate;
    if (parsed.data.electricity_rate != null) data.electricity_rate = parsed.data.electricity_rate;
    if (parsed.data.notes !== undefined) data.notes = parsed.data.notes;
    const lease = await prisma.lease.update({ where: { id: req.params.id }, data });
    res.json(lease);
  } catch (e) {
    next(e);
  }
});

router.post('/:id/terminate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const existing = await prisma.lease.findFirst({ where: { id: req.params.id }, include: { room: { include: { apartment: true } } } });
    if (!existing || existing.room.apartment.organization_id !== orgId) return next(createAppError(404, NotFoundMessages.LEASE));
    const roomId = existing.room_id;
    const otherActive = await prisma.lease.count({ where: { room_id: roomId, is_active: true, id: { not: req.params.id } } });
    await prisma.lease.update({ where: { id: req.params.id }, data: { is_active: false } });
    if (otherActive === 0) {
      await prisma.room.update({ where: { id: roomId }, data: { status: 'available' } });
    }
    res.locals.successMessage = Messages.LEASE_TERMINATED;
    res.json({});
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const existing = await prisma.lease.findFirst({ where: { id: req.params.id }, include: { room: { include: { apartment: true } } } });
    if (!existing || existing.room.apartment.organization_id !== orgId) return next(createAppError(404, NotFoundMessages.LEASE));
    await prisma.lease.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

export const leasesRouter = router;
