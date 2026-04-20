import { useState } from 'react';
import { Button, Checkbox, Skeleton } from 'antd';
import type { OrgRole, Permission } from '@/api/permissions';
import { ChevronDown, ChevronRight, Save } from 'lucide-react';
import { tenantMessages } from '@/i18n';

const RESOURCE_LABELS: Record<string, string> = {
  apartment: '公寓管理',
  room: '房间管理',
  tenant: '租客管理',
  lease: '租约管理',
  bill: '账单管理',
  utility: '水电管理',
  member: '团队成员',
  settings: '系统设置',
  report: '报表分析',
};

const ACTION_LABELS: Record<string, string> = {
  view: '查看',
  create: '创建',
  edit: '编辑',
  delete: '删除',
  export: '导出',
};

export interface OrgRoleDetailPanelProps {
  role: OrgRole | null;
  selectedPermissions: Set<string>;
  groupedPermissions: Record<string, Permission[]> | null;
  onTogglePermission: (code: string) => void;
  onToggleResource: (resource: string, permissions: Permission[]) => void;
  onSave: () => void;
  isOwner: boolean;
  isLoadingRolePermissions: boolean;
  isSaving: boolean;
}

/**
 * 角色权限详情：右侧树形面板
 */
export function OrgRoleDetailPanel({
  role,
  selectedPermissions,
  groupedPermissions,
  onTogglePermission,
  onToggleResource,
  onSave,
  isOwner,
  isLoadingRolePermissions,
  isSaving,
}: OrgRoleDetailPanelProps) {
  // 只有组织所有者才能修改
  const readOnly = !isOwner;
  const entries = groupedPermissions ? Object.entries(groupedPermissions) : [];
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(entries.map(([k]) => k)));

  const toggleExpanded = (resource: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(resource)) next.delete(resource);
      else next.add(resource);
      return next;
    });
  };

  if (!role) {
    return (
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex flex-1 items-center justify-center text-muted-foreground">请选择一个角色</div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="border-b p-4 pt-0">
        <h3 className="font-semibold">{role.name}</h3>
        {role.description && <p className="mt-1 text-sm text-muted-foreground">{role.description}</p>}
        {readOnly && (
          <p className="mt-1 text-sm text-muted-foreground">{tenantMessages.settings.permissions.creatorHint}</p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {isLoadingRolePermissions ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} active paragraph={{ rows: 4 }} />
            ))}
          </div>
        ) : entries.length > 0 ? (
          <div className="py-3">
            <ul className="space-y-0.5">
              {entries.map(([resource, permissions]) => {
                const isOpen = expanded.has(resource);
                const allChecked = permissions.length > 0 && permissions.every((p) => selectedPermissions.has(p.code));
                const groupCount = permissions.filter((p) => selectedPermissions.has(p.code)).length;
                return (
                  <li key={resource}>
                    <div className="flex items-center gap-2 py-1.5 pr-2">
                      <button
                        type="button"
                        onClick={() => toggleExpanded(resource)}
                        className="shrink-0 rounded p-0.5 text-muted-foreground hover:bg-muted/80"
                        aria-expanded={isOpen}
                        aria-label={isOpen ? '收起' : '展开'}
                      >
                        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </button>
                      <Checkbox
                        disabled={readOnly}
                        id={`org-res-${resource}`}
                        checked={allChecked}
                        onChange={() => onToggleResource(resource, permissions)}
                        className="shrink-0"
                      />
                      <label
                        htmlFor={`org-res-${resource}`}
                        className="flex-1 cursor-pointer select-none py-0.5 text-sm font-medium"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {RESOURCE_LABELS[resource] || resource}
                      </label>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {groupCount}/{permissions.length}
                      </span>
                    </div>
                    {isOpen && (
                      <ul className="ml-2 space-y-0.5 border-l border-muted pb-1 pl-6">
                        {permissions.map((permission) => (
                          <li
                            key={permission.code}
                            className="-ml-px flex items-center gap-2 border-b border-muted/50 py-1 pl-2 last:border-b-0"
                          >
                            <Checkbox
                              disabled={readOnly}
                              id={`org-perm-${permission.code}`}
                              checked={selectedPermissions.has(permission.code)}
                              onChange={() => onTogglePermission(permission.code)}
                              className="shrink-0"
                            />
                            <label
                              htmlFor={`org-perm-${permission.code}`}
                              className="flex-1 cursor-pointer select-none text-sm"
                            >
                              {permission.name ||
                                `${RESOURCE_LABELS[resource] || resource}${ACTION_LABELS[permission.action] || permission.action}`}
                            </label>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </div>

      {!readOnly && isOwner && groupedPermissions && Object.keys(groupedPermissions).length > 0 && (
        <div className="border-t p-2">
          <Button onClick={onSave} disabled={isSaving} icon={<Save className="h-4 w-4" />}>
            {isSaving ? tenantMessages.settings.team.editSubmitting : '保存更改'}
          </Button>
        </div>
      )}
    </div>
  );
}
