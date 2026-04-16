'use client';

import { SelectableSideList } from '@apartment-ultra/shared-ui/components/ui';
import type { MemberRole } from '@/types';
import { tenantMessages } from '@/i18n';

const ROLE_LABELS: Record<MemberRole, string> = {
  owner: tenantMessages.settings.team.roles.owner,
  admin: tenantMessages.settings.team.roles.admin,
  member: tenantMessages.settings.team.roles.member,
  viewer: tenantMessages.settings.team.roles.viewer,
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
  const items = roles.map((role) => ({
    id: role,
    value: role,
    label: ROLE_LABELS[role],
  }));

  return (
    <SelectableSideList
      title={<span className="font-medium text-muted-foreground">{tenantMessages.settings.team.labels.teamRoles}</span>}
      items={items}
      selectedId={selectedRole}
      onSelect={onSelectRole}
    />
  );
}
