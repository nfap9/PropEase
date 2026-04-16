import { Router, type Request, type Response, type NextFunction } from 'express';
import { requireConsoleAuth } from '../../middlewares/requireAuth.js';
import { requireOrgMembership } from '../../utils/orgContext.js';
import { defaultReportService } from '../../services/report.service.js';

const router: Router = Router();

router.use(requireConsoleAuth);

/**
 * @openapi
 * /reports/overview:
 *   get:
 *     summary: 获取概览统计
 *     tags: [报表]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 概览统计数据
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total_apartments:
 *                   type: integer
 *                 total_rooms:
 *                   type: integer
 *                 occupied_rooms:
 *                   type: integer
 *                 total_tenants:
 *                   type: integer
 *                 active_leases:
 *                   type: integer
 *                 pending_bills:
 *                   type: integer
 *                 overdue_bills:
 *                   type: integer
 *                 total_income:
 *                   type: number
 */
router.get('/overview', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const stats = await defaultReportService.getOverview(orgId);
    res.json(stats);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /reports/income:
 *   get:
 *     summary: 获取收入统计
 *     tags: [报表]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: 年份，默认为当前年
 *       - in: query
 *         name: start_month
 *         schema:
 *           type: integer
 *         description: 起始月份
 *       - in: query
 *         name: end_month
 *         schema:
 *           type: integer
 *         description: 结束月份
 *     responses:
 *       200:
 *         description: 收入统计数据
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 year:
 *                   type: integer
 *                 monthly_data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       month:
 *                         type: integer
 *                       income:
 *                         type: number
 *                 total:
 *                   type: number
 */
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

/**
 * @openapi
 * /reports/occupancy:
 *   get:
 *     summary: 获取入住率统计
 *     tags: [报表]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: 年份，默认为当前年
 *     responses:
 *       200:
 *         description: 入住率统计数据
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 year:
 *                   type: integer
 *                 monthly_data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       month:
 *                         type: integer
 *                       occupancy_rate:
 *                         type: number
 *                       total_rooms:
 *                         type: integer
 *                       occupied_rooms:
 *                         type: integer
 *                 avg_occupancy_rate:
 *                   type: number
 */
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
