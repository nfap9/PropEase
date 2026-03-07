'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { DataTable } from '@/components/common/data-table';
import { TableActions } from '@/components/common/table-actions';
import { Badge } from '@/components/ui/badge';
import { ORG_STATUS_CONFIG } from '@/lib/status-config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  adminApiEndpoints,
  AdminRegisteredUser,
  AdminRegisteredUserDetail,
} from '@/lib/api/admin-client';
import { getErrorMessage } from '@/lib/utils/error';
import { formatDateTime } from '@/lib/date-utils';
import { ColumnDef } from '@tanstack/react-table';
import { Eye, Power, PowerOff, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

type FilterActive = 'all' | 'active' | 'inactive';

export default function AdminRegisteredUsersPage() {
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState<FilterActive>('all');
  const [search, setSearch] = useState('');
  const [searchSubmitted, setSearchSubmitted] = useState('');
  const [detailUserId, setDetailUserId] = useState<string | null>(null);
  /** 待停用确认的用户 id，用于二次确认弹窗 */
  const [disableConfirmUserId, setDisableConfirmUserId] = useState<string | null>(null);
  /** 待删除确认的用户 id */
  const [deleteConfirmUserId, setDeleteConfirmUserId] = useState<string | null>(null);

  const isActiveParam = activeFilter === 'all' ? undefined : activeFilter === 'active';

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin', 'registered-users', isActiveParam, searchSubmitted],
    queryFn: async () => {
      const res = await adminApiEndpoints.listRegisteredUsers({
        limit: 500,
        is_active: isActiveParam,
        search: searchSubmitted || undefined,
      });
      return (res.data ?? []) as AdminRegisteredUser[];
    },
  });

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ['admin', 'registered-users', 'detail', detailUserId],
    queryFn: async () => {
      if (!detailUserId) return null;
      const res = await adminApiEndpoints.getRegisteredUser(detailUserId);
      return (res.data ?? null) as AdminRegisteredUserDetail | null;
    },
    enabled: !!detailUserId,
  });

  const setActiveMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      adminApiEndpoints.setRegisteredUserActive(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'registered-users'] });
      if (detailUserId) {
        queryClient.invalidateQueries({
          queryKey: ['admin', 'registered-users', 'detail', detailUserId],
        });
      }
      setDisableConfirmUserId(null);
      toast.success('已更新');
    },
    onError: (error) => toast.error(getErrorMessage(error, '操作失败，请重试')),
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => adminApiEndpoints.deleteRegisteredUser(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'registered-users'] });
      if (detailUserId === id) setDetailUserId(null);
      setDeleteConfirmUserId(null);
      toast.success('已删除');
    },
    onError: (error) => toast.error(getErrorMessage(error, '删除失败，请重试')),
  });

  const columns: ColumnDef<AdminRegisteredUser>[] = [
    { accessorKey: 'phone', header: '手机号' },
    { accessorKey: 'full_name', header: '姓名' },
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
      accessorKey: 'created_at',
      header: '注册时间',
      cell: ({ row }) => formatDateTime(row.original.created_at),
    },
    {
      id: 'actions',
      header: '操作',
      cell: ({ row }) => {
        const user = row.original;
        return (
          <TableActions
            actions={[
              {
                icon: Eye,
                label: '详情',
                onClick: () => setDetailUserId(user.id),
              },
              ...(user.is_active
                ? [
                    {
                      icon: PowerOff,
                      label: '停用',
                      variant: 'destructive' as const,
                      onClick: () => setDisableConfirmUserId(user.id),
                    },
                  ]
                : [
                    {
                      icon: Power,
                      label: '启用',
                      onClick: () =>
                        setActiveMutation.mutate({
                          id: user.id,
                          is_active: true,
                        }),
                    },
                  ]),
              {
                icon: Trash2,
                label: '删除',
                variant: 'destructive',
                onClick: () => setDeleteConfirmUserId(user.id),
              },
            ]}
          />
        );
      },
    },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchSubmitted(search);
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl">
        <Skeleton className="mb-4 h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-semibold" data-testid="admin-registered-users-heading">用户管理</h2>
        <div className="flex flex-wrap items-center gap-2">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <Input
              placeholder="手机号或姓名"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-40"
            />
            <Button type="submit" variant="secondary" size="sm">
              搜索
            </Button>
          </form>
          <Select value={activeFilter} onValueChange={(v) => setActiveFilter(v as FilterActive)}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="状态筛选" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              <SelectItem value="active">启用</SelectItem>
              <SelectItem value="inactive">停用</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable columns={columns} data={users ?? []} data-testid="admin-registered-users-list" />

      <AlertDialog
        open={!!disableConfirmUserId}
        onOpenChange={(open) => !open && setDisableConfirmUserId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认停用</AlertDialogTitle>
            <AlertDialogDescription>
              确定要停用该账号吗？停用后该用户将无法登录系统。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (disableConfirmUserId) {
                  setActiveMutation.mutate({
                    id: disableConfirmUserId,
                    is_active: false,
                  });
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {setActiveMutation.isPending ? '处理中…' : '确定停用'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!deleteConfirmUserId}
        onOpenChange={(open) => !open && setDeleteConfirmUserId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除该注册用户吗？删除后账号及其关联数据将无法恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteConfirmUserId) {
                  deleteUserMutation.mutate(deleteConfirmUserId);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteUserMutation.isPending ? '处理中…' : '确定删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Sheet open={!!detailUserId} onOpenChange={(open) => !open && setDetailUserId(null)}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>用户详情</SheetTitle>
          </SheetHeader>
          {detailUserId && (
            <div className="mt-6">
              {detailLoading ? (
                <Skeleton className="h-32 w-full" />
              ) : detail ? (
                <div className="space-y-4">
                  <div>
                    <span className="text-muted-foreground">手机号</span>
                    <p className="font-medium">{detail.phone}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">姓名</span>
                    <p className="font-medium">{detail.full_name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">状态</span>
                    <p>
                      <Badge
                        variant={
                          detail.is_active
                            ? ORG_STATUS_CONFIG.active.variant
                            : ORG_STATUS_CONFIG.inactive.variant
                        }
                      >
                        {detail.is_active
                          ? ORG_STATUS_CONFIG.active.label
                          : ORG_STATUS_CONFIG.inactive.label}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">注册时间</span>
                    <p className="font-medium">{formatDateTime(detail.created_at)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">所属组织</span>
                    {detail.organizations.length === 0 ? (
                      <p className="text-sm text-muted-foreground">暂无</p>
                    ) : (
                      <ul className="mt-1 space-y-1">
                        {detail.organizations.map((org) => (
                          <li
                            key={org.id}
                            className="flex items-center justify-between rounded border px-2 py-1 text-sm"
                          >
                            <span>{org.name}</span>
                            <Badge variant="outline">{org.role}</Badge>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {detail.is_active ? (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDisableConfirmUserId(detail.id)}
                        disabled={setActiveMutation.isPending}
                      >
                        停用账号
                      </Button>
                    ) : (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => {
                          setActiveMutation.mutate({
                            id: detail.id,
                            is_active: true,
                          });
                        }}
                        disabled={setActiveMutation.isPending}
                      >
                        启用账号
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => setDeleteConfirmUserId(detail.id)}
                      disabled={deleteUserMutation.isPending}
                    >
                      删除账号
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">加载失败</p>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
