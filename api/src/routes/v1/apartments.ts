import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { ulid } from 'ulid';
import { prisma } from '../../lib/prisma.js';
import { requireConsoleAuth } from '../../middlewares/requireAuth.js';
import { requireOrgMembership } from '../../utils/orgContext.js';
import { getConsoleUser } from '../../utils/context.js';
import { createAppError } from '../../utils/appError.js';
import { Messages, NotFoundMessages } from '../../messages.js';
import { getEffectivePlanLimits, getRoomsUsedForLimitCheck } from '../../utils/orgPlanLimits.js';

const router: Router = Router();

router.use(requireConsoleAuth);

const ApartmentCreateSchema = z.object({ name: z.string().min(1), address: z.string().optional(), description: z.string().optional() });
const ApartmentUpdateSchema = z.object({ name: z.string().min(1).optional(), address: z.string().optional(), description: z.string().optional() });
const RoomCreateSchema = z.object({
  apartment_id: z.string(),
  room_number: z.string().min(1),
  layout: z.string().optional(),
  monthly_rent: z.number(),
  area: z.number().optional(),
  notes: z.string().optional(),
  status: z.enum(['available', 'occupied', 'maintenance']).optional(),
});
const RoomBatchSchema = z.object({ room_numbers: z.array(z.string()), layout: z.string().optional(), monthly_rent: z.number(), area: z.number().optional(), notes: z.string().optional() });
const RoomUpdateSchema = z.object({ room_number: z.string().optional(), layout: z.string().optional(), status: z.string().optional(), monthly_rent: z.number().optional(), area: z.number().optional(), notes: z.string().optional() });
const UtilityConfigSchema = z.object({
  water_price_per_unit: z.number().min(0).optional(),
  electricity_price_per_unit: z.number().min(0).optional(),
  internet_fee: z.number().min(0).optional(),
  management_fee: z.number().min(0).optional(),
  service_fee: z.number().min(0).optional(),
  effective_from: z.string(), // date YYYY-MM-DD
  notes: z.string().max(500).optional(),
});

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const list = await prisma.apartment.findMany({
      where: { organization_id: orgId },
      include: { rooms: true },
    });
    const withStats = list.map((apt) => {
      const rooms = apt.rooms;
      const total = rooms.length;
      const available = rooms.filter((r) => r.status === 'available').length;
      const occupied = rooms.filter((r) => r.status === 'occupied').length;
      const maintenance = rooms.filter((r) => r.status === 'maintenance').length;
      return { ...apt, room_stats: { total, available, occupied, maintenance } };
    });
    res.json(withStats);
  } catch (e) {
    next(e);
  }
});

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const limits = await getEffectivePlanLimits(orgId);
    const apartments_used = await prisma.apartment.count({ where: { organization_id: orgId } });
    if (apartments_used >= limits.max_apartments)
      return next(createAppError(403, `当前套餐最多允许 ${limits.max_apartments} 个公寓`));
    const parsed = ApartmentCreateSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    const apt = await prisma.apartment.create({
      data: { id: ulid().toLowerCase(), organization_id: orgId, name: parsed.data.name, address: parsed.data.address ?? undefined, description: parsed.data.description ?? undefined },
    });
    res.status(201).json(apt);
  } catch (e) {
    next(e);
  }
});

// /rooms/:roomId must come before /:apartmentId/rooms so /apartments/rooms/xxx is not matched as apartmentId=rooms
router.get('/rooms/:roomId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const roomId = req.params.roomId;
    const room = await prisma.room.findFirst({
      where: { id: roomId },
      include: { apartment: true },
    });
    if (!room || room.apartment.organization_id !== orgId) return next(createAppError(404, NotFoundMessages.ROOM));
    res.json(room);
  } catch (e) {
    next(e);
  }
});

router.put('/rooms/:roomId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const roomId = req.params.roomId;
    const room = await prisma.room.findFirst({ where: { id: roomId }, include: { apartment: true } });
    if (!room || room.apartment.organization_id !== orgId) return next(createAppError(404, NotFoundMessages.ROOM));
    const parsed = RoomUpdateSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    const updated = await prisma.room.update({
      where: { id: roomId },
      data: {
        room_number: parsed.data.room_number ?? room.room_number,
        layout: parsed.data.layout ?? room.layout ?? undefined,
        status: (parsed.data.status as 'available' | 'occupied' | 'maintenance') ?? room.status,
        monthly_rent: parsed.data.monthly_rent ?? Number(room.monthly_rent),
        area: parsed.data.area !== undefined ? parsed.data.area : (room.area != null ? Number(room.area) : undefined),
        notes: parsed.data.notes ?? room.notes ?? undefined,
      },
    });
    res.json(updated);
  } catch (e) {
    next(e);
  }
});

router.delete('/rooms/:roomId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const roomId = req.params.roomId;
    const room = await prisma.room.findFirst({ where: { id: roomId }, include: { apartment: true } });
    if (!room || room.apartment.organization_id !== orgId) return next(createAppError(404, NotFoundMessages.ROOM));
    await prisma.room.delete({ where: { id: roomId } });
    res.locals.successMessage = Messages.ROOM_DELETED;
    res.json({});
  } catch (e) {
    next(e);
  }
});

router.get('/:apartmentId/rooms', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const apartmentId = req.params.apartmentId;
    const apt = await prisma.apartment.findFirst({ where: { id: apartmentId, organization_id: orgId } });
    if (!apt) return next(createAppError(404, NotFoundMessages.APARTMENT));
    const rooms = await prisma.room.findMany({ where: { apartment_id: apartmentId } });
    res.json(rooms);
  } catch (e) {
    next(e);
  }
});

router.post('/:apartmentId/rooms', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const user = getConsoleUser(req);
    if (!user) return next(createAppError(401, '未授权或登录已过期'));
    const apartmentId = req.params.apartmentId;
    const apt = await prisma.apartment.findFirst({ where: { id: apartmentId, organization_id: orgId } });
    if (!apt) return next(createAppError(404, NotFoundMessages.APARTMENT));
    const limits = await getEffectivePlanLimits(orgId);
    const rooms_used = await getRoomsUsedForLimitCheck(orgId, user.id);
    if (rooms_used + 1 > limits.max_rooms)
      return next(createAppError(403, `当前套餐最多允许 ${limits.max_rooms} 个房间`));
    const parsed = RoomCreateSchema.safeParse({ ...req.body, apartment_id: apartmentId });
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    const room = await prisma.room.create({
      data: {
        id: ulid().toLowerCase(),
        apartment_id: apartmentId,
        room_number: parsed.data.room_number,
        layout: parsed.data.layout ?? undefined,
        monthly_rent: parsed.data.monthly_rent,
        area: parsed.data.area ?? undefined,
        notes: parsed.data.notes ?? undefined,
        status: (parsed.data.status as 'available' | 'occupied' | 'maintenance') ?? 'available',
      },
    });
    res.status(201).json(room);
  } catch (e) {
    next(e);
  }
});

router.post('/:apartmentId/rooms/batch', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const user = getConsoleUser(req);
    if (!user) return next(createAppError(401, '未授权或登录已过期'));
    const apartmentId = req.params.apartmentId;
    const apt = await prisma.apartment.findFirst({ where: { id: apartmentId, organization_id: orgId } });
    if (!apt) return next(createAppError(404, NotFoundMessages.APARTMENT));
    const limits = await getEffectivePlanLimits(orgId);
    const rooms_used = await getRoomsUsedForLimitCheck(orgId, user.id);
    const parsed = RoomBatchSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    const addCount = parsed.data.room_numbers.length;
    if (rooms_used + addCount > limits.max_rooms)
      return next(createAppError(403, `当前套餐最多允许 ${limits.max_rooms} 个房间，当前已用 ${rooms_used}，无法再添加 ${addCount} 个`));
    const created = await Promise.all(
      parsed.data.room_numbers.map((rn) =>
        prisma.room.create({
          data: {
            id: ulid().toLowerCase(),
            apartment_id: apartmentId,
            room_number: rn,
            layout: parsed.data!.layout ?? undefined,
            monthly_rent: parsed.data!.monthly_rent,
            area: parsed.data!.area ?? undefined,
            notes: parsed.data!.notes ?? undefined,
            status: 'available',
          },
        })
      )
    );
    res.status(201).json(created);
  } catch (e) {
    next(e);
  }
});

router.get('/:apartmentId/utility-config', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const apartmentId = req.params.apartmentId;
    const apt = await prisma.apartment.findFirst({ where: { id: apartmentId, organization_id: orgId } });
    if (!apt) return next(createAppError(404, NotFoundMessages.APARTMENT));
    const config = await prisma.utilityConfig.findUnique({ where: { apartment_id: apartmentId } });
    if (!config) return next(createAppError(404, NotFoundMessages.UTILITY_CONFIG));
    res.json(config);
  } catch (e) {
    next(e);
  }
});

router.post('/:apartmentId/utility-config', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const apartmentId = req.params.apartmentId;
    const apt = await prisma.apartment.findFirst({ where: { id: apartmentId, organization_id: orgId } });
    if (!apt) return next(createAppError(404, NotFoundMessages.APARTMENT));
    const parsed = UtilityConfigSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    const effectiveFrom = new Date(parsed.data.effective_from);
    const config = await prisma.utilityConfig.create({
      data: {
        id: ulid().toLowerCase(),
        apartment_id: apartmentId,
        water_price_per_unit: parsed.data.water_price_per_unit ?? undefined,
        electricity_price_per_unit: parsed.data.electricity_price_per_unit ?? undefined,
        internet_fee: parsed.data.internet_fee ?? undefined,
        management_fee: parsed.data.management_fee ?? undefined,
        service_fee: parsed.data.service_fee ?? undefined,
        effective_from: effectiveFrom,
        notes: parsed.data.notes ?? undefined,
      },
    });
    res.status(201).json(config);
  } catch (e) {
    next(e);
  }
});

router.put('/:apartmentId/utility-config', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const apartmentId = req.params.apartmentId;
    const apt = await prisma.apartment.findFirst({ where: { id: apartmentId, organization_id: orgId } });
    if (!apt) return next(createAppError(404, NotFoundMessages.APARTMENT));
    const parsed = UtilityConfigSchema.partial().safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    const existing = await prisma.utilityConfig.findUnique({ where: { apartment_id: apartmentId } });
    if (!existing) return next(createAppError(404, NotFoundMessages.UTILITY_CONFIG));
    const data: Record<string, unknown> = {};
    if (parsed.data.water_price_per_unit != null) data.water_price_per_unit = parsed.data.water_price_per_unit;
    if (parsed.data.electricity_price_per_unit != null) data.electricity_price_per_unit = parsed.data.electricity_price_per_unit;
    if (parsed.data.internet_fee != null) data.internet_fee = parsed.data.internet_fee;
    if (parsed.data.management_fee != null) data.management_fee = parsed.data.management_fee;
    if (parsed.data.service_fee != null) data.service_fee = parsed.data.service_fee;
    if (parsed.data.effective_from != null) data.effective_from = new Date(parsed.data.effective_from);
    if (parsed.data.notes !== undefined) data.notes = parsed.data.notes;
    const config = await prisma.utilityConfig.update({ where: { id: existing.id }, data });
    res.json(config);
  } catch (e) {
    next(e);
  }
});

router.delete('/:apartmentId/utility-config', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const apartmentId = req.params.apartmentId;
    const apt = await prisma.apartment.findFirst({ where: { id: apartmentId, organization_id: orgId } });
    if (!apt) return next(createAppError(404, NotFoundMessages.APARTMENT));
    await prisma.utilityConfig.deleteMany({ where: { apartment_id: apartmentId } });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const apt = await prisma.apartment.findFirst({
      where: { id: req.params.id, organization_id: orgId },
      include: { rooms: true },
    });
    if (!apt) return next(createAppError(404, NotFoundMessages.APARTMENT));
    res.json(apt);
  } catch (e) {
    next(e);
  }
});

router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const parsed = ApartmentUpdateSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    const apt = await prisma.apartment.findFirst({ where: { id: req.params.id, organization_id: orgId } });
    if (!apt) return next(createAppError(404, NotFoundMessages.APARTMENT));
    const updated = await prisma.apartment.update({
      where: { id: req.params.id },
      data: { name: parsed.data.name ?? apt.name, address: parsed.data.address ?? apt.address ?? undefined, description: parsed.data.description ?? apt.description ?? undefined },
    });
    res.json(updated);
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const apt = await prisma.apartment.findFirst({ where: { id: req.params.id, organization_id: orgId } });
    if (!apt) return next(createAppError(404, NotFoundMessages.APARTMENT));
    await prisma.apartment.delete({ where: { id: req.params.id } });
    res.locals.successMessage = Messages.APARTMENT_DELETED;
    res.json({});
  } catch (e) {
    next(e);
  }
});

export const apartmentsRouter = router;
