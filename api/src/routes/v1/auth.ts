import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { ulid } from 'ulid';
import { prisma } from '../../lib/prisma.js';
import { config } from '../../config.js';
import { hashPassword, verifyPassword } from '../../utils/security.js';
import { createAccessToken, createRefreshToken, decodeToken } from '../../utils/jwt.js';
import { getConsoleUser } from '../../utils/context.js';
import { requireConsoleAuth } from '../../middlewares/requireAuth.js';
import { createAppError } from '../../utils/appError.js';
import { createPersonalOrgWithFreePlan } from '../../services/createPersonalOrgWithFreePlan.js';

/** 开发环境万能验证码，无需发送短信，输入此码即可通过 */
const DEV_VERIFICATION_CODE = '123456';

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
  verification_code: z.string().min(1, '验证码不能为空'),
});

const LoginSchema = z.object({
  phone: z.string().regex(PHONE_REG, '请输入有效的中国大陆手机号'),
  password: z.string().optional(),
  verification_code: z.string().optional(),
}).refine((d) => !!d.password !== !!d.verification_code, {
  message: '密码和验证码只能提供一个',
}).refine((d) => !!d.password || !!d.verification_code, {
  message: '密码和验证码至少提供一个',
});

const RefreshSchema = z.object({ refresh_token: z.string().min(1) });

const SendSmsCodeSchema = z.object({
  phone: z.string().regex(PHONE_REG, '请输入有效的中国大陆手机号'),
  purpose: z.enum(['login', 'register']),
});

function zodToFieldErrors(e: z.ZodError): Array<{ field: string; message: string }> {
  return e.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }));
}

// 注册
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = RegisterSchema.safeParse(req.body);
    if (!parsed.success) {
      const err = createAppError(422, '参数校验失败', {
        businessCode: 40001,
        fieldErrors: zodToFieldErrors(parsed.error),
      });
      return next(err);
    }
    const { phone, full_name, password, verification_code } = parsed.data;
    if (!verification_code) {
      return next(createAppError(400, '验证码不能为空'));
    }
    // 开发环境：仅固定码 123456 通过；生产环境 TODO 对接短信服务并校验
    if (config.isDev) {
      if (verification_code !== DEV_VERIFICATION_CODE) {
        return next(createAppError(400, '验证码无效，开发环境请使用 123456'));
      }
    }
    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing) return next(createAppError(400, '手机号已注册'));
    const passwordHash = await hashPassword(password);
    const userId = ulid().toLowerCase();
    const user = await prisma.user.create({
      data: {
        id: userId,
        phone,
        full_name,
        password_hash: passwordHash,
      },
    });
    await createPersonalOrgWithFreePlan(user.id);
    res.status(201).json({
      id: user.id,
      phone: user.phone,
      full_name: user.full_name,
      is_active: user.is_active,
      created_at: user.created_at,
    });
  } catch (e) {
    next(e);
  }
});

// 登录
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
      const err = createAppError(422, '参数校验失败', {
        businessCode: 40001,
        fieldErrors: zodToFieldErrors(parsed.error),
      });
      return next(err);
    }
    const { phone, password, verification_code } = parsed.data;
    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) return next(createAppError(401, '手机号或密码错误'));
    if (password) {
      const ok = await verifyPassword(password, user.password_hash);
      if (!ok) return next(createAppError(401, '手机号或密码错误'));
    } else {
      // 验证码登录
      if (!verification_code) return next(createAppError(401, '验证码无效或已过期'));
      // 开发环境：仅固定码 123456 通过；生产环境 TODO 校验 Redis 中的验证码
      if (config.isDev) {
        if (verification_code !== DEV_VERIFICATION_CODE) {
          return next(createAppError(401, '验证码无效或已过期，开发环境请使用 123456'));
        }
      }
    }
    if (!user.is_active) return next(createAppError(401, '账号已停用或不允许登录'));
    const access_token = createAccessToken({ sub: user.id, phone: user.phone });
    const refresh_token = createRefreshToken({ sub: user.id, phone: user.phone });
    res.json({ access_token, refresh_token, token_type: 'bearer' });
  } catch (e) {
    next(e);
  }
});

// 刷新令牌
router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = RefreshSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(createAppError(422, '参数校验失败', {
        businessCode: 40001,
        fieldErrors: zodToFieldErrors(parsed.error),
      }));
    }
    const payload = decodeToken(parsed.data.refresh_token);
    if (!payload || (payload.type as string) !== 'refresh') {
      return next(createAppError(401, 'Could not validate credentials'));
    }
    const sub = payload.sub as string;
    const user = await prisma.user.findUnique({ where: { id: sub } });
    if (!user || !user.is_active) {
      return next(createAppError(401, 'Could not validate credentials'));
    }
    const access_token = createAccessToken({ sub: user.id, phone: user.phone });
    const refresh_token = createRefreshToken({ sub: user.id, phone: user.phone });
    res.json({ access_token, refresh_token, token_type: 'bearer' });
  } catch (e) {
    next(e);
  }
});

// 发送短信验证码（stub：仅校验参数，不真实发送；开发环境使用固定码 123456）
router.post('/sms/send', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = SendSmsCodeSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(createAppError(422, '参数校验失败', {
        businessCode: 40001,
        fieldErrors: zodToFieldErrors(parsed.error),
      }));
    }
    const { phone, purpose } = parsed.data;
    if (config.isDev) {
      console.log(`[开发] 短信验证码 phone=${phone} purpose=${purpose} => 请使用固定码 ${DEV_VERIFICATION_CODE}`);
    }
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

// 当前用户信息
router.get('/me', requireConsoleAuth, (req: Request, res: Response, next: NextFunction) => {
  const user = getConsoleUser(req);
  if (!user) return next(createAppError(401, 'Could not validate credentials'));
  prisma.user
    .findUnique({ where: { id: user.id } })
    .then((u) => {
      if (!u) return next(createAppError(401, 'User not found'));
      res.json({
        id: u.id,
        phone: u.phone,
        full_name: u.full_name,
        is_active: u.is_active,
        created_at: u.created_at,
      });
    })
    .catch(next);
});

export const authRouter = router;
