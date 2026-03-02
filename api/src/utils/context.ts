import type { Request } from 'express';

export interface ConsoleUser {
  id: string;
  phone: string;
  full_name: string;
  is_active: boolean;
}

export interface AdminUser {
  id: string;
  username: string;
  role_id: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace -- Express 类型扩展约定
  namespace Express {
    interface Request {
      consoleUser?: ConsoleUser;
      adminUser?: AdminUser;
    }
  }
}

export function getConsoleUser(req: Request): ConsoleUser | undefined {
  return req.consoleUser;
}

export function getAdminUser(req: Request): AdminUser | undefined {
  return req.adminUser;
}
