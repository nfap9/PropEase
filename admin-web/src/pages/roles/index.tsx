
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminApiEndpoints, AdminRole, AdminRoleUpdate } from '@/api/admin-client';
import { getErrorMessage } from '@/utils/error';
import { AdminRoleList } from '@/pages/roles/components/admin-role-list';
import { AdminRoleDetailPanel } from '@/pages/roles/components/admin-role-detail-panel';
import { AdminRoleCreateDialog } from '@/pages/roles/components/admin-role-create-dialog';
import { AdminRoleDeleteDialog } from '@/pages/roles/components/admin-role-delete-dialog';
import { getAllAdminPermissionCodes } from '@/types/admin-permissions';
import { togglePermissionCode } from './utils';
import { Skeleton } from '@apartment-ultra/shared-ui/components/ui';
import { adminMessages } from '@/i18n';

export default function AdminRolesPage() {
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<AdminRole | null>(null);
  const [draftPermissionCodes, setDraftPermissionCodes] = useState<string[]>([]);
  const [createPermissionCodes, setCreatePermissionCodes] = useState<string[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const { data: roles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ['admin', 'roles'],
    queryFn: async () => {
      const res = await adminApiEndpoints.listRoles({ limit: 200 });
      return (res.data ?? []) as AdminRole[];
    },
  });

  // 切换角色或进入页面时，从服务端数据加载权限草稿；历史「*」展开为全部权限码
  useEffect(() => {
    const raw = selectedRole?.permissions ?? [];
    const codes = raw.includes('*') ? getAllAdminPermissionCodes() : raw;
    setDraftPermissionCodes(codes);
  }, [selectedRole?.id, selectedRole?.permissions]);

  const createMutation = useMutation({
    mutationFn: (payload: { name: string; permissionCodes: string[] }) =>
      adminApiEndpoints.createRole({
        name: payload.name,
        permissions: payload.permissionCodes,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'roles'] });
      setIsCreateOpen(false);
      setCreatePermissionCodes([]);
      toast.success(adminMessages.roles.toast.created);
    },
    onError: (error) => toast.error(getErrorMessage(error, '创建失败，请重试')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: AdminRoleUpdate }) => adminApiEndpoints.updateRole(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'roles'] });
      toast.success(adminMessages.roles.toast.saved);
    },
    onError: (error) => toast.error(getErrorMessage(error, '保存失败，请重试')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApiEndpoints.deleteRole(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'roles'] });
      setIsDeleteOpen(false);
      setSelectedRole(null);
      toast.success(adminMessages.roles.toast.deleted);
    },
    onError: (error) => toast.error(getErrorMessage(error, '删除失败，请重试')),
  });

  const handleSelectRole = (role: AdminRole) => {
    setSelectedRole(role);
  };

  const handleToggleDraftPermission = (code: string, checked: boolean) => {
    setDraftPermissionCodes((prev) => togglePermissionCode(prev, code, checked));
  };

  const handleSave = () => {
    if (!selectedRole || selectedRole.is_system) return;
    updateMutation.mutate({
      id: selectedRole.id,
      data: { permissions: draftPermissionCodes },
    });
  };

  const handleCreateSubmit = (name: string, permissionCodes: string[]) => {
    createMutation.mutate({ name, permissionCodes });
  };

  const handleToggleCreatePermission = (code: string, checked: boolean) => {
    setCreatePermissionCodes((prev) => togglePermissionCode(prev, code, checked));
  };

  const handleDeleteRole = (role: AdminRole) => {
    if (role.is_system) return; // 系统预置角色（如超级管理员）不可删除
    setSelectedRole(role);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!selectedRole || selectedRole.is_system) return;
    deleteMutation.mutate(selectedRole.id);
  };

  useEffect(() => {
    if (isCreateOpen) setCreatePermissionCodes([]);
  }, [isCreateOpen]);

  if (rolesLoading) {
    return (
      <div className="flex h-[60vh]">
        <Skeleton className="w-56 shrink-0" />
        <Skeleton className="flex-1" />
      </div>
    );
  }

  return (
    <>
      <div className="flex h-[calc(100vh-8rem)]">
        <aside data-testid="admin-roles-list" className="w-56 shrink-0">
          <AdminRoleList
            roles={roles}
            selectedRoleId={selectedRole?.id ?? null}
            onSelectRole={handleSelectRole}
            onAddRole={() => setIsCreateOpen(true)}
            onDeleteRole={handleDeleteRole}
            isLoading={rolesLoading}
          />
        </aside>
        <main className="flex min-w-0 flex-1 flex-col">
          <AdminRoleDetailPanel
            role={selectedRole}
            draftPermissionCodes={draftPermissionCodes}
            onTogglePermission={handleToggleDraftPermission}
            onSave={handleSave}
            isSaving={updateMutation.isPending}
          />
        </main>
      </div>

      <AdminRoleCreateDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        permissionCodes={createPermissionCodes}
        onPermissionToggle={handleToggleCreatePermission}
        onSubmit={handleCreateSubmit}
        isPending={createMutation.isPending}
      />

      <AdminRoleDeleteDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        role={selectedRole}
        onConfirm={handleDeleteConfirm}
        isPending={deleteMutation.isPending}
      />
    </>
  );
}
