import { Router, type Request, type Response, type NextFunction } from 'express';
import { requireConsoleAuth } from '../../middlewares/requireAuth.js';
import { requireOrgMembership, requirePermission } from '../../utils/orgContext.js';
import { createAppError } from '../../utils/appError.js';
import { Messages } from '../../messages.js';
import { defaultLeaseService } from '../../services/lease.service.js';
import { defaultLeaseChangeLogService } from '../../services/leaseChangeLog.service.js';
import { settleLease } from '../../services/leaseSettlement.service.js';
import {
  LeaseChangeRoomSchema,
  LeaseRenewSchema,
  LeaseUpdateTenantSchema,
  LeaseChangeRentSchema,
  LeaseChangeUtilityRatesSchema,
  LeaseChangeDepositSchema,
  LeaseUpdateFeeItemsSchema,
  LeaseSetFeeItemsSchema,
} from '../lib/schemas.js';

// Re-export for backward compatibility
const ChangeRoomSchema = LeaseChangeRoomSchema;
const RenewSchema = LeaseRenewSchema;
const UpdateTenantSchema = LeaseUpdateTenantSchema;
const ChangeRentSchema = LeaseChangeRentSchema;
const ChangeUtilityRatesSchema = LeaseChangeUtilityRatesSchema;
const ChangeDepositSchema = LeaseChangeDepositSchema;
const UpdateFeeItemsSchema = LeaseUpdateFeeItemsSchema;
const SetLeaseFeeItemsSchema = LeaseSetFeeItemsSchema;

export {
  ChangeRoomSchema,
  RenewSchema,
  UpdateTenantSchema,
  ChangeRentSchema,
  ChangeUtilityRatesSchema,
  ChangeDepositSchema,
  UpdateFeeItemsSchema,
  SetLeaseFeeItemsSchema,
};

const router: Router = Router();

router.use(requireConsoleAuth);
    })
  ),
});

const SettleSchema = z.object({
  finalWaterReading: z.number().optional(),
  finalElectricityReading: z.number().optional(),
  penaltyAmount: z.number().optional(),
  remarks: z.string().optional(),
});

// 租约费用项目输入（直接输入模式）
const LeaseFeeItemInputSchema = z.object({
  fee_type_id: z.string().optional(), // 可选，关联费用类型
  fee_name: z.string().min(1, '费用名称不能为空'), // 费用名称
  fee_amount: z.number().min(0, '费用金额不能为负'), // 费用金额
  fee_cycle: z.enum(['monthly', 'quarterly', 'yearly', 'one_time']).default('monthly'), // 计费周期
  quantity: z.number().optional().default(1), // 数量
  notes: z.string().optional(), // 备注
});

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
  fee_items: z.array(LeaseFeeItemInputSchema).optional(),
});
const LeaseUpdateSchema = LeaseCreateSchema.partial();

/**
 * @openapi
 * /leases:
 *   get:
 *     summary: 获取租约列表
 *     tags: [租约管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *         description: 是否仅显示活跃租约
 *     responses:
 *       200:
 *         description: 租约列表
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Lease'
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const isActive =
      req.query.is_active === 'true' ? true : req.query.is_active === 'false' ? false : undefined;
    const list = await defaultLeaseService.list(orgId, isActive);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /leases:
 *   post:
 *     summary: 创建租约
 *     tags: [租约管理]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [room_id, tenant_id, start_date, monthly_rent]
 *             properties:
 *               room_id:
 *                 type: string
 *               tenant_id:
 *                 type: string
 *               start_date:
 *                 type: string
 *                 format: date
 *               end_date:
 *                 type: string
 *                 format: date
 *               billing_day:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 28
 *               monthly_rent:
 *                 type: number
 *               deposit:
 *                 type: number
 *               water_rate:
 *                 type: number
 *               electricity_rate:
 *                 type: number
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: 创建成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Lease'
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    await requirePermission(req, orgId, 'lease:create');
    const parsed = LeaseCreateSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    const lease = await defaultLeaseService.create(orgId, parsed.data);
    res.status(201).json(lease);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /leases/{id}:
 *   get:
 *     summary: 获取单个租约
 *     tags: [租约管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 租约信息
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Lease'
 *       404:
 *         description: 租约不存在
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const lease = await defaultLeaseService.getById(orgId, req.params.id);
    res.json(lease);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /leases/{id}:
 *   put:
 *     summary: 更新租约
 *     tags: [租约管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               room_id:
 *                 type: string
 *               tenant_id:
 *                 type: string
 *               start_date:
 *                 type: string
 *                 format: date
 *               end_date:
 *                 type: string
 *                 format: date
 *               billing_day:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 28
 *               monthly_rent:
 *                 type: number
 *               deposit:
 *                 type: number
 *               water_rate:
 *                 type: number
 *               electricity_rate:
 *                 type: number
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: 更新成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Lease'
 *       404:
 *         description: 租约不存在
 */
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    await requirePermission(req, orgId, 'lease:edit');
    const parsed = LeaseUpdateSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    const lease = await defaultLeaseService.update(orgId, req.params.id, parsed.data);
    res.json(lease);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /leases/{id}/terminate:
 *   post:
 *     summary: 终止租约
 *     tags: [租约管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 终止成功
 *       404:
 *         description: 租约不存在
 */
router.post('/:id/terminate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    await requirePermission(req, orgId, 'lease:delete');
    await defaultLeaseService.terminate(orgId, req.params.id);
    res.locals.successMessage = Messages.LEASE_TERMINATED;
    res.json({});
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /leases/{id}:
 *   delete:
 *     summary: 删除租约
 *     tags: [租约管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: 删除成功
 *       404:
 *         description: 租约不存在
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    await requirePermission(req, orgId, 'lease:delete');
    await defaultLeaseService.delete(orgId, req.params.id);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

/**
 * POST /leases/:id/change-room - 换房
 */
router.post('/:id/change-room', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    await requirePermission(req, orgId, 'lease:edit');
    const parsed = ChangeRoomSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    const result = await defaultLeaseService.changeRoom(
      orgId,
      req.params.id,
      parsed.data.new_roomId,
      parsed.data.changeDate,
      parsed.data.reason
    );
    res.json(result);
  } catch (e) {
    next(e);
  }
});

/**
 * POST /leases/:id/renew - 续约
 */
router.post('/:id/renew', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    await requirePermission(req, orgId, 'lease:edit');
    const parsed = RenewSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    const result = await defaultLeaseService.renew(orgId, req.params.id, parsed.data.newEndDate, parsed.data.reason);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

/**
 * POST /leases/:id/update-tenant - 编辑租客信息
 */
router.post('/:id/update-tenant', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    await requirePermission(req, orgId, 'lease:edit');
    const parsed = UpdateTenantSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    const result = await defaultLeaseService.updateTenant(orgId, req.params.id, parsed.data.newTenantId);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

/**
 * POST /leases/:id/change-rent - 房租变更
 */
router.post('/:id/change-rent', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    await requirePermission(req, orgId, 'lease:edit');
    const parsed = ChangeRentSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    const result = await defaultLeaseService.changeRent(
      orgId,
      req.params.id,
      parsed.data.newRent,
      parsed.data.effectiveFromYear,
      parsed.data.effectiveFromMonth,
      parsed.data.reason
    );
    res.json(result);
  } catch (e) {
    next(e);
  }
});

/**
 * POST /leases/:id/change-utility-rates - 水电单价变更
 */
router.post('/:id/change-utility-rates', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    await requirePermission(req, orgId, 'lease:edit');
    const parsed = ChangeUtilityRatesSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    const result = await defaultLeaseService.changeUtilityRates(
      orgId,
      req.params.id,
      parsed.data.waterRate,
      parsed.data.electricityRate,
      parsed.data.effectiveFromYear,
      parsed.data.effectiveFromMonth
    );
    res.json(result);
  } catch (e) {
    next(e);
  }
});

/**
 * POST /leases/:id/change-deposit - 押金变更
 */
router.post('/:id/change-deposit', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    await requirePermission(req, orgId, 'lease:edit');
    const parsed = ChangeDepositSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    const result = await defaultLeaseService.changeDeposit(
      orgId,
      req.params.id,
      parsed.data.newDeposit,
      parsed.data.reason
    );
    res.json(result);
  } catch (e) {
    next(e);
  }
});

/**
 * POST /leases/:id/update-fee-items - 编辑租约费用项目
 */
router.post('/:id/update-fee-items', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    await requirePermission(req, orgId, 'lease:edit');
    const parsed = UpdateFeeItemsSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    const result = await defaultLeaseService.updateFeeItems(
      orgId,
      req.params.id,
      parsed.data.feeItems,
      parsed.data.effectiveFromYear,
      parsed.data.effectiveFromMonth
    );
    res.json(result);
  } catch (e) {
    next(e);
  }
});

/**
 * POST /leases/:id/set-fee-items - 直接设置租约费用项目（替换模式）
 */
router.post('/:id/set-fee-items', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    await requirePermission(req, orgId, 'lease:edit');
    const parsed = SetLeaseFeeItemsSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    const result = await defaultLeaseService.setLeaseFeeItems(
      orgId,
      req.params.id,
      parsed.data.feeItems
    );
    res.json(result);
  } catch (e) {
    next(e);
  }
});

/**
 * POST /leases/:id/settle - 退租结算
 */
router.post('/:id/settle', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    await requirePermission(req, orgId, 'lease:edit');
    const parsed = SettleSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    const result = await settleLease({
      lease_id: req.params.id,
      org_id: orgId,
      final_water_reading: parsed.data.finalWaterReading,
      final_electricity_reading: parsed.data.finalElectricityReading,
      penalty_amount: parsed.data.penaltyAmount,
      remarks: parsed.data.remarks,
    });
    res.json(result);
  } catch (e) {
    next(e);
  }
});

/**
 * GET /leases/:id/change-logs - 获取变更日志
 */
router.get('/:id/change-logs', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await requireOrgMembership(req);
    const logs = await defaultLeaseChangeLogService.list(req.params.id);
    res.json(logs);
  } catch (e) {
    next(e);
  }
});

export const leasesRouter = router;
