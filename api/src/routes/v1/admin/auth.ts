import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { createAppError } from '../../../utils/appError.js';
import { defaultAdminService } from '../../../services/admin.service.js';
import { auditLog } from '../../../utils/audit.js';

const router: Router = Router();

const LoginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
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
  } catch (e) {
    next(e);
  }
});

export const adminAuthRouter = router;
