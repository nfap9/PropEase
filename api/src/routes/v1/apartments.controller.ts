import { type Request, type Response, type NextFunction } from 'express';
import { requireOrgMembership, requirePermission } from '../../utils/orgContext.js';
import { getConsoleUser } from '../../utils/context.js';
import { createAppError } from '../../utils/appError.js';
import { Messages } from '../../messages.js';
import { getEffectivePlanLimits, getRoomsUsedForLimitCheck } from '../../utils/orgPlanLimits.js';
import { defaultApartmentService } from '../../services/apartment.service.js';
import { defaultApartmentRepo } from '../../repositories/apartment.repo.js';
import { defaultRoomService } from '../../services/room.service.js';

import {
  ApartmentCreateSchema,
  ApartmentUpdateSchema,
  FacilityItemSchema,
  RoomFacilitiesSchema,
  RoomCreateSchema,
  RoomUpdateSchema,
  RoomBatchSchema,
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
};


// ==================== Handlers ====================

export async function list(req: Request, res: Response, _next: NextFunction) {
  
    const orgId = await requireOrgMembership(req);
    const result = await defaultApartmentService.listByOrg(orgId);
    res.json(result);
  
}

export async function create(req: Request, res: Response, next: NextFunction) {
  
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
  
}

export async function get(req: Request, res: Response, _next: NextFunction) {
  
    const orgId = await requireOrgMembership(req);
    const apt = await defaultApartmentService.getById(orgId, req.params.id);
    res.json(apt);
  
}

export async function update(req: Request, res: Response, next: NextFunction) {
  
    const orgId = await requireOrgMembership(req);
    await requirePermission(req, orgId, 'apartment:edit');
    const parsed = ApartmentUpdateSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    const apt = await defaultApartmentService.update(orgId, req.params.id, parsed.data);
    res.json(apt);
  
}

export async function del(req: Request, res: Response, _next: NextFunction) {
  
    const orgId = await requireOrgMembership(req);
    await requirePermission(req, orgId, 'apartment:delete');
    await defaultApartmentService.delete(orgId, req.params.id);
    res.locals.successMessage = Messages.APARTMENT_DELETED;
    res.json({});
  
}

// rooms sub-resource
export async function listRooms(req: Request, res: Response, _next: NextFunction) {
  
    const orgId = await requireOrgMembership(req);
    const rooms = await defaultRoomService.listByApartment(orgId, req.params.apartmentId);
    res.json(rooms);
  
}

export async function getRoom(req: Request, res: Response, _next: NextFunction) {
  
    const orgId = await requireOrgMembership(req);
    const room = await defaultRoomService.getById(orgId, req.params.roomId);
    res.json(room);
  
}

export async function createRoom(req: Request, res: Response, next: NextFunction) {
  
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
  
}

export async function updateRoom(req: Request, res: Response, next: NextFunction) {
  
    const orgId = await requireOrgMembership(req);
    await requirePermission(req, orgId, 'room:edit');
    const parsed = RoomUpdateSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    const updated = await defaultRoomService.update(orgId, req.params.roomId, {
      ...parsed.data,
      facilities: parsed.data.facilities ?? undefined,
    });
    res.json(updated);
  
}

export async function deleteRoom(req: Request, res: Response, _next: NextFunction) {
  
    const orgId = await requireOrgMembership(req);
    await requirePermission(req, orgId, 'room:delete');
    await defaultRoomService.delete(orgId, req.params.roomId);
    res.locals.successMessage = Messages.ROOM_DELETED;
    res.json({});
  
}

export async function batchCreateRooms(req: Request, res: Response, next: NextFunction) {
  
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
  
}


