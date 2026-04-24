import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { permissionsApi } from '@/api/permissions';
import { organizationsApi } from '@/api/organizations';
import { getErrorMessage } from '@/utils/error';
import type { OrgRole, Permission } from '@/api/permissions';
import { useAuth } from '@/contexts/auth';
import { tenantMessages } from '@/i18n';

export function usePermissionsData() {
  const { organization, user } = useAuth();
  const queryClient = useQueryClient();

  const [selectedRole, setSelectedRole] = useState<OrgRole | null>(null);
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
      if (selectedRole && selectedRole.id === deleteMutation.variables) {
        setSelectedRole(null);
      }
    },
    onError: (error) => toast.error(getErrorMessage(error, '删除失败，请重试')),
  });

  const createRole = useCallback(
    (data: { name: string; description?: string }, onSuccess?: () => void) => {
      createMutation.mutate(data, { onSuccess });
    },
    [createMutation],
  );

  const updateRolePermissions = useCallback(
    (codes: string[]) => {
      if (selectedRole) {
        updateMutation.mutate({ roleId: selectedRole.id, codes });
      }
    },
    [selectedRole, updateMutation],
  );

  const deleteRole = useCallback(
    (roleId: string, onSuccess?: () => void) => {
      deleteMutation.mutate(roleId, { onSuccess });
    },
    [deleteMutation],
  );

  const handleTogglePermission = useCallback(
    (code: string) => {
      const newSet = new Set(selectedPermissions);
      if (newSet.has(code)) {
        newSet.delete(code);
      } else {
        newSet.add(code);
      }
      setSelectedPermissions(newSet);
    },
    [selectedPermissions],
  );

  const handleToggleResource = useCallback(
    (resource: string, permissions: Permission[]) => {
      const resourceCodes = permissions.map((p) => p.code);
      const allSelected = resourceCodes.every((code) => selectedPermissions.has(code));

      const newSet = new Set(selectedPermissions);
      if (allSelected) {
        resourceCodes.forEach((code) => newSet.delete(code));
      } else {
        resourceCodes.forEach((code) => newSet.add(code));
      }
      setSelectedPermissions(newSet);
    },
    [selectedPermissions],
  );

  const handleSave = useCallback(() => {
    updateRolePermissions(Array.from(selectedPermissions));
  }, [selectedPermissions, updateRolePermissions]);

  const handleSelectRole = useCallback((role: OrgRole) => {
    setSelectedRole(role);
  }, []);

  return {
    groupedPermissions,
    roles,
    rolesLoading,
    permissionsLoading,
    rolePermissions,
    rolePermissionsLoading,
    selectedRole,
    selectedPermissions,
    isOwner,
    createRole,
    deleteRole,
    handleTogglePermission,
    handleToggleResource,
    handleSave,
    handleSelectRole,
    isCreating: createMutation.isPending,
    isSaving: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
