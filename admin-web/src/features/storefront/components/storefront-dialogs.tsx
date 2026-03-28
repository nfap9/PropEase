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
          <DialogTitle>{mode === 'create' ? '新建商店配置' : '编辑商店配置'}</DialogTitle>
          <DialogDescription>
            {mode === 'create' ? '创建新的商店配置' : storefront?.name}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>商店名称</FormLabel>
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
                  <FormLabel>商店代码</FormLabel>
                  <FormControl>
                    <Input placeholder="如 default, promotion" {...field} disabled={mode === 'edit'} />
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
                  <FormLabel className="!mt-0">设为默认商店</FormLabel>
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
                  <FormLabel className="!mt-0">启用</FormLabel>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                取消
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (mode === 'create' ? '创建中…' : '保存中…') : mode === 'create' ? '创建' : '保存'}
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
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确认删除</AlertDialogTitle>
          <AlertDialogDescription>
            确定要删除商店配置「{storefront?.name}」吗？此操作将同时删除所有商品配置。
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
          <DialogTitle>{mode === 'create' ? '添加服务到商店' : '编辑商店项'}</DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? `为 ${storefront?.name ?? '当前商店'} 选择要展示的服务产品`
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
                    <FormLabel>服务产品</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="选择服务" />
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
                  <FormLabel className="!mt-0">在客户端显示</FormLabel>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sort_order"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>排序</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(event) => field.onChange(Number(event.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <StorefrontDiscountFields form={form} fields={fields} append={append} remove={remove} />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                取消
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (mode === 'create' ? '添加中…' : '保存中…') : mode === 'create' ? '添加' : '保存'}
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
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确认删除</AlertDialogTitle>
          <AlertDialogDescription>
            确定要从商店移除「{item?.service?.name}」吗？
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
