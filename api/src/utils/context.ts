/**
 * 请求上下文模块
 *
 * 定义 Express Request 对象上挂载的用户信息：
 * - consoleUser：租户端登录用户
 * - adminUser：运营后台管理员
 *
 * 这些值由对应的认证中间件（如 requireAuth、requireAdmin）填充
 */
import type { Request } from 'express';

/**
 * 租户端用户信息
 * 从 JWT Token 解码后查询数据库获取完整信息
 */
export interface ConsoleUser {
  id: string;           // 用户 ID (ULID)
  phone: string;        // 手机号
  full_name: string;    // 姓名
  is_active: boolean;   // 账号是否激活
}

/**
 * 运营后台管理员信息
 */
export interface AdminUser {
  id: string;           // 管理员 ID
  username: string;     // 用户名
  role_id: string;      // 角色 ID
}

/**
 * 扩展 Express Request 类型
 * 在运行时由中间件挂载 consoleUser 或 adminUser
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace -- Express 类型扩展约定
  namespace Express {
    interface Request {
      /** 租户端认证用户 */
      consoleUser?: ConsoleUser;
      /** 运营后台管理员 */
      adminUser?: AdminUser;
    }
  }
}

/**
 * 获取租户端用户
 */
export function getConsoleUser(req: Request): ConsoleUser | undefined {
  return req.consoleUser;
}

/**
 * 获取运营后台管理员
 */
export function getAdminUser(req: Request): AdminUser | undefined {
  return req.adminUser;
}
