
import type { UseFormReturn } from 'react-hook-form';
import { FormProvider, Controller } from 'react-hook-form';
import { Gift } from 'lucide-react';
import { Badge } from '@apartment-ultra/shared-ui/components/ui';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
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
  AppDrawer,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@apartment-ultra/shared-ui/components/ui';
import { Input } from '@apartment-ultra/shared-ui/components/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@apartment-ultra/shared-ui/components/ui';
import { Skeleton } from '@apartment-ultra/shared-ui/components/ui';
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
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{adminMessages.registeredUsers.dialogs.disableTitle}</AlertDialogTitle>
          <AlertDialogDescription>{adminMessages.registeredUsers.dialogs.disableDescription}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{adminMessages.common.cancel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? adminMessages.common.processing : adminMessages.registeredUsers.dialogs.disableConfirm}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
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
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{adminMessages.registeredUsers.dialogs.deleteTitle}</AlertDialogTitle>
          <AlertDialogDescription>{adminMessages.registeredUsers.dialogs.deleteDescription}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{adminMessages.common.cancel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? adminMessages.common.processing : adminMessages.registeredUsers.dialogs.deleteConfirm}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
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
    <AppDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={adminMessages.registeredUsers.dialogs.detailTitle}
      size="sm"
    >
      {detailUserId ? (
        <div>
          {detailLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : detail ? (
            <div className="space-y-4">
              <div>
                <span className="text-muted-foreground">{adminMessages.registeredUsers.dialogs.phone}</span>
                <p className="font-medium">{detail.phone}</p>
              </div>
              <div>
                <span className="text-muted-foreground">{adminMessages.registeredUsers.dialogs.name}</span>
                <p className="font-medium">{detail.full_name}</p>
              </div>
              <div>
                <span className="text-muted-foreground">{adminMessages.registeredUsers.dialogs.status}</span>
                <p>
                  <Badge
                    variant={detail.is_active ? ORG_STATUS_CONFIG.active.variant : ORG_STATUS_CONFIG.inactive.variant}
                  >
                    {detail.is_active ? ORG_STATUS_CONFIG.active.label : ORG_STATUS_CONFIG.inactive.label}
                  </Badge>
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">{adminMessages.registeredUsers.dialogs.createdAt}</span>
                <p className="font-medium">{formatDateTime(detail.created_at)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">{adminMessages.registeredUsers.dialogs.organizations}</span>
                {detail.organizations.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
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
                        <Badge variant="outline">{organization.role}</Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                <Button variant="secondary" size="sm" onClick={onOpenGift} disabled={detail.organizations.length === 0}>
                  <Gift className="mr-2 h-4 w-4" />
                  {adminMessages.registeredUsers.dialogs.giftService}
                </Button>
                {detail.is_active ? (
                  <Button variant="destructive" size="sm" onClick={onDisable} disabled={isSetActivePending}>
                    {adminMessages.registeredUsers.dialogs.disableAccount}
                  </Button>
                ) : (
                  <Button variant="default" size="sm" onClick={onEnable} disabled={isSetActivePending}>
                    {adminMessages.registeredUsers.dialogs.enableAccount}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  onClick={onDelete}
                  disabled={isDeletePending}
                >
                  {adminMessages.registeredUsers.dialogs.deleteAccount}
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{adminMessages.registeredUsers.dialogs.loadFailed}</p>
          )}
        </div>
      ) : null}
    </AppDrawer>
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{adminMessages.registeredUsers.dialogs.giftTitle}</DialogTitle>
          <DialogDescription>{adminMessages.registeredUsers.dialogs.giftDescription}</DialogDescription>
        </DialogHeader>
        {detail ? (
          <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <Controller
                control={form.control}
                name="organization_id"
                render={({ field, fieldState }) => (
                  <div className="space-y-1">
                    <label className="text-sm font-medium">{adminMessages.registeredUsers.dialogs.targetOrganization}</label>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={adminMessages.registeredUsers.dialogs.targetOrganizationPlaceholder}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {detail.organizations.map((organization) => (
                          <SelectItem key={organization.id} value={organization.id}>
                            {organization.name} ({organization.role})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.error && (
                      <p className="text-sm text-destructive">{fieldState.error.message}</p>
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
                      onValueChange={(value) => {
                        field.onChange(value);
                        const nextPlan = plans.find((plan) => plan.id === value) ?? null;
                        const nextPricingId = nextPlan?.pricing?.[0]?.id ?? '';
                        form.setValue('pricing_id', nextPricingId, { shouldValidate: true });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            plansLoading
                              ? adminMessages.registeredUsers.dialogs.loadingPlans
                              : adminMessages.registeredUsers.dialogs.targetServicePlaceholder
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {plans.map((plan) => (
                          <SelectItem key={plan.id} value={plan.id}>
                            {plan.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.error && (
                      <p className="text-sm text-destructive">{fieldState.error.message}</p>
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
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder={adminMessages.registeredUsers.dialogs.targetPricingPlaceholder} />
                      </SelectTrigger>
                      <SelectContent>
                        {(selectedGiftPlan?.pricing ?? []).map((pricing) => (
                          <SelectItem key={pricing.id} value={pricing.id}>
                            {pricing.months} 个月 · ¥{pricing.price.toLocaleString()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.error && (
                      <p className="text-sm text-destructive">{fieldState.error.message}</p>
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
                      <p className="text-sm text-destructive">{fieldState.error.message}</p>
                    )}
                  </div>
                )}
              />

              {selectedPricing && (
                <div className="rounded-lg border bg-muted/40 px-3 py-3 text-sm text-muted-foreground">
                  {adminI18n.t('registeredUsers.dialogs.summary', {
                    price: selectedPricing.price.toLocaleString(),
                    months: selectedPricing.months,
                    giftMonths: form.watch('gift_months'),
                  })}
                </div>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  {adminMessages.common.cancel}
                </Button>
                <Button type="submit" disabled={isPending || detail.organizations.length === 0}>
                  {isPending
                    ? adminMessages.registeredUsers.dialogs.gifting
                    : adminMessages.registeredUsers.dialogs.confirmGift}
                </Button>
              </DialogFooter>
            </form>
          </FormProvider>
        ) : (
          <p className="text-sm text-muted-foreground">{adminMessages.registeredUsers.dialogs.noUserSelected}</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
