'use client';

import { useEffect, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { DollarSign, Settings } from 'lucide-react';
import type { ServiceProduct } from '@/lib/api/admin-client';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { Checkbox } from '@apartment-ultra/shared-ui/components/ui';
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
import { Input } from '@apartment-ultra/shared-ui/components/ui';
import { AppDrawer } from '@apartment-ultra/shared-ui/components/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@apartment-ultra/shared-ui/components/ui';
import {
  serviceProductCreateSchema,
  serviceProductUpdateSchema,
  type ServiceProductForm,
} from '../service-pricing.schemas';
import { getDefaultServiceProductFormValues, getServiceProductFormValues } from '../service-pricing.utils';
import { ServiceProductPricingFields } from './service-product-pricing-fields';
import { adminI18n, adminMessages } from '@/lib/i18n';

function ServiceProductFormSections({
  form,
  mode,
  editTab,
  onEditTabChange,
}: {
  form: ReturnType<typeof useForm<ServiceProductForm>>;
  mode: 'create' | 'edit';
  editTab?: string;
  onEditTabChange?: (value: string) => void;
}) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'pricing',
  });

  return (
    <>
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{adminMessages.servicePricing.fields.name}</FormLabel>
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
            <FormLabel>{adminMessages.servicePricing.fields.code}</FormLabel>
            <FormControl>
              <Input
                placeholder={adminMessages.servicePricing.fields.codePlaceholder}
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
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {mode === 'create'
                ? adminMessages.servicePricing.fields.optionalDescription
                : adminMessages.servicePricing.fields.description}
            </FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <Tabs value={editTab} onValueChange={onEditTabChange} defaultValue="pricing" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pricing" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            {adminMessages.servicePricing.fields.pricingTab}
          </TabsTrigger>
          <TabsTrigger value="limits" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            {adminMessages.servicePricing.fields.contentTab}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pricing" className="space-y-4 pt-4">
          <ServiceProductPricingFields form={form} fields={fields} append={append} remove={remove} />
        </TabsContent>

        <TabsContent value="limits" className="space-y-4 pt-4">
          <div className={`grid grid-cols-2 gap-4 ${mode === 'create' ? 'sm:grid-cols-4' : 'sm:grid-cols-2'}`}>
            <FormField
              control={form.control}
              name="max_organizations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{adminMessages.servicePricing.fields.maxOrganizations}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder={adminMessages.servicePricing.fields.maxOrganizationsPlaceholder}
                      {...field}
                      value={field.value ?? ''}
                      onChange={(event) =>
                        field.onChange(event.target.value === '' ? null : Number(event.target.value))
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="max_apartments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{adminMessages.servicePricing.fields.maxApartments}</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="max_rooms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{adminMessages.servicePricing.fields.maxRooms}</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="max_members"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{adminMessages.servicePricing.fields.maxMembers}</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </TabsContent>
      </Tabs>

      <FormField
        control={form.control}
        name="sort_order"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{adminMessages.servicePricing.fields.sortOrder}</FormLabel>
            <FormControl>
              <Input type="number" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {mode === 'edit' && (
        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex items-center gap-2">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(checked === true)} />
              </FormControl>
              <FormLabel className="!mt-0">{adminMessages.servicePricing.fields.enabled}</FormLabel>
            </FormItem>
          )}
        />
      )}
    </>
  );
}

export function ServicePricingCreateDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ServiceProductForm) => void;
  isPending: boolean;
}) {
  const form = useForm<ServiceProductForm>({
    resolver: zodResolver(serviceProductCreateSchema),
    defaultValues: getDefaultServiceProductFormValues(),
  });

  useEffect(() => {
    if (open) {
      form.reset(getDefaultServiceProductFormValues());
    }
  }, [form, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{adminMessages.servicePricing.dialogs.createTitle}</DialogTitle>
          <DialogDescription>{adminMessages.servicePricing.dialogs.createDescription}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <ServiceProductFormSections form={form} mode="create" />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {adminMessages.common.cancel}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? adminMessages.common.submitting : adminMessages.common.create}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function ServicePricingEditSheet({
  open,
  onOpenChange,
  service,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: ServiceProduct | null;
  onSubmit: (data: ServiceProductForm, editTab: string) => void;
  isPending: boolean;
}) {
  const [editTab, setEditTab] = useState('pricing');
  const form = useForm<ServiceProductForm>({
    resolver: zodResolver(serviceProductUpdateSchema),
    defaultValues: getDefaultServiceProductFormValues(),
  });

  useEffect(() => {
    if (open && service) {
      setEditTab('pricing');
      form.reset(getServiceProductFormValues(service));
    }
  }, [form, open, service]);

  const footer = (
    <>
      <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
        {adminMessages.common.cancel}
      </Button>
      <Button type="button" disabled={isPending} onClick={form.handleSubmit((data) => onSubmit(data, editTab))}>
        {isPending ? adminMessages.common.saving : adminMessages.common.save}
      </Button>
    </>
  );

  return (
    <AppDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={adminMessages.servicePricing.dialogs.editTitle}
      description={service?.name}
      footer={footer}
      size="lg"
    >
      <Form {...form}>
        <div className="space-y-4">
          <ServiceProductFormSections form={form} mode="edit" editTab={editTab} onEditTabChange={setEditTab} />
        </div>
      </Form>
    </AppDrawer>
  );
}

export function ServicePricingDeleteDialog({
  open,
  onOpenChange,
  service,
  onConfirm,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: ServiceProduct | null;
  onConfirm: () => void;
  isPending: boolean;
}) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={adminMessages.servicePricing.dialogs.deleteTitle}
      description={adminI18n.t('servicePricing.dialogs.deleteDescription', { name: service?.name ?? '' })}
      cancelLabel={adminMessages.common.cancel}
      confirmLabel={isPending ? adminMessages.common.deleting : adminMessages.common.delete}
      onConfirm={onConfirm}
      isPending={isPending}
      intent="destructive"
    />
  );
}
