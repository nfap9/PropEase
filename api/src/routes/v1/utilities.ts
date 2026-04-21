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
  reading_context: z.enum(['normal', 'initial', 'meter_reset']).optional(),
  anomaly_reason: z.string().optional(),
});
const ReadingUpdateSchema = ReadingCreateSchema.partial();
const BatchReadingSchema = z.object({
  period_year: z.number(),
  period_month: z.number(),
  reading_date: z.string(),
  readings: z.array(
    z.object({
      room_id: z.string(),
      water_reading: z.number().optional(),
      electricity_reading: z.number().optional(),
      notes: z.string().optional(),
    })
  ),
});

// Query schemas for list and export
const UtilityQuerySchema = z.object({
  room_id: z.string().optional(),
  apartment_id: z.string().optional(),
  period_year: z.number().optional(),
  period_month: z.number().optional(),
});

const UtilityExportSchema = z.object({
  period_year: z.number().optional(),
  period_month: z.number().optional(),
  days_range: z.number().optional(),
});

/**
 * @openapi
 * /utilities/query:
 *   post:
 *     summary: 获取水电读数列表
 *     tags: [水电管理]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               room_id:
 *                 type: string
 *                 description: 房间ID
 *               apartment_id:
 *                 type: string
 *                 description: 公寓ID
 *               period_year:
 *                 type: integer
 *                 description: 账单年份
 *               period_month:
 *                 type: integer
 *                 description: 账单月份
 *     responses:
 *       200:
 *         description: 水电读数列表
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/UtilityReading'
 */
router.post('/query', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const parsed = UtilityQuerySchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    const filter: ReadingFilter = {
      roomId: parsed.data.room_id,
      apartmentId: parsed.data.apartment_id,
      periodYear: parsed.data.period_year,
      periodMonth: parsed.data.period_month,
    };
    const list = await defaultUtilityService.list(orgId, filter);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /utilities/rooms-missing-initial:
 *   get:
 *     summary: 获取缺少初始读数的房间
 *     tags: [水电管理]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 缺少初始读数的房间列表
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   room_id:
 *                     type: string
 *                   room_number:
 *                     type: string
 *                   apartment_name:
 *                     type: string
 */
router.get('/rooms-missing-initial', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const result = await defaultUtilityService.getMissingInitialReadings(orgId);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /utilities/export:
 *   post:
 *     summary: 获取水电导出列表
 *     tags: [水电管理]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               period_year:
 *                 type: integer
 *                 description: 账单年份
 *               period_month:
 *                 type: integer
 *                 description: 账单月份
 *               days_range:
 *                 type: integer
 *                 description: 最近N天内未录入读数的筛选
 *     responses:
 *       200:
 *         description: 导出数据列表
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
router.post('/export', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const parsed = UtilityExportSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));

    const exportList = await defaultUtilityService.getExportList(
      orgId,
      parsed.data.period_year,
      parsed.data.period_month,
      parsed.data.days_range
    );
    res.json(exportList);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /utilities/latest-before:
 *   get:
 *     summary: 获取所有房间在指定周期之前的最新水电读数
 *     tags: [水电管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period_year
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: period_month
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 以 room_id 为键的水电读数映射
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties:
 *                 $ref: '#/components/schemas/UtilityReading'
 */
router.get('/latest-before', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const periodYear = Number(req.query.period_year);
    const periodMonth = Number(req.query.period_month);

    if (!req.query.period_year || !req.query.period_month) {
      throw createAppError(400, 'period_year 和 period_month 为必填参数');
    }
    if (isNaN(periodYear) || isNaN(periodMonth) || periodYear < 2020 || periodMonth < 1 || periodMonth > 12) {
      throw createAppError(400, 'period_year 或 period_month 参数无效');
    }

    const result = await defaultUtilityService.getLatestReadingsBefore(orgId, periodYear, periodMonth);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /utilities:
 *   post:
 *     summary: 创建水电读数
 *     tags: [水电管理]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [room_id, period_year, period_month, reading_date]
 *             properties:
 *               room_id:
 *                 type: string
 *               period_year:
 *                 type: integer
 *               period_month:
 *                 type: integer
 *               reading_date:
 *                 type: string
 *                 format: date
 *               water_reading:
 *                 type: number
 *               electricity_reading:
 *                 type: number
 *               water_previous:
 *                 type: number
 *               electricity_previous:
 *                 type: number
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: 创建成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UtilityReading'
 */
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

/**
 * @openapi
 * /utilities/batch:
 *   post:
 *     summary: 批量创建水电读数
 *     tags: [水电管理]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [period_year, period_month, reading_date, readings]
 *             properties:
 *               period_year:
 *                 type: integer
 *               period_month:
 *                 type: integer
 *               reading_date:
 *                 type: string
 *                 format: date
 *               readings:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [room_id]
 *                   properties:
 *                     room_id:
 *                       type: string
 *                     water_reading:
 *                       type: number
 *                     electricity_reading:
 *                       type: number
 *                     notes:
 *                       type: string
 *     responses:
 *       201:
 *         description: 创建成功
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/UtilityReading'
 */
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

/**
 * @openapi
 * /utilities/{id}:
 *   get:
 *     summary: 获取单个水电读数
 *     tags: [水电管理]
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
 *         description: 水电读数信息
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UtilityReading'
 *       404:
 *         description: 读数不存在
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const reading = await defaultUtilityService.getById(orgId, req.params.id);
    res.json(reading);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /utilities/{id}:
 *   put:
 *     summary: 更新水电读数
 *     tags: [水电管理]
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
 *               period_year:
 *                 type: integer
 *               period_month:
 *                 type: integer
 *               reading_date:
 *                 type: string
 *                 format: date
 *               water_reading:
 *                 type: number
 *               electricity_reading:
 *                 type: number
 *               water_previous:
 *                 type: number
 *               electricity_previous:
 *                 type: number
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: 更新成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UtilityReading'
 *       404:
 *         description: 读数不存在
 */
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

/**
 * @openapi
 * /utilities/{id}:
 *   delete:
 *     summary: 删除水电读数
 *     tags: [水电管理]
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
 *         description: 读数不存在
 */
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
