import { Router, type NextFunction, type Request, type Response } from 'express';
import { z } from 'zod';
import { requireConsoleAuth } from '../../middlewares/requireAuth.js';
import { requireOrgMembership } from '../../utils/orgContext.js';
import { createAppError } from '../../utils/appError.js';
import { defaultTenantReachabilityService } from '../../services/tenantReachability.service.js';

const router: Router = Router();

router.use(requireConsoleAuth);

const eventTypeSchema = z.enum(['bill_generated', 'rent_due_reminder', 'bill_overdue']);

const updateTemplateSchema = z.object({
  content: z.string().min(1).max(1000),
  is_enabled: z.boolean(),
});

router.get('/templates', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const templates = await defaultTenantReachabilityService.listTemplates(orgId);
    res.json(templates);
  } catch (error) {
    next(error);
  }
});

router.put('/templates/:eventType', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const eventTypeResult = eventTypeSchema.safeParse(req.params.eventType);
    if (!eventTypeResult.success) {
      return next(createAppError(422, '不支持的模板事件类型'));
    }

    const bodyResult = updateTemplateSchema.safeParse(req.body);
    if (!bodyResult.success) {
      return next(createAppError(422, '参数校验失败'));
    }

    const template = await defaultTenantReachabilityService.updateTemplate(
      orgId,
      eventTypeResult.data,
      bodyResult.data
    );
    res.json(template);
  } catch (error) {
    next(error);
  }
});

router.get('/deliveries', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const status =
      req.query.status === 'sent' || req.query.status === 'failed' || req.query.status === 'skipped'
        ? req.query.status
        : 'all';
    const eventType =
      req.query.event_type === 'bill_generated' ||
      req.query.event_type === 'rent_due_reminder' ||
      req.query.event_type === 'bill_overdue'
        ? req.query.event_type
        : 'all';
    const tenantId = typeof req.query.tenant_id === 'string' ? req.query.tenant_id : undefined;
    const limit =
      typeof req.query.limit === 'string' && Number.isFinite(Number(req.query.limit))
        ? Number(req.query.limit)
        : undefined;

    const deliveries = await defaultTenantReachabilityService.listDeliveries(orgId, {
      status,
      event_type: eventType,
      tenant_id: tenantId,
      limit,
    });
    res.json(deliveries);
  } catch (error) {
    next(error);
  }
});

export const tenantReachabilityRouter = router;
