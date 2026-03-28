'use client';

import type { MemberRole } from '@/types';
import { cn } from '@/lib/utils';

const ROLE_LABELS: Record<MemberRole, string> = {
  owner: '创建者',
  admin: '管理成员',
  member: '协作成员',
  viewer: '只读成员',
};

/** 可配置身份（不含 owner） */
export const EDITABLE_ORG_ROLES: MemberRole[] = ['admin', 'member', 'viewer'];

export interface OrgRoleListProps {
  selectedRole: MemberRole;
  onSelectRole: (role: MemberRole) => void;
  /** 是否展示创建者（仅作说明，选中时右侧显示“拥有全部权限”） */
  showOwner?: boolean;
}

/**
 * 团队身份列表（左侧栏）：展示管理成员、协作成员、只读成员，可选展示创建者。
 * 参考运营端 AdminRoleList 的布局与样式，无新建/删除。
 */
export function OrgRoleList({ selectedRole, onSelectRole, showOwner = true }: OrgRoleListProps) {
  const roles: MemberRole[] = showOwner ? ['owner', ...EDITABLE_ORG_ROLES] : EDITABLE_ORG_ROLES;

  return (
    <div className="flex h-full flex-col border-r bg-muted/30">
      <div className="border-b p-3">
        <p className="text-sm font-medium text-muted-foreground">成员身份</p>
      </div>
      <ul className="flex-1 space-y-1 overflow-y-auto p-2">
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
                'flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                'hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                selectedRole === role && 'bg-muted font-medium'
              )}
            >
              <span className="flex-1 truncate text-left">{ROLE_LABELS[role]}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
