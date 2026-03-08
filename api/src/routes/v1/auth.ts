import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { config } from '../../config.js';
import { getConsoleUser } from '../../utils/context.js';
import { requireConsoleAuth } from '../../middlewares/requireAuth.js';
import { createAppError } from '../../utils/appError.js';
import { defaultAuthService, verificationCodeStore } from '../../services/auth.service.js';

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

const LoginSchema = z
  .object({
    phone: z.string().regex(PHONE_REG, '请输入有效的中国大陆手机号'),
    password: z.string().optional(),
    verification_code: z.string().optional(),
  })
  .refine((d) => !!d.password !== !!d.verification_code, {
    message: '密码和验证码只能提供一个',
  })
  .refine((d) => !!d.password || !!d.verification_code, {
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
    const { phone, verification_code } = parsed.data;

    // 验证码校验
    if (!verification_code) {
      return next(createAppError(400, '验证码不能为空'));
    }
    if (!defaultAuthService.validateVerificationCode(verification_code, phone)) {
      return next(createAppError(400, '验证码无效或已过期'));
    }

    const user = await defaultAuthService.register(parsed.data);
    res.status(201).json(user);
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
    const result = await defaultAuthService.login(parsed.data);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

// 刷新令牌
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

// 发送短信验证码（开发环境生成随机码并打印到控制台）
router.post('/sms/send', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = SendSmsCodeSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(
        createAppError(422, '参数校验失败', {
          businessCode: 40001,
          fieldErrors: zodToFieldErrors(parsed.error),
        })
      );
    }
    const { phone, purpose } = parsed.data;

    // 生成 6 位随机验证码
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 分钟有效期

    // 存储验证码
    verificationCodeStore.set(phone, { code, expiresAt, purpose });

    // 开发环境打印验证码到控制台
    if (config.isDev) {
      console.log(`[验证码] 手机号: ${phone}, 用途: ${purpose}, 验证码: ${code}`);
    }

    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

// 当前用户信息
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
