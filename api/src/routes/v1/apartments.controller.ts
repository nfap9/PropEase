import { type Request, type Response, type NextFunction } from 'express';
import { requireOrgMembership, requirePermission } from '../../utils/orgContext.js';
import { getConsoleUser } from '../../utils/context.js';
import { createAppError } from '../../utils/appError.js';
import { Messages, NotFoundMessages } from '../../messages.js';
import { getEffectivePlanLimits, getRoomsUsedForLimitCheck } from '../../utils/orgPlanLimits.js';
import { defaultApartmentService } from '../../services/apartment.service.js';
import { defaultApartmentRepo } from '../../repositories/apartment.repo.js';
import { defaultRoomService } from '../../services/room.service.js';
import { defaultUtilityConfigService } from '../../services/utilityConfig.service.js';
import {
  ApartmentCreateSchema,
  ApartmentUpdateSchema,
  FacilityItemSchema,
  RoomFacilitiesSchema,
  RoomCreateSchema,
  RoomUpdateSchema,
  RoomBatchSchema,
  UtilityConfigSchema,
} from '../../lib/schemas.js';

// Re-export for backward compatibility
export {
  ApartmentCreateSchema,
  ApartmentUpdateSchema,
  FacilityItemSchema,
  RoomFacilitiesSchema,
  RoomCreateSchema,
  RoomUpdateSchema,
  RoomBatchSchema,
  UtilityConfigSchema,
};


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
    await requirePermission(req, orgId, 'apartment:create');
    const user = getConsoleUser(req);
    const limits = await getEffectivePlanLimits(orgId, user?.id);
    const apartmentsUsed = await defaultApartmentRepo.countByOrgId(orgId);
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
    await requirePermission(req, orgId, 'apartment:edit');
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
    await requirePermission(req, orgId, 'apartment:delete');
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
    await requirePermission(req, orgId, 'room:create');
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
    await requirePermission(req, orgId, 'room:edit');
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
    await requirePermission(req, orgId, 'room:delete');
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
    await requirePermission(req, orgId, 'room:create');
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
    const config = await defaultUtilityConfigService.getByApartmentId(req.params.apartmentId);
    if (!config) return next(createAppError(404, NotFoundMessages.UTILITY_CONFIG));
    res.json(config);
  } catch (e) {
    next(e);
  }
}

export async function createUtilityConfig(req: Request, res: Response, next: NextFunction) {
  try {
    const orgId = await requireOrgMembership(req);
    await requirePermission(req, orgId, 'utility:create');
    await defaultApartmentService.validateOwnership(orgId, req.params.apartmentId);
    const parsed = UtilityConfigSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    const config = await defaultUtilityConfigService.upsert(req.params.apartmentId, parsed.data);
    res.status(200).json(config);
  } catch (e) {
    next(e);
  }
}

export async function updateUtilityConfig(req: Request, res: Response, next: NextFunction) {
  try {
    const orgId = await requireOrgMembership(req);
    await requirePermission(req, orgId, 'utility:edit');
    await defaultApartmentService.validateOwnership(orgId, req.params.apartmentId);
    const parsed = UtilityConfigSchema.partial().safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    const config = await defaultUtilityConfigService.update(req.params.apartmentId, parsed.data);
    res.json(config);
  } catch (e) {
    next(e);
  }
}

export async function deleteUtilityConfig(req: Request, res: Response, next: NextFunction) {
  try {
    const orgId = await requireOrgMembership(req);
    await requirePermission(req, orgId, 'utility:delete');
    await defaultApartmentService.validateOwnership(orgId, req.params.apartmentId);
    await defaultUtilityConfigService.delete(req.params.apartmentId);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
}

