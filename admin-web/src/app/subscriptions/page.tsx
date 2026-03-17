'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import Link from 'next/link';
import { DataTable } from '@/components/common/data-table';
import { TableActions } from '@/components/common/table-actions';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { Input } from '@apartment-ultra/shared-ui/components/ui';
import { Badge } from '@apartment-ultra/shared-ui/components/ui';
import { SUBSCRIPTION_STATUS_CONFIG, BOOLEAN_YES_NO_CONFIG } from '@/lib/status-config';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@apartment-ultra/shared-ui/components/ui';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@apartment-ultra/shared-ui/components/ui';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@apartment-ultra/shared-ui/components/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@apartment-ultra/shared-ui/components/ui';
import { ColumnDef } from '@tanstack/react-table';
import { formatDate } from '@/lib/date-utils';
import { adminApiEndpoints, AdminSubscription } from '@/lib/api/admin-client';
import { getErrorMessage } from '@/lib/utils/error';
import { CalendarPlus, Ban } from 'lucide-react';
import { Skeleton } from '@apartment-ultra/shared-ui/components/ui';

const renewSchema = z.object({
  extend_days: z.coerce.number().min(1, '至少延长 1 天'),
});

type RenewForm = z.infer<typeof renewSchema>;

export default function AdminSubscriptionsPage() {
  const queryClient = useQueryClient();
  const [orgIdFilter, setOrgIdFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isRenewOpen, setIsRenewOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [selectedSub, setSelectedSub] = useState<AdminSubscription | null>(null);

  const { data: subscriptions, isLoading } = useQuery({
    queryKey: ['admin', 'subscriptions', orgIdFilter || undefined, statusFilter || undefined],
    queryFn: async () => {
      const res = await adminApiEndpoints.listSubscriptions({
        limit: 200,
        organization_id: orgIdFilter || undefined,
        status_filter: statusFilter || undefined,
      });
      return (res.data ?? []) as AdminSubscription[];
    },
  });

  const renewForm = useForm<RenewForm>({
    resolver: zodResolver(renewSchema),
    defaultValues: { extend_days: 30 },
  });

  const renewMutation = useMutation({
    mutationFn: ({ id, extend_days }: { id: string; extend_days: number }) =>
      adminApiEndpoints.renewSubscription(id, { extend_days }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'subscriptions'] });
      setIsRenewOpen(false);
      setSelectedSub(null);
      renewForm.reset({ extend_days: 30 });
      toast.success('续期成功');
    },
    onError: (error) => toast.error(getErrorMessage(error, '续期失败，请重试')),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => adminApiEndpoints.cancelSubscription(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'subscriptions'] });
      setIsCancelOpen(false);
      setSelectedSub(null);
      toast.success('已取消订阅');
    },
    onError: (error) => toast.error(getErrorMessage(error, '取消失败，请重试')),
  });

  const handleRenew = (sub: AdminSubscription) => {
    setSelectedSub(sub);
    renewForm.reset({ extend_days: 30 });
    setIsRenewOpen(true);
  };

  const handleCancel = (sub: AdminSubscription) => {
    setSelectedSub(sub);
    setIsCancelOpen(true);
  };

  const columns: ColumnDef<AdminSubscription>[] = [
    {
      accessorKey: 'organization_id',
      header: '组织 ID',
      cell: ({ row }) => (
        <Link
          href={`/organizations/${row.original.organization_id}`}
          className="text-primary hover:underline"
        >
          {row.original.organization_id}
        </Link>
      ),
    },
    {
      id: 'plan_name',
      header: '套餐',
      cell: ({ row }) => row.original.plan?.name ?? '—',
    },
    { accessorKey: 'billing_cycle', header: '计费周期' },
    {
      accessorKey: 'status',
      header: '状态',
      cell: ({ row }) => {
        const s = row.original.status;
        const config = SUBSCRIPTION_STATUS_CONFIG[s] ?? {
          label: s,
          variant: 'secondary' as const,
        };
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    {
      accessorKey: 'start_date',
      header: '开始日期',
      cell: ({ row }) => formatDate(row.original.start_date),
    },
    {
      accessorKey: 'end_date',
      header: '结束日期',
      cell: ({ row }) => formatDate(row.original.end_date),
    },
    {
      accessorKey: 'auto_renew',
      header: '自动续费',
      cell: ({ row }) => {
        const config = row.original.auto_renew
          ? BOOLEAN_YES_NO_CONFIG.yes
          : BOOLEAN_YES_NO_CONFIG.no;
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    {
      id: 'actions',
      header: '操作',
      cell: ({ row }) => {
        const sub = row.original;
        const isActive = sub.status === 'active';
        return (
          <TableActions
            actions={[
              ...(isActive
                ? [
                    {
                      icon: CalendarPlus,
                      label: '续期',
                      onClick: () => handleRenew(sub),
                    },
                    {
                      icon: Ban,
                      label: '取消',
                      variant: 'destructive' as const,
                      onClick: () => handleCancel(sub),
                    },
                  ]
                : []),
            ]}
          />
        );
      },
    },
  ];

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
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold">订阅管理</h2>
        <div className="flex items-center gap-2">
          <Input
            placeholder="按组织 ID 筛选"
            value={orgIdFilter}
            onChange={(e) => setOrgIdFilter(e.target.value)}
            className="w-48"
          />
          <Select
            value={statusFilter || 'all'}
            onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v)}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="active">生效中</SelectItem>
              <SelectItem value="expired">已过期</SelectItem>
              <SelectItem value="cancelled">已取消</SelectItem>
              <SelectItem value="trial">试用</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable columns={columns} data={subscriptions ?? []} />

      {/* 续期 */}
      <Dialog open={isRenewOpen} onOpenChange={setIsRenewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>手动续期</DialogTitle>
            <DialogDescription>
              {selectedSub ? `为组织 ${selectedSub.organization_id} 的订阅延长有效期` : ''}
            </DialogDescription>
          </DialogHeader>
          <Form {...renewForm}>
            <form
              onSubmit={renewForm.handleSubmit((d) =>
                selectedSub
                  ? renewMutation.mutate({
                      id: selectedSub.id,
                      extend_days: d.extend_days,
                    })
                  : undefined
              )}
              className="space-y-4"
            >
              <FormField
                control={renewForm.control}
                name="extend_days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>延长天数</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsRenewOpen(false)}>
                  取消
                </Button>
                <Button type="submit" disabled={renewMutation.isPending}>
                  {renewMutation.isPending ? '提交中…' : '确定续期'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* 取消确认 */}
      <AlertDialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认取消订阅</AlertDialogTitle>
            <AlertDialogDescription>
              确定要取消组织「{selectedSub?.organization_id}
              」的订阅吗？取消后该组织将按免费版限制使用。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>返回</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedSub && cancelMutation.mutate(selectedSub.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelMutation.isPending ? '处理中…' : '确认取消'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
