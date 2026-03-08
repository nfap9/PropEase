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
import { Checkbox } from '@/components/ui/checkbox';
import { ORG_STATUS_CONFIG } from '@/lib/status-config';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { ColumnDef } from '@tanstack/react-table';
import { adminApiEndpoints, AdminUser, AdminRole } from '@/lib/api/admin-client';
import { getErrorMessage } from '@/lib/utils/error';
import { formatDateTime } from '@/lib/date-utils';
import { Plus, Pencil, Trash2, KeyRound } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

/** 运营账号密码强度：至少 8 位，含大小写、数字、特殊字符（与后端一致） */
const adminPasswordSchema = z
  .string()
  .min(8, '密码至少 8 位')
  .refine((s) => /[a-z]/.test(s), '密码须包含小写字母')
  .refine((s) => /[A-Z]/.test(s), '密码须包含大写字母')
  .refine((s) => /\d/.test(s), '密码须包含数字')
  .refine((s) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?\s]/.test(s), '密码须包含特殊字符');

const createUserSchema = z.object({
  username: z.string().min(1, '请输入用户名'),
  password: adminPasswordSchema,
  name: z.string().min(1, '请输入姓名'),
  email: z.string().optional(),
  role_id: z.string().min(1, '请选择角色'),
});

const editUserSchema = z.object({
  name: z.string().min(1, '请输入姓名'),
  email: z.string().optional(),
  role_id: z.string().min(1, '请选择角色'),
  is_active: z.boolean(),
});

const resetPasswordSchema = z
  .object({
    new_password: adminPasswordSchema,
    confirm: z.string(),
  })
  .refine((d) => d.new_password === d.confirm, { message: '两次密码不一致', path: ['confirm'] });

type CreateUserForm = z.infer<typeof createUserSchema>;
type EditUserForm = z.infer<typeof editUserSchema>;
type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      const res = await adminApiEndpoints.listUsers({ limit: 200 });
      return (res.data ?? []) as AdminUser[];
    },
  });

  const { data: roles } = useQuery({
    queryKey: ['admin', 'roles'],
    queryFn: async () => {
      const res = await adminApiEndpoints.listRoles({ limit: 100 });
      return (res.data ?? []) as AdminRole[];
    },
  });

  const createForm = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { username: '', password: '', name: '', email: '', role_id: '' },
  });

  const editForm = useForm<EditUserForm>({
    resolver: zodResolver(editUserSchema),
  });

  const resetForm = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { new_password: '', confirm: '' },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateUserForm) =>
      adminApiEndpoints.createUser({
        username: data.username,
        password: data.password,
        name: data.name,
        email: data.email || undefined,
        role_id: data.role_id,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setIsCreateOpen(false);
      createForm.reset();
      toast.success('运营账号创建成功');
    },
    onError: (error) => toast.error(getErrorMessage(error, '创建失败，请重试')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: EditUserForm }) =>
      adminApiEndpoints.updateUser(id, {
        name: data.name,
        email: data.email || null,
        role_id: data.role_id,
        is_active: data.is_active,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setIsEditOpen(false);
      setSelectedUser(null);
      toast.success('运营账号已更新');
    },
    onError: (error) => toast.error(getErrorMessage(error, '更新失败，请重试')),
  });

  const resetMutation = useMutation({
    mutationFn: ({ id, new_password }: { id: string; new_password: string }) =>
      adminApiEndpoints.resetUserPassword(id, { new_password }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setIsResetOpen(false);
      setSelectedUser(null);
      resetForm.reset();
      toast.success('密码已重置');
    },
    onError: (error) => toast.error(getErrorMessage(error, '重置失败，请重试')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApiEndpoints.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setIsDeleteOpen(false);
      setSelectedUser(null);
      toast.success('运营账号已删除');
    },
    onError: (error) => toast.error(getErrorMessage(error, '删除失败，请重试')),
  });

  const handleEdit = (user: AdminUser) => {
    setSelectedUser(user);
    editForm.reset({
      name: user.name,
      email: user.email ?? '',
      role_id: user.role_id,
      is_active: user.is_active,
    });
    setIsEditOpen(true);
  };

  const handleResetPassword = (user: AdminUser) => {
    setSelectedUser(user);
    resetForm.reset({ new_password: '', confirm: '' });
    setIsResetOpen(true);
  };

  const handleDelete = (user: AdminUser) => {
    setSelectedUser(user);
    setIsDeleteOpen(true);
  };

  const columns: ColumnDef<AdminUser>[] = [
    { accessorKey: 'username', header: '用户名' },
    { accessorKey: 'name', header: '姓名' },
    { accessorKey: 'email', header: '邮箱', cell: ({ row }) => row.original.email ?? '—' },
    { accessorKey: 'role_name', header: '角色', cell: ({ row }) => row.original.role_name ?? '—' },
    {
      accessorKey: 'is_active',
      header: '状态',
      cell: ({ row }) => {
        const config = row.original.is_active
          ? ORG_STATUS_CONFIG.active
          : ORG_STATUS_CONFIG.inactive;
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    {
      accessorKey: 'last_login_at',
      header: '最后登录',
      cell: ({ row }) => {
        const t = row.original.last_login_at;
        return t ? formatDateTime(t) : '—';
      },
    },
    {
      id: 'actions',
      header: '操作',
      cell: ({ row }) => (
        <TableActions
          actions={[
            { icon: Pencil, label: '编辑', onClick: () => handleEdit(row.original) },
            {
              icon: KeyRound,
              label: '重置密码',
              onClick: () => handleResetPassword(row.original),
            },
            {
              icon: Trash2,
              label: '删除',
              variant: 'destructive',
              onClick: () => handleDelete(row.original),
              show: !row.original.is_system,
            },
          ]}
        />
      ),
    },
  ];

  if (usersLoading) {
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
        <h2 className="text-xl font-semibold" data-testid="admin-users-heading">运营账号</h2>
        <Button onClick={() => setIsCreateOpen(true)} data-testid="admin-users-create-btn">
          <Plus className="mr-2 h-4 w-4" />
          新建账号
        </Button>
      </div>

      <DataTable columns={columns} data={users ?? []} testid="admin-users-list" />

      {/* 新建 */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新建运营账号</DialogTitle>
            <DialogDescription>创建新的运营后台登录账号</DialogDescription>
          </DialogHeader>
          <Form {...createForm}>
            <form
              onSubmit={createForm.handleSubmit((d) => createMutation.mutate(d))}
              className="space-y-4"
            >
              <FormField
                control={createForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>用户名</FormLabel>
                    <FormControl>
                      <Input placeholder="登录用户名" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>密码</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="至少 8 位，含大小写、数字、特殊字符"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>姓名</FormLabel>
                    <FormControl>
                      <Input placeholder="显示姓名" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>邮箱（选填）</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="role_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>角色</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="选择角色" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(roles ?? []).map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
            <DialogTitle>编辑运营账号</DialogTitle>
            <DialogDescription>
              {selectedUser ? `编辑 ${selectedUser.username}` : ''}
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form
              onSubmit={editForm.handleSubmit((d) =>
                selectedUser ? updateMutation.mutate({ id: selectedUser.id, data: d }) : undefined
              )}
              className="space-y-4"
            >
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>姓名</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>邮箱</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="role_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>角色</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="选择角色" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(roles ?? []).map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Checkbox
                        id="edit-form-is_active"
                        checked={field.value}
                        onCheckedChange={(v) => field.onChange(v === true)}
                      />
                    </FormControl>
                    <FormLabel htmlFor="edit-form-is_active" className="!mt-0">
                      启用
                    </FormLabel>
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

      {/* 重置密码 */}
      <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>重置密码</DialogTitle>
            <DialogDescription>
              {selectedUser ? `为 ${selectedUser.username} 设置新密码` : ''}
            </DialogDescription>
          </DialogHeader>
          <Form {...resetForm}>
            <form
              onSubmit={resetForm.handleSubmit((d) =>
                selectedUser
                  ? resetMutation.mutate({ id: selectedUser.id, new_password: d.new_password })
                  : undefined
              )}
              className="space-y-4"
            >
              <FormField
                control={resetForm.control}
                name="new_password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>新密码</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="至少 8 位，含大小写、数字、特殊字符"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={resetForm.control}
                name="confirm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>确认密码</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="再次输入" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsResetOpen(false)}>
                  取消
                </Button>
                <Button type="submit" disabled={resetMutation.isPending}>
                  {resetMutation.isPending ? '提交中…' : '确定'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* 删除确认：系统预置账号不可删除 */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedUser?.is_system ? (
                <>系统预置账号「{selectedUser?.username}」不可删除。</>
              ) : (
                <>确定要删除运营账号「{selectedUser?.username}」吗？此操作不可恢复。</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            {!selectedUser?.is_system && (
              <AlertDialogAction
                onClick={() => selectedUser && deleteMutation.mutate(selectedUser.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteMutation.isPending ? '删除中…' : '删除'}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
