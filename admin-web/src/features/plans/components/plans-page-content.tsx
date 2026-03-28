'use client';

import { Plus } from 'lucide-react';
import { useManagedItem } from '@apartment-ultra/shared-ui';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { ListPageLayout } from '@apartment-ultra/shared-ui/components/ui';
import { PageToolbar } from '@apartment-ultra/shared-ui/components/ui';
import { Skeleton } from '@apartment-ultra/shared-ui/components/ui';
import { DataTable } from '@/components/common/data-table';
import type { AdminPlan } from '@/lib/api/admin-client';
import { createPlanColumns } from '../plans.columns';
import { usePlansData } from '../plans.hooks';
import { toPlanCreatePayload, toPlanPricingPayload, toPlanUpdatePayload } from '../plans.utils';
import { PlanCreateDialog, PlanDeleteDialog, PlanEditSheet } from './plans-dialogs';

type PlanDialogAction = 'create' | 'edit' | 'delete';

export function PlansPageContent() {
  const dialogState = useManagedItem<AdminPlan, PlanDialogAction>();

  const { plans, plansLoading, createMutation, updateMutation, updatePricingMutation, deleteMutation } = usePlansData({
    onCreateSuccess: dialogState.close,
    onUpdateSuccess: dialogState.close,
    onDeleteSuccess: dialogState.close,
  });

  const columns = createPlanColumns({
    onEdit: (plan) => dialogState.openFor('edit', plan),
    onDelete: (plan) => dialogState.openFor('delete', plan),
  });

  if (plansLoading) {
    return (
      <div className="mx-auto max-w-6xl">
        <Skeleton className="mb-4 h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <ListPageLayout
      title="服务配置"
      titleTestId="admin-plans-heading"
      maxWidth="6xl"
      actions={
        <PageToolbar>
          <Button onClick={() => dialogState.openAction('create')} data-testid="admin-plans-create-btn">
            <Plus className="mr-2 h-4 w-4" />
            新建服务
          </Button>
        </PageToolbar>
      }
    >
      <DataTable columns={columns} data={plans ?? []} testid="admin-plans-list" />

      <PlanCreateDialog
        {...dialogState.dialogProps('create')}
        onSubmit={(data) => createMutation.mutate(toPlanCreatePayload(data))}
        isPending={createMutation.isPending}
      />

      <PlanEditSheet
        {...dialogState.dialogProps('edit')}
        plan={dialogState.selectedItem}
        onSubmit={(data, activeTab) => {
          if (!dialogState.selectedItem) {
            return;
          }

          if (activeTab === 'pricing') {
            updatePricingMutation.mutate({
              planId: dialogState.selectedItem.id,
              pricing: toPlanPricingPayload(data),
            });
          }

          updateMutation.mutate({
            id: dialogState.selectedItem.id,
            data: toPlanUpdatePayload(data),
          });
        }}
        isPending={updateMutation.isPending || updatePricingMutation.isPending}
      />

      <PlanDeleteDialog
        {...dialogState.dialogProps('delete')}
        plan={dialogState.selectedItem}
        onConfirm={() => dialogState.selectedItem && deleteMutation.mutate(dialogState.selectedItem.id)}
        isPending={deleteMutation.isPending}
      />
    </ListPageLayout>
  );
}
