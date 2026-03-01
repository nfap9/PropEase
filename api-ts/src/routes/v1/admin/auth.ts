import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../../../lib/prisma.js';
import { verifyPassword } from '../../../utils/security.js';
import { createAdminAccessToken } from '../../../utils/jwt.js';
import { createAppError } from '../../../utils/appError.js';

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
    const { username, password } = parsed.data;
    const admin = await prisma.adminUser.findUnique({
      where: { username },
      include: { role: true },
    });
    if (!admin) {
      return next(createAppError(401, '用户名或密码错误'));
    }
    if (!admin.is_active) {
      return next(createAppError(401, '账号已停用'));
    }
    const ok = await verifyPassword(password, admin.password_hash);
    if (!ok) {
      return next(createAppError(401, '用户名或密码错误'));
    }
    const access_token = createAdminAccessToken(admin.id);
    res.json({ access_token, token_type: 'bearer' });
  } catch (e) {
    next(e);
  }
});

export const adminAuthRouter = router;
