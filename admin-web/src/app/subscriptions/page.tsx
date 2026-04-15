'use client';

import { Suspense, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { appToast } from '@apartment-ultra/shared-ui/components/ui';
import Link from 'next/link';
import { useAsyncDialogSubmit, usePageQueryState } from '@apartment-ultra/shared-ui';
import { DataTable } from '@/components/common/data-table';
import { TableActions } from '@/components/common/table-actions';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { FilterField } from '@apartment-ultra/shared-ui/components/ui';
import { Input } from '@apartment-ultra/shared-ui/components/ui';
import { StatusBadge } from '@apartment-ultra/shared-ui/components/ui';
import { SUBSCRIPTION_STATUS_CONFIG, BOOLEAN_YES_NO_CONFIG } from '@/lib/status-config';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@apartment-ultra/shared-ui/components/ui';
import { ConfirmDialog } from '@apartment-ultra/shared-ui/components/ui';
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

function SubscriptionsContent() {
  const queryClient = useQueryClient();
  const [isRenewOpen, setIsRenewOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [selectedSub, setSelectedSub] = useState<AdminSubscription | null>(null);
  const orgIdFilterQuery = usePageQueryState<string>({
    queryKey: 'organization_id',
    defaultValue: '',
    parse: (value) => value ?? '',
    serialize: (value) => value.trim() || null,
  });
  const statusFilterQuery = usePageQueryState<string>({
    queryKey: 'status',
    defaultValue: '',
    parse: (value) => value ?? '',
    serialize: (value) => value || null,
  });
  const renewForm = useForm<RenewForm>({
    resolver: zodResolver(renewSchema),
    defaultValues: { extend_days: 30 },
  });
  const renewSubmit = useAsyncDialogSubmit({
    close: () => setIsRenewOpen(false),
    reset: () => renewForm.reset({ extend_days: 30 }),
    clear: () => setSelectedSub(null),
  });
  const cancelSubmit = useAsyncDialogSubmit({
    close: () => setIsCancelOpen(false),
    clear: () => setSelectedSub(null),
  });

  const { data: subscriptions, isLoading } = useQuery({
    queryKey: ['admin', 'subscriptions', orgIdFilterQuery.value || undefined, statusFilterQuery.value || undefined],
    queryFn: async () => {
      const res = await adminApiEndpoints.listSubscriptions({
        limit: 200,
        organization_id: orgIdFilterQuery.value || undefined,
        status_filter: statusFilterQuery.value || undefined,
      });
      return (res.data ?? []) as AdminSubscription[];
    },
  });

  const renewMutation = useMutation({
    mutationFn: ({ id, extend_days }: { id: string; extend_days: number }) =>
      adminApiEndpoints.renewSubscription(id, { extend_days }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'subscriptions'] });
      renewSubmit.handleSuccess();
      appToast.success(adminMessages.subscriptions.toast.renewed);
    },
    onError: (error) => appToast.error(getErrorMessage(error, adminMessages.subscriptions.errors.renew)),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => adminApiEndpoints.cancelSubscription(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'subscriptions'] });
      cancelSubmit.handleSuccess();
      appToast.success(adminMessages.subscriptions.toast.cancelled);
    },
    onError: (error) => appToast.error(getErrorMessage(error, adminMessages.subscriptions.errors.cancel)),
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
      size: 200,
      minSize: 150,
      cell: ({ row }) => (
        <Link href={`/organizations/${row.original.organization_id}`} className="text-primary hover:underline">
          {row.original.organization_id}
        </Link>
      ),
    },
    {
      id: 'plan_name',
      header: adminMessages.subscriptions.columns.service,
      size: 140,
      minSize: 100,
      cell: ({ row }) => row.original.plan?.name ?? '—',
    },
    { accessorKey: 'billing_cycle', header: adminMessages.subscriptions.columns.billingCycle, size: 120, minSize: 100 },
    {
      accessorKey: 'status',
      header: adminMessages.subscriptions.columns.status,
      size: 120,
      minSize: 100,
      cell: ({ row }) => {
        const s = row.original.status;
        const config = SUBSCRIPTION_STATUS_CONFIG[s] ?? {
          label: s,
          variant: 'secondary' as const,
        };
        return <StatusBadge variant={config.variant}>{config.label}</StatusBadge>;
      },
    },
    {
      accessorKey: 'start_date',
      header: adminMessages.subscriptions.columns.startDate,
      size: 120,
      minSize: 100,
      cell: ({ row }) => formatDate(row.original.start_date),
    },
    {
      accessorKey: 'end_date',
      header: adminMessages.subscriptions.columns.endDate,
      size: 120,
      minSize: 100,
      cell: ({ row }) => formatDate(row.original.end_date),
    },
    {
      accessorKey: 'auto_renew',
      header: adminMessages.subscriptions.columns.autoRenew,
      size: 100,
      minSize: 80,
      cell: ({ row }) => {
        const config = row.original.auto_renew ? BOOLEAN_YES_NO_CONFIG.yes : BOOLEAN_YES_NO_CONFIG.no;
        return <StatusBadge variant={config.variant}>{config.label}</StatusBadge>;
      },
    },
    {
      id: 'actions',
      header: adminMessages.subscriptions.columns.actions,
      size: 140,
      minSize: 120,
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
      <DataTable
        columns={columns}
        data={subscriptions ?? []}
        testid="admin-subscriptions-list"
        useCard={false}
        toolbar={
          <div className="flex flex-wrap gap-4">
            <FilterField label="团队 ID">
              <Input
                placeholder={adminMessages.subscriptions.teamIdPlaceholder}
                value={orgIdFilterQuery.value}
                onChange={(e) => orgIdFilterQuery.setValue(e.target.value)}
                className="w-full"
              />
            </FilterField>
            <FilterField label="状态">
              <Select
                value={statusFilterQuery.value || 'all'}
                onValueChange={(v) => statusFilterQuery.setValue(v === 'all' ? '' : v)}
              >
                <SelectTrigger className="w-full">
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
            </FilterField>
          </div>
        }
      />

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
                  {renewMutation.isPending
                    ? adminMessages.common.submitting
                    : adminMessages.subscriptions.renewDialog.submit}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={isCancelOpen}
        onOpenChange={setIsCancelOpen}
        title={adminMessages.subscriptions.cancelDialog.title}
        description={adminI18n.t('subscriptions.cancelDialog.description', {
          organizationId: selectedSub?.organization_id ?? '',
        })}
        cancelLabel={adminMessages.subscriptions.cancelDialog.back}
        confirmLabel={
          cancelMutation.isPending ? adminMessages.common.processing : adminMessages.subscriptions.cancelDialog.submit
        }
        onConfirm={() => selectedSub && cancelMutation.mutate(selectedSub.id)}
        isPending={cancelMutation.isPending}
        intent="destructive"
      />
    </div>
  );
}

function SubscriptionsPageSkeleton() {
  return (
    <div className="mx-auto max-w-6xl">
      <Skeleton className="mb-4 h-8 w-48" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

export default function AdminSubscriptionsPage() {
  return (
    <Suspense fallback={<SubscriptionsPageSkeleton />}>
      <SubscriptionsContent />
    </Suspense>
  );
}
