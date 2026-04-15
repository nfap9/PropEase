/**
 * 服务产品管理路由
 */
import { Router } from 'express';
import { z } from 'zod';
import { createAppError } from '../../../utils/appError.js';
import { auditAdminAction } from '../../../utils/audit.js';
import { defaultServiceProductService } from '../../../services/service-product.service.js';
import type { Request, Response, NextFunction } from 'express';

export const adminServiceProductsRouter: Router = Router();
const service = defaultServiceProductService;

// ========================
// 服务产品 CRUD
// ========================

/** 列表查询 */
adminServiceProductsRouter.get('/service-products', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const isActive = req.query.is_active === 'true' ? true : req.query.is_active === 'false' ? false : undefined;
    const includePricing = req.query.include_pricing === 'true';
    const products = await service.listServiceProducts({
      is_active: isActive,
      include_pricing: includePricing,
    });
    res.json(products);
  } catch (e) {
    next(e);
  }
});

/** 根据 ID 查询 */
adminServiceProductsRouter.get('/service-products/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await service.getServiceProductById(req.params.id);
    if (!product) {
      return next(createAppError(404, '服务产品不存在'));
    }
    res.json(product);
  } catch (e) {
    next(e);
  }
});

const ServiceProductCreateSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  description: z.string().optional(),
  max_organizations: z.number().int().min(0).optional().nullable(),
  max_apartments: z.number().int().min(0).default(1),
  max_rooms: z.number().int().min(0).default(100),
  max_members: z.number().int().min(0).default(1),
  is_active: z.boolean().default(true),
  sort_order: z.number().int().default(0),
  pricing: z
    .array(
      z.object({
        months: z.number().int().min(1),
        price: z.number().min(0),
        is_active: z.boolean().default(true),
        sort_order: z.number().int().default(0),
      })
    )
    .optional(),
});

/** 创建 */
adminServiceProductsRouter.post('/service-products', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = ServiceProductCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(createAppError(422, '参数校验失败'));
    }
    const product = await service.createServiceProduct(parsed.data);
    if (product) {
      auditAdminAction(req, 'service-product:create', product.id, { name: parsed.data.name });
    }
    res.status(201).json(product);
  } catch (e) {
    next(e);
  }
});

const ServiceProductUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  max_organizations: z.number().int().min(0).optional().nullable(),
  max_apartments: z.number().int().min(0).optional(),
  max_rooms: z.number().int().min(0).optional(),
  max_members: z.number().int().min(0).optional(),
  is_active: z.boolean().optional(),
  sort_order: z.number().int().optional(),
});
/** 更新 */
adminServiceProductsRouter.put('/service-products/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = ServiceProductUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(createAppError(422, '参数校验失败'));
    }
    const product = await service.updateServiceProduct(req.params.id, parsed.data);
    auditAdminAction(req, 'service-product:update', req.params.id, parsed.data);
    res.json(product);
  } catch (e) {
    next(e);
  }
});

/** 删除 */
adminServiceProductsRouter.delete('/service-products/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await service.deleteServiceProduct(req.params.id);
    auditAdminAction(req, 'service-product:delete', req.params.id);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

// ========================
// 服务定价管理
// ========================

const ServicePricingBatchSchema = z.object({
  pricing: z.array(
    z.object({
      months: z.number().int().min(1),
      price: z.number().min(0),
      is_active: z.boolean().default(true),
      sort_order: z.number().int().default(0),
    })
  ),
});
/** 批量更新服务定价 */
adminServiceProductsRouter.put(
  '/service-products/:id/pricing',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = ServicePricingBatchSchema.safeParse(req.body);
      if (!parsed.success) {
        return next(createAppError(422, '参数校验失败'));
      }
      const product = await service.batchUpdatePricing(req.params.id, parsed.data.pricing);
      auditAdminAction(req, 'service-product:pricing:update', req.params.id, {
        pricing_count: parsed.data.pricing.length,
      });
      res.json(product);
    } catch (e) {
      next(e);
    }
  }
);
