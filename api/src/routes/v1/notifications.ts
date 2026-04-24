import { Router, type Request, type Response, type NextFunction } from 'express';
import { requireConsoleAuth } from '../../middlewares/requireAuth.js';
import { getConsoleUser } from '../../utils/context.js';
import { createAppError } from '../../utils/appError.js';
import { defaultNotificationService } from '../../services/notification.service.js';
import { NotificationQuerySchema } from '../../lib/schemas.js';

// Re-export for backward compatibility
export { NotificationQuerySchema };

const router: Router = Router();

router.use(requireConsoleAuth);

router.post('/query', async (req: Request, res: Response, next: NextFunction) => {
  
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
  
});

router.get('/unread-count', async (req: Request, res: Response, next: NextFunction) => {
  
    const user = getConsoleUser(req);
    if (!user) return next(createAppError(401, '未授权或登录已过期'));
    const count = await defaultNotificationService.getUnreadCount(user.id);
    res.json({ count });
  
});

router.post('/mark-all-read', async (req: Request, res: Response, next: NextFunction) => {
  
    const user = getConsoleUser(req);
    if (!user) return next(createAppError(401, '未授权或登录已过期'));
    await defaultNotificationService.markAllRead(user.id);
    res.json({ message: 'ok' });
  
});

router.post('/:id/read', async (req: Request, res: Response, next: NextFunction) => {
  
    const user = getConsoleUser(req);
    if (!user) return next(createAppError(401, '未授权或登录已过期'));
    await defaultNotificationService.markRead(user.id, req.params.id);
    res.json({ message: 'ok' });
  
});

export const notificationsRouter = router;
