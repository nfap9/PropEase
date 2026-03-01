'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  adminApiEndpoints,
  AdminRole,
  AdminRoleUpdate,
} from '@/lib/api/admin-client';
import { AdminRoleList } from '@/components/admin/admin-role-list';
import { AdminRoleDetailPanel } from '@/components/admin/admin-role-detail-panel';
import { AdminRoleCreateDialog } from '@/components/admin/admin-role-create-dialog';
import { AdminRoleDeleteDialog } from '@/components/admin/admin-role-delete-dialog';
import { togglePermissionCode } from './utils';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export default function AdminRolesPage() {
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<AdminRole | null>(null);
  const [draftPermissionCodes, setDraftPermissionCodes] = useState<string[]>(
    []
  );
  const [createPermissionCodes, setCreatePermissionCodes] = useState<string[]>(
    []
  );
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const { data: roles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ['admin', 'roles'],
    queryFn: async () => {
      const res = await adminApiEndpoints.listRoles({ limit: 200 });
      return (res.data ?? []) as AdminRole[];
    },
  });

  // 切换角色或进入页面时，从服务端数据加载权限草稿；未点保存离开则丢弃
  useEffect(() => {
    setDraftPermissionCodes(selectedRole?.permissions ?? []);
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
      toast.success('角色创建成功');
    },
    onError: (e: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(e.response?.data?.message ?? '创建失败，请重试');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: AdminRoleUpdate }) =>
      adminApiEndpoints.updateRole(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'roles'] });
      toast.success('权限已保存');
    },
    onError: () => toast.error('保存失败，请重试'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApiEndpoints.deleteRole(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'roles'] });
      setIsDeleteOpen(false);
      setSelectedRole(null);
      toast.success('角色已删除');
    },
    onError: (e: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(e.response?.data?.message ?? '删除失败，请重试');
    },
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
    setSelectedRole(role);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedRole) deleteMutation.mutate(selectedRole.id);
  };

  useEffect(() => {
    if (isCreateOpen) setCreatePermissionCodes([]);
  }, [isCreateOpen]);

  if (rolesLoading) {
    return (
      <div className="flex h-[60vh]">
        <Skeleton className="w-56 shrink-0" />
        <Skeleton className={cn('flex-1')} />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] min-h-[400px] rounded-lg border bg-card">
      <aside className="w-56 shrink-0">
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
    </div>
  );
}
