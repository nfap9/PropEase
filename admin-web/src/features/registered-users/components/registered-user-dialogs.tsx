'use client';

import type { UseFormReturn } from 'react-hook-form';
import { Gift } from 'lucide-react';
import { Badge } from '@apartment-ultra/shared-ui/components/ui';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { ConfirmDialog } from '@apartment-ultra/shared-ui/components/ui';
import {
  AppDrawer,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@apartment-ultra/shared-ui/components/ui';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
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
import type { GiftSubscriptionForm } from '../registered-users.schemas';
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
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={adminMessages.registeredUsers.dialogs.disableTitle}
      description={adminMessages.registeredUsers.dialogs.disableDescription}
      cancelLabel={adminMessages.common.cancel}
      confirmLabel={isPending ? adminMessages.common.processing : adminMessages.registeredUsers.dialogs.disableConfirm}
      onConfirm={onConfirm}
      isPending={isPending}
      intent="destructive"
    />
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
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={adminMessages.registeredUsers.dialogs.deleteTitle}
      description={adminMessages.registeredUsers.dialogs.deleteDescription}
      cancelLabel={adminMessages.common.cancel}
      confirmLabel={isPending ? adminMessages.common.processing : adminMessages.registeredUsers.dialogs.deleteConfirm}
      onConfirm={onConfirm}
      isPending={isPending}
      intent="destructive"
    />
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
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="organization_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{adminMessages.registeredUsers.dialogs.targetOrganization}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={adminMessages.registeredUsers.dialogs.targetOrganizationPlaceholder}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {detail.organizations.map((organization) => (
                          <SelectItem key={organization.id} value={organization.id}>
                            {organization.name} ({organization.role})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="service_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{adminMessages.registeredUsers.dialogs.targetService}</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        const nextPlan = plans.find((plan) => plan.id === value) ?? null;
                        const nextPricingId = nextPlan?.pricing?.[0]?.id ?? '';
                        form.setValue('pricing_id', nextPricingId, { shouldValidate: true });
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              plansLoading
                                ? adminMessages.registeredUsers.dialogs.loadingPlans
                                : adminMessages.registeredUsers.dialogs.targetServicePlaceholder
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {plans.map((plan) => (
                          <SelectItem key={plan.id} value={plan.id}>
                            {plan.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pricing_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{adminMessages.registeredUsers.dialogs.targetPricing}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={adminMessages.registeredUsers.dialogs.targetPricingPlaceholder} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(selectedGiftPlan?.pricing ?? []).map((pricing) => (
                          <SelectItem key={pricing.id} value={pricing.id}>
                            {pricing.months} 个月 · ¥{pricing.price.toLocaleString()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gift_months"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{adminMessages.registeredUsers.dialogs.extraMonths}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={24}
                        value={field.value}
                        onChange={(event) => field.onChange(event.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
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
          </Form>
        ) : (
          <p className="text-sm text-muted-foreground">{adminMessages.registeredUsers.dialogs.noUserSelected}</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
