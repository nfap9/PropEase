import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { requireConsoleAuth } from '../../middlewares/requireAuth.js';
import { requireOrgMembership } from '../../utils/orgContext.js';
import { createAppError } from '../../utils/appError.js';
import { Messages } from '../../messages.js';
import { defaultCustomRoleService } from '../../services/customRole.service.js';

const router: Router = Router();

router.use(requireConsoleAuth);

const CustomRoleCreateSchema = z.object({ name: z.string(), description: z.string().optional(), permissions: z.string().optional() });
const CustomRoleUpdateSchema = z.object({ name: z.string().optional(), description: z.string().optional(), permissions: z.string().optional(), is_active: z.boolean().optional() });

router.get('/orgs/:org_id/roles', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req, 'org_id');
    const list = await defaultCustomRoleService.list(orgId);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.post('/orgs/:org_id/roles/init', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req, 'org_id');
    const result = await defaultCustomRoleService.initDefaultRoles(orgId);
    if (result.alreadyInitialized) {
      res.locals.successMessage = Messages.ALREADY_INITIALIZED;
      res.json({});
      return;
    }
    res.status(201).json({});
  } catch (e) {
    next(e);
  }
});

router.post('/orgs/:org_id/roles', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req, 'org_id');
    const parsed = CustomRoleCreateSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    const role = await defaultCustomRoleService.create(orgId, parsed.data);
    res.status(201).json(role);
  } catch (e) {
    next(e);
  }
});

router.get('/orgs/:org_id/roles/:role_id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await requireOrgMembership(req, 'org_id');
    const role = await defaultCustomRoleService.getById(req.params.org_id, req.params.role_id);
    res.json(role);
  } catch (e) {
    next(e);
  }
});

router.put('/orgs/:org_id/roles/:role_id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req, 'org_id');
    const parsed = CustomRoleUpdateSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    const role = await defaultCustomRoleService.update(orgId, req.params.role_id, parsed.data);
    res.json(role);
  } catch (e) {
    next(e);
  }
});

router.delete('/orgs/:org_id/roles/:role_id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req, 'org_id');
    await defaultCustomRoleService.delete(orgId, req.params.role_id);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

export const customRolesRouter = router;
