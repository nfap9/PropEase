'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { DataTable } from '@/components/common/data-table';
import { Skeleton } from '@apartment-ultra/shared-ui/components/ui';
import { giftSubscriptionSchema, type FilterActive, type GiftSubscriptionForm } from '../registered-users.schemas';
import { createRegisteredUsersColumns } from '../registered-users.columns';
import { useRegisteredUsersData } from '../registered-users.hooks';
import {
  getDefaultGiftFormValues,
  getSelectedGiftPlan,
} from '../registered-users.utils';
import {
  DeleteRegisteredUserDialog,
  DisableRegisteredUserDialog,
  GiftSubscriptionDialog,
  RegisteredUserDetailSheet,
} from './registered-user-dialogs';
import { RegisteredUsersToolbar } from './registered-users-toolbar';

export function RegisteredUsersPageContent() {
  const [activeFilter, setActiveFilter] = useState<FilterActive>('all');
  const [search, setSearch] = useState('');
  const [searchSubmitted, setSearchSubmitted] = useState('');
  const [detailUserId, setDetailUserId] = useState<string | null>(null);
  const [disableConfirmUserId, setDisableConfirmUserId] = useState<string | null>(null);
  const [deleteConfirmUserId, setDeleteConfirmUserId] = useState<string | null>(null);
  const [isGiftOpen, setIsGiftOpen] = useState(false);

  const giftForm = useForm<GiftSubscriptionForm>({
    resolver: zodResolver(giftSubscriptionSchema),
    defaultValues: getDefaultGiftFormValues(),
  });

  const {
    users,
    usersLoading,
    detail,
    detailLoading,
    plans,
    plansLoading,
    setActiveMutation,
    deleteUserMutation,
    giftSubscriptionMutation,
  } = useRegisteredUsersData({
    activeFilter,
    searchSubmitted,
    detailUserId,
    isGiftOpen,
    onUserDisabled: () => setDisableConfirmUserId(null),
    onUserDeleted: (deletedUserId) => {
      if (detailUserId === deletedUserId) {
        setDetailUserId(null);
      }
      setDeleteConfirmUserId(null);
    },
    onGiftSuccess: () => {
      setIsGiftOpen(false);
      giftForm.reset(getDefaultGiftFormValues(detail));
    },
  });

  const selectedGiftPlan = useMemo(
    () => getSelectedGiftPlan(plans, giftForm.watch('service_id')),
    [plans, giftForm]
  );
  const selectedPricing = selectedGiftPlan?.pricing?.find((pricing) => pricing.id === giftForm.watch('pricing_id')) ?? null;

  const columns = useMemo(
    () =>
      createRegisteredUsersColumns({
        onView: setDetailUserId,
        onEnable: (userId) => setActiveMutation.mutate({ id: userId, is_active: true }),
        onDisable: setDisableConfirmUserId,
        onDelete: setDeleteConfirmUserId,
      }),
    [setActiveMutation]
  );

  const handleSearchSubmit = (event: FormEvent) => {
    event.preventDefault();
    setSearchSubmitted(search);
  };

  const openGiftDialog = () => {
    if (!detail) {
      return;
    }

    giftForm.reset(getDefaultGiftFormValues(detail));
    setIsGiftOpen(true);
  };

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
      <RegisteredUsersToolbar
        activeFilter={activeFilter}
        search={search}
        onSearchChange={setSearch}
        onSearchSubmit={handleSearchSubmit}
        onActiveFilterChange={setActiveFilter}
      />

      <DataTable columns={columns} data={users ?? []} testid="admin-registered-users-list" />

      <DisableRegisteredUserDialog
        open={Boolean(disableConfirmUserId)}
        onOpenChange={(open) => !open && setDisableConfirmUserId(null)}
        onConfirm={() => {
          if (disableConfirmUserId) {
            setActiveMutation.mutate({
              id: disableConfirmUserId,
              is_active: false,
            });
          }
        }}
        isPending={setActiveMutation.isPending}
      />

      <DeleteRegisteredUserDialog
        open={Boolean(deleteConfirmUserId)}
        onOpenChange={(open) => !open && setDeleteConfirmUserId(null)}
        onConfirm={() => {
          if (deleteConfirmUserId) {
            deleteUserMutation.mutate(deleteConfirmUserId);
          }
        }}
        isPending={deleteUserMutation.isPending}
      />

      <RegisteredUserDetailSheet
        open={Boolean(detailUserId)}
        onOpenChange={(open) => !open && setDetailUserId(null)}
        detailUserId={detailUserId}
        detail={detail}
        detailLoading={detailLoading}
        onOpenGift={openGiftDialog}
        onDisable={() => detail && setDisableConfirmUserId(detail.id)}
        onEnable={() => detail && setActiveMutation.mutate({ id: detail.id, is_active: true })}
        onDelete={() => detail && setDeleteConfirmUserId(detail.id)}
        isSetActivePending={setActiveMutation.isPending}
        isDeletePending={deleteUserMutation.isPending}
      />

      <GiftSubscriptionDialog
        open={isGiftOpen}
        onOpenChange={setIsGiftOpen}
        detail={detail}
        plans={plans}
        plansLoading={plansLoading}
        selectedGiftPlan={selectedGiftPlan}
        selectedPricing={selectedPricing}
        form={giftForm}
        onSubmit={(values) => giftSubscriptionMutation.mutate(values)}
        isPending={giftSubscriptionMutation.isPending}
      />
    </div>
  );
}
