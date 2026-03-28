'use client';

import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { Skeleton } from '@apartment-ultra/shared-ui/components/ui';
import { DataTable } from '@/components/common/data-table';
import type { AdminPlan } from '@/lib/api/admin-client';
import { createPlanColumns } from '../plans.columns';
import { usePlansData } from '../plans.hooks';
import { toPlanCreatePayload, toPlanPricingPayload, toPlanUpdatePayload } from '../plans.utils';
import { PlanCreateDialog, PlanDeleteDialog, PlanEditSheet } from './plans-dialogs';

export function PlansPageContent() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<AdminPlan | null>(null);

  const {
    plans,
    plansLoading,
    createMutation,
    updateMutation,
    updatePricingMutation,
    deleteMutation,
  } = usePlansData({
    onCreateSuccess: () => setIsCreateOpen(false),
    onUpdateSuccess: () => {
      setIsEditOpen(false);
      setSelectedPlan(null);
    },
    onDeleteSuccess: () => {
      setIsDeleteOpen(false);
      setSelectedPlan(null);
    },
  });

  const columns = useMemo(
    () =>
      createPlanColumns({
        onEdit: (plan) => {
          setSelectedPlan(plan);
          setIsEditOpen(true);
        },
        onDelete: (plan) => {
          setSelectedPlan(plan);
          setIsDeleteOpen(true);
        },
      }),
    []
  );

  if (plansLoading) {
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
        <h2 className="text-xl font-semibold" data-testid="admin-plans-heading">
          服务配置
        </h2>
        <Button onClick={() => setIsCreateOpen(true)} data-testid="admin-plans-create-btn">
          <Plus className="mr-2 h-4 w-4" />
          新建服务
        </Button>
      </div>

      <DataTable columns={columns} data={plans ?? []} testid="admin-plans-list" />

      <PlanCreateDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSubmit={(data) => createMutation.mutate(toPlanCreatePayload(data))}
        isPending={createMutation.isPending}
      />

      <PlanEditSheet
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        plan={selectedPlan}
        onSubmit={(data, activeTab) => {
          if (!selectedPlan) {
            return;
          }

          if (activeTab === 'pricing') {
            updatePricingMutation.mutate({
              planId: selectedPlan.id,
              pricing: toPlanPricingPayload(data),
            });
          }

          updateMutation.mutate({
            id: selectedPlan.id,
            data: toPlanUpdatePayload(data),
          });
        }}
        isPending={updateMutation.isPending || updatePricingMutation.isPending}
      />

      <PlanDeleteDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        plan={selectedPlan}
        onConfirm={() => selectedPlan && deleteMutation.mutate(selectedPlan.id)}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
