'use client';

import { useEffect, useState } from 'react';
import { useFieldArray, useForm, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { DollarSign, Settings } from 'lucide-react';
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
import { CommonDrawer } from '@apartment-ultra/shared-ui/components/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@apartment-ultra/shared-ui/components/ui';
import type { AdminPlan } from '@/lib/api/admin-client';
import { planCreateSchema, planUpdateSchema, type PlanCreateForm, type PlanUpdateForm } from '../plans.schemas';
import { getDefaultPlanCreateFormValues, getPlanUpdateFormValues } from '../plans.utils';
import { PlanPricingFields } from './plan-pricing-fields';
import { adminI18n, adminMessages } from '@/lib/i18n';

type PlanForm = PlanCreateForm | PlanUpdateForm;

function PlanFormSections({
  form,
  mode,
  activeTab,
  onTabChange,
}: {
  form: UseFormReturn<PlanForm>;
  mode: 'create' | 'edit';
  activeTab: string;
  onTabChange: (value: string) => void;
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
            <FormLabel>{adminMessages.plans.fields.name}</FormLabel>
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
            <FormLabel>{adminMessages.plans.fields.code}</FormLabel>
            <FormControl>
              <Input placeholder={adminMessages.plans.fields.codePlaceholder} {...field} disabled={mode === 'edit'} />
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
                ? adminMessages.plans.fields.optionalDescription
                : adminMessages.plans.fields.description}
            </FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pricing" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            {adminMessages.plans.fields.pricingTab}
          </TabsTrigger>
          <TabsTrigger value="limits" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            {adminMessages.plans.fields.limitsTab}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pricing" className="space-y-4 pt-4">
          <PlanPricingFields form={form} fields={fields} append={append} remove={remove} />
          <FormField
            control={form.control}
            name="is_purchasable"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel className="!mt-0">{adminMessages.plans.fields.allowPurchase}</FormLabel>
              </FormItem>
            )}
          />
        </TabsContent>

        <TabsContent value="limits" className="space-y-4 pt-4">
          <div className={`grid grid-cols-2 gap-4 ${mode === 'create' ? 'sm:grid-cols-4' : 'sm:grid-cols-2'}`}>
            <FormField
              control={form.control}
              name="max_organizations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{adminMessages.plans.fields.maxOrganizations}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder={adminMessages.plans.fields.maxOrganizationsPlaceholder}
                      {...field}
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
                  <FormLabel>{adminMessages.plans.fields.maxApartments}</FormLabel>
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
                  <FormLabel>{adminMessages.plans.fields.maxRooms}</FormLabel>
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
                  <FormLabel>{adminMessages.plans.fields.maxMembers}</FormLabel>
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
            <FormLabel>{adminMessages.plans.fields.sortOrder}</FormLabel>
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
                <Checkbox checked={field.value} onCheckedChange={(value) => field.onChange(value === true)} />
              </FormControl>
              <FormLabel className="!mt-0">{adminMessages.plans.fields.enabled}</FormLabel>
            </FormItem>
          )}
        />
      )}
    </>
  );
}

export function PlanCreateDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: PlanCreateForm) => void;
  isPending: boolean;
}) {
  const [activeTab, setActiveTab] = useState('pricing');
  const form = useForm<PlanCreateForm>({
    resolver: zodResolver(planCreateSchema),
    defaultValues: getDefaultPlanCreateFormValues(),
  });

  useEffect(() => {
    if (open) {
      setActiveTab('pricing');
      form.reset(getDefaultPlanCreateFormValues());
    }
  }, [form, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{adminMessages.plans.dialogs.createTitle}</DialogTitle>
          <DialogDescription>{adminMessages.plans.dialogs.createDescription}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <PlanFormSections
              form={form as UseFormReturn<PlanForm>}
              mode="create"
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
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

export function PlanEditSheet({
  open,
  onOpenChange,
  plan,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: AdminPlan | null;
  onSubmit: (data: PlanUpdateForm, activeTab: string) => void;
  isPending: boolean;
}) {
  const [activeTab, setActiveTab] = useState('pricing');
  const form = useForm<PlanUpdateForm>({
    resolver: zodResolver(planUpdateSchema),
  });

  useEffect(() => {
    if (open && plan) {
      setActiveTab('pricing');
      form.reset(getPlanUpdateFormValues(plan));
    }
  }, [form, open, plan]);

  const header = (
    <div>
      <h2 className="text-lg font-semibold">{adminMessages.plans.dialogs.editTitle}</h2>
      <p className="text-sm text-muted-foreground">{plan?.name}</p>
    </div>
  );

  const footer = (
    <div className="flex justify-end gap-3">
      <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
        {adminMessages.common.cancel}
      </Button>
      <Button type="button" disabled={isPending} onClick={form.handleSubmit((data) => onSubmit(data, activeTab))}>
        {isPending ? adminMessages.common.saving : adminMessages.common.save}
      </Button>
    </div>
  );

  return (
    <CommonDrawer open={open} onOpenChange={onOpenChange} header={header} footer={footer} width="w-full sm:w-[600px]">
      <Form {...form}>
        <div className="space-y-4">
          <PlanFormSections
            form={form as UseFormReturn<PlanForm>}
            mode="edit"
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>
      </Form>
    </CommonDrawer>
  );
}

export function PlanDeleteDialog({
  open,
  onOpenChange,
  plan,
  onConfirm,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: AdminPlan | null;
  onConfirm: () => void;
  isPending: boolean;
}) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={adminMessages.plans.dialogs.deleteTitle}
      description={adminI18n.t('plans.dialogs.deleteDescription', { name: plan?.name ?? '' })}
      cancelLabel={adminMessages.common.cancel}
      confirmLabel={isPending ? adminMessages.common.deleting : adminMessages.common.delete}
      onConfirm={onConfirm}
      isPending={isPending}
      intent="destructive"
    />
  );
}
