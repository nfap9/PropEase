'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { permissionsApi } from '@/lib/api/permissions';
import { MemberRole, Permission } from '@/types';
import { useAuth } from '@/lib/auth/context';
import { Shield, Save } from 'lucide-react';

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
  manage: '管理（全部）',
};

export default function PermissionsPage() {
  const { organization, user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<MemberRole>('admin');
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(
    new Set()
  );

  // 获取当前用户的角色
  const { data: members } = useQuery({
    queryKey: ['organization-members', organization?.id],
    queryFn: async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/organizations/${organization?.id}/members`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        }
      );
      return response.json();
    },
    enabled: !!organization,
  });

  // 获取权限分组
  const { data: groupedPermissions, isLoading: permissionsLoading } = useQuery({
    queryKey: ['permissions-grouped'],
    queryFn: permissionsApi.getGrouped,
  });

  // 获取角色当前权限
  const { data: rolePermissions, isLoading: rolePermissionsLoading } = useQuery({
    queryKey: ['role-permissions', organization?.id, selectedRole],
    queryFn: async () => {
      if (!organization) return null;
      const response = await permissionsApi.getRolePermissions(
        organization.id,
        selectedRole
      );
      return response;
    },
    enabled: !!organization && selectedRole !== 'owner',
  });

  // 当角色权限加载完成后，更新选中的权限
  useEffect(() => {
    if (rolePermissions?.permissions) {
      setSelectedPermissions(
        new Set(rolePermissions.permissions.map((p: Permission) => p.code))
      );
    }
  }, [rolePermissions]);

  const currentMember = members?.find(
    (m: { user_id: string }) => m.user_id === user?.id
  );
  const isOwner = currentMember?.role === 'owner';

  // 更新权限
  const updateMutation = useMutation({
    mutationFn: (data: { role: MemberRole; codes: string[] }) =>
      permissionsApi.updateRolePermissions(organization!.id, data.role, {
        permission_codes: data.codes,
      }),
    onSuccess: () => {
      toast.success('权限更新成功');
      queryClient.invalidateQueries({
        queryKey: ['role-permissions', organization?.id],
      });
    },
    onError: () => {
      toast.error('更新失败，请重试');
    },
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
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">请先选择一个组织</p>
        </div>
      </MainLayout>
    );
  }

  if (permissionsLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-96" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Shield className="h-8 w-8" />
            <div>
              <h1 className="text-3xl font-bold">权限管理</h1>
              <p className="text-muted-foreground">
                配置 {organization.name} 的角色权限
              </p>
            </div>
          </div>
          {isOwner && selectedRole !== 'owner' && (
            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending}
            >
              <Save className="mr-2 h-4 w-4" />
              {updateMutation.isPending ? '保存中...' : '保存更改'}
            </Button>
          )}
        </div>

        <Tabs
          value={selectedRole}
          onValueChange={(v) => setSelectedRole(v as MemberRole)}
        >
          <TabsList>
            {(['admin', 'member', 'viewer'] as MemberRole[]).map((role) => (
              <TabsTrigger key={role} value={role}>
                {ROLE_LABELS[role]}
              </TabsTrigger>
            ))}
          </TabsList>

          {selectedRole === 'owner' ? (
            <Card className="mt-4">
              <CardContent className="py-12 text-center">
                <Shield className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">所有者权限不可修改</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  所有者角色始终拥有所有权限
                </p>
              </CardContent>
            </Card>
          ) : !isOwner ? (
            <Card className="mt-4">
              <CardContent className="py-12 text-center">
                <Shield className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">无权限修改</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  只有组织所有者可以修改角色权限
                </p>
              </CardContent>
            </Card>
          ) : rolePermissionsLoading ? (
            <div className="mt-4 space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          ) : (
            groupedPermissions && (
              <div className="space-y-4 mt-4">
                {Object.entries(groupedPermissions).map(
                  ([resource, permissions]) => (
                    <Card key={resource}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {isOwner && (
                              <Checkbox
                                checked={permissions.every((p) =>
                                  selectedPermissions.has(p.code)
                                )}
                                onCheckedChange={() =>
                                  handleToggleResource(resource, permissions)
                                }
                              />
                            )}
                            <CardTitle className="text-lg">
                              {RESOURCE_LABELS[resource] || resource}
                            </CardTitle>
                          </div>
                          <Badge variant="secondary">
                            {permissions.filter((p) =>
                              selectedPermissions.has(p.code)
                            ).length}{' '}
                            / {permissions.length}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                          {permissions.map((permission) => (
                            <div
                              key={permission.id}
                              className="flex items-center space-x-2 cursor-pointer"
                              onClick={() => handleTogglePermission(permission.code)}
                            >
                              <Checkbox
                                checked={selectedPermissions.has(permission.code)}
                                onCheckedChange={() =>
                                  handleTogglePermission(permission.code)
                                }
                                disabled={!isOwner}
                              />
                              <label className="text-sm cursor-pointer">
                                {ACTION_LABELS[permission.action] || permission.action}
                              </label>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )
                )}
              </div>
            )
          )}
        </Tabs>
      </div>
    </MainLayout>
  );
}
