import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { createAppError } from '../../../utils/appError.js';
import {
  isSystemInitialized,
  setupInitialAdmin,
  validatePasswordStrength,
} from '../../../services/admin-init.service.js';
import { auditLog } from '../../../utils/audit.js';

const router: Router = Router();

/**
 * GET /api/v1/admin/init/status
 * 检查系统初始化状态
 */
router.get(
  '/status',
  async (_req: Request, res: Response, _next: NextFunction) => {
    
      const initialized = await isSystemInitialized();
      res.json({ initialized });
    
  }
);

// 初始化请求 schema
const SetupSchema = z.object({
  username: z
    .string()
    .min(3, '用户名至少3个字符')
    .max(64, '用户名最多64个字符')
    .regex(/^[a-zA-Z0-9_]+$/, '用户名只能包含字母、数字和下划线'),
  password: z.string().min(8, '密码至少8个字符'),
  name: z.string().max(100, '名称最多100个字符').optional(),
});

/**
 * POST /api/v1/admin/init/setup
 * 执行系统初始化，创建第一个超级管理员
 */
router.post(
  '/setup',
  async (req: Request, res: Response, next: NextFunction) => {
    
      // 1. 验证请求体
      const parsed = SetupSchema.safeParse(req.body);
      if (!parsed.success) {
        return next(createAppError(422, '参数校验失败'));
      }

      const { username, password, name } = parsed.data;

      // 2. 验证密码强度
      const passwordValidation = validatePasswordStrength(password);
      if (!passwordValidation.valid) {
        return next(createAppError(400, passwordValidation.message!));
      }

      // 3. 执行初始化
      const result = await setupInitialAdmin({ username, password, name });

      // 4. 审计日志
      auditLog({
        action: 'admin:init:setup',
        adminUsername: username,
        metadata: { name },
      });

      res.status(201).json(result);
    
  }
);

export const adminInitRouter = router;
