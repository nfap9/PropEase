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

// GET /fee-types - 获取费用类型列表
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const list = await defaultFeeTypeService.list(orgId);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

// GET /fee-types/specifications/:specId - 获取单个费用规格
// 注意：此路由必须在 /:id 之前定义，否则会被 :id 匹配
router.get('/specifications/:specId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const spec = await defaultFeeTypeService.getSpecificationById(orgId, req.params.specId);
    res.json(spec);
  } catch (e) {
    next(e);
  }
});

// GET /fee-types/:id - 获取费用类型详情
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const feeType = await defaultFeeTypeService.getById(orgId, req.params.id);
    res.json(feeType);
  } catch (e) {
    next(e);
  }
});

// POST /fee-types - 创建费用类型
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

// PUT /fee-types/:id - 更新费用类型
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

// DELETE /fee-types/:id - 删除费用类型
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    await defaultFeeTypeService.delete(orgId, req.params.id);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

// GET /fee-types/:id/specifications - 获取费用类型的规格列表
router.get('/:id/specifications', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const feeType = await defaultFeeTypeService.getById(orgId, req.params.id);
    res.json(feeType.specifications);
  } catch (e) {
    next(e);
  }
});

// POST /fee-types/:id/specifications - 添加规格
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

// PUT /fee-types/specifications/:specId - 更新规格
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

// DELETE /fee-types/specifications/:specId - 删除规格
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
