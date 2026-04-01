import { type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { ulid } from 'ulid';
import { prisma } from '../../lib/prisma.js';
import { requireOrgMembership } from '../../utils/orgContext.js';
import { getConsoleUser } from '../../utils/context.js';
import { createAppError } from '../../utils/appError.js';
import { Messages, NotFoundMessages } from '../../messages.js';
import { getEffectivePlanLimits, getRoomsUsedForLimitCheck } from '../../utils/orgPlanLimits.js';
import { defaultApartmentService } from '../../services/apartment.service.js';
import { defaultRoomService } from '../../services/room.service.js';

// ==================== Schemas ====================

export const ApartmentCreateSchema = z.object({
  name: z.string().min(1),
  address: z.string().optional(),
  description: z.string().optional(),
  floors: z.number().int().min(1).optional(),
  land_area: z.number().min(0).optional(),
  total_area: z.number().min(0).optional(),
  landlord_name: z.string().max(100).optional(),
  landlord_contact: z.string().max(50).optional(),
  contract_start: z.string().optional(),
  contract_end: z.string().optional(),
  landlord_rent: z.number().min(0).optional(),
  operating_cost: z.number().min(0).optional(),
});

export const ApartmentUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  address: z.string().optional(),
  description: z.string().optional(),
  floors: z.number().int().min(1).optional(),
  land_area: z.number().min(0).optional(),
  total_area: z.number().min(0).optional(),
  landlord_name: z.string().max(100).optional(),
  landlord_contact: z.string().max(50).optional(),
  contract_start: z.string().optional(),
  contract_end: z.string().optional(),
  landlord_rent: z.number().min(0).optional(),
  operating_cost: z.number().min(0).optional(),
});

export const FacilityItemSchema = z.object({
  code: z.string(),
  quantity: z.number().int().min(1),
});

export const RoomFacilitiesSchema = z.object({
  version: z.literal(1),
  furniture: z.array(FacilityItemSchema),
  appliances: z.array(FacilityItemSchema),
});

export const RoomCreateSchema = z.object({
  apartment_id: z.string(),
  room_number: z.string().min(1),
  layout: z.string().optional(),
  monthly_rent: z.number(),
  area: z.number().optional(),
  notes: z.string().optional(),
  status: z.enum(['available', 'occupied', 'maintenance']).optional(),
  facilities: RoomFacilitiesSchema.nullable().optional(),
});

export const RoomBatchSchema = z.object({
  room_numbers: z.array(z.string()),
  layout: z.string().optional(),
  monthly_rent: z.number(),
  area: z.number().optional(),
  notes: z.string().optional(),
});

export const RoomUpdateSchema = z.object({
  room_number: z.string().optional(),
  layout: z.string().optional(),
  status: z.enum(['available', 'occupied', 'maintenance']).optional(),
  monthly_rent: z.number().optional(),
  area: z.number().optional(),
  notes: z.string().optional(),
  facilities: RoomFacilitiesSchema.nullable().optional(),
});

export const UtilityConfigSchema = z.object({
  water_price_per_unit: z.number().min(0).optional(),
  electricity_price_per_unit: z.number().min(0).optional(),
  internet_fee: z.number().min(0).optional(),
  management_fee: z.number().min(0).optional(),
  service_fee: z.number().min(0).optional(),
  notes: z.string().max(500).optional(),
});


// ==================== Handlers ====================

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const orgId = await requireOrgMembership(req);
    const result = await defaultApartmentService.listByOrg(orgId);
    res.json(result);
  } catch (e) {
    next(e);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const orgId = await requireOrgMembership(req);
    const user = getConsoleUser(req);
    const limits = await getEffectivePlanLimits(orgId, user?.id);
    const apartmentsUsed = await prisma.apartment.count({ where: { organization_id: orgId } });
    if (apartmentsUsed >= limits.max_apartments) {
      return next(createAppError(403, `当前服务最多允许 ${limits.max_apartments} 个公寓`));
    }
    const parsed = ApartmentCreateSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    const apt = await defaultApartmentService.create(orgId, parsed.data);
    res.status(201).json(apt);
  } catch (e) {
    next(e);
  }
}

export async function get(req: Request, res: Response, next: NextFunction) {
  try {
    const orgId = await requireOrgMembership(req);
    const apt = await defaultApartmentService.getById(orgId, req.params.id);
    res.json(apt);
  } catch (e) {
    next(e);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const orgId = await requireOrgMembership(req);
    const parsed = ApartmentUpdateSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    const apt = await defaultApartmentService.update(orgId, req.params.id, parsed.data);
    res.json(apt);
  } catch (e) {
    next(e);
  }
}

export async function del(req: Request, res: Response, next: NextFunction) {
  try {
    const orgId = await requireOrgMembership(req);
    await defaultApartmentService.delete(orgId, req.params.id);
    res.locals.successMessage = Messages.APARTMENT_DELETED;
    res.json({});
  } catch (e) {
    next(e);
  }
}

// rooms sub-resource
export async function listRooms(req: Request, res: Response, next: NextFunction) {
  try {
    const orgId = await requireOrgMembership(req);
    const rooms = await defaultRoomService.listByApartment(orgId, req.params.apartmentId);
    res.json(rooms);
  } catch (e) {
    next(e);
  }
}

export async function getRoom(req: Request, res: Response, next: NextFunction) {
  try {
    const orgId = await requireOrgMembership(req);
    const room = await defaultRoomService.getById(orgId, req.params.roomId);
    res.json(room);
  } catch (e) {
    next(e);
  }
}

export async function createRoom(req: Request, res: Response, next: NextFunction) {
  try {
    const orgId = await requireOrgMembership(req);
    const user = getConsoleUser(req);
    if (!user) return next(createAppError(401, '未授权或登录已过期'));
    const limits = await getEffectivePlanLimits(orgId, user.id);
    const roomsUsed = await getRoomsUsedForLimitCheck(orgId, user.id);
    if (roomsUsed + 1 > limits.max_rooms) {
      return next(createAppError(403, `当前服务最多允许 ${limits.max_rooms} 个房间`));
    }
    const parsed = RoomCreateSchema.safeParse({
      ...req.body,
      apartment_id: req.params.apartmentId,
    });
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    const createData = {
      ...parsed.data,
      facilities: parsed.data.facilities ?? undefined,
    };
    const room = await defaultRoomService.create(orgId, req.params.apartmentId, createData);
    res.status(201).json(room);
  } catch (e) {
    next(e);
  }
}

export async function updateRoom(req: Request, res: Response, next: NextFunction) {
  try {
    const orgId = await requireOrgMembership(req);
    const parsed = RoomUpdateSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    const updated = await defaultRoomService.update(orgId, req.params.roomId, {
      ...parsed.data,
      facilities: parsed.data.facilities ?? undefined,
    });
    res.json(updated);
  } catch (e) {
    next(e);
  }
}

export async function deleteRoom(req: Request, res: Response, next: NextFunction) {
  try {
    const orgId = await requireOrgMembership(req);
    await defaultRoomService.delete(orgId, req.params.roomId);
    res.locals.successMessage = Messages.ROOM_DELETED;
    res.json({});
  } catch (e) {
    next(e);
  }
}

export async function batchCreateRooms(req: Request, res: Response, next: NextFunction) {
  try {
    const orgId = await requireOrgMembership(req);
    const user = getConsoleUser(req);
    if (!user) return next(createAppError(401, '未授权或登录已过期'));
    const limits = await getEffectivePlanLimits(orgId, user.id);
    const roomsUsed = await getRoomsUsedForLimitCheck(orgId, user.id);
    const parsed = RoomBatchSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    const addCount = parsed.data.room_numbers.length;
    if (roomsUsed + addCount > limits.max_rooms) {
      return next(
        createAppError(
          403,
          `当前服务最多允许 ${limits.max_rooms} 个房间，当前已用 ${roomsUsed}，无法再添加 ${addCount} 个`
        )
      );
    }
    const created = await defaultRoomService.batchCreate(
      orgId,
      req.params.apartmentId,
      parsed.data
    );
    res.status(201).json(created);
  } catch (e) {
    next(e);
  }
}

// utility config
export async function getUtilityConfig(req: Request, res: Response, next: NextFunction) {
  try {
    const orgId = await requireOrgMembership(req);
    await defaultApartmentService.validateOwnership(orgId, req.params.apartmentId);
    const config = await prisma.utilityConfig.findUnique({
      where: { apartment_id: req.params.apartmentId },
    });
    if (!config) return next(createAppError(404, NotFoundMessages.UTILITY_CONFIG));
    res.json(config);
  } catch (e) {
    next(e);
  }
}

export async function createUtilityConfig(req: Request, res: Response, next: NextFunction) {
  try {
    const orgId = await requireOrgMembership(req);
    await defaultApartmentService.validateOwnership(orgId, req.params.apartmentId);
    const parsed = UtilityConfigSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    const config = await prisma.utilityConfig.upsert({
      where: { apartment_id: req.params.apartmentId },
      update: {
        water_price_per_unit: parsed.data.water_price_per_unit ?? undefined,
        electricity_price_per_unit: parsed.data.electricity_price_per_unit ?? undefined,
        internet_fee: parsed.data.internet_fee ?? undefined,
        management_fee: parsed.data.management_fee ?? undefined,
        service_fee: parsed.data.service_fee ?? undefined,
        notes: parsed.data.notes ?? undefined,
      },
      create: {
        id: ulid().toLowerCase(),
        apartment_id: req.params.apartmentId,
        water_price_per_unit: parsed.data.water_price_per_unit ?? undefined,
        electricity_price_per_unit: parsed.data.electricity_price_per_unit ?? undefined,
        internet_fee: parsed.data.internet_fee ?? undefined,
        management_fee: parsed.data.management_fee ?? undefined,
        service_fee: parsed.data.service_fee ?? undefined,
        notes: parsed.data.notes ?? undefined,
      },
    });
    res.status(200).json(config);
  } catch (e) {
    next(e);
  }
}

export async function updateUtilityConfig(req: Request, res: Response, next: NextFunction) {
  try {
    const orgId = await requireOrgMembership(req);
    await defaultApartmentService.validateOwnership(orgId, req.params.apartmentId);
    const parsed = UtilityConfigSchema.partial().safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    const existing = await prisma.utilityConfig.findUnique({
      where: { apartment_id: req.params.apartmentId },
    });
    if (!existing) return next(createAppError(404, NotFoundMessages.UTILITY_CONFIG));
    const data: Record<string, unknown> = {};
    if (parsed.data.water_price_per_unit != null)
      data.water_price_per_unit = parsed.data.water_price_per_unit;
    if (parsed.data.electricity_price_per_unit != null)
      data.electricity_price_per_unit = parsed.data.electricity_price_per_unit;
    if (parsed.data.internet_fee != null) data.internet_fee = parsed.data.internet_fee;
    if (parsed.data.management_fee != null) data.management_fee = parsed.data.management_fee;
    if (parsed.data.service_fee != null) data.service_fee = parsed.data.service_fee;
    if (parsed.data.notes !== undefined) data.notes = parsed.data.notes;
    const config = await prisma.utilityConfig.update({ where: { id: existing.id }, data });
    res.json(config);
  } catch (e) {
    next(e);
  }
}

export async function deleteUtilityConfig(req: Request, res: Response, next: NextFunction) {
  try {
    const orgId = await requireOrgMembership(req);
    await defaultApartmentService.validateOwnership(orgId, req.params.apartmentId);
    await prisma.utilityConfig.deleteMany({ where: { apartment_id: req.params.apartmentId } });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
}

