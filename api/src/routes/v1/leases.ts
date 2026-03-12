import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { requireConsoleAuth } from '../../middlewares/requireAuth.js';
import { requireOrgMembership } from '../../utils/orgContext.js';
import { createAppError } from '../../utils/appError.js';
import { Messages } from '../../messages.js';
import { defaultLeaseService } from '../../services/lease.service.js';

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
    await defaultLeaseService.delete(orgId, req.params.id);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

export const leasesRouter = router;
