import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { ulid } from 'ulid';
import { prisma } from '../../lib/prisma.js';
import { requireConsoleAuth } from '../../middlewares/requireAuth.js';
import { requireOrgMembership } from '../../utils/orgContext.js';
import { createAppError } from '../../utils/appError.js';

const router: Router = Router();

router.use(requireConsoleAuth);

const TenantCreateSchema = z.object({ name: z.string().min(1), phone: z.string().optional(), id_card: z.string().optional(), emergency_contact: z.string().optional(), emergency_phone: z.string().optional(), notes: z.string().optional() });
const TenantUpdateSchema = TenantCreateSchema.partial();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : undefined;
    const where: { organization_id: string; OR?: Array<{ name?: { contains: string; mode: 'insensitive' }; phone?: { contains: string; mode: 'insensitive' } }> } = { organization_id: orgId };
    if (search && search.length > 0) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }
    const list = await prisma.tenant.findMany({ where });
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const parsed = TenantCreateSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    const tenant = await prisma.tenant.create({
      data: { id: ulid().toLowerCase(), organization_id: orgId, name: parsed.data.name, phone: parsed.data.phone ?? undefined, id_card: parsed.data.id_card ?? undefined, emergency_contact: parsed.data.emergency_contact ?? undefined, emergency_phone: parsed.data.emergency_phone ?? undefined, notes: parsed.data.notes ?? undefined },
    });
    res.status(201).json(tenant);
  } catch (e) {
    next(e);
  }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const tenant = await prisma.tenant.findFirst({
      where: { id: req.params.id, organization_id: orgId },
    });
    if (!tenant) {
      res.status(404).json({ code: 40002, message: 'Resource not found' });
      return;
    }
    res.json(tenant);
  } catch (e) {
    next(e);
  }
});

router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const parsed = TenantUpdateSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    const existing = await prisma.tenant.findFirst({ where: { id: req.params.id, organization_id: orgId } });
    if (!existing) { res.status(404).json({ code: 40002, message: 'Resource not found' }); return; }
    const tenant = await prisma.tenant.update({
      where: { id: req.params.id },
      data: { name: parsed.data.name ?? existing.name, phone: parsed.data.phone ?? existing.phone ?? undefined, id_card: parsed.data.id_card ?? existing.id_card ?? undefined, emergency_contact: parsed.data.emergency_contact ?? existing.emergency_contact ?? undefined, emergency_phone: parsed.data.emergency_phone ?? existing.emergency_phone ?? undefined, notes: parsed.data.notes ?? existing.notes ?? undefined },
    });
    res.json(tenant);
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const existing = await prisma.tenant.findFirst({ where: { id: req.params.id, organization_id: orgId } });
    if (!existing) { res.status(404).json({ code: 40002, message: 'Resource not found' }); return; }
    await prisma.tenant.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

export const tenantsRouter = router;
