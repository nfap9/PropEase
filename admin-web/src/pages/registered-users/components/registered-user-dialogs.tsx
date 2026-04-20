
import type { UseFormReturn } from 'react-hook-form';
import { FormProvider, Controller } from 'react-hook-form';
import { Gift } from 'lucide-react';
import { Button, Modal, Input, Select, Skeleton, Tag, Drawer } from 'antd';
import type { AdminPlan, AdminRegisteredUserDetail } from '@/api/admin-client';
import { formatDateTime } from '@/utils/date';
import { ORG_STATUS_CONFIG } from '@/utils/status';
import type { GiftSubscriptionForm } from '@/schemas/registered-users';
import { adminI18n, adminMessages } from '@/i18n';

type SelectedPricing = NonNullable<AdminPlan['pricing']>[number];

export function DisableRegisteredUserDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  return (
    <Modal
      open={open}
      onCancel={() => onOpenChange(false)}
      title={adminMessages.registeredUsers.dialogs.disableTitle}
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={() => onOpenChange(false)}>
            {adminMessages.common.cancel}
          </Button>
          <Button
            danger
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? adminMessages.common.processing : adminMessages.registeredUsers.dialogs.disableConfirm}
          </Button>
        </div>
      }
    >
      <div>{adminMessages.registeredUsers.dialogs.disableDescription}</div>
    </Modal>
  );
}

export function DeleteRegisteredUserDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  return (
    <Modal
      open={open}
      onCancel={() => onOpenChange(false)}
      title={adminMessages.registeredUsers.dialogs.deleteTitle}
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={() => onOpenChange(false)}>
            {adminMessages.common.cancel}
          </Button>
          <Button
            danger
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? adminMessages.common.processing : adminMessages.registeredUsers.dialogs.deleteConfirm}
          </Button>
        </div>
      }
    >
      <div>{adminMessages.registeredUsers.dialogs.deleteDescription}</div>
    </Modal>
  );
}

export function RegisteredUserDetailSheet({
  open,
  onOpenChange,
  detailUserId,
  detail,
  detailLoading,
  onOpenGift,
  onDisable,
  onEnable,
  onDelete,
  isSetActivePending,
  isDeletePending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  detailUserId: string | null;
  detail: AdminRegisteredUserDetail | null | undefined;
  detailLoading: boolean;
  onOpenGift: () => void;
  onDisable: () => void;
  onEnable: () => void;
  onDelete: () => void;
  isSetActivePending: boolean;
  isDeletePending: boolean;
}) {
  return (
    <Drawer open={open} onClose={() => onOpenChange(false)} title={adminMessages.registeredUsers.dialogs.detailTitle}>
      <div className="space-y-4">
        {detailUserId ? (
          <div>
            {detailLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : detail ? (
              <div className="space-y-4">
                <div>
                  <span className="text-gray-500">{adminMessages.registeredUsers.dialogs.phone}</span>
                  <p className="font-medium">{detail.phone}</p>
                </div>
                <div>
                  <span className="text-gray-500">{adminMessages.registeredUsers.dialogs.name}</span>
                  <p className="font-medium">{detail.full_name}</p>
                </div>
                <div>
                  <span className="text-gray-500">{adminMessages.registeredUsers.dialogs.status}</span>
                  <p>
                    <Tag color={detail.is_active ? 'success' : 'default'}>
                      {detail.is_active ? ORG_STATUS_CONFIG.active.label : ORG_STATUS_CONFIG.inactive.label}
                    </Tag>
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">{adminMessages.registeredUsers.dialogs.createdAt}</span>
                  <p className="font-medium">{formatDateTime(detail.created_at)}</p>
                </div>
                <div>
                  <span className="text-gray-500">{adminMessages.registeredUsers.dialogs.organizations}</span>
                  {detail.organizations.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      {adminMessages.registeredUsers.dialogs.emptyOrganizations}
                    </p>
                  ) : (
                    <ul className="mt-1 space-y-1">
                      {detail.organizations.map((organization) => (
                        <li
                          key={organization.id}
                          className="flex items-center justify-between rounded border px-2 py-1 text-sm"
                        >
                          <span>{organization.name}</span>
                          <Tag>{organization.role}</Tag>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button size="small" onClick={onOpenGift} disabled={detail.organizations.length === 0}>
                    <Gift className="mr-2 h-4 w-4" />
                    {adminMessages.registeredUsers.dialogs.giftService}
                  </Button>
                  {detail.is_active ? (
                    <Button danger size="small" onClick={onDisable} disabled={isSetActivePending}>
                      {adminMessages.registeredUsers.dialogs.disableAccount}
                    </Button>
                  ) : (
                    <Button size="small" onClick={onEnable} disabled={isSetActivePending}>
                      {adminMessages.registeredUsers.dialogs.enableAccount}
                    </Button>
                  )}
                  <Button
                    size="small"
                    className="text-red-500 hover:bg-red-50 hover:text-red-600"
                    onClick={onDelete}
                    disabled={isDeletePending}
                  >
                    {adminMessages.registeredUsers.dialogs.deleteAccount}
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">{adminMessages.registeredUsers.dialogs.loadFailed}</p>
            )}
          </div>
        ) : null}
      </div>
    </Drawer>
  );
}

export function GiftSubscriptionDialog({
  open,
  onOpenChange,
  detail,
  plans,
  plansLoading,
  selectedGiftPlan,
  selectedPricing,
  form,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  detail: AdminRegisteredUserDetail | null | undefined;
  plans: AdminPlan[];
  plansLoading: boolean;
  selectedGiftPlan: AdminPlan | null;
  selectedPricing: SelectedPricing | null;
  form: UseFormReturn<GiftSubscriptionForm>;
  onSubmit: (data: GiftSubscriptionForm) => void;
  isPending: boolean;
}) {
  return (
    <Modal
      open={open}
      onCancel={() => onOpenChange(false)}
      title={adminMessages.registeredUsers.dialogs.giftTitle}
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={() => onOpenChange(false)}>
            {adminMessages.common.cancel}
          </Button>
          <Button disabled={isPending || detail?.organizations.length === 0}>
            {isPending
              ? adminMessages.registeredUsers.dialogs.gifting
              : adminMessages.registeredUsers.dialogs.confirmGift}
          </Button>
        </div>
      }
    >
      {detail ? (
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Controller
              control={form.control}
              name="organization_id"
              render={({ field, fieldState }) => (
                <div className="space-y-1">
                  <label className="text-sm font-medium">{adminMessages.registeredUsers.dialogs.targetOrganization}</label>
                  <Select value={field.value} onChange={(value) => field.onChange(value)}>
                    <Select.Option value="">
                      {adminMessages.registeredUsers.dialogs.targetOrganizationPlaceholder}
                    </Select.Option>
                    {detail.organizations.map((organization) => (
                      <Select.Option key={organization.id} value={organization.id}>
                        {organization.name} ({organization.role})
                      </Select.Option>
                    ))}
                  </Select>
                  {fieldState.error && (
                    <p className="text-sm text-red-500">{fieldState.error.message}</p>
                  )}
                </div>
              )}
            />

            <Controller
              control={form.control}
              name="service_id"
              render={({ field, fieldState }) => (
                <div className="space-y-1">
                  <label className="text-sm font-medium">{adminMessages.registeredUsers.dialogs.targetService}</label>
                  <Select
                    value={field.value}
                    onChange={(value) => {
                      field.onChange(value);
                      const nextPlan = plans.find((plan) => plan.id === value) ?? null;
                      const nextPricingId = nextPlan?.pricing?.[0]?.id ?? '';
                      form.setValue('pricing_id', nextPricingId, { shouldValidate: true });
                    }}
                  >
                    <Select.Option value="">
                      {plansLoading
                        ? adminMessages.registeredUsers.dialogs.loadingPlans
                        : adminMessages.registeredUsers.dialogs.targetServicePlaceholder}
                    </Select.Option>
                    {plans.map((plan) => (
                      <Select.Option key={plan.id} value={plan.id}>
                        {plan.name}
                      </Select.Option>
                    ))}
                  </Select>
                  {fieldState.error && (
                    <p className="text-sm text-red-500">{fieldState.error.message}</p>
                  )}
                </div>
              )}
            />

            <Controller
              control={form.control}
              name="pricing_id"
              render={({ field, fieldState }) => (
                <div className="space-y-1">
                  <label className="text-sm font-medium">{adminMessages.registeredUsers.dialogs.targetPricing}</label>
                  <Select value={field.value} onChange={field.onChange}>
                    <Select.Option value="">
                      {adminMessages.registeredUsers.dialogs.targetPricingPlaceholder}
                    </Select.Option>
                    {(selectedGiftPlan?.pricing ?? []).map((pricing) => (
                      <Select.Option key={pricing.id} value={pricing.id}>
                        {pricing.months} 个月 · ¥{pricing.price.toLocaleString()}
                      </Select.Option>
                    ))}
                  </Select>
                  {fieldState.error && (
                    <p className="text-sm text-red-500">{fieldState.error.message}</p>
                  )}
                </div>
              )}
            />

            <Controller
              control={form.control}
              name="gift_months"
              render={({ field, fieldState }) => (
                <div className="space-y-1">
                  <label className="text-sm font-medium">{adminMessages.registeredUsers.dialogs.extraMonths}</label>
                  <Input
                    type="number"
                    min={0}
                    max={24}
                    value={field.value}
                    onChange={(event) => field.onChange(event.target.value)}
                  />
                  {fieldState.error && (
                    <p className="text-sm text-red-500">{fieldState.error.message}</p>
                  )}
                </div>
              )}
            />

            {selectedPricing && (
              <div className="rounded-lg border bg-gray-50 px-3 py-3 text-sm text-gray-600">
                {adminI18n.t('registeredUsers.dialogs.summary', {
                  price: selectedPricing.price.toLocaleString(),
                  months: selectedPricing.months,
                  giftMonths: form.watch('gift_months'),
                })}
              </div>
            )}
          </form>
        </FormProvider>
      ) : (
        <p className="text-sm text-gray-500">{adminMessages.registeredUsers.dialogs.noUserSelected}</p>
      )}
    </Modal>
  );
}
