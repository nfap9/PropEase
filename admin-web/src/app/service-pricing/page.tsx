'use client';

import { useMemo, useState } from 'react';
import { Skeleton } from '@/components/ui';
import type { ServiceProduct } from '@/lib/api/admin-client';
import { createServicePricingColumns } from '@/features/service-pricing/service-pricing.columns';
import { useServicePricingData } from '@/features/service-pricing/service-pricing.hooks';
import {
  ServicePricingCreateDialog,
  ServicePricingDeleteDialog,
  ServicePricingEditSheet,
} from '@/features/service-pricing/components/service-pricing-dialogs';
import { ServicePricingView } from '@/features/service-pricing/components/service-pricing-view';
import {
  toServicePricingPayload,
  toServiceProductCreatePayload,
  toServiceProductUpdatePayload,
} from '@/features/service-pricing/service-pricing.utils';

export default function ServicePricingPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceProduct | null>(null);

  const {
    services,
    servicesLoading,
    createMutation,
    updateMutation,
    updatePricingMutation,
    deleteMutation,
  } = useServicePricingData({
    onCreateSuccess: () => setIsCreateOpen(false),
    onUpdateSuccess: () => {
      setIsEditOpen(false);
      setSelectedService(null);
    },
    onDeleteSuccess: () => {
      setIsDeleteOpen(false);
      setSelectedService(null);
    },
  });

  const columns = useMemo(
    () =>
      createServicePricingColumns({
        onEdit: (service) => {
          setSelectedService(service);
          setIsEditOpen(true);
        },
        onDelete: (service) => {
          setSelectedService(service);
          setIsDeleteOpen(true);
        },
      }),
    []
  );

  if (servicesLoading) {
    return (
      <div className="mx-auto max-w-6xl">
        <Skeleton className="mb-4 h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <>
      <ServicePricingView
        services={services ?? []}
        columns={columns}
        onCreate={() => setIsCreateOpen(true)}
      />

      <ServicePricingCreateDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSubmit={(data) => createMutation.mutate(toServiceProductCreatePayload(data))}
        isPending={createMutation.isPending}
      />

      <ServicePricingEditSheet
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        service={selectedService}
        onSubmit={(data, editTab) => {
          if (!selectedService) {
            return;
          }

          if (editTab === 'pricing') {
            updatePricingMutation.mutate({
              id: selectedService.id,
              pricing: toServicePricingPayload(data),
            });
          }

          updateMutation.mutate({
            id: selectedService.id,
            data: toServiceProductUpdatePayload(data),
          });
        }}
        isPending={updateMutation.isPending || updatePricingMutation.isPending}
      />

      <ServicePricingDeleteDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        service={selectedService}
        onConfirm={() => selectedService && deleteMutation.mutate(selectedService.id)}
        isPending={deleteMutation.isPending}
      />
    </>
  );
}
