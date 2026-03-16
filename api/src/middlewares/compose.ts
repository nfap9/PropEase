import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { requireConsoleAuth } from './requireAuth.js';
import { requireAdmin } from './requireAdmin.js';
import { requireSystemInitialized } from './requireSystemInitialized.js';

/**
 * 中间件类型定义
 */
type Middleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => void | Promise<void>;

/**
 * 组合多个中间件，返回一个装饰器函数
 * 该装饰器函数可以将中间件应用到任意路由处理器上
 *
 * @example
 * ```typescript
 * // 创建需要认证的路由处理器
 * const handler = withMiddleware(requireConsoleAuth)(async (req, res) => {
 *   res.json({ user: req.consoleUser });
 * });
 *
 * // 或使用预定义的组合
 * router.get('/profile', authenticated(getProfile));
 * ```
 */
export const withMiddleware =
  (...middlewares: Middleware[]) =>
  (handler: RequestHandler): RequestHandler => {
    return async (req, res, next) => {
      try {
        for (const mw of middlewares) {
          await new Promise<void>((resolve, reject) => {
            let isSettled = false;

            const result = mw(req, res, (err?: unknown) => {
              if (isSettled) return;
              isSettled = true;
              if (err) {
                reject(err);
              } else {
                resolve();
              }
            });

            // 处理异步中间件返回的 Promise
            if (result instanceof Promise) {
              result
                .then(() => {
                  if (!isSettled) {
                    isSettled = true;
                    resolve();
                  }
                })
                .catch((err) => {
                  if (!isSettled) {
                    isSettled = true;
                    reject(err);
                  }
                });
            }
          });

          // 如果响应已经发送（例如中间件调用了 res.json），则停止执行
          if (res.writableEnded) {
            return;
          }
        }

        await handler(req, res, next);
      } catch (err) {
        next(err);
      }
    };
  };

/**
 * 预定义的组合：需要控制台用户认证
 * 自动将 requireConsoleAuth 中间件应用到处理器
 *
 * @example
 * ```typescript
 * router.get('/profile', authenticated(getProfile));
 * ```
 */
export const authenticated = withMiddleware(requireConsoleAuth);

/**
 * 预定义的组合：需要运营后台管理员认证
 * 自动将 requireAdmin 中间件应用到处理器
 *
 * @example
 * ```typescript
 * router.get('/admin/stats', adminOnly(getAdminStats));
 * ```
 */
export const adminOnly = withMiddleware(requireAdmin);

/**
 * 预定义的组合：需要系统已初始化
 * 自动将 requireSystemInitialized 中间件应用到处理器
 *
 * @example
 * ```typescript
 * router.post('/setup', initializedOnly(setupSystem));
 * ```
 */
export const initializedOnly = withMiddleware(requireSystemInitialized);

/**
 * 预定义的组合：需要管理员认证且系统已初始化
 *
 * @example
 * ```typescript
 * router.get('/admin/dashboard', adminWithInit(getDashboard));
 * ```
 */
export const adminWithInit = withMiddleware(requireSystemInitialized, requireAdmin);

/**
 * 预定义的组合：需要用户认证且系统已初始化
 *
 * @example
 * ```typescript
 * router.get('/user/dashboard', authenticatedWithInit(getUserDashboard));
 * ```
 */
export const authenticatedWithInit = withMiddleware(
  requireSystemInitialized,
  requireConsoleAuth
);
