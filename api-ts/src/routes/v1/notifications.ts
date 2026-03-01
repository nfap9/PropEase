import { Router, type Request, type Response, type NextFunction } from 'express';
import { prisma } from '../../lib/prisma.js';
import { requireConsoleAuth } from '../../middlewares/requireAuth.js';
import { getConsoleUser } from '../../utils/context.js';
import { createAppError } from '../../utils/appError.js';

const router: Router = Router();

router.use(requireConsoleAuth);

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = getConsoleUser(req);
    if (!user) return next(createAppError(401, '未授权或登录已过期'));
    const list = await prisma.notification.findMany({
      where: { user_id: user.id },
      orderBy: { created_at: 'desc' },
      take: 50,
    });
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.get('/unread-count', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = getConsoleUser(req);
    if (!user) return next(createAppError(401, '未授权或登录已过期'));
    const count = await prisma.notification.count({ where: { user_id: user.id, is_read: false } });
    res.json({ count });
  } catch (e) {
    next(e);
  }
});

router.post('/mark-all-read', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = getConsoleUser(req);
    if (!user) return next(createAppError(401, '未授权或登录已过期'));
    await prisma.notification.updateMany({ where: { user_id: user.id }, data: { is_read: true } });
    res.json({ message: 'ok' });
  } catch (e) {
    next(e);
  }
});

router.post('/:id/read', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = getConsoleUser(req);
    if (!user) return next(createAppError(401, '未授权或登录已过期'));
    const n = await prisma.notification.findFirst({ where: { id: req.params.id, user_id: user.id } });
    if (!n) { res.status(404).json({ code: 40002, message: 'Resource not found' }); return; }
    await prisma.notification.update({ where: { id: req.params.id }, data: { is_read: true } });
    res.json({ message: 'ok' });
  } catch (e) {
    next(e);
  }
});

export const notificationsRouter = router;
