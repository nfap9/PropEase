import type { Request } from 'express';
import { getConsoleUser } from './context.js';
import { prisma } from '../lib/prisma.js';
import { createAppError } from './appError.js';
import { defaultPermissionService } from '../services/permission.service.js';

/**
 * 从路径参数或查询中取 organization_id，并校验当前用户属于该组织。
 * 校验失败时抛出 403，供 next 传入 errorHandler。
 */
export async function requireOrgMembership(
  req: Request,
  orgIdParamName: string = 'orgId'
): Promise<string> {
  const user = getConsoleUser(req);
  if (!user) throw createAppError(401, 'Could not validate credentials');
  const orgId =
    (req.params as Record<string, string>)[orgIdParamName] ??
    (req.query as Record<string, string>).org_id ??
    (typeof req.headers['x-org-id'] === 'string'
      ? req.headers['x-org-id'].trim() || undefined
      : undefined);
  if (!orgId) throw createAppError(400, '需要选择组织');
  const member = await prisma.organizationMember.findFirst({
    where: { organization_id: orgId, user_id: user.id },
  });
  if (!member) throw createAppError(403, 'Access denied');
  return orgId;
}

/**
 * 校验当前用户是否拥有指定权限。
 * 需要先调用 requireOrgMembership 获取 orgId。
 * 校验失败时抛出 403，供 next 传入 errorHandler。
 */
export async function requirePermission(req: Request, orgId: string, permission: string): Promise<void> {
  const user = getConsoleUser(req);
  if (!user) throw createAppError(401, 'Could not validate credentials');
  const permissions = await defaultPermissionService.getMyPermissions(user.id, orgId);
  if (!permissions.includes(permission)) {
    throw createAppError(403, '没有权限执行此操作');
  }
}
