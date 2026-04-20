
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Table, Input } from 'antd';
import type { TableProps } from 'antd';
import { Skeleton } from 'antd';
import { giftSubscriptionSchema, type FilterActive, type GiftSubscriptionForm } from '@/schemas/registered-users';
import { createRegisteredUsersColumns } from '@/pages/registered-users/components/columns';
import { useRegisteredUsersData } from '@/hooks/registered-users';
import { getDefaultGiftFormValues, getSelectedGiftPlan } from '@/utils/registered-users';
import {
  DeleteRegisteredUserDialog,
  DisableRegisteredUserDialog,
  GiftSubscriptionDialog,
  RegisteredUserDetailSheet,
} from '@/pages/registered-users/components/registered-user-dialogs';
import { RegisteredUsersToolbar } from '@/pages/registered-users/components/registered-users-toolbar';
import { useListFilters, useConfirmAction } from '@/hooks';

interface RegisteredUsersFiltersState {
  activeFilter: FilterActive;
  search: string;
  searchSubmitted: string;
}

export default function AdminRegisteredUsersPage() {
  const [detailUserId, setDetailUserId] = useState<string | null>(null);
  const [isGiftOpen, setIsGiftOpen] = useState(false);
  const { filters, setFilter, patchFilters } = useListFilters<RegisteredUsersFiltersState>({
    activeFilter: 'all',
    search: '',
    searchSubmitted: '',
  });
  const disableConfirm = useConfirmAction<string>();
  const deleteConfirm = useConfirmAction<string>();

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
    activeFilter: filters.activeFilter,
    searchSubmitted: filters.searchSubmitted,
    detailUserId,
    isGiftOpen,
    onUserDisabled: disableConfirm.close,
    onUserDeleted: (deletedUserId) => {
      if (detailUserId === deletedUserId) {
        setDetailUserId(null);
      }
      deleteConfirm.close();
    },
    onGiftSuccess: () => {
      setIsGiftOpen(false);
      giftForm.reset(getDefaultGiftFormValues(detail));
    },
  });

  const selectedGiftPlan = useMemo(() => getSelectedGiftPlan(plans, giftForm.watch('service_id')), [plans, giftForm]);
  const selectedPricing =
    selectedGiftPlan?.pricing?.find((pricing) => pricing.id === giftForm.watch('pricing_id')) ?? null;

  const columns = useMemo(
    () =>
      createRegisteredUsersColumns({
        onView: setDetailUserId,
        onEnable: (userId) => setActiveMutation.mutate({ id: userId, is_active: true }),
        onDisable: disableConfirm.openFor,
        onDelete: deleteConfirm.openFor,
      }),
    [deleteConfirm.openFor, disableConfirm.openFor, setActiveMutation]
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilter('search', e.target.value);
  };

  const handleSearchSubmit = () => {
    patchFilters({ searchSubmitted: filters.search });
  };

  const openGiftDialog = () => {
    if (!detail) {
      return;
    }

    giftForm.reset(getDefaultGiftFormValues(detail));
    setIsGiftOpen(true);
  };

  const filteredUsers = useMemo(() => {
    if (!filters.searchSubmitted) return users ?? [];
    const lowerFilter = filters.searchSubmitted.toLowerCase();
    return (users ?? []).filter(
      (user) =>
        user.full_name?.toLowerCase().includes(lowerFilter) ||
        user.phone?.includes(lowerFilter)
    );
  }, [users, filters.searchSubmitted]);

  const tableProps: TableProps = {
    dataSource: filteredUsers,
    columns,
    rowKey: (record: any) => record.id,
    pagination: { pageSize: 20, showSizeChanger: true, showTotal: (total: number) => `共 ${total} 条` },
    scroll: { x: 'max-content' },
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
      <div className="mb-4 flex items-center gap-4">
        <Input.Search
          placeholder="搜索用户名、手机号..."
          value={filters.search}
          onChange={handleSearchChange}
          onSearch={handleSearchSubmit}
          style={{ width: 300 }}
        />
        <RegisteredUsersToolbar
          activeFilter={filters.activeFilter}
          onActiveFilterChange={(value) => setFilter('activeFilter', value)}
        />
      </div>

      <Table {...tableProps} data-testid="admin-registered-users-list" />

      <DisableRegisteredUserDialog
        {...disableConfirm.dialogProps}
        onConfirm={() => {
          if (disableConfirm.selectedItem) {
            setActiveMutation.mutate({
              id: disableConfirm.selectedItem,
              is_active: false,
            });
          }
        }}
        isPending={setActiveMutation.isPending}
      />

      <DeleteRegisteredUserDialog
        {...deleteConfirm.dialogProps}
        onConfirm={() => {
          if (deleteConfirm.selectedItem) {
            deleteUserMutation.mutate(deleteConfirm.selectedItem);
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
        onDisable={() => detail && disableConfirm.openFor(detail.id)}
        onEnable={() => detail && setActiveMutation.mutate({ id: detail.id, is_active: true })}
        onDelete={() => detail && deleteConfirm.openFor(detail.id)}
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
