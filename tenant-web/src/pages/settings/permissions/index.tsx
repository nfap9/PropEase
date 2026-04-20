import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { PermissionPageGuard } from '@/components/layout/permission-page-guard';
import { permissionsApi } from '@/api/permissions';
import { organizationsApi } from '@/api';
import { getErrorMessage } from '@/utils/error';
import type { OrgRole, Permission } from '@/api/permissions';
import { useAuth } from '@/contexts/auth';
import {
  OrgRoleList,
  OrgRoleCreateDialog,
  OrgRoleDeleteDialog,
} from '@/pages/settings/permissions/components/org-role-list';
import { OrgRoleDetailPanel } from '@/pages/settings/permissions/components/org-role-detail-panel';
import { Shield } from 'lucide-react';
import { Skeleton } from '@apartment-ultra/shared-ui/components/ui';
import { tenantMessages } from '@/i18n';

export default function PermissionsPage() {
  const { organization, user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<OrgRole | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const { data: members } = useQuery({
    queryKey: ['organization-members', organization?.id],
    queryFn: () => organizationsApi.getMembers(organization!.id),
    enabled: !!organization,
  });

  const { data: groupedPermissions, isLoading: permissionsLoading } = useQuery({
    queryKey: ['permissions-grouped'],
    queryFn: permissionsApi.getGrouped,
  });

  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ['org-roles', organization?.id],
    queryFn: () => permissionsApi.getOrgRoles(),
    enabled: !!organization,
  });

  const { data: rolePermissions, isLoading: rolePermissionsLoading } = useQuery({
    queryKey: ['role-permissions', selectedRole?.id],
    queryFn: async () => {
      if (!selectedRole || !organization) return null;
      return permissionsApi.getRolePermissions(selectedRole.id);
    },
    enabled: !!selectedRole && !!organization,
  });

  useEffect(() => {
    if (rolePermissions?.permissions) {
      setSelectedPermissions(new Set(rolePermissions.permissions));
    }
  }, [rolePermissions]);

  const currentMember = members?.find((m: { user_id: string }) => m.user_id === user?.id);
  const isOwner = currentMember?.role_name === '组织所有者';

  const createMutation = useMutation({
    mutationFn: (data: { name: string; description?: string }) => permissionsApi.createOrgRole(data),
    onSuccess: () => {
      toast.success('角色创建成功');
      queryClient.invalidateQueries({ queryKey: ['org-roles', organization?.id] });
      setIsCreateOpen(false);
    },
    onError: (error) => toast.error(getErrorMessage(error, '创建失败，请重试')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ roleId, codes }: { roleId: string; codes: string[] }) => {
      if (!organization) throw new Error('No organization selected');
      return permissionsApi.updateRolePermissions(roleId, codes);
    },
    onSuccess: () => {
      toast.success(tenantMessages.settings.permissions.saved);
      queryClient.invalidateQueries({ queryKey: ['org-roles', organization?.id] });
      queryClient.invalidateQueries({ queryKey: ['role-permissions', selectedRole?.id] });
    },
    onError: (error) => toast.error(getErrorMessage(error, '保存失败，请重试')),
  });

  const deleteMutation = useMutation({
    mutationFn: (roleId: string) => {
      if (!organization) throw new Error('No organization selected');
      return permissionsApi.deleteOrgRole(roleId);
    },
    onSuccess: () => {
      toast.success('角色删除成功');
      queryClient.invalidateQueries({ queryKey: ['org-roles', organization?.id] });
      setIsDeleteOpen(false);
      if (selectedRole && selectedRole.id === deleteMutation.variables) {
        setSelectedRole(null);
      }
    },
    onError: (error) => toast.error(getErrorMessage(error, '删除失败，请重试')),
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
    if (!selectedRole) return;
    updateMutation.mutate({
      roleId: selectedRole.id,
      codes: Array.from(selectedPermissions),
    });
  };

  const handleSelectRole = (role: OrgRole) => {
    setSelectedRole(role);
  };

  const handleAddRole = () => {
    setIsCreateOpen(true);
  };

  const handleDeleteRole = (role: OrgRole) => {
    setSelectedRole(role);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!selectedRole) return;
    deleteMutation.mutate(selectedRole.id);
  };

  if (!organization) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-muted-foreground">请先选择一个团队</p>
      </div>
    );
  }

  if (rolesLoading || permissionsLoading) {
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
      <div className="flex h-full rounded-lg border bg-card">
        <div className="w-56 shrink-0 border-r p-4">
          <OrgRoleList
            roles={roles ?? []}
            selectedRoleId={selectedRole?.id ?? null}
            onSelectRole={handleSelectRole}
            onAddRole={handleAddRole}
            onDeleteRole={handleDeleteRole}
          />
        </div>
        <div className="flex-1 overflow-auto p-4">
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
        </div>
      </div>

      <OrgRoleCreateDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSubmit={(name, description) => createMutation.mutate({ name, description })}
        isPending={createMutation.isPending}
      />

      <OrgRoleDeleteDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        role={selectedRole}
        onConfirm={handleDeleteConfirm}
        isPending={deleteMutation.isPending}
      />
    </PermissionPageGuard>
  );
}
