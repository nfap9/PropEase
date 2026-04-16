import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { getConsoleUser } from '../../utils/context.js';
import { requireConsoleAuth } from '../../middlewares/requireAuth.js';
import { createAppError } from '../../utils/appError.js';
import { defaultAuthService } from '../../services/auth.service.js';
import { loginRateLimit, registerRateLimit } from '../../middlewares/rateLimit.js';
import { decodeToken, getTokenRemainingTtl } from '../../utils/jwt.js';
import { addToBlacklist } from '../../lib/redis.js';

const router: Router = Router();

const PHONE_REG = /^1[3-9]\d{9}$/;

const RegisterSchema = z.object({
  phone: z.string().regex(PHONE_REG, '请输入有效的中国大陆手机号'),
  full_name: z.string().min(1, '姓名不能为空'),
  password: z
    .string()
    .min(8, '密码长度至少为8个字符')
    .regex(/[a-zA-Z]/, '密码必须包含至少一个字母')
    .regex(/\d/, '密码必须包含至少一个数字'),
});

const LoginSchema = z.object({
  phone: z.string().regex(PHONE_REG, '请输入有效的中国大陆手机号'),
  password: z.string().min(8, '密码长度至少为8个字符'),
});

const RefreshSchema = z.object({ refresh_token: z.string().min(1) });

function zodToFieldErrors(e: z.ZodError): Array<{ field: string; message: string }> {
  return e.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }));
}

/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: 用户注册
 *     tags: [认证]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterData'
 *     responses:
 *       201:
 *         description: 注册成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       422:
 *         description: 参数校验失败
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/register', registerRateLimit, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = RegisterSchema.safeParse(req.body);
    if (!parsed.success) {
      const err = createAppError(422, '参数校验失败', {
        businessCode: 40001,
        fieldErrors: zodToFieldErrors(parsed.error),
      });
      return next(err);
    }

    const user = await defaultAuthService.register(parsed.data);
    res.status(201).json(user);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: 用户登录
 *     tags: [认证]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginCredentials'
 *     responses:
 *       200:
 *         description: 登录成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TokenResponse'
 *       401:
 *         description: 认证失败
 */
router.post('/login', loginRateLimit, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
      const err = createAppError(422, '参数校验失败', {
        businessCode: 40001,
        fieldErrors: zodToFieldErrors(parsed.error),
      });
      return next(err);
    }
    const result = await defaultAuthService.login(parsed.data);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     summary: 刷新令牌
 *     tags: [认证]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refresh_token]
 *             properties:
 *               refresh_token:
 *                 type: string
 *     responses:
 *       200:
 *         description: 刷新成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TokenResponse'
 */
router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = RefreshSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(
        createAppError(422, '参数校验失败', {
          businessCode: 40001,
          fieldErrors: zodToFieldErrors(parsed.error),
        })
      );
    }
    const result = await defaultAuthService.refreshToken(parsed.data.refresh_token);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     summary: 退出登录
 *     tags: [认证]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 退出成功
 *       401:
 *         description: 未认证
 */
router.post('/logout', requireConsoleAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
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
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /auth/me:
 *   get:
 *     summary: 获取当前用户信息
 *     tags: [认证]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 用户信息
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: 未认证
 */
router.get('/me', requireConsoleAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = getConsoleUser(req);
    if (!user) return next(createAppError(401, 'Could not validate credentials'));
    const u = await defaultAuthService.getUserById(user.id);
    if (!u) return next(createAppError(401, 'User not found'));
    res.json(u);
  } catch (e) {
    next(e);
  }
});

export const authRouter = router;
