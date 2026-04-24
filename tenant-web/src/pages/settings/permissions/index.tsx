import { PermissionPageGuard } from '@/components/layout/permission-page-guard';
import { useAuth } from '@/contexts/auth';
import { Skeleton } from 'antd';
import { Shield } from 'lucide-react';
import { usePermissionsPage } from './hooks/use-permissions-page';
import {
  OrgRoleList,
  OrgRoleCreateDialog,
  OrgRoleDeleteDialog,
} from '@/pages/settings/permissions/components/org-role-list';
import { OrgRoleDetailPanel } from '@/pages/settings/permissions/components/org-role-detail-panel';

export default function PermissionsPage() {
  const { organization } = useAuth();

  const {
    roles,
    rolesLoading,
    permissionsLoading,
    selectedRole,
    selectedPermissions,
    groupedPermissions,
    rolePermissionsLoading,
    isCreateOpen,
    isDeleteOpen,
    isOwner,
    createMutation,
    updateMutation,
    deleteMutation,
    handleSelectRole,
    handleAddRole,
    handleDeleteRole,
    handleTogglePermission,
    handleToggleResource,
    handleSave,
    handleDeleteConfirm,
    setIsCreateOpen,
    setIsDeleteOpen,
  } = usePermissionsPage();

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
