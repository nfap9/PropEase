/**
 * 审计日志工具
 * 用于记录运营后台操作，方便追踪和审计
 */

type AuditAction =
  | 'admin:login'
  | 'admin:user:create'
  | 'admin:user:update'
  | 'admin:user:delete'
  | 'admin:user:reset_password'
  | 'admin:role:create'
  | 'admin:role:update'
  | 'admin:role:delete'
  | 'admin:organization:set_active'
  | 'admin:registered_user:set_active'
  | 'admin:registered_user:delete'
  | 'admin:plan:create'
  | 'admin:plan:update'
  | 'admin:plan:delete'
  | 'admin:subscription:renew'
  | 'admin:subscription:cancel'
  | 'admin:platform_config:update'
  | 'admin:usage_pricing:update';

interface AuditLogParams {
  /** 操作类型，格式为 admin:资源:动作 */
  action: AuditAction | string;
  /** 执行操作的管理员 ID */
  adminId?: string;
  /** 管理员用户名 */
  adminUsername?: string;
  /** 操作的目标资源 ID */
  targetId?: string;
  /** 额外的上下文信息 */
  metadata?: Record<string, unknown>;
}

/**
 * 记录审计日志
 * 格式: [AUDIT] admin:xxx {adminId: "xxx", targetId: "xxx", ...}
 */
export function auditLog(params: AuditLogParams): void {
  const { action, adminId, adminUsername, targetId, metadata } = params;
  const timestamp = new Date().toISOString();

  const logData: Record<string, unknown> = {
    ts: timestamp,
    action,
  };

  if (adminId) logData.adminId = adminId;
  if (adminUsername) logData.adminUsername = adminUsername;
  if (targetId) logData.targetId = targetId;
  if (metadata) logData.metadata = metadata;

  console.log('[AUDIT]', JSON.stringify(logData));
}

/**
 * 便捷方法：从 Express Request 中提取管理员信息并记录审计日志
 */
export function auditAdminAction(
  req: { adminUser?: { id?: string; username?: string } },
  action: AuditAction | string,
  targetId?: string,
  metadata?: Record<string, unknown>
): void {
  auditLog({
    action,
    adminId: req.adminUser?.id,
    adminUsername: req.adminUser?.username,
    targetId,
    metadata,
  });
}
