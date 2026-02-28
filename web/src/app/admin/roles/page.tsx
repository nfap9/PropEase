'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { DataTable } from '@/components/common/data-table';
import { TableActions } from '@/components/common/table-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { ColumnDef } from '@tanstack/react-table';
import {
  adminApiEndpoints,
  AdminRole,
  AdminRoleUpdate,
} from '@/lib/api/admin-client';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const roleSchema = z.object({
  name: z.string().min(1, '请输入角色名称'),
  permissions: z.string().optional(),
});

type RoleFormData = z.infer<typeof roleSchema>;

function permissionsStringToArray(s: string): string[] {
  return s
    .split(/[\s,，]+/)
    .map((x) => x.trim())
    .filter(Boolean);
}

function permissionsArrayToString(arr: string[]): string {
  return (arr ?? []).join(', ');
}

export default function AdminRolesPage() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<AdminRole | null>(null);

  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ['admin', 'roles'],
    queryFn: async () => {
      const res = await adminApiEndpoints.listRoles({ limit: 200 });
      return (res.data ?? []) as AdminRole[];
    },
  });

  const createForm = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: { name: '', permissions: '' },
  });

  const editForm = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
  });

  const createMutation = useMutation({
    mutationFn: (data: RoleFormData) =>
      adminApiEndpoints.createRole({
        name: data.name,
        permissions: permissionsStringToArray(data.permissions ?? ''),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'roles'] });
      setIsCreateOpen(false);
      createForm.reset();
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
      setIsEditOpen(false);
      setSelectedRole(null);
      toast.success('角色已更新');
    },
    onError: () => toast.error('更新失败，请重试'),
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

  const handleEdit = (role: AdminRole) => {
    setSelectedRole(role);
    editForm.reset({
      name: role.name,
      permissions: permissionsArrayToString(role.permissions ?? []),
    });
    setIsEditOpen(true);
  };

  const handleDelete = (role: AdminRole) => {
    setSelectedRole(role);
    setIsDeleteOpen(true);
  };

  const columns: ColumnDef<AdminRole>[] = [
    { accessorKey: 'name', header: '角色名称' },
    {
      accessorKey: 'permissions',
      header: '权限',
      cell: ({ row }) => {
        const p = row.original.permissions ?? [];
        if (p.length === 0) return '—';
        if (p.length <= 3) return p.join(', ');
        return `${p.slice(0, 2).join(', ')} 等 ${p.length} 项`;
      },
    },
    {
      accessorKey: 'is_system',
      header: '系统预置',
      cell: ({ row }) =>
        row.original.is_system ? (
          <Badge variant="secondary">是</Badge>
        ) : (
          <Badge variant="outline">否</Badge>
        ),
    },
    {
      id: 'actions',
      header: '操作',
      cell: ({ row }) => {
        const role = row.original;
        return (
          <TableActions
            actions={[
              {
                icon: Pencil,
                label: '编辑',
                onClick: () => handleEdit(role),
                show: true,
              },
              {
                icon: Trash2,
                label: '删除',
                variant: 'destructive',
                onClick: () => handleDelete(role),
                show: !role.is_system,
              },
            ]}
          />
        );
      },
    },
  ];

  if (rolesLoading) {
    return (
      <div className="mx-auto max-w-6xl">
        <Skeleton className="mb-4 h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">运营角色</h2>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          新建角色
        </Button>
      </div>

      <DataTable columns={columns} data={roles ?? []} />

      {/* 新建 */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新建角色</DialogTitle>
            <DialogDescription>权限为逗号或空格分隔的字符串，如 admin:user:read, admin:org:write</DialogDescription>
          </DialogHeader>
          <Form {...createForm}>
            <form
              onSubmit={createForm.handleSubmit((d) => createMutation.mutate(d))}
              className="space-y-4"
            >
              <FormField
                control={createForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>角色名称</FormLabel>
                    <FormControl>
                      <Input placeholder="如：运营专员" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="permissions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>权限（选填）</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="admin:user:read, admin:org:write"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  取消
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? '提交中…' : '创建'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* 编辑 */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑角色</DialogTitle>
            <DialogDescription>
              {selectedRole?.is_system
                ? '系统预置角色不可修改名称，仅可调整权限'
                : `编辑 ${selectedRole?.name}`}
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form
              onSubmit={editForm.handleSubmit((d) => {
                if (!selectedRole) return;
                updateMutation.mutate({
                  id: selectedRole.id,
                  data: {
                    name: selectedRole.is_system ? undefined : d.name,
                    permissions: permissionsStringToArray(d.permissions ?? ''),
                  },
                });
              })}
              className="space-y-4"
            >
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>角色名称</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={selectedRole?.is_system} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="permissions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>权限</FormLabel>
                    <FormControl>
                      <Input placeholder="逗号或空格分隔" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                  取消
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? '保存中…' : '保存'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* 删除确认 */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除角色「{selectedRole?.name}」吗？此操作不可恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedRole && deleteMutation.mutate(selectedRole.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? '删除中…' : '删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
