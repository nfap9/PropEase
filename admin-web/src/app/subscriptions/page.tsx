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
import { adminI18n, adminMessages } from '@/lib/i18n';

const renewSchema = z.object({
  extend_days: z.coerce.number().min(1, adminMessages.subscriptions.renewDialog.validation),
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
      toast.success(adminMessages.subscriptions.toast.renewed);
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, adminMessages.subscriptions.errors.renew)),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => adminApiEndpoints.cancelSubscription(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'subscriptions'] });
      setIsCancelOpen(false);
      setSelectedSub(null);
      toast.success(adminMessages.subscriptions.toast.cancelled);
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, adminMessages.subscriptions.errors.cancel)),
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
      header: adminMessages.subscriptions.columns.teamId,
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
      header: adminMessages.subscriptions.columns.service,
      cell: ({ row }) => row.original.plan?.name ?? '—',
    },
    { accessorKey: 'billing_cycle', header: adminMessages.subscriptions.columns.billingCycle },
    {
      accessorKey: 'status',
      header: adminMessages.subscriptions.columns.status,
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
      header: adminMessages.subscriptions.columns.startDate,
      cell: ({ row }) => formatDate(row.original.start_date),
    },
    {
      accessorKey: 'end_date',
      header: adminMessages.subscriptions.columns.endDate,
      cell: ({ row }) => formatDate(row.original.end_date),
    },
    {
      accessorKey: 'auto_renew',
      header: adminMessages.subscriptions.columns.autoRenew,
      cell: ({ row }) => {
        const config = row.original.auto_renew
          ? BOOLEAN_YES_NO_CONFIG.yes
          : BOOLEAN_YES_NO_CONFIG.no;
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    {
      id: 'actions',
      header: adminMessages.subscriptions.columns.actions,
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
                      label: adminMessages.subscriptions.actions.renew,
                      onClick: () => handleRenew(sub),
                    },
                    {
                      icon: Ban,
                      label: adminMessages.subscriptions.actions.cancel,
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
        <h2 className="text-xl font-semibold" data-testid="admin-subscriptions-heading">{adminMessages.subscriptions.heading}</h2>
        <div className="flex items-center gap-2">
          <Input
            placeholder={adminMessages.subscriptions.teamIdPlaceholder}
            value={orgIdFilter}
            onChange={(e) => setOrgIdFilter(e.target.value)}
            className="w-48"
          />
          <Select
            value={statusFilter || 'all'}
            onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v)}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder={adminMessages.subscriptions.filters.statusPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{adminMessages.subscriptions.filters.all}</SelectItem>
              <SelectItem value="active">{adminMessages.subscriptions.filters.active}</SelectItem>
              <SelectItem value="expired">{adminMessages.subscriptions.filters.expired}</SelectItem>
              <SelectItem value="cancelled">{adminMessages.subscriptions.filters.cancelled}</SelectItem>
              <SelectItem value="trial">{adminMessages.subscriptions.filters.trial}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable columns={columns} data={subscriptions ?? []} testid="admin-subscriptions-list" />

      {/* 续期 */}
      <Dialog open={isRenewOpen} onOpenChange={setIsRenewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{adminMessages.subscriptions.renewDialog.title}</DialogTitle>
            <DialogDescription>
              {selectedSub
                ? adminI18n.t('subscriptions.renewDialog.description', {
                    organizationId: selectedSub.organization_id,
                  })
                : ''}
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
                    <FormLabel>{adminMessages.subscriptions.renewDialog.extendDays}</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsRenewOpen(false)}>
                  {adminMessages.common.cancel}
                </Button>
                <Button type="submit" disabled={renewMutation.isPending}>
                  {renewMutation.isPending ? adminMessages.common.submitting : adminMessages.subscriptions.renewDialog.submit}
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
            <AlertDialogTitle>{adminMessages.subscriptions.cancelDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {adminI18n.t('subscriptions.cancelDialog.description', {
                organizationId: selectedSub?.organization_id ?? '',
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{adminMessages.subscriptions.cancelDialog.back}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedSub && cancelMutation.mutate(selectedSub.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelMutation.isPending ? adminMessages.common.processing : adminMessages.subscriptions.cancelDialog.submit}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
