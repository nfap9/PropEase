/**
 * 商店配置管理路由
 */
import { Router } from 'express';
import { z } from 'zod';
import { getAdminUser } from '../../../utils/context.js';
import { createAppError } from '../../../utils/appError.js';
import { auditAdminAction } from '../../../utils/audit.js';
import { ServiceProductService } from '../../../services/service-product.service.js';
import type { Request, Response, NextFunction } from 'express';

export const adminStorefrontsRouter: Router = Router();
const service = new ServiceProductService();

// ========================
// 商店配置 CRUD
// ========================

/** 列表查询 */
adminStorefrontsRouter.get('/storefronts', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const isActive = req.query.is_active === 'true' ? true : req.query.is_active === 'false' ? false : undefined;
    const configs = await service.listStorefronts({ is_active: isActive });
    res.json(configs);
  } catch (e) {
    next(e);
  }
});

/** 根据 ID 查询 */
adminStorefrontsRouter.get('/storefronts/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const config = await service.getStorefrontById(req.params.id);
    if (!config) {
      return next(createAppError(404, '商店配置不存在'));
    }
    res.json(config);
  } catch (e) {
    next(e);
  }
});

const StorefrontCreateSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  is_active: z.boolean().default(true),
  is_default: z.boolean().default(false),
});

/** 创建商店配置 */
adminStorefrontsRouter.post('/storefronts', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = StorefrontCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(createAppError(422, '参数校验失败'));
    }
    const config = await service.createStorefront(parsed.data);
    auditAdminAction(req, 'storefront:create', config.id, { name: parsed.data.name });
    res.status(201).json(config);
  } catch (e) {
    next(e);
  }
});

const StorefrontUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  is_active: z.boolean().optional(),
  is_default: z.boolean().optional(),
});
/** 更新商店配置 */
adminStorefrontsRouter.put('/storefronts/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = StorefrontUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(createAppError(422, '参数校验失败'));
    }
    const config = await service.updateStorefront(req.params.id, parsed.data);
    auditAdminAction(req, 'storefront:update', req.params.id, parsed.data);
    res.json(config);
  } catch (e) {
    next(e);
  }
});

/** 删除商店配置 */
adminStorefrontsRouter.delete('/storefronts/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await service.deleteStorefront(req.params.id);
    auditAdminAction(req, 'storefront:delete', req.params.id);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

// ========================
// 商店项管理
// ========================

const StorefrontItemCreateSchema = z.object({
  service_id: z.string().min(1),
  is_visible: z.boolean().default(true),
  sort_order: z.number().int().default(0),
  pricing_discounts: z
 .array(
    z.object({
      months: z.number().int().min(1),
      discount_type: z.enum(['percent', 'fixed', 'gift']),
      discount_value: z.number().nullable(),
      gift_months: z.number().int().nullable(),
    })
  )
  .optional(),
});
/** 添加服务到商店 */
adminStorefrontsRouter.post(
  '/storefronts/:id/items',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = StorefrontItemCreateSchema.safeParse(req.body);
      if (!parsed.success) {
        return next(createAppError(422, '参数校验失败'));
      }
      const item = await service.addServiceToStorefront(req.params.id, parsed.data);
      auditAdminAction(req, 'storefront-item:create', item.id, {
        service_id: parsed.data.service_id,
      });
      res.status(201).json(item);
    } catch (e) {
      next(e);
    }
  }
);

const StorefrontItemUpdateSchema = z.object({
  is_visible: z.boolean().optional(),
  sort_order: z.number().int().optional(),
  pricing_discounts: z
 .array(
    z.object({
      months: z.number().int().min(1),
      discount_type: z.enum(['percent', 'fixed', 'gift']),
      discount_value: z.number().nullable(),
      gift_months: z.number().int().nullable(),
    })
  )
  .optional(),
});
/** 更新商店项 */
adminStorefrontsRouter.put(
  '/storefronts/:storefront_id/items/:item_id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = StorefrontItemUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        return next(createAppError(422, '参数校验失败'));
      }
      const item = await service.updateStorefrontItem(req.params.item_id, parsed.data);
      auditAdminAction(req, 'storefront-item:update', req.params.item_id, parsed.data);
      res.json(item);
    } catch (e) {
      next(e);
    }
  }
);

/** 从商店移除服务 */
adminStorefrontsRouter.delete(
  '/storefronts/:storefront_id/items/:item_id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await service.removeServiceFromStorefront(req.params.storefront_id, req.params.item_id);
      auditAdminAction(req, 'storefront-item:delete', req.params.item_id);
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  }
);

const StorefrontItemsReorderSchema = z.object({
  item_ids: z.array(z.string().min(1)),
});
/** 重新排序商店项 */
adminStorefrontsRouter.put(
  '/storefronts/:id/items/reorder',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = StorefrontItemsReorderSchema.safeParse(req.body);
      if (!parsed.success) {
        return next(createAppError(422, '参数校验失败'));
      }
      await service.reorderStorefrontItems(req.params.id, parsed.data.item_ids);
      auditAdminAction(req, 'storefront-items:reorder', req.params.id, {
        item_count: parsed.data.item_ids.length,
      });
      res.json({ success: true });
    } catch (e) {
      next(e);
    }
  }
);
