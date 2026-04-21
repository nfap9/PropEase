import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { requireConsoleAuth } from '../../middlewares/requireAuth.js';
import { getConsoleUser } from '../../utils/context.js';
import { createAppError } from '../../utils/appError.js';
import { defaultNotificationService } from '../../services/notification.service.js';

const router: Router = Router();

router.use(requireConsoleAuth);

const NotificationQuerySchema = z.object({
  status: z.enum(['unread', 'all']).optional(),
  category: z.enum(['lease', 'billing', 'tenant', 'system', 'all']).optional(),
  limit: z.number().optional(),
});

router.post('/query', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = getConsoleUser(req);
    if (!user) return next(createAppError(401, '未授权或登录已过期'));
    const parsed = NotificationQuerySchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    const status = parsed.data.status === 'unread' ? 'unread' : 'all';
    const category = parsed.data.category ?? 'all';
    const list = await defaultNotificationService.list(user.id, {
      status,
      category,
      limit: parsed.data.limit,
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
    const count = await defaultNotificationService.getUnreadCount(user.id);
    res.json({ count });
  } catch (e) {
    next(e);
  }
});

router.post('/mark-all-read', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = getConsoleUser(req);
    if (!user) return next(createAppError(401, '未授权或登录已过期'));
    await defaultNotificationService.markAllRead(user.id);
    res.json({ message: 'ok' });
  } catch (e) {
    next(e);
  }
});

router.post('/:id/read', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = getConsoleUser(req);
    if (!user) return next(createAppError(401, '未授权或登录已过期'));
    await defaultNotificationService.markRead(user.id, req.params.id);
    res.json({ message: 'ok' });
  } catch (e) {
    next(e);
  }
});

export const notificationsRouter = router;
