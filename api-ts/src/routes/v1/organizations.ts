import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { ulid } from 'ulid';
import { prisma } from '../../lib/prisma.js';
import { requireConsoleAuth } from '../../middlewares/requireAuth.js';
import { getConsoleUser } from '../../utils/context.js';
import { requireOrgMembership } from '../../utils/orgContext.js';
import { createAppError } from '../../utils/appError.js';

const router: Router = Router();

router.use(requireConsoleAuth);

function toOrgResponse(o: { id: string; name: string; slug: string; plan: string; settings: unknown; is_personal: boolean; is_active: boolean; created_at: Date; updated_at: Date }) {
  return { id: o.id, name: o.name, slug: o.slug, plan: o.plan, settings: o.settings, is_personal: o.is_personal, is_active: o.is_active, created_at: o.created_at, updated_at: o.updated_at };
}

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = getConsoleUser(req);
    if (!user) return next(createAppError(401, '未授权或登录已过期'));
    const members = await prisma.organizationMember.findMany({
      where: { user_id: user.id },
      include: { organization: true },
    });
    const list = members.map((m) => ({
      id: m.organization.id,
      name: m.organization.name,
      slug: m.organization.slug,
      plan: m.organization.plan,
      is_personal: m.organization.is_personal,
      is_active: m.organization.is_active,
      role: m.role,
      created_at: m.organization.created_at,
    }));
    res.json(list);
  } catch (e) {
    next(e);
  }
});

const CreateOrgSchema = z.object({ name: z.string().min(1), slug: z.string().optional() });
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = getConsoleUser(req);
    if (!user) return next(createAppError(401, '未授权或登录已过期'));
    const parsed = CreateOrgSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败', { fieldErrors: parsed.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })) }));
    const { name, slug: rawSlug } = parsed.data;
    let slug = rawSlug ?? (name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'org');
    let n = 1;
    while (await prisma.organization.findUnique({ where: { slug } })) {
      slug = `${slug}-${n}`;
      n += 1;
    }
    const orgId = ulid().toLowerCase();
    const org = await prisma.organization.create({
      data: { id: orgId, name, slug, is_personal: false },
    });
    await prisma.organizationMember.create({
      data: { id: ulid().toLowerCase(), organization_id: orgId, user_id: user.id, role: 'owner' },
    });
    res.status(201).json(toOrgResponse(org));
  } catch (e) {
    next(e);
  }
});

router.get('/personal', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = getConsoleUser(req);
    if (!user) return next(createAppError(401, '未授权或登录已过期'));
    const personal = await prisma.organization.findFirst({
      where: { is_personal: true, members: { some: { user_id: user.id } } },
    });
    if (!personal) {
      res.status(404).json({ code: 40002, message: 'Resource not found' });
      return;
    }
    res.json(toOrgResponse(personal));
  } catch (e) {
    next(e);
  }
});

const MigrateSchema = z.object({ target_org_id: z.string().min(1) });
router.post('/personal/migrate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = getConsoleUser(req);
    if (!user) return next(createAppError(401, '未授权或登录已过期'));
    const parsed = MigrateSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    const personal = await prisma.organization.findFirst({
      where: { is_personal: true, members: { some: { user_id: user.id, role: 'owner' } } },
    });
    if (!personal) return next(createAppError(400, '您没有个人团队'));
    const targetMember = await prisma.organizationMember.findFirst({
      where: { organization_id: parsed.data.target_org_id, user_id: user.id },
    });
    if (!targetMember) return next(createAppError(403, '无目标组织权限'));
    const [apts, rooms, tenants, leases, bills, readings] = await Promise.all([
      prisma.apartment.count({ where: { organization_id: personal.id } }),
      prisma.room.count({ where: { apartment: { organization_id: personal.id } } }),
      prisma.tenant.count({ where: { organization_id: personal.id } }),
      prisma.lease.count({ where: { room: { apartment: { organization_id: personal.id } } } }),
      prisma.bill.count({ where: { lease: { room: { apartment: { organization_id: personal.id } } } } }),
      prisma.utilityReading.count({ where: { room: { apartment: { organization_id: personal.id } } } }),
    ]);
    const targetId = parsed.data.target_org_id;
    await prisma.$transaction(async (tx) => {
      const aptsToMove = await tx.apartment.findMany({ where: { organization_id: personal!.id }, include: { rooms: true } });
      for (const apt of aptsToMove) {
        await tx.apartment.update({ where: { id: apt.id }, data: { organization_id: targetId } });
      }
      await tx.tenant.updateMany({ where: { organization_id: personal!.id }, data: { organization_id: targetId } });
      await tx.organization.delete({ where: { id: personal!.id } });
    });
    res.json({ apartments: apts, rooms, tenants, leases, bills, utility_readings: readings, message: '团队迁移成功' });
  } catch (e) {
    next(e);
  }
});

router.get('/:orgId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = getConsoleUser(req);
    const orgId = req.params.orgId;
    const member = await prisma.organizationMember.findFirst({
      where: { organization_id: orgId, user_id: user?.id },
      include: { organization: true },
    });
    if (!member) {
      res.status(404).json({ code: 40002, message: 'Resource not found' });
      return;
    }
    res.json(toOrgResponse(member.organization));
  } catch (e) {
    next(e);
  }
});

const UpdateOrgSchema = z.object({ name: z.string().min(1).optional(), settings: z.record(z.unknown()).optional() });
router.put('/:orgId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await requireOrgMembership(req, 'orgId');
    const orgId = req.params.orgId;
    const member = await prisma.organizationMember.findFirst({
      where: { organization_id: orgId, user_id: getConsoleUser(req)!.id },
    });
    if (member?.role !== 'owner' && member?.role !== 'admin') return next(createAppError(403, 'Insufficient permissions'));
    const parsed = UpdateOrgSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    const data: { name?: string; settings?: object } = {};
    if (parsed.data.name != null) data.name = parsed.data.name;
    if (parsed.data.settings != null) data.settings = parsed.data.settings;
    const org = await prisma.organization.update({ where: { id: orgId }, data });
    res.json(toOrgResponse(org));
  } catch (e) {
    next(e);
  }
});

router.get('/:orgId/deletion-preview', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await requireOrgMembership(req, 'orgId');
    const orgId = req.params.orgId;
    const org = await prisma.organization.findUnique({ where: { id: orgId } });
    if (!org) { res.status(404).json({ code: 40002, message: 'Resource not found' }); return; }
    const [apartments, rooms, tenants, leases, bills] = await Promise.all([
      prisma.apartment.count({ where: { organization_id: orgId } }),
      prisma.room.count({ where: { apartment: { organization_id: orgId } } }),
      prisma.tenant.count({ where: { organization_id: orgId } }),
      prisma.lease.count({ where: { room: { apartment: { organization_id: orgId } } } }),
      prisma.bill.count({ where: { lease: { room: { apartment: { organization_id: orgId } } } } }),
    ]);
    res.json({
      can_delete: true,
      blockers: [] as string[],
      stats: { apartments, rooms, tenants, leases, bills },
      org_name: org.name,
      is_personal: org.is_personal,
    });
  } catch (e) {
    next(e);
  }
});

const ConfirmDeleteSchema = z.object({ confirmed_name: z.string().min(1) });
router.delete('/:orgId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = req.params.orgId;
    const member = await prisma.organizationMember.findFirst({
      where: { organization_id: orgId, user_id: getConsoleUser(req)?.id },
    });
    if (!member || member.role !== 'owner') return next(createAppError(403, '只有团队所有者可以删除团队'));
    const parsed = ConfirmDeleteSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(400, '请提供团队名称以确认删除'));
    const org = await prisma.organization.findUnique({ where: { id: orgId } });
    if (!org || org.name !== parsed.data.confirmed_name) return next(createAppError(400, '团队名称不匹配'));
    await prisma.organization.delete({ where: { id: orgId } });
    res.json({ message: '团队已删除' });
  } catch (e) {
    next(e);
  }
});

router.get('/:orgId/members', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await requireOrgMembership(req, 'orgId');
    const orgId = req.params.orgId;
    const members = await prisma.organizationMember.findMany({
      where: { organization_id: orgId },
      include: { user: true },
    });
    res.json(members.map((m) => ({
      id: m.id,
      organization_id: m.organization_id,
      user_id: m.user_id,
      role: m.role,
      created_at: m.created_at,
      user_phone: m.user?.phone ?? null,
      user_full_name: m.user?.full_name ?? '未知用户',
    })));
  } catch (e) {
    next(e);
  }
});

router.post('/:orgId/members', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await requireOrgMembership(req, 'orgId');
    const orgId = req.params.orgId;
    const phone = (req.query.phone as string) ?? (req.body?.phone as string);
    const role = ((req.query.role as string) ?? req.body?.role ?? 'member') as string;
    if (!phone) return next(createAppError(400, '缺少 phone'));
    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) return next(createAppError(400, '用户不存在'));
    const existing = await prisma.organizationMember.findFirst({ where: { organization_id: orgId, user_id: user.id } });
    if (existing) return next(createAppError(409, '用户已在组织中'));
    const m = await prisma.organizationMember.create({
      data: { id: ulid().toLowerCase(), organization_id: orgId, user_id: user.id, role },
    });
    const u = await prisma.user.findUnique({ where: { id: m.user_id } });
    res.status(201).json({ id: m.id, organization_id: m.organization_id, user_id: m.user_id, role: m.role, created_at: m.created_at, user_phone: u?.phone ?? null, user_full_name: u?.full_name ?? '未知用户' });
  } catch (e) {
    next(e);
  }
});

router.put('/:orgId/members/:userId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = req.params.orgId;
    const userId = req.params.userId;
    await requireOrgMembership(req, 'orgId');
    const me = await prisma.organizationMember.findFirst({ where: { organization_id: orgId, user_id: getConsoleUser(req)!.id } });
    if (me?.role !== 'owner' && me?.role !== 'admin') return next(createAppError(403, 'Only owner can update roles'));
    const role = (req.query.role as string) ?? req.body?.role;
    if (!role) return next(createAppError(400, '缺少 role'));
    const m = await prisma.organizationMember.updateMany({
      where: { organization_id: orgId, user_id: userId },
      data: { role },
    });
    if (m.count === 0) { res.status(404).json({ code: 40002, message: 'Resource not found' }); return; }
    const updated = await prisma.organizationMember.findFirst({ where: { organization_id: orgId, user_id: userId }, include: { user: true } });
    res.json({ id: updated!.id, organization_id: updated!.organization_id, user_id: updated!.user_id, role: updated!.role, created_at: updated!.created_at, user_phone: updated!.user?.phone ?? null, user_full_name: updated!.user?.full_name ?? '未知用户' });
  } catch (e) {
    next(e);
  }
});

router.delete('/:orgId/members/:userId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await requireOrgMembership(req, 'orgId');
    const orgId = req.params.orgId;
    const userId = req.params.userId;
    const me = await prisma.organizationMember.findFirst({ where: { organization_id: orgId, user_id: getConsoleUser(req)!.id } });
    if (me?.role !== 'owner' && me?.role !== 'admin') return next(createAppError(403, 'Only owner can remove members'));
    await prisma.organizationMember.deleteMany({ where: { organization_id: orgId, user_id: userId } });
    res.json({ message: 'Member removed successfully' });
  } catch (e) {
    next(e);
  }
});

router.get('/:orgId/usage', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await requireOrgMembership(req, 'orgId');
    const orgId = req.params.orgId;
    const org = await prisma.organization.findUnique({ where: { id: orgId } });
    if (!org) { res.status(404).json({ code: 40002, message: 'Resource not found' }); return; }
    const [apartments_used, rooms_used, members_used] = await Promise.all([
      prisma.apartment.count({ where: { organization_id: orgId } }),
      prisma.room.count({ where: { apartment: { organization_id: orgId } } }),
      prisma.organizationMember.count({ where: { organization_id: orgId } }),
    ]);
    const plan = org.plan || 'free';
    const maxA = 10;
    const maxR = 100;
    const maxM = 10;
    res.json({
      plan,
      apartments_used,
      rooms_used,
      members_used,
      max_apartments: maxA,
      max_rooms: maxR,
      max_members: maxM,
      apartments_remaining: maxA < 0 ? -1 : Math.max(0, maxA - apartments_used),
      rooms_remaining: maxR < 0 ? -1 : Math.max(0, maxR - rooms_used),
      members_remaining: maxM < 0 ? -1 : Math.max(0, maxM - members_used),
      can_invite_members: true,
      can_create_team: true,
    });
  } catch (e) {
    next(e);
  }
});

export const organizationsRouter = router;
