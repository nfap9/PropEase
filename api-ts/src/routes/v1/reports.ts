import { Router, type Request, type Response, type NextFunction } from 'express';
import { prisma } from '../../lib/prisma.js';
import { requireConsoleAuth } from '../../middlewares/requireAuth.js';
import { requireOrgMembership } from '../../utils/orgContext.js';

const router: Router = Router();

router.use(requireConsoleAuth);

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await requireOrgMembership(req);
    res.json([]);
  } catch (e) {
    next(e);
  }
});

router.get('/overview', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const [apartments, rooms, tenants, leases] = await Promise.all([
      prisma.apartment.count({ where: { organization_id: orgId } }),
      prisma.room.count({ where: { apartment: { organization_id: orgId } } }),
      prisma.tenant.count({ where: { organization_id: orgId } }),
      prisma.lease.count({ where: { room: { apartment: { organization_id: orgId } }, is_active: true } }),
    ]);
    res.json({ apartments, rooms, tenants, active_leases: leases });
  } catch (e) {
    next(e);
  }
});

router.get('/income', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const rooms = await prisma.room.findMany({ where: { apartment: { organization_id: orgId } }, select: { id: true } });
    const leaseIds = (await prisma.lease.findMany({ where: { room_id: { in: rooms.map((r) => r.id) } }, select: { id: true } })).map((l) => l.id);
    const payments = await prisma.payment.findMany({ where: { bill: { lease_id: { in: leaseIds } } } });
    const total = payments.reduce((s, p) => s + Number(p.amount), 0);
    res.json({ total_income: total, by_month: {} });
  } catch (e) {
    next(e);
  }
});

router.get('/occupancy', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const rooms = await prisma.room.findMany({ where: { apartment: { organization_id: orgId } } });
    const total = rooms.length;
    const occupied = rooms.filter((r) => r.status === 'occupied').length;
    res.json({ total, occupied, rate: total ? occupied / total : 0 });
  } catch (e) {
    next(e);
  }
});

export const reportsRouter = router;
