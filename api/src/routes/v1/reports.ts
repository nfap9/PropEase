import { Router, type Request, type Response, type NextFunction } from 'express';
import { requireConsoleAuth } from '../../middlewares/requireAuth.js';
import { requireOrgMembership } from '../../utils/orgContext.js';
import { defaultReportService } from '../../services/report.service.js';

const router: Router = Router();

router.use(requireConsoleAuth);

router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.json([]);
  } catch (e) {
    next(e);
  }
});

router.get('/overview', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const stats = await defaultReportService.getOverview(orgId);
    res.json(stats);
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
    const result = await defaultReportService.getIncome(orgId, year, startMonth, endMonth);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.get('/occupancy', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const year = req.query.year != null ? Number(req.query.year) : new Date().getFullYear();
    const result = await defaultReportService.getOccupancy(orgId, year);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

export const reportsRouter = router;
