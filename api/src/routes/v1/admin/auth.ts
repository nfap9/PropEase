import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { createAppError } from '../../../utils/appError.js';
import { defaultAdminService } from '../../../services/admin.service.js';
import { auditLog } from '../../../utils/audit.js';
import { loginRateLimit } from '../../../middlewares/rateLimit.js';
import { decodeToken, getTokenRemainingTtl } from '../../../utils/jwt.js';
import { addToBlacklist } from '../../../lib/redis.js';
import { requireAdmin } from '../../../middlewares/requireAdmin.js';

const router: Router = Router();

const LoginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

router.post('/login', loginRateLimit, async (req: Request, res: Response, next: NextFunction) => {
  
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(createAppError(422, '参数校验失败'));
    }
    const result = await defaultAdminService.login(parsed.data.username, parsed.data.password);
    // 审计日志：运营后台登录成功
    auditLog({
      action: 'admin:login',
      adminUsername: parsed.data.username,
    });
    res.json(result);
  
});

/**
 * @openapi
 * /admin/auth/logout:
 *   post:
 *     summary: 运营后台退出登录
 *     tags: [运营后台-认证]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 退出成功
 *       401:
 *         description: 未认证
 */
router.post('/logout', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
      return next(createAppError(401, 'Could not validate credentials'));
    }
    const token = auth.slice(7);
    const payload = decodeToken(token);
    const jti = payload?.jti as string | undefined;
    if (jti) {
      const ttl = getTokenRemainingTtl(token);
      if (ttl > 0) {
        await addToBlacklist(jti, ttl);
      }
    }
    res.json({ message: '退出成功' });
  
});

export const adminAuthRouter = router;
