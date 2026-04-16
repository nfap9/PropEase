'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appToast } from '@apartment-ultra/shared-ui/components/ui';
import { SplitSettingsPanel } from '@apartment-ultra/shared-ui/components/ui';
import { PermissionPageGuard } from '@/components/layout/permission-page-guard';
import { permissionsApi } from '@/api/permissions';
import { organizationsApi } from '@/api';
import { getErrorMessage } from '@/utils/error';
import { MemberRole, Permission } from '@/types';
import { useAuth } from '@/auth/context';
import { OrgRoleList } from '@/components/settings/org-role-list';
import { OrgRoleDetailPanel } from '@/components/settings/org-role-detail-panel';
import { Shield } from 'lucide-react';
import { Skeleton } from '@apartment-ultra/shared-ui/components/ui';
import { tenantMessages } from '@/i18n';

// 注意: 实际使用时从 testids 导入 PERMISSIONS 常量
const PERMISSIONS = {
  HEADING: 'permissions-heading',
  ROLE_LIST: 'permissions-role-list',
  PERMISSION_PANEL: 'permissions-permission-panel',
  SAVE_BUTTON: 'permissions-save-btn',
  ROLE_TAB: 'permissions-role-tab',
  CREATE_ROLE_BTN: 'permissions-create-role-btn',
} as const;

export default function PermissionsPage() {
  const { organization, user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<MemberRole>('admin');
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());

  const { data: members } = useQuery({
    queryKey: ['organization-members', organization?.id],
    queryFn: () => organizationsApi.getMembers(organization!.id),
    enabled: !!organization,
  });

  const { data: groupedPermissions, isLoading: permissionsLoading } = useQuery({
    queryKey: ['permissions-grouped'],
    queryFn: permissionsApi.getGrouped,
  });

  const { data: rolePermissions, isLoading: rolePermissionsLoading } = useQuery({
    queryKey: ['role-permissions', organization?.id, selectedRole],
    queryFn: async () => {
      if (!organization) return null;
      const response = await permissionsApi.getRolePermissions(organization.id, selectedRole);
      return response;
    },
    enabled: !!organization && selectedRole !== 'owner',
  });

  useEffect(() => {
    if (rolePermissions?.permissions) {
      setSelectedPermissions(new Set(rolePermissions.permissions.map((p: Permission) => p.code)));
    }
  }, [rolePermissions]);

  const currentMember = members?.find((m: { user_id: string }) => m.user_id === user?.id);
  const isOwner = currentMember?.role === 'owner';

  const updateMutation = useMutation({
    mutationFn: (data: { role: MemberRole; codes: string[] }) =>
      permissionsApi.updateRolePermissions(organization!.id, data.role, {
        permission_codes: data.codes,
      }),
    onSuccess: () => {
      appToast.success(tenantMessages.settings.permissions.saved);
      queryClient.invalidateQueries({
        queryKey: ['role-permissions', organization?.id],
      });
    },
    onError: (error) => appToast.error(getErrorMessage(error, '更新失败，请重试')),
  });

  const handleTogglePermission = (code: string) => {
    const newSet = new Set(selectedPermissions);
    if (newSet.has(code)) {
      newSet.delete(code);
    } else {
      newSet.add(code);
    }
    setSelectedPermissions(newSet);
  };

  const handleToggleResource = (resource: string, permissions: Permission[]) => {
    const resourceCodes = permissions.map((p) => p.code);
    const allSelected = resourceCodes.every((code) => selectedPermissions.has(code));

    const newSet = new Set(selectedPermissions);
    if (allSelected) {
      resourceCodes.forEach((code) => newSet.delete(code));
    } else {
      resourceCodes.forEach((code) => newSet.add(code));
    }
    setSelectedPermissions(newSet);
  };

  const handleSave = () => {
    updateMutation.mutate({
      role: selectedRole,
      codes: Array.from(selectedPermissions),
    });
  };

  if (!organization) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-muted-foreground">请先选择一个团队</p>
      </div>
    );
  }

  if (permissionsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="mt-1 h-4 w-64" />
          </div>
        </div>
        <div className="flex h-[calc(100vh-12rem)] min-h-[400px] rounded-lg border bg-card">
          <Skeleton className="w-56 shrink-0" />
          <Skeleton className="flex-1" />
        </div>
      </div>
    );
  }

  return (
    <PermissionPageGuard>
      <div className="space-y-6">

        <SplitSettingsPanel
          className="h-[calc(100vh-12rem)]"
          sidebarTestId={PERMISSIONS.ROLE_LIST}
          contentTestId={PERMISSIONS.PERMISSION_PANEL}
          sidebar={<OrgRoleList selectedRole={selectedRole} onSelectRole={setSelectedRole} showOwner />}
        >
          <OrgRoleDetailPanel
            role={selectedRole}
            selectedPermissions={selectedPermissions}
            groupedPermissions={groupedPermissions ?? null}
            onTogglePermission={handleTogglePermission}
            onToggleResource={handleToggleResource}
            onSave={handleSave}
            isOwner={isOwner}
            isLoadingRolePermissions={rolePermissionsLoading}
            isSaving={updateMutation.isPending}
          />
        </SplitSettingsPanel>
      </div>
    </PermissionPageGuard>
  );
}
