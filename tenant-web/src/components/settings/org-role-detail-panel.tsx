'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import type { MemberRole, Permission } from '@/types';
import { ChevronDown, ChevronRight, Shield, Save } from 'lucide-react';

const ROLE_LABELS: Record<MemberRole, string> = {
  owner: '所有者',
  admin: '管理员',
  member: '成员',
  viewer: '查看者',
};

const RESOURCE_LABELS: Record<string, string> = {
  apartment: '公寓管理',
  room: '房间管理',
  tenant: '租客管理',
  lease: '租约管理',
  bill: '账单管理',
  utility: '水电管理',
  member: '成员管理',
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
 * 组织角色权限详情：右侧树形面板。每个模块可展开显示权限列表；勾选模块内全部即表示该模块全部权限。
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
            所有者拥有组织内全部操作权限，无需配置
          </p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {readOnly ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Shield className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">所有者拥有全部权限</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                所有者角色无需配置，始终拥有所有操作权限
              </p>
            </CardContent>
          </Card>
        ) : !isOwner ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Shield className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">您无法修改权限</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                仅组织所有者可以在此页面调整角色权限
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
            <p className="mb-2 text-sm font-medium leading-none">权限</p>
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
            {isSaving ? '保存中…' : '保存更改'}
          </Button>
        </div>
      )}
    </div>
  );
}
