import { type Request, type Response, type NextFunction } from 'express';
import { requireOrgMembership, requirePermission } from '../../utils/orgContext.js';
import { createAppError } from '../../utils/appError.js';
import { NotFoundMessages } from '../../messages.js';
import { defaultApartmentService } from '../../services/apartment.service.js';
import { defaultApartmentConfigService } from '../../services/apartmentConfig.service.js';
import { defaultApartmentFeeItemService } from '../../services/apartmentFeeItem.service.js';
import {
  ApartmentConfigSchema,
  ApartmentFeeItemCreateSchema,
  ApartmentFeeItemUpdateSchema,
  CopyConfigSchema,
} from '../../lib/schemas.js';

// ==================== Apartment Config Handlers ====================

export async function getConfig(req: Request, res: Response, next: NextFunction) {
  
    const orgId = await requireOrgMembership(req);
    await defaultApartmentService.validateOwnership(orgId, req.params.apartmentId);
    const config = await defaultApartmentConfigService.getWithFeeItems(req.params.apartmentId);
    if (!config) return next(createAppError(404, NotFoundMessages.APARTMENT_CONFIG));
    res.json(config);
  
}

export async function upsertConfig(req: Request, res: Response, next: NextFunction) {
  
    const orgId = await requireOrgMembership(req);
    await requirePermission(req, orgId, 'apartment:edit');
    await defaultApartmentService.validateOwnership(orgId, req.params.apartmentId);
    const parsed = ApartmentConfigSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    const config = await defaultApartmentConfigService.upsert(req.params.apartmentId, parsed.data);
    res.status(200).json(config);
  
}

export async function updateConfig(req: Request, res: Response, next: NextFunction) {
  
    const orgId = await requireOrgMembership(req);
    await requirePermission(req, orgId, 'apartment:edit');
    await defaultApartmentService.validateOwnership(orgId, req.params.apartmentId);
    const parsed = ApartmentConfigSchema.partial().safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    const config = await defaultApartmentConfigService.update(req.params.apartmentId, parsed.data);
    res.json(config);
  
}

export async function deleteConfig(req: Request, res: Response, _next: NextFunction) {
  
    const orgId = await requireOrgMembership(req);
    await requirePermission(req, orgId, 'apartment:edit');
    await defaultApartmentService.validateOwnership(orgId, req.params.apartmentId);
    await defaultApartmentConfigService.delete(req.params.apartmentId);
    res.status(204).send();
  
}

// ==================== Fee Item Handlers ====================

export async function listFeeItems(req: Request, res: Response, _next: NextFunction) {
  
    const orgId = await requireOrgMembership(req);
    await defaultApartmentService.validateOwnership(orgId, req.params.apartmentId);
    const { category, cycle, search } = req.query;
    const list = await defaultApartmentFeeItemService.list(req.params.apartmentId, {
      category: category as string,
      cycle: cycle as string,
      search: search as string,
    });
    res.json(list);
  
}

export async function getFeeItem(req: Request, res: Response, _next: NextFunction) {
  
    const orgId = await requireOrgMembership(req);
    await defaultApartmentService.validateOwnership(orgId, req.params.apartmentId);
    const item = await defaultApartmentFeeItemService.getById(req.params.apartmentId, req.params.id);
    res.json(item);
  
}

export async function createFeeItem(req: Request, res: Response, next: NextFunction) {
  
    const orgId = await requireOrgMembership(req);
    await requirePermission(req, orgId, 'apartment:edit');
    await defaultApartmentService.validateOwnership(orgId, req.params.apartmentId);
    const parsed = ApartmentFeeItemCreateSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    const item = await defaultApartmentFeeItemService.create(req.params.apartmentId, parsed.data);
    res.status(201).json(item);
  
}

export async function updateFeeItem(req: Request, res: Response, next: NextFunction) {
  
    const orgId = await requireOrgMembership(req);
    await requirePermission(req, orgId, 'apartment:edit');
    await defaultApartmentService.validateOwnership(orgId, req.params.apartmentId);
    const parsed = ApartmentFeeItemUpdateSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    const item = await defaultApartmentFeeItemService.update(req.params.apartmentId, req.params.id, parsed.data);
    res.json(item);
  
}

export async function deleteFeeItem(req: Request, res: Response, _next: NextFunction) {
  
    const orgId = await requireOrgMembership(req);
    await requirePermission(req, orgId, 'apartment:edit');
    await defaultApartmentService.validateOwnership(orgId, req.params.apartmentId);
    await defaultApartmentFeeItemService.delete(req.params.apartmentId, req.params.id);
    res.status(204).send();
  
}

// ==================== Copy Config Handler ====================

export async function applyConfig(req: Request, res: Response, next: NextFunction) {
  
    const orgId = await requireOrgMembership(req);
    await requirePermission(req, orgId, 'apartment:edit');
    await defaultApartmentService.validateOwnership(orgId, req.params.apartmentId);
    const parsed = CopyConfigSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));

    // 验证目标公寓的所有权
    for (const targetId of parsed.data.target_apartment_ids) {
      await defaultApartmentService.validateOwnership(orgId, targetId);
    }

    const result = await defaultApartmentConfigService.copyConfig(req.params.apartmentId, parsed.data);
    res.json(result);
  
}
