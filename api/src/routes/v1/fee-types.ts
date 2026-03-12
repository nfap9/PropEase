import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { requireConsoleAuth } from '../../middlewares/requireAuth.js';
import { requireOrgMembership } from '../../utils/orgContext.js';
import { createAppError } from '../../utils/appError.js';
import { defaultFeeTypeService } from '../../services/feeType.service.js';

const router: Router = Router();

router.use(requireConsoleAuth);

// Schemas
const FeeSpecificationSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price_monthly: z.number().min(0),
  price_yearly: z.number().min(0).optional(),
  unit: z.string().optional(),
  is_default: z.boolean().optional(),
  sort_order: z.number().optional(),
});

const FeeTypeCreateSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1).max(50),
  description: z.string().optional(),
  category: z.enum(['fixed', 'utility', 'optional']).optional(),
  specifications: z.array(FeeSpecificationSchema).optional(),
});

const FeeTypeUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z.enum(['fixed', 'utility', 'optional']).optional(),
  is_active: z.boolean().optional(),
  sort_order: z.number().optional(),
});

const SpecificationCreateSchema = FeeSpecificationSchema;
const SpecificationUpdateSchema = FeeSpecificationSchema.partial();

/**
 * @openapi
 * /fee-types:
 *   get:
 *     summary: 获取费用类型列表
 *     tags: [费用类型]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 费用类型列表
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/FeeType'
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const list = await defaultFeeTypeService.list(orgId);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /fee-types/specifications/{specId}:
 *   get:
 *     summary: 获取单个费用规格
 *     tags: [费用类型]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: specId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 费用规格信息
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FeeSpecification'
 *       404:
 *         description: 规格不存在
 */
router.get('/specifications/:specId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const spec = await defaultFeeTypeService.getSpecificationById(orgId, req.params.specId);
    res.json(spec);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /fee-types/{id}:
 *   get:
 *     summary: 获取费用类型详情
 *     tags: [费用类型]
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
 *         description: 费用类型详情
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FeeType'
 *       404:
 *         description: 费用类型不存在
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const feeType = await defaultFeeTypeService.getById(orgId, req.params.id);
    res.json(feeType);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /fee-types:
 *   post:
 *     summary: 创建费用类型
 *     tags: [费用类型]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, code]
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *                 maxLength: 50
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [fixed, utility, optional]
 *               specifications:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [name, price_monthly]
 *                   properties:
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                     price_monthly:
 *                       type: number
 *                     price_yearly:
 *                       type: number
 *                     unit:
 *                       type: string
 *                     is_default:
 *                       type: boolean
 *                     sort_order:
 *                       type: number
 *     responses:
 *       201:
 *         description: 创建成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FeeType'
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const parsed = FeeTypeCreateSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    const feeType = await defaultFeeTypeService.create(orgId, parsed.data);
    res.status(201).json(feeType);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /fee-types/{id}:
 *   put:
 *     summary: 更新费用类型
 *     tags: [费用类型]
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
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [fixed, utility, optional]
 *               is_active:
 *                 type: boolean
 *               sort_order:
 *                 type: number
 *     responses:
 *       200:
 *         description: 更新成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FeeType'
 *       404:
 *         description: 费用类型不存在
 */
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const parsed = FeeTypeUpdateSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    const feeType = await defaultFeeTypeService.update(orgId, req.params.id, parsed.data);
    res.json(feeType);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /fee-types/{id}:
 *   delete:
 *     summary: 删除费用类型
 *     tags: [费用类型]
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
 *         description: 费用类型不存在
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    await defaultFeeTypeService.delete(orgId, req.params.id);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /fee-types/{id}/specifications:
 *   get:
 *     summary: 获取费用类型的规格列表
 *     tags: [费用类型]
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
 *         description: 规格列表
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/FeeSpecification'
 *       404:
 *         description: 费用类型不存在
 */
router.get('/:id/specifications', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const feeType = await defaultFeeTypeService.getById(orgId, req.params.id);
    res.json(feeType.specifications);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /fee-types/{id}/specifications:
 *   post:
 *     summary: 添加费用规格
 *     tags: [费用类型]
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
 *             required: [name, price_monthly]
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price_monthly:
 *                 type: number
 *               price_yearly:
 *                 type: number
 *               unit:
 *                 type: string
 *               is_default:
 *                 type: boolean
 *               sort_order:
 *                 type: number
 *     responses:
 *       201:
 *         description: 添加成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FeeSpecification'
 *       404:
 *         description: 费用类型不存在
 */
router.post('/:id/specifications', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const parsed = SpecificationCreateSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    const spec = await defaultFeeTypeService.addSpecification(orgId, req.params.id, parsed.data);
    res.status(201).json(spec);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /fee-types/specifications/{specId}:
 *   put:
 *     summary: 更新费用规格
 *     tags: [费用类型]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: specId
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
 *               description:
 *                 type: string
 *               price_monthly:
 *                 type: number
 *               price_yearly:
 *                 type: number
 *               unit:
 *                 type: string
 *               is_default:
 *                 type: boolean
 *               sort_order:
 *                 type: number
 *     responses:
 *       200:
 *         description: 更新成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FeeSpecification'
 *       404:
 *         description: 规格不存在
 */
router.put('/specifications/:specId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const parsed = SpecificationUpdateSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    const spec = await defaultFeeTypeService.updateSpecification(orgId, req.params.specId, parsed.data);
    res.json(spec);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /fee-types/specifications/{specId}:
 *   delete:
 *     summary: 删除费用规格
 *     tags: [费用类型]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: specId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: 删除成功
 *       404:
 *         description: 规格不存在
 */
router.delete('/specifications/:specId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    await defaultFeeTypeService.deleteSpecification(orgId, req.params.specId);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

export const feeTypesRouter = router;
