'use client';

import type { MemberRole } from '@/types';
import { cn } from '@/lib/utils';

const ROLE_LABELS: Record<MemberRole, string> = {
  owner: '所有者',
  admin: '管理员',
  member: '成员',
  viewer: '查看者',
};

/** 可配置权限的角色（不含 owner） */
export const EDITABLE_ORG_ROLES: MemberRole[] = ['admin', 'member', 'viewer'];

export interface OrgRoleListProps {
  selectedRole: MemberRole;
  onSelectRole: (role: MemberRole) => void;
  /** 是否展示所有者（仅作说明，选中时右侧显示“拥有全部权限”） */
  showOwner?: boolean;
}

/**
 * 业务系统组织角色列表（左侧栏）：展示管理员、成员、查看者，可选展示所有者。
 * 参考运营端 AdminRoleList 的布局与样式，无新建/删除。
 */
export function OrgRoleList({
  selectedRole,
  onSelectRole,
  showOwner = true,
}: OrgRoleListProps) {
  const roles: MemberRole[] = showOwner
    ? ['owner', ...EDITABLE_ORG_ROLES]
    : EDITABLE_ORG_ROLES;

  return (
    <div className="flex h-full flex-col border-r bg-muted/30">
      <div className="p-3 border-b">
        <p className="text-sm font-medium text-muted-foreground">组织角色</p>
      </div>
      <ul className="flex-1 overflow-y-auto p-2 space-y-1">
        {roles.map((role) => (
          <li key={role}>
            <div
              role="button"
              tabIndex={0}
              onClick={() => onSelectRole(role)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectRole(role);
                }
              }}
              className={cn(
                'flex items-center gap-2 rounded-md px-3 py-2 text-sm cursor-pointer transition-colors',
                'hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                selectedRole === role && 'bg-muted font-medium'
              )}
            >
              <span className="flex-1 truncate text-left">
                {ROLE_LABELS[role]}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
