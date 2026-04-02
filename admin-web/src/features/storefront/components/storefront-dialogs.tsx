'use client';

import { useEffect } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type {
  ServiceProduct,
  StorefrontConfig,
  StorefrontItem,
  StorefrontItemCreate,
  StorefrontItemUpdate,
} from '@/lib/api/admin-client';
import { Button } from '@/components/ui';
import { Checkbox } from '@/components/ui';
import {
  ConfirmDialog,
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
import { Input } from '@/components/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@apartment-ultra/shared-ui/components/ui';
import {
  storefrontCreateSchema,
  storefrontItemSchema,
  storefrontUpdateSchema,
  type StorefrontForm,
  type StorefrontItemForm,
} from '../storefront.schemas';
import {
  getDefaultStorefrontFormValues,
  getDefaultStorefrontItemFormValues,
  getStorefrontFormValues,
  getStorefrontItemFormValues,
  normalizePricingDiscounts,
} from '../storefront.utils';
import { StorefrontDiscountFields } from './storefront-discount-fields';
import { adminI18n, adminMessages } from '@/lib/i18n';

export function StorefrontFormDialog({
  mode,
  open,
  onOpenChange,
  storefront,
  onSubmit,
  isPending,
}: {
  mode: 'create' | 'edit';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storefront?: StorefrontConfig | null;
  onSubmit: (data: StorefrontForm) => void;
  isPending: boolean;
}) {
  const form = useForm<StorefrontForm>({
    resolver: zodResolver(mode === 'create' ? storefrontCreateSchema : storefrontUpdateSchema),
    defaultValues: getDefaultStorefrontFormValues(),
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    form.reset(storefront ? getStorefrontFormValues(storefront) : getDefaultStorefrontFormValues());
  }, [form, open, storefront]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === 'create'
              ? adminMessages.storefront.dialog.createTitle
              : adminMessages.storefront.dialog.editTitle}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' ? adminMessages.storefront.dialog.createDescription : storefront?.name}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{adminMessages.storefront.fields.name}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{adminMessages.storefront.fields.code}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={adminMessages.storefront.fields.codePlaceholder}
                      {...field}
                      disabled={mode === 'edit'}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_default"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(checked === true)} />
                  </FormControl>
                  <FormLabel className="!mt-0">{adminMessages.storefront.fields.default}</FormLabel>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(checked === true)} />
                  </FormControl>
                  <FormLabel className="!mt-0">{adminMessages.storefront.fields.enabled}</FormLabel>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {adminMessages.common.cancel}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? mode === 'create'
                    ? adminMessages.common.creating
                    : adminMessages.common.saving
                  : mode === 'create'
                    ? adminMessages.common.create
                    : adminMessages.common.save}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function StorefrontDeleteDialog({
  open,
  onOpenChange,
  storefront,
  onConfirm,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storefront: StorefrontConfig | null;
  onConfirm: () => void;
  isPending: boolean;
}) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={adminMessages.servicePricing.dialogs.deleteTitle}
      description={adminI18n.t('storefront.dialog.deleteDescription', { name: storefront?.name ?? '' })}
      cancelLabel={adminMessages.common.cancel}
      confirmLabel={isPending ? adminMessages.common.deleting : adminMessages.common.delete}
      onConfirm={onConfirm}
      isPending={isPending}
      intent="destructive"
    />
  );
}

export function StorefrontItemFormDialog({
  mode,
  open,
  onOpenChange,
  storefront,
  item,
  serviceProducts,
  onSubmit,
  isPending,
}: {
  mode: 'create' | 'edit';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storefront: StorefrontConfig | null;
  item?: StorefrontItem | null;
  serviceProducts?: ServiceProduct[];
  onSubmit: ((data: StorefrontItemCreate) => void) | ((data: StorefrontItemUpdate) => void);
  isPending: boolean;
}) {
  const form = useForm<StorefrontItemForm>({
    resolver: zodResolver(storefrontItemSchema),
    defaultValues: getDefaultStorefrontItemFormValues(),
  });
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'pricing_discounts',
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    form.reset(item ? getStorefrontItemFormValues(item) : getDefaultStorefrontItemFormValues());
  }, [form, item, open]);

  const handleSubmit = (data: StorefrontItemForm) => {
    const normalizedDiscounts = normalizePricingDiscounts(data.pricing_discounts);

    if (mode === 'create') {
      (onSubmit as (data: StorefrontItemCreate) => void)({
        service_id: data.service_id,
        is_visible: data.is_visible,
        sort_order: data.sort_order,
        pricing_discounts: normalizedDiscounts,
      });
      return;
    }

    (onSubmit as (data: StorefrontItemUpdate) => void)({
      is_visible: data.is_visible,
      sort_order: data.sort_order,
      pricing_discounts: normalizedDiscounts,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create'
              ? adminMessages.storefront.dialog.itemCreateTitle
              : adminMessages.storefront.dialog.itemEditTitle}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? adminI18n.t('storefront.dialog.itemCreateDescription', {
                  storefrontName: storefront?.name ?? adminMessages.storefront.heading,
                })
              : item?.service?.name}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {mode === 'create' && (
              <FormField
                control={form.control}
                name="service_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{adminMessages.storefront.fields.service}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={adminMessages.storefront.fields.servicePlaceholder} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {serviceProducts?.map((service) => (
                          <SelectItem key={service.id} value={service.id}>
                            {service.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="is_visible"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(checked === true)} />
                  </FormControl>
                  <FormLabel className="!mt-0">{adminMessages.storefront.fields.visible}</FormLabel>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sort_order"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{adminMessages.storefront.fields.sortOrder}</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} onChange={(event) => field.onChange(Number(event.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <StorefrontDiscountFields form={form} fields={fields} append={append} remove={remove} />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {adminMessages.common.cancel}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? mode === 'create'
                    ? '添加中…'
                    : adminMessages.common.saving
                  : mode === 'create'
                    ? '添加'
                    : adminMessages.common.save}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function StorefrontItemDeleteDialog({
  open,
  onOpenChange,
  item,
  onConfirm,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: StorefrontItem | null;
  onConfirm: () => void;
  isPending: boolean;
}) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={adminMessages.storefront.dialog.itemDeleteTitle}
      description={adminI18n.t('storefront.dialog.itemDeleteDescription', {
        name: item?.service?.name ?? '',
      })}
      cancelLabel={adminMessages.common.cancel}
      confirmLabel={isPending ? adminMessages.common.deleting : adminMessages.common.delete}
      onConfirm={onConfirm}
      isPending={isPending}
      intent="destructive"
    />
  );
}
