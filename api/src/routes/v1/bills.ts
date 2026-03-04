import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { requireConsoleAuth } from '../../middlewares/requireAuth.js';
import { requireOrgMembership } from '../../utils/orgContext.js';
import { createAppError } from '../../utils/appError.js';
import { generateBillsExcel, generateBillPdf } from '../../utils/billExports.js';
import { generateBillsForOrg } from '../../services/billGeneration.js';
import { getBrandConfig } from '../../services/platformConfig.js';
import { defaultBillService } from '../../services/bill.service.js';
import type { BillFilter } from '../../repositories/bill.repo.js';

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
const BillUpdateSchema = z.object({
  rent_amount: z.number().optional(),
  water_amount: z.number().optional(),
  electricity_amount: z.number().optional(),
  other_amount: z.number().optional(),
  total_amount: z.number().optional(),
  status: z.string().optional(),
  notes: z.string().optional(),
});
const PaymentCreateSchema = z.object({
  amount: z.number(),
  payment_date: z.string(),
  payment_method: z.string().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const filter: BillFilter = {
      leaseId: typeof req.query.lease_id === 'string' ? req.query.lease_id : undefined,
      year: req.query.year != null ? Number(req.query.year) : undefined,
      month: req.query.month != null ? Number(req.query.month) : undefined,
      status: typeof req.query.status === 'string' ? req.query.status : undefined,
    };
    const list = await defaultBillService.list(orgId, filter);
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
    const bill = await defaultBillService.create(orgId, parsed.data);
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

    const filter: BillFilter = { year, month };
    if (exportType === 'unfinished') {
      filter.excludeStatus = 'paid';
    } else if (status) {
      filter.status = status;
    }

    const bills = await defaultBillService.list(orgId, filter);
    if (bills.length === 0) return next(createAppError(400, '没有可导出的账单'));

    const tenantIds = [...new Set(bills.map((b) => b.lease.tenant_id))];
    const tenants = await prisma.tenant.findMany({ where: { id: { in: tenantIds } }, select: { id: true, name: true } });
    const tenantNameById = Object.fromEntries(tenants.map((t) => [t.id, t.name]));

    const org = await prisma.organization.findUnique({ where: { id: orgId } });
    const brandConfig = await getBrandConfig();
    const orgName = org?.name ?? brandConfig.app_name;

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
    const payments = await defaultBillService.getPayments(orgId, req.params.id);
    res.json(payments);
  } catch (e) {
    next(e);
  }
});

router.get('/:id/pdf', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const bill = await defaultBillService.validateOwnership(orgId, req.params.id);
    const tenant = await prisma.tenant.findUnique({ where: { id: bill.lease.tenant_id }, select: { name: true } });
    const org = await prisma.organization.findUnique({ where: { id: orgId } });
    const brandConfig = await getBrandConfig();
    const orgName = org?.name ?? brandConfig.app_name;

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
    const bill = await defaultBillService.getById(orgId, req.params.id);
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
    const bill = await defaultBillService.update(orgId, req.params.id, parsed.data);
    res.json(bill);
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    await defaultBillService.delete(orgId, req.params.id);
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
    const payment = await defaultBillService.addPayment(orgId, req.params.id, parsed.data);
    res.status(201).json(payment);
  } catch (e) {
    next(e);
  }
});

export const billsRouter = router;
