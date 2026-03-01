import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { ulid } from 'ulid';
import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { requireConsoleAuth } from '../../middlewares/requireAuth.js';
import { requireOrgMembership } from '../../utils/orgContext.js';
import { createAppError } from '../../utils/appError.js';
import { generateBillsExcel, generateBillPdf } from '../../utils/billExports.js';
import { generateBillsForOrg } from '../../services/billGeneration.js';

const router: Router = Router();

router.use(requireConsoleAuth);

const GenerateBillsSchema = z.object({
  bill_year: z.number(),
  bill_month: z.number(),
  due_date: z.string(),
  lease_ids: z.array(z.string()).optional(),
});

const BillCreateSchema = z.object({
  lease_id: z.string(),
  bill_year: z.number(),
  bill_month: z.number(),
  due_date: z.string(),
  rent_amount: z.number().optional(),
  water_amount: z.number().optional(),
  electricity_amount: z.number().optional(),
  other_amount: z.number().optional(),
  total_amount: z.number(),
  notes: z.string().optional(),
});
const BillUpdateSchema = z.object({ rent_amount: z.number().optional(), water_amount: z.number().optional(), electricity_amount: z.number().optional(), other_amount: z.number().optional(), total_amount: z.number().optional(), status: z.string().optional(), notes: z.string().optional() });
const PaymentCreateSchema = z.object({ amount: z.number(), payment_date: z.string(), payment_method: z.string().optional(), reference: z.string().optional(), notes: z.string().optional() });

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const rooms = await prisma.room.findMany({
      where: { apartment: { organization_id: orgId } },
      select: { id: true },
    });
    const roomIds = rooms.map((r) => r.id);
    const leases = await prisma.lease.findMany({
      where: { room_id: { in: roomIds } },
      select: { id: true },
    });
    const leaseIds = leases.map((l) => l.id);
    const list = await prisma.bill.findMany({
      where: { lease_id: { in: leaseIds } },
      include: { lease: { include: { room: true, tenant: true } } },
    });
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.post('/generate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const parsed = GenerateBillsSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));

    const { bill_year, bill_month, due_date, lease_ids } = parsed.data;
    const dueDate = new Date(due_date);
    const result = await generateBillsForOrg(orgId, bill_year, bill_month, dueDate, lease_ids);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const parsed = BillCreateSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    const lease = await prisma.lease.findFirst({ where: { id: parsed.data.lease_id }, include: { room: { include: { apartment: true } } } });
    if (!lease || lease.room.apartment.organization_id !== orgId) return next(createAppError(404, 'Resource not found'));
    const rent = parsed.data.rent_amount ?? 0;
    const water = parsed.data.water_amount ?? 0;
    const elec = parsed.data.electricity_amount ?? 0;
    const other = parsed.data.other_amount ?? 0;
    const total = parsed.data.total_amount ?? rent + water + elec + other;
    const bill = await prisma.bill.create({
      data: {
        id: ulid().toLowerCase(),
        lease_id: parsed.data.lease_id,
        bill_year: parsed.data.bill_year,
        bill_month: parsed.data.bill_month,
        due_date: new Date(parsed.data.due_date),
        rent_amount: rent,
        water_amount: water,
        electricity_amount: elec,
        other_amount: other,
        total_amount: total,
        paid_amount: 0,
        notes: parsed.data.notes ?? undefined,
      },
    });
    res.status(201).json(bill);
  } catch (e) {
    next(e);
  }
});

router.get('/export/excel', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const year = req.query.year != null ? Number(req.query.year) : undefined;
    const month = req.query.month != null ? Number(req.query.month) : undefined;
    const exportType = typeof req.query.exportType === 'string' ? req.query.exportType : undefined;

    const rooms = await prisma.room.findMany({
      where: { apartment: { organization_id: orgId } },
      select: { id: true },
    });
    const roomIds = rooms.map((r) => r.id);
    const leases = await prisma.lease.findMany({
      where: { room_id: { in: roomIds } },
      select: { id: true },
    });
    const leaseIds = leases.map((l) => l.id);
    const billWhere: { lease_id: { in: string[] }; bill_year?: number; bill_month?: number; status?: string | { not: string } } = { lease_id: { in: leaseIds } };
    if (year != null) billWhere.bill_year = year;
    if (month != null) billWhere.bill_month = month;
    if (exportType === 'unfinished') {
      billWhere.status = { not: 'paid' };
    } else if (status) {
      billWhere.status = status;
    }
    const bills = await prisma.bill.findMany({
      where: billWhere,
      include: { lease: { include: { room: { include: { apartment: true } } } } },
    });
    if (bills.length === 0) return next(createAppError(400, '没有可导出的账单'));

    const tenantIds = [...new Set(bills.map((b) => b.lease.tenant_id))];
    const tenants = await prisma.tenant.findMany({ where: { id: { in: tenantIds } }, select: { id: true, name: true } });
    const tenantNameById = Object.fromEntries(tenants.map((t) => [t.id, t.name]));

    const org = await prisma.organization.findUnique({ where: { id: orgId } });
    const orgName = org?.name ?? 'Apartment Ultra';
    const billsData = bills.map((b) => ({
      id: b.id,
      bill_year: b.bill_year,
      bill_month: b.bill_month,
      apartment_name: b.lease.room.apartment.name,
      room_number: b.lease.room.room_number,
      tenant_name: tenantNameById[b.lease.tenant_id] ?? '-',
      rent_amount: Number(b.rent_amount),
      water_amount: Number(b.water_amount),
      electricity_amount: Number(b.electricity_amount),
      other_amount: Number(b.other_amount),
      total_amount: Number(b.total_amount),
      paid_amount: Number(b.paid_amount),
      status: b.status,
    }));
    const buffer = await generateBillsExcel(billsData, orgName);
    let filename = 'bills';
    if (exportType === 'unfinished') filename += '_unfinished';
    else if (status) filename += `_${status}`;
    filename += '.xlsx';
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (e) {
    next(e);
  }
});

router.get('/:id/payments', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const bill = await prisma.bill.findFirst({ where: { id: req.params.id }, include: { lease: { include: { room: { include: { apartment: true } } } }, payments: true } });
    if (!bill || bill.lease.room.apartment.organization_id !== orgId) { res.status(404).json({ code: 40002, message: 'Resource not found' }); return; }
    res.json(bill.payments);
  } catch (e) {
    next(e);
  }
});

router.get('/:id/pdf', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const bill = await prisma.bill.findFirst({
      where: { id: req.params.id },
      include: { lease: { include: { room: { include: { apartment: true } } } } },
    });
    if (!bill || bill.lease.room.apartment.organization_id !== orgId) {
      res.status(404).json({ code: 40002, message: 'Resource not found' });
      return;
    }
    const tenant = await prisma.tenant.findUnique({ where: { id: bill.lease.tenant_id }, select: { name: true } });
    const org = await prisma.organization.findUnique({ where: { id: orgId } });
    const orgName = org?.name ?? 'Apartment Ultra';
    const buffer = await generateBillPdf(
      {
        id: bill.id,
        bill_year: bill.bill_year,
        bill_month: bill.bill_month,
        due_date: bill.due_date,
        status: bill.status,
        apartment_name: bill.lease.room.apartment.name,
        room_number: bill.lease.room.room_number,
        tenant_name: tenant?.name ?? '-',
        rent_amount: Number(bill.rent_amount),
        water_amount: Number(bill.water_amount),
        electricity_amount: Number(bill.electricity_amount),
        other_amount: Number(bill.other_amount),
        total_amount: Number(bill.total_amount),
        paid_amount: Number(bill.paid_amount),
        notes: bill.notes,
      },
      orgName
    );
    res.setHeader('Content-Disposition', `attachment; filename=bill-${bill.id}.pdf`);
    res.setHeader('Content-Type', 'application/pdf');
    res.send(buffer);
  } catch (e) {
    next(e);
  }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const bill = await prisma.bill.findFirst({
      where: { id: req.params.id },
      include: { lease: { include: { room: { include: { apartment: true } }, tenant: true } }, payments: true },
    });
    if (!bill || bill.lease.room.apartment.organization_id !== orgId) {
      res.status(404).json({ code: 40002, message: 'Resource not found' });
      return;
    }
    res.json(bill);
  } catch (e) {
    next(e);
  }
});

router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const parsed = BillUpdateSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    const existing = await prisma.bill.findFirst({ where: { id: req.params.id }, include: { lease: { include: { room: { include: { apartment: true } } } } } });
    if (!existing || existing.lease.room.apartment.organization_id !== orgId) { res.status(404).json({ code: 40002, message: 'Resource not found' }); return; }
    const data: Record<string, unknown> = {};
    if (parsed.data.rent_amount != null) data.rent_amount = parsed.data.rent_amount;
    if (parsed.data.water_amount != null) data.water_amount = parsed.data.water_amount;
    if (parsed.data.electricity_amount != null) data.electricity_amount = parsed.data.electricity_amount;
    if (parsed.data.other_amount != null) data.other_amount = parsed.data.other_amount;
    if (parsed.data.total_amount != null) data.total_amount = parsed.data.total_amount;
    if (parsed.data.status != null) data.status = parsed.data.status;
    if (parsed.data.notes !== undefined) data.notes = parsed.data.notes;
    const bill = await prisma.bill.update({ where: { id: req.params.id }, data });
    res.json(bill);
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const existing = await prisma.bill.findFirst({ where: { id: req.params.id }, include: { lease: { include: { room: { include: { apartment: true } } } } } });
    if (!existing || existing.lease.room.apartment.organization_id !== orgId) { res.status(404).json({ code: 40002, message: 'Resource not found' }); return; }
    await prisma.bill.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

router.post('/:id/payments', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const parsed = PaymentCreateSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    const bill = await prisma.bill.findFirst({ where: { id: req.params.id }, include: { lease: { include: { room: { include: { apartment: true } } } } } });
    if (!bill || bill.lease.room.apartment.organization_id !== orgId) { res.status(404).json({ code: 40002, message: 'Resource not found' }); return; }
    const payment = await prisma.payment.create({
      data: {
        id: ulid().toLowerCase(),
        bill_id: req.params.id,
        amount: parsed.data.amount,
        payment_date: new Date(parsed.data.payment_date),
        payment_method: parsed.data.payment_method ?? 'cash',
        reference: parsed.data.reference ?? undefined,
        notes: parsed.data.notes ?? undefined,
      },
    });
    const newPaid = Number(bill.paid_amount) + parsed.data.amount;
    await prisma.bill.update({ where: { id: req.params.id }, data: { paid_amount: new Prisma.Decimal(newPaid), status: newPaid >= Number(bill.total_amount) ? 'paid' : 'partial' } });
    res.status(201).json(payment);
  } catch (e) {
    next(e);
  }
});

export const billsRouter = router;
