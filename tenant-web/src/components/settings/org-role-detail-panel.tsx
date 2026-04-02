'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';
import { Card, CardContent } from '@apartment-ultra/shared-ui/components/ui';
import { Checkbox } from '@/components/ui';
import { Skeleton } from '@/components/ui';
import type { MemberRole, Permission } from '@/types';
import { ChevronDown, ChevronRight, Shield, Save } from 'lucide-react';
import { tenantMessages } from '@/lib/i18n';

const ROLE_LABELS: Record<MemberRole, string> = {
  owner: tenantMessages.settings.team.roles.owner,
  admin: tenantMessages.settings.team.roles.admin,
  member: tenantMessages.settings.team.roles.member,
  viewer: tenantMessages.settings.team.roles.viewer,
};

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
  role: MemberRole;
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
 * 成员身份功能详情：右侧树形面板。每个模块可展开显示功能列表；勾选模块内全部即表示该模块全部功能。
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
  const readOnly = role === 'owner';
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

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="border-b p-4">
        <h3 className="font-semibold">{ROLE_LABELS[role]}</h3>
        {readOnly && (
          <p className="mt-1 text-sm text-muted-foreground">
            {tenantMessages.settings.permissions.creatorHint}
          </p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {readOnly ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Shield className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">{tenantMessages.settings.permissions.creatorFullAccessTitle}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {tenantMessages.settings.permissions.creatorFullAccessDescription}
              </p>
            </CardContent>
          </Card>
        ) : !isOwner ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Shield className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">{tenantMessages.settings.permissions.readonlyTitle}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {tenantMessages.settings.permissions.readonlyDescription}
              </p>
            </CardContent>
          </Card>
        ) : isLoadingRolePermissions ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : entries.length > 0 ? (
          <div className="space-y-0.5 rounded-md border p-3">
            <p className="mb-2 text-sm font-medium leading-none">{tenantMessages.settings.team.labels.availableFeatures}</p>
            <ul className="space-y-0.5">
              {entries.map(([resource, permissions]) => {
                const isOpen = expanded.has(resource);
                const allChecked =
                  permissions.length > 0 &&
                  permissions.every((p) => selectedPermissions.has(p.code));
                const groupCount = permissions.filter((p) =>
                  selectedPermissions.has(p.code)
                ).length;
                return (
                  <li key={resource} className="rounded-md">
                    <div className="flex items-center gap-2 py-1.5 pr-2">
                      <button
                        type="button"
                        onClick={() => toggleExpanded(resource)}
                        className="shrink-0 rounded p-0.5 text-muted-foreground hover:bg-muted/80"
                        aria-expanded={isOpen}
                        aria-label={isOpen ? '收起' : '展开'}
                      >
                        {isOpen ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                      <Checkbox
                        id={`org-res-${resource}`}
                        checked={allChecked}
                        onCheckedChange={() => onToggleResource(resource, permissions)}
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
                            key={permission.id}
                            className="-ml-px flex items-center gap-2 border-b border-muted/50 py-1 pl-2 last:border-b-0"
                          >
                            <Checkbox
                              id={`org-perm-${permission.id}`}
                              checked={selectedPermissions.has(permission.code)}
                              onCheckedChange={() => onTogglePermission(permission.code)}
                              className="shrink-0"
                            />
                            <label
                              htmlFor={`org-perm-${permission.id}`}
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
        <div className="border-t p-4">
          <Button onClick={onSave} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? tenantMessages.settings.team.editSubmitting : '保存更改'}
          </Button>
        </div>
      )}
    </div>
  );
}
