import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { requireConsoleAuth } from '../../middlewares/requireAuth.js';
import { requireOrgMembership } from '../../utils/orgContext.js';
import { createAppError } from '../../utils/appError.js';
import { defaultTenantService } from '../../services/tenant.service.js';

const router: Router = Router();

router.use(requireConsoleAuth);

const TenantCreateSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional(),
  sms_opt_out: z.boolean().optional(),
  sms_opt_out_reason: z.string().max(255).optional(),
  id_card: z.string().optional(),
  emergency_contact: z.string().optional(),
  emergency_phone: z.string().optional(),
  notes: z.string().optional(),
});
const TenantUpdateSchema = TenantCreateSchema.partial();

/**
 * @openapi
 * /tenants:
 *   get:
 *     summary: 获取租客列表
 *     tags: [租客管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: 搜索关键词
 *     responses:
 *       200:
 *         description: 租客列表
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Tenant'
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : undefined;
    const list = await defaultTenantService.list(orgId, search);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /tenants:
 *   post:
 *     summary: 创建租客
 *     tags: [租客管理]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               id_card:
 *                 type: string
 *               emergency_contact:
 *                 type: string
 *               emergency_phone:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: 创建成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tenant'
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const parsed = TenantCreateSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    const tenant = await defaultTenantService.create(orgId, parsed.data);
    res.status(201).json(tenant);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /tenants/{id}:
 *   get:
 *     summary: 获取单个租客
 *     tags: [租客管理]
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
 *         description: 租客信息
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tenant'
 *       404:
 *         description: 租客不存在
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const tenant = await defaultTenantService.getById(orgId, req.params.id);
    res.json(tenant);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /tenants/{id}:
 *   put:
 *     summary: 更新租客
 *     tags: [租客管理]
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
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               id_card:
 *                 type: string
 *               emergency_contact:
 *                 type: string
 *               emergency_phone:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: 更新成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tenant'
 *       404:
 *         description: 租客不存在
 */
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const parsed = TenantUpdateSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    const tenant = await defaultTenantService.update(orgId, req.params.id, parsed.data);
    res.json(tenant);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /tenants/{id}:
 *   delete:
 *     summary: 删除租客
 *     tags: [租客管理]
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
 *         description: 租客不存在
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    await defaultTenantService.delete(orgId, req.params.id);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

export const tenantsRouter = router;
