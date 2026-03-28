'use client';

import { useEffect, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { DollarSign, Settings } from 'lucide-react';
import type { ServiceProduct } from '@/lib/api/admin-client';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { Checkbox } from '@apartment-ultra/shared-ui/components/ui';
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@apartment-ultra/shared-ui/components/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@apartment-ultra/shared-ui/components/ui';
import {
  serviceProductCreateSchema,
  serviceProductUpdateSchema,
  type ServiceProductForm,
} from '../service-pricing.schemas';
import {
  getDefaultServiceProductFormValues,
  getServiceProductFormValues,
} from '../service-pricing.utils';
import { ServiceProductPricingFields } from './service-product-pricing-fields';

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
            <FormLabel>服务名称</FormLabel>
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
            <FormLabel>服务代码</FormLabel>
            <FormControl>
              <Input placeholder="如 basic, pro" {...field} disabled={mode === 'edit'} />
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
            <FormLabel>{mode === 'create' ? '描述（选填）' : '描述'}</FormLabel>
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
            定价配置
          </TabsTrigger>
          <TabsTrigger value="limits" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            服务内容
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
                  <FormLabel>最大组织数</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="留空表示不限制"
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
                  <FormLabel>最大公寓数</FormLabel>
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
                  <FormLabel>最大房间数</FormLabel>
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
                  <FormLabel>最大成员数</FormLabel>
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
            <FormLabel>排序</FormLabel>
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
              <FormLabel className="!mt-0">启用</FormLabel>
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
          <DialogTitle>新建服务产品</DialogTitle>
          <DialogDescription>创建新的服务产品及定价</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <ServiceProductFormSections form={form} mode="create" />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                取消
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? '提交中…' : '创建'}
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="max-h-screen w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>编辑服务产品</SheetTitle>
          <SheetDescription>{service?.name}</SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => onSubmit(data, editTab))} className="mt-4 space-y-4">
            <ServiceProductFormSections
              form={form}
              mode="edit"
              editTab={editTab}
              onEditTabChange={setEditTab}
            />
            <SheetFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                取消
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? '保存中…' : '保存'}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
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
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确认删除</AlertDialogTitle>
          <AlertDialogDescription>
            确定要删除服务产品「{service?.name}」吗？此操作不可恢复。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? '删除中…' : '删除'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

