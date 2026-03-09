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
import { defaultApartmentService } from '../../services/apartment.service.js';
import { defaultRoomService } from '../../services/room.service.js';
import { defaultApartmentFeeConfigService } from '../../services/apartmentFeeConfig.service.js';

const router: Router = Router();

router.use(requireConsoleAuth);

const ApartmentCreateSchema = z.object({
  name: z.string().min(1),
  address: z.string().optional(),
  description: z.string().optional(),
});
const ApartmentUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  address: z.string().optional(),
  description: z.string().optional(),
});
const FacilityItemSchema = z.object({
  code: z.string(),
  quantity: z.number().int().min(1),
});
const RoomFacilitiesSchema = z.object({
  version: z.literal(1),
  furniture: z.array(FacilityItemSchema),
  appliances: z.array(FacilityItemSchema),
});
const RoomCreateSchema = z.object({
  apartment_id: z.string(),
  room_number: z.string().min(1),
  layout: z.string().optional(),
  monthly_rent: z.number(),
  area: z.number().optional(),
  notes: z.string().optional(),
  status: z.enum(['available', 'occupied', 'maintenance']).optional(),
  facilities: RoomFacilitiesSchema.optional(),
});
const RoomBatchSchema = z.object({
  room_numbers: z.array(z.string()),
  layout: z.string().optional(),
  monthly_rent: z.number(),
  area: z.number().optional(),
  notes: z.string().optional(),
});
const RoomUpdateSchema = z.object({
  room_number: z.string().optional(),
  layout: z.string().optional(),
  status: z.string().optional(),
  monthly_rent: z.number().optional(),
  area: z.number().optional(),
  notes: z.string().optional(),
  facilities: RoomFacilitiesSchema.nullable().optional(),
});
const UtilityConfigSchema = z.object({
  water_price_per_unit: z.number().min(0).optional(),
  electricity_price_per_unit: z.number().min(0).optional(),
  internet_fee: z.number().min(0).optional(),
  management_fee: z.number().min(0).optional(),
  service_fee: z.number().min(0).optional(),
  notes: z.string().max(500).optional(),
});

// GET /apartments - 列出所有公寓（带统计）
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const list = await defaultApartmentService.listByOrg(orgId);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

// POST /apartments - 创建公寓
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const user = getConsoleUser(req);
    const limits = await getEffectivePlanLimits(orgId, user?.id);
    const apartmentsUsed = await prisma.apartment.count({ where: { organization_id: orgId } });
    if (apartmentsUsed >= limits.max_apartments) {
      return next(createAppError(403, `当前套餐最多允许 ${limits.max_apartments} 个公寓`));
    }
    const parsed = ApartmentCreateSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    const apt = await defaultApartmentService.create(orgId, parsed.data);
    res.status(201).json(apt);
  } catch (e) {
    next(e);
  }
});

// GET /apartments/rooms/:roomId - 获取单个房间
router.get('/rooms/:roomId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const room = await defaultRoomService.getById(orgId, req.params.roomId);
    res.json(room);
  } catch (e) {
    next(e);
  }
});

// PUT /apartments/rooms/:roomId - 更新房间
router.put('/rooms/:roomId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const parsed = RoomUpdateSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { status: _status, ...restData } = parsed.data;
    const updated = await defaultRoomService.update(orgId, req.params.roomId, {
      ...restData,
      facilities: restData.facilities ?? undefined,
    });
    res.json(updated);
  } catch (e) {
    next(e);
  }
});

// DELETE /apartments/rooms/:roomId - 删除房间
router.delete('/rooms/:roomId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    await defaultRoomService.delete(orgId, req.params.roomId);
    res.locals.successMessage = Messages.ROOM_DELETED;
    res.json({});
  } catch (e) {
    next(e);
  }
});

// GET /apartments/:apartmentId/rooms - 列出公寓的房间
router.get('/:apartmentId/rooms', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const rooms = await defaultRoomService.listByApartment(orgId, req.params.apartmentId);
    res.json(rooms);
  } catch (e) {
    next(e);
  }
});

// POST /apartments/:apartmentId/rooms - 创建房间
router.post('/:apartmentId/rooms', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const user = getConsoleUser(req);
    if (!user) return next(createAppError(401, '未授权或登录已过期'));
    const limits = await getEffectivePlanLimits(orgId, user.id);
    const roomsUsed = await getRoomsUsedForLimitCheck(orgId, user.id);
    if (roomsUsed + 1 > limits.max_rooms) {
      return next(createAppError(403, `当前套餐最多允许 ${limits.max_rooms} 个房间`));
    }
    const parsed = RoomCreateSchema.safeParse({
      ...req.body,
      apartment_id: req.params.apartmentId,
    });
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    const room = await defaultRoomService.create(orgId, req.params.apartmentId, parsed.data);
    res.status(201).json(room);
  } catch (e) {
    next(e);
  }
});

// POST /apartments/:apartmentId/rooms/batch - 批量创建房间
router.post(
  '/:apartmentId/rooms/batch',
  async (req: Request, res: Response, next: NextFunction) => {
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
            `当前套餐最多允许 ${limits.max_rooms} 个房间，当前已用 ${roomsUsed}，无法再添加 ${addCount} 个`
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
);

// GET /apartments/:apartmentId/utility-config - 获取水电配置
router.get(
  '/:apartmentId/utility-config',
  async (req: Request, res: Response, next: NextFunction) => {
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
);

// POST /apartments/:apartmentId/utility-config - 创建或更新水电配置 (upsert)
router.post(
  '/:apartmentId/utility-config',
  async (req: Request, res: Response, next: NextFunction) => {
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
);

// PUT /apartments/:apartmentId/utility-config - 更新水电配置
router.put(
  '/:apartmentId/utility-config',
  async (req: Request, res: Response, next: NextFunction) => {
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
);

// DELETE /apartments/:apartmentId/utility-config - 删除水电配置
router.delete(
  '/:apartmentId/utility-config',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orgId = await requireOrgMembership(req);
      await defaultApartmentService.validateOwnership(orgId, req.params.apartmentId);
      await prisma.utilityConfig.deleteMany({ where: { apartment_id: req.params.apartmentId } });
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  }
);

// 费用配置 Schemas
const ApartmentFeeConfigCreateSchema = z.object({
  fee_type_id: z.string().min(1),
  specification_id: z.string().optional(),
  is_enabled: z.boolean().optional(),
  allow_lease_override: z.boolean().optional(),
  effective_from: z.string().min(1),
  effective_to: z.string().optional(),
  notes: z.string().max(500).optional(),
});
const ApartmentFeeConfigUpdateSchema = ApartmentFeeConfigCreateSchema.partial().omit({ fee_type_id: true });

// GET /apartments/:apartmentId/fee-configs - 获取公寓费用配置列表
router.get(
  '/:apartmentId/fee-configs',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orgId = await requireOrgMembership(req);
      await defaultApartmentService.validateOwnership(orgId, req.params.apartmentId);
      const configs = await defaultApartmentFeeConfigService.list(req.params.apartmentId);
      res.json(configs);
    } catch (e) {
      next(e);
    }
  }
);

// POST /apartments/:apartmentId/fee-configs - 启用费用类型
router.post(
  '/:apartmentId/fee-configs',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orgId = await requireOrgMembership(req);
      await defaultApartmentService.validateOwnership(orgId, req.params.apartmentId);
      const parsed = ApartmentFeeConfigCreateSchema.safeParse(req.body);
      if (!parsed.success) return next(createAppError(422, '参数校验失败'));
      const config = await defaultApartmentFeeConfigService.create(
        req.params.apartmentId,
        parsed.data
      );
      res.status(201).json(config);
    } catch (e) {
      next(e);
    }
  }
);

// GET /apartments/:apartmentId/fee-configs/:configId - 获取单个费用配置
router.get(
  '/:apartmentId/fee-configs/:configId',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orgId = await requireOrgMembership(req);
      await defaultApartmentService.validateOwnership(orgId, req.params.apartmentId);
      const config = await defaultApartmentFeeConfigService.getById(
        req.params.apartmentId,
        req.params.configId
      );
      res.json(config);
    } catch (e) {
      next(e);
    }
  }
);

// PUT /apartments/:apartmentId/fee-configs/:configId - 更新费用配置
router.put(
  '/:apartmentId/fee-configs/:configId',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orgId = await requireOrgMembership(req);
      await defaultApartmentService.validateOwnership(orgId, req.params.apartmentId);
      const parsed = ApartmentFeeConfigUpdateSchema.safeParse(req.body);
      if (!parsed.success) return next(createAppError(422, '参数校验失败'));
      const config = await defaultApartmentFeeConfigService.update(
        req.params.apartmentId,
        req.params.configId,
        parsed.data
      );
      res.json(config);
    } catch (e) {
      next(e);
    }
  }
);

// DELETE /apartments/:apartmentId/fee-configs/:configId - 禁用费用类型
router.delete(
  '/:apartmentId/fee-configs/:configId',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orgId = await requireOrgMembership(req);
      await defaultApartmentService.validateOwnership(orgId, req.params.apartmentId);
      await defaultApartmentFeeConfigService.delete(
        req.params.apartmentId,
        req.params.configId
      );
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  }
);

// GET /apartments/:id - 获取单个公寓
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const apt = await defaultApartmentService.getById(orgId, req.params.id);
    res.json(apt);
  } catch (e) {
    next(e);
  }
});

// PUT /apartments/:id - 更新公寓
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const parsed = ApartmentUpdateSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    const apt = await defaultApartmentService.update(orgId, req.params.id, parsed.data);
    res.json(apt);
  } catch (e) {
    next(e);
  }
});

// DELETE /apartments/:id - 删除公寓
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    await defaultApartmentService.delete(orgId, req.params.id);
    res.locals.successMessage = Messages.APARTMENT_DELETED;
    res.json({});
  } catch (e) {
    next(e);
  }
});

export const apartmentsRouter = router;
