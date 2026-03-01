import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { ulid } from 'ulid';
import { prisma } from '../../lib/prisma.js';
import { requireConsoleAuth } from '../../middlewares/requireAuth.js';
import { requireOrgMembership } from '../../utils/orgContext.js';
import { createAppError } from '../../utils/appError.js';
import { Messages, NotFoundMessages } from '../../messages.js';

const router: Router = Router();

router.use(requireConsoleAuth);

const CustomRoleCreateSchema = z.object({ name: z.string(), description: z.string().optional(), permissions: z.string().optional() });
const CustomRoleUpdateSchema = z.object({ name: z.string().optional(), description: z.string().optional(), permissions: z.string().optional(), is_active: z.boolean().optional() });

router.get('/orgs/:org_id/roles', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req, 'org_id');
    const list = await prisma.customRole.findMany({ where: { organization_id: orgId } });
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.post('/orgs/:org_id/roles/init', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req, 'org_id');
    const existing = await prisma.customRole.count({ where: { organization_id: orgId } });
    if (existing > 0) {
      res.locals.successMessage = Messages.ALREADY_INITIALIZED;
      res.json({});
      return;
    }
    const defaults = [
      { name: '管理员', description: '组织管理员', permissions: null },
      { name: '财务', description: '财务人员', permissions: null },
      { name: '运营', description: '运营人员', permissions: null },
    ];
    for (const d of defaults) {
      await prisma.customRole.create({
        data: { id: ulid().toLowerCase(), organization_id: orgId, name: d.name, description: d.description ?? undefined, is_system: false },
      });
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
    const role = await prisma.customRole.create({
      data: {
        id: ulid().toLowerCase(),
        organization_id: orgId,
        name: parsed.data.name,
        description: parsed.data.description ?? undefined,
        permissions: parsed.data.permissions ?? undefined,
        is_system: false,
      },
    });
    res.status(201).json(role);
  } catch (e) {
    next(e);
  }
});

router.get('/orgs/:org_id/roles/:role_id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req, 'org_id');
    const role = await prisma.customRole.findFirst({
      where: { id: req.params.role_id, organization_id: orgId },
    });
    if (!role) return next(createAppError(404, NotFoundMessages.CUSTOM_ROLE));
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
    const existing = await prisma.customRole.findFirst({ where: { id: req.params.role_id, organization_id: orgId } });
    if (!existing) return next(createAppError(404, NotFoundMessages.CUSTOM_ROLE));
    const data: Record<string, unknown> = {};
    if (parsed.data.name != null) data.name = parsed.data.name;
    if (parsed.data.description !== undefined) data.description = parsed.data.description;
    if (parsed.data.permissions !== undefined) data.permissions = parsed.data.permissions;
    if (parsed.data.is_active !== undefined) data.is_active = parsed.data.is_active;
    const role = await prisma.customRole.update({ where: { id: req.params.role_id }, data });
    res.json(role);
  } catch (e) {
    next(e);
  }
});

router.delete('/orgs/:org_id/roles/:role_id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req, 'org_id');
    const existing = await prisma.customRole.findFirst({ where: { id: req.params.role_id, organization_id: orgId } });
    if (!existing) return next(createAppError(404, NotFoundMessages.CUSTOM_ROLE));
    if (existing.is_system) return next(createAppError(400, '系统角色不可删除'));
    await prisma.customRole.delete({ where: { id: req.params.role_id } });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

export const customRolesRouter = router;
