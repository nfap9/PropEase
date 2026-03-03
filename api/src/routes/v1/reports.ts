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
    const today = new Date();
    const [total_apartments, total_rooms, occupied_rooms, total_tenants, active_leases, monthly_revenue, pending_bills, overdue_bills, rooms_missing_initial_readings] = await Promise.all([
      prisma.apartment.count({ where: { organization_id: orgId } }),
      prisma.room.count({ where: { apartment: { organization_id: orgId } } }),
      prisma.room.count({ where: { apartment: { organization_id: orgId }, status: 'occupied' } }),
      prisma.tenant.count({ where: { organization_id: orgId } }),
      prisma.lease.count({ where: { room: { apartment: { organization_id: orgId } }, is_active: true } }),
      prisma.bill.aggregate({ where: { lease: { room: { apartment: { organization_id: orgId } } }, bill_year: today.getFullYear(), bill_month: today.getMonth() + 1 }, _sum: { total_amount: true } }).then((r) => Number(r._sum.total_amount ?? 0)),
      prisma.bill.count({ where: { lease: { room: { apartment: { organization_id: orgId } } }, status: 'pending' } }),
      prisma.bill.count({ where: { lease: { room: { apartment: { organization_id: orgId } } }, status: { not: 'paid' }, due_date: { lt: today } } }),
      (async () => {
        const rooms = await prisma.room.findMany({
          where: { apartment: { organization_id: orgId }, status: 'occupied' },
          include: { leases: { where: { is_active: true }, take: 1, orderBy: { start_date: 'desc' } } },
        });
        const roomIds = rooms.map((r) => r.id);
        const readings = await prisma.utilityReading.findMany({
          where: { room_id: { in: roomIds } },
          select: { room_id: true, period_year: true, period_month: true },
        });
        const readingKeys = new Set(readings.map((r) => `${r.room_id}:${r.period_year}:${r.period_month}`));
        let count = 0;
        for (const r of rooms) {
          const lease = r.leases[0];
          if (!lease) continue;
          const start = lease.start_date;
          if (!readingKeys.has(`${r.id}:${start.getFullYear()}:${start.getMonth() + 1}`)) count += 1;
        }
        return count;
      })(),
    ]);
    const available_rooms = total_rooms - occupied_rooms;
    const occupancy_rate = total_rooms > 0 ? Math.round((occupied_rooms / total_rooms) * 1000) / 10 : 0;
    res.json({
      total_apartments,
      total_rooms,
      occupied_rooms,
      available_rooms,
      total_tenants,
      active_leases,
      occupancy_rate,
      monthly_revenue,
      pending_bills,
      overdue_bills,
      rooms_missing_initial_readings,
    });
  } catch (e) {
    next(e);
  }
});

router.get('/income', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const year = req.query.year != null ? Number(req.query.year) : new Date().getFullYear();
    const startMonth = req.query.start_month != null ? Number(req.query.start_month) : undefined;
    const endMonth = req.query.end_month != null ? Number(req.query.end_month) : undefined;

    const rooms = await prisma.room.findMany({ where: { apartment: { organization_id: orgId } }, select: { id: true } });
    const roomIds = rooms.map((r) => r.id);
    const leases = await prisma.lease.findMany({ where: { room_id: { in: roomIds } }, select: { id: true } });
    const leaseIds = leases.map((l) => l.id);

    const bills = await prisma.bill.findMany({
      where: {
        lease_id: { in: leaseIds },
        bill_year: year,
        ...(startMonth != null ? { bill_month: { gte: startMonth } } : {}),
        ...(endMonth != null ? { bill_month: { lte: endMonth } } : {}),
      },
    });

    const byMonth = new Map<number, { total_rent: number; total_water: number; total_electricity: number; total_other: number; total_amount: number; collected_amount: number }>();
    for (const b of bills) {
      const m = b.bill_month;
      if (!byMonth.has(m)) byMonth.set(m, { total_rent: 0, total_water: 0, total_electricity: 0, total_other: 0, total_amount: 0, collected_amount: 0 });
      const row = byMonth.get(m)!;
      row.total_rent += Number(b.rent_amount);
      row.total_water += Number(b.water_amount);
      row.total_electricity += Number(b.electricity_amount);
      row.total_other += Number(b.other_amount);
      row.total_amount += Number(b.total_amount);
      row.collected_amount += Number(b.paid_amount);
    }

    const sortedMonths = Array.from(byMonth.entries()).sort((a, b) => a[0] - b[0]);
    const result = sortedMonths.map(([month, row]) => ({
      period: `${month}月`,
      total_rent: row.total_rent,
      total_water: row.total_water,
      total_electricity: row.total_electricity,
      total_other: row.total_other,
      total_amount: row.total_amount,
      collected_amount: row.collected_amount,
      collection_rate: row.total_amount > 0 ? Math.round((row.collected_amount / row.total_amount) * 1000) / 10 : 0,
    }));
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.get('/occupancy', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const year = req.query.year != null ? Number(req.query.year) : new Date().getFullYear();

    const rooms = await prisma.room.findMany({ where: { apartment: { organization_id: orgId } }, select: { id: true } });
    const total_rooms = rooms.length;
    if (total_rooms === 0) {
      res.json([]);
      return;
    }
    const roomIds = rooms.map((r) => r.id);

    const result: Array<{ period: string; total_rooms: number; occupied_rooms: number; vacant_rooms: number; occupancy_rate: number }> = [];
    for (let month = 1; month <= 12; month++) {
      const monthStart = new Date(year, month - 1, 1);
      const monthEndNext = new Date(year, month, 1);

      const overlappingRooms = await prisma.lease.groupBy({
        by: ['room_id'],
        where: {
          room_id: { in: roomIds },
          start_date: { lt: monthEndNext },
          OR: [{ end_date: null }, { end_date: { gte: monthStart } }],
        },
      });
      const occupiedInMonth = overlappingRooms.length;
      const vacant_rooms = total_rooms - occupiedInMonth;
      const occupancy_rate = total_rooms > 0 ? Math.round((occupiedInMonth / total_rooms) * 1000) / 10 : 0;
      result.push({
        period: `${month}月`,
        total_rooms: total_rooms,
        occupied_rooms: occupiedInMonth,
        vacant_rooms,
        occupancy_rate,
      });
    }
    res.json(result);
  } catch (e) {
    next(e);
  }
});

export const reportsRouter = router;
