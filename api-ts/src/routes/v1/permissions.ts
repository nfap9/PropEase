import { Router, type Request, type Response, type NextFunction } from 'express';
import { prisma } from '../../lib/prisma.js';
import { requireConsoleAuth } from '../../middlewares/requireAuth.js';
import { getConsoleUser } from '../../utils/context.js';
import { requireOrgMembership } from '../../utils/orgContext.js';
import { createAppError } from '../../utils/appError.js';

const router: Router = Router();

router.use(requireConsoleAuth);

router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const list = await prisma.permission.findMany();
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.get('/grouped', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const list = await prisma.permission.findMany();
    const grouped: Record<string, typeof list> = {};
    for (const p of list) {
      const key = p.resource;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(p);
    }
    res.json(grouped);
  } catch (e) {
    next(e);
  }
});

router.get('/organization/:org_id/roles/:role', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await requireOrgMembership(req, 'org_id');
    res.json({ role: req.params.role, permissions: [] });
  } catch (e) {
    next(e);
  }
});

router.put('/organization/:org_id/roles/:role', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await requireOrgMembership(req, 'org_id');
    res.json({ message: 'ok' });
  } catch (e) {
    next(e);
  }
});

router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = getConsoleUser(req);
    if (!user) return next(createAppError(401, '未授权或登录已过期'));
    const perms = await prisma.permission.findMany();
    res.json({ permissions: perms.map((p) => p.code) });
  } catch (e) {
    next(e);
  }
});

router.get('/system-roles', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const list = await prisma.systemRoleConfig.findMany();
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.post('/system-roles/grant', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(501).json({ code: 50000, message: 'Not implemented' });
  } catch (e) {
    next(e);
  }
});

router.post('/system-roles/revoke', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(501).json({ code: 50000, message: 'Not implemented' });
  } catch (e) {
    next(e);
  }
});

router.get('/system-roles/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = getConsoleUser(req);
    if (!user) return next(createAppError(401, '未授权或登录已过期'));
    res.json([]);
  } catch (e) {
    next(e);
  }
});

export const permissionsRouter = router;
