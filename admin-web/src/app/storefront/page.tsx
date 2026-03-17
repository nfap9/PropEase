'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { DataTable } from '@/components/common/data-table';
import { TableActions } from '@/components/common/table-actions';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { Input } from '@apartment-ultra/shared-ui/components/ui';
import { Badge } from '@apartment-ultra/shared-ui/components/ui';
import { Checkbox } from '@apartment-ultra/shared-ui/components/ui';
import { Label } from '@apartment-ultra/shared-ui/components/ui';
import { BOOLEAN_YES_NO_CONFIG } from '@/lib/status-config';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@apartment-ultra/shared-ui/components/ui';
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@apartment-ultra/shared-ui/components/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@apartment-ultra/shared-ui/components/ui';
import { ColumnDef } from '@tanstack/react-table';
import {
  adminApiEndpoints,
  StorefrontConfig,
  StorefrontConfigCreate,
  StorefrontConfigUpdate,
  StorefrontItem,
  StorefrontItemCreate,
  StorefrontItemUpdate,
  ServiceProduct,
  PricingDiscount,
} from '@/lib/api/admin-client';
import { getErrorMessage } from '@/lib/utils/error';
import { Plus, Pencil, Trash2, Store, GripVertical } from 'lucide-react';
import { Skeleton } from '@apartment-ultra/shared-ui/components/ui';

// 商店配置 Schema
const storefrontCreateSchema = z.object({
  name: z.string().min(1, '请输入商店名称'),
  code: z.string().min(1, '请输入商店代码'),
  is_active: z.boolean(),
  is_default: z.boolean(),
});

const storefrontUpdateSchema = storefrontCreateSchema;

type StorefrontForm = z.infer<typeof storefrontCreateSchema>;

// 商店项 Schema
const discountSchema = z.object({
  months: z.number().min(1),
  discount_type: z.enum(['percent', 'fixed', 'gift']),
  discount_value: z.number().nullable(),
  gift_months: z.number().nullable(),
});

const storefrontItemCreateSchema = z.object({
  service_id: z.string().min(1, '请选择服务'),
  is_visible: z.boolean(),
  sort_order: z.number(),
  pricing_discounts: z.array(discountSchema).nullable(),
});

type StorefrontItemForm = z.infer<typeof storefrontItemCreateSchema>;

// 折扣类型配置
const DISCOUNT_TYPE_CONFIG = {
  percent: { label: '打折', description: '如 0.8 表示 8 折' },
  fixed: { label: '立减', description: '立减金额（元）' },
  gift: { label: '赠送', description: '购买后赠送时长' },
};

export default function StorefrontPage() {
  const queryClient = useQueryClient();
  const [isCreateStorefrontOpen, setIsCreateStorefrontOpen] = useState(false);
  const [isEditStorefrontOpen, setIsEditStorefrontOpen] = useState(false);
  const [isDeleteStorefrontOpen, setIsDeleteStorefrontOpen] = useState(false);
  const [selectedStorefront, setSelectedStorefront] = useState<StorefrontConfig | null>(null);

  // 商店项管理状态
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isEditItemOpen, setIsEditItemOpen] = useState(false);
  const [isDeleteItemOpen, setIsDeleteItemOpen] = useState(false);
  const [selectedStorefrontForItems, setSelectedStorefrontForItems] = useState<StorefrontConfig | null>(null);
  const [selectedItem, setSelectedItem] = useState<StorefrontItem | null>(null);

  // 查询商店配置列表
  const { data: storefronts, isLoading } = useQuery({
    queryKey: ['admin', 'storefronts'],
    queryFn: async () => {
      const res = await adminApiEndpoints.listStorefronts({ is_active: undefined });
      return (res.data ?? []) as StorefrontConfig[];
    },
  });

  // 查询服务产品列表（用于商店项配置）
  const { data: serviceProducts } = useQuery({
    queryKey: ['admin', 'service-products'],
    queryFn: async () => {
      const res = await adminApiEndpoints.listServiceProducts({ is_active: true });
      return (res.data ?? []) as ServiceProduct[];
    },
  });

  // 查询单个商店详情（含商店项）
  const { data: storefrontDetail } = useQuery({
    queryKey: ['admin', 'storefronts', selectedStorefrontForItems?.id],
    queryFn: async () => {
      if (!selectedStorefrontForItems) return null;
      const res = await adminApiEndpoints.getStorefront(selectedStorefrontForItems.id);
      return res.data as StorefrontConfig;
    },
    enabled: !!selectedStorefrontForItems,
  });

  // 商店配置表单
  const storefrontCreateForm = useForm<StorefrontForm>({
    resolver: zodResolver(storefrontCreateSchema),
    defaultValues: {
      name: '',
      code: '',
      is_active: true,
      is_default: false,
    },
  });

  const storefrontEditForm = useForm<StorefrontForm>({
    resolver: zodResolver(storefrontUpdateSchema),
  });

  // 商店项表单
  const itemForm = useForm<StorefrontItemForm>({
    resolver: zodResolver(storefrontItemCreateSchema),
    defaultValues: {
      service_id: '',
      is_visible: true,
      sort_order: 0,
      pricing_discounts: null,
    },
  });

  const {
    fields: discountFields,
    append: appendDiscount,
    remove: removeDiscount,
  } = useFieldArray<StorefrontItemForm>({
    control: itemForm.control,
    name: 'pricing_discounts',
  });

  // 商店配置 CRUD
  const createStorefrontMutation = useMutation({
    mutationFn: (data: StorefrontForm) =>
      adminApiEndpoints.createStorefront(data as StorefrontConfigCreate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'storefronts'] });
      setIsCreateStorefrontOpen(false);
      storefrontCreateForm.reset();
      toast.success('商店配置创建成功');
    },
    onError: (error) => toast.error(getErrorMessage(error, '创建失败，请重试')),
  });

  const updateStorefrontMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: StorefrontConfigUpdate }) =>
      adminApiEndpoints.updateStorefront(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'storefronts'] });
      setIsEditStorefrontOpen(false);
      setSelectedStorefront(null);
      toast.success('商店配置已更新');
    },
    onError: (error) => toast.error(getErrorMessage(error, '更新失败，请重试')),
  });

  const deleteStorefrontMutation = useMutation({
    mutationFn: (id: string) => adminApiEndpoints.deleteStorefront(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'storefronts'] });
      setIsDeleteStorefrontOpen(false);
      setSelectedStorefront(null);
      toast.success('商店配置已删除');
    },
    onError: (error) => toast.error(getErrorMessage(error, '删除失败，请重试')),
  });

  // 商店项 CRUD
  const addItemMutation = useMutation({
    mutationFn: ({ storefrontId, data }: { storefrontId: string; data: StorefrontItemCreate }) =>
      adminApiEndpoints.addStorefrontItem(storefrontId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'storefronts', selectedStorefrontForItems?.id] });
      setIsAddItemOpen(false);
      itemForm.reset();
      toast.success('服务已添加到商店');
    },
    onError: (error) => toast.error(getErrorMessage(error, '添加失败，请重试')),
  });

  const updateItemMutation = useMutation({
    mutationFn: ({
      storefrontId,
      itemId,
      data,
    }: {
      storefrontId: string;
      itemId: string;
      data: StorefrontItemUpdate;
    }) => adminApiEndpoints.updateStorefrontItem(storefrontId, itemId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'storefronts', selectedStorefrontForItems?.id] });
      setIsEditItemOpen(false);
      setSelectedItem(null);
      toast.success('商店项已更新');
    },
    onError: (error) => toast.error(getErrorMessage(error, '更新失败，请重试')),
  });

  const deleteItemMutation = useMutation({
    mutationFn: ({ storefrontId, itemId }: { storefrontId: string; itemId: string }) =>
      adminApiEndpoints.deleteStorefrontItem(storefrontId, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'storefronts', selectedStorefrontForItems?.id] });
      setIsDeleteItemOpen(false);
      setSelectedItem(null);
      toast.success('商店项已删除');
    },
    onError: (error) => toast.error(getErrorMessage(error, '删除失败，请重试')),
  });

  // 处理编辑商店配置
  const handleEditStorefront = (storefront: StorefrontConfig) => {
    setSelectedStorefront(storefront);
    storefrontEditForm.reset({
      name: storefront.name,
      code: storefront.code,
      is_active: storefront.is_active,
      is_default: storefront.is_default,
    });
    setIsEditStorefrontOpen(true);
  };

  // 处理编辑商店项
  const handleEditItem = (item: StorefrontItem) => {
    setSelectedItem(item);
    itemForm.reset({
      service_id: item.service_id,
      is_visible: item.is_visible,
      sort_order: item.sort_order,
      pricing_discounts: item.pricing_discounts ?? null,
    });
    setIsEditItemOpen(true);
  };

  // 处理添加商店项
  const handleAddItem = (storefront: StorefrontConfig) => {
    setSelectedStorefrontForItems(storefront);
    itemForm.reset({
      service_id: '',
      is_visible: true,
      sort_order: 0,
      pricing_discounts: null,
    });
    setIsAddItemOpen(true);
  };

  // 商店配置表格列定义
  const storefrontColumns: ColumnDef<StorefrontConfig>[] = [
    { accessorKey: 'name', header: '商店名称' },
    { accessorKey: 'code', header: '代码' },
    {
      accessorKey: 'is_default',
      header: '默认',
      cell: ({ row }) => {
        const config = row.original.is_default
          ? BOOLEAN_YES_NO_CONFIG.yes
          : BOOLEAN_YES_NO_CONFIG.no;
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    {
      accessorKey: 'is_active',
      header: '启用',
      cell: ({ row }) => {
        const config = row.original.is_active
          ? BOOLEAN_YES_NO_CONFIG.yes
          : BOOLEAN_YES_NO_CONFIG.no;
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    {
      id: 'items_count',
      header: '服务数量',
      cell: ({ row }) => row.original.items?.length ?? 0,
    },
    {
      id: 'actions',
      header: '操作',
      cell: ({ row }) => (
        <TableActions
          actions={[
            {
              icon: Store,
              label: '管理商品',
              onClick: () => setSelectedStorefrontForItems(row.original),
            },
            { icon: Pencil, label: '编辑', onClick: () => handleEditStorefront(row.original) },
            {
              icon: Trash2,
              label: '删除',
              variant: 'destructive',
              onClick: () => {
                setSelectedStorefront(row.original);
                setIsDeleteStorefrontOpen(true);
              },
            },
          ]}
        />
      ),
    },
  ];

  // 商店项表格列定义
  const itemColumns: ColumnDef<StorefrontItem>[] = [
    {
      id: 'sort',
      header: '',
      cell: () => <GripVertical className="h-4 w-4 text-muted-foreground" />,
    },
    {
      id: 'service_name',
      header: '服务名称',
      cell: ({ row }) => row.original.service?.name ?? row.original.service_id,
    },
    {
      accessorKey: 'is_visible',
      header: '可见',
      cell: ({ row }) => {
        const config = row.original.is_visible
          ? BOOLEAN_YES_NO_CONFIG.yes
          : BOOLEAN_YES_NO_CONFIG.no;
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    {
      id: 'discounts',
      header: '折扣配置',
      cell: ({ row }) => {
        const discounts = row.original.pricing_discounts;
        if (!discounts || discounts.length === 0) return '-';
        return discounts.map((d, i) => (
          <Badge key={i} variant="outline" className="mr-1">
            {d.months}月:
            {d.discount_type === 'gift'
              ? `送${d.gift_months}月`
              : d.discount_type === 'percent'
                ? `${(d.discount_value ?? 0) * 10}折`
                : `减${d.discount_value}元`}
          </Badge>
        ));
      },
    },
    {
      id: 'actions',
      header: '操作',
      cell: ({ row }) => (
        <TableActions
          actions={[
            { icon: Pencil, label: '编辑', onClick: () => handleEditItem(row.original) },
            {
              icon: Trash2,
              label: '删除',
              variant: 'destructive',
              onClick: () => {
                setSelectedItem(row.original);
                setIsDeleteItemOpen(true);
              },
            },
          ]}
        />
      ),
    },
  ];

  // 渲染折扣配置表单
  const renderDiscountFields = () => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>折扣配置（可选）</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            appendDiscount({
              months: 1,
              discount_type: 'percent',
              discount_value: 1,
              gift_months: null,
            } as never)
          }
        >
          <Plus className="mr-1 h-3 w-3" />
          添加折扣
        </Button>
      </div>
      <div className="space-y-2">
        {discountFields.map((field, index) => (
          <div key={field.id} className="rounded border p-2">
            <div className="flex items-end gap-2">
              <FormField
                control={itemForm.control}
                name={`pricing_discounts.${index}.months`}
                render={({ field }) => (
                  <FormItem className="w-20">
                    <FormLabel className="text-xs">购买月数</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={itemForm.control}
                name={`pricing_discounts.${index}.discount_type`}
                render={({ field }) => (
                  <FormItem className="w-24">
                    <FormLabel className="text-xs">折扣类型</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="percent">打折</SelectItem>
                        <SelectItem value="fixed">立减</SelectItem>
                        <SelectItem value="gift">赠送</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={itemForm.control}
                name={`pricing_discounts.${index}.discount_value`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel className="text-xs">折扣值</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(e.target.value === '' ? null : Number(e.target.value))
                        }
                        disabled={
                          itemForm.watch(`pricing_discounts.${index}.discount_type`) === 'gift'
                        }
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={itemForm.control}
                name={`pricing_discounts.${index}.gift_months`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel className="text-xs">赠送月数</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(e.target.value === '' ? null : Number(e.target.value))
                        }
                        disabled={
                          itemForm.watch(`pricing_discounts.${index}.discount_type`) !== 'gift'
                        }
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeDiscount(index)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <FormDescription className="text-xs mt-1">
              {DISCOUNT_TYPE_CONFIG[
                itemForm.watch(`pricing_discounts.${index}.discount_type`) as keyof typeof DISCOUNT_TYPE_CONFIG
              ]?.description ?? ''}
            </FormDescription>
          </div>
        ))}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl">
        <Skeleton className="mb-4 h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // 渲染商品管理视图
  if (selectedStorefrontForItems && !isAddItemOpen && !isEditItemOpen) {
    return (
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedStorefrontForItems(null)}
              className="mb-2"
            >
              ← 返回商店列表
            </Button>
            <h2 className="text-xl font-semibold">
              {selectedStorefrontForItems.name} - 商品管理
            </h2>
          </div>
          <Button onClick={() => handleAddItem(selectedStorefrontForItems)}>
            <Plus className="mr-2 h-4 w-4" />
            添加服务
          </Button>
        </div>

        <DataTable
          columns={itemColumns}
          data={storefrontDetail?.items ?? []}
          testid="storefront-items-list"
        />

        {/* 添加商店项 */}
        <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl">
            <DialogHeader>
              <DialogTitle>添加服务到商店</DialogTitle>
              <DialogDescription>
                选择要添加的服务产品，并配置展示和折扣选项
              </DialogDescription>
            </DialogHeader>
            <Form {...itemForm}>
              <form
                onSubmit={itemForm.handleSubmit((d) => {
                  if (!selectedStorefrontForItems) return;
                  addItemMutation.mutate({
                    storefrontId: selectedStorefrontForItems.id,
                    data: {
                      service_id: d.service_id,
                      is_visible: d.is_visible,
                      sort_order: d.sort_order,
                      pricing_discounts: d.pricing_discounts?.length
                        ? (d.pricing_discounts as PricingDiscount[])
                        : undefined,
                    },
                  });
                })}
                className="space-y-4"
              >
                <FormField
                  control={itemForm.control}
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
                          {serviceProducts?.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={itemForm.control}
                  name="is_visible"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="!mt-0">在客户端显示</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={itemForm.control}
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
                {renderDiscountFields()}
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddItemOpen(false)}>
                    取消
                  </Button>
                  <Button type="submit" disabled={addItemMutation.isPending}>
                    {addItemMutation.isPending ? '添加中…' : '添加'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* 编辑商店项 */}
        <Dialog open={isEditItemOpen} onOpenChange={setIsEditItemOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl">
            <DialogHeader>
              <DialogTitle>编辑商店项</DialogTitle>
              <DialogDescription>{selectedItem?.service?.name}</DialogDescription>
            </DialogHeader>
            <Form {...itemForm}>
              <form
                onSubmit={itemForm.handleSubmit((d) => {
                  if (!selectedStorefrontForItems || !selectedItem) return;
                  updateItemMutation.mutate({
                    storefrontId: selectedStorefrontForItems.id,
                    itemId: selectedItem.id,
                    data: {
                      is_visible: d.is_visible,
                      sort_order: d.sort_order,
                      pricing_discounts: d.pricing_discounts?.length
                        ? (d.pricing_discounts as PricingDiscount[])
                        : undefined,
                    },
                  });
                })}
                className="space-y-4"
              >
                <FormField
                  control={itemForm.control}
                  name="is_visible"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="!mt-0">在客户端显示</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={itemForm.control}
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
                {renderDiscountFields()}
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsEditItemOpen(false)}>
                    取消
                  </Button>
                  <Button type="submit" disabled={updateItemMutation.isPending}>
                    {updateItemMutation.isPending ? '保存中…' : '保存'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* 删除商店项确认 */}
        <AlertDialog open={isDeleteItemOpen} onOpenChange={setIsDeleteItemOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>确认删除</AlertDialogTitle>
              <AlertDialogDescription>
                确定要从商店移除「{selectedItem?.service?.name}」吗？
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (selectedStorefrontForItems && selectedItem) {
                    deleteItemMutation.mutate({
                      storefrontId: selectedStorefrontForItems.id,
                      itemId: selectedItem.id,
                    });
                  }
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteItemMutation.isPending ? '删除中…' : '删除'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold" data-testid="storefront-heading">
          商店配置
        </h2>
        <Button onClick={() => setIsCreateStorefrontOpen(true)} data-testid="storefront-create-btn">
          <Plus className="mr-2 h-4 w-4" />
          新建商店
        </Button>
      </div>

      <DataTable
        columns={storefrontColumns}
        data={storefronts ?? []}
        testid="storefront-list"
      />

      {/* 新建商店配置 */}
      <Dialog open={isCreateStorefrontOpen} onOpenChange={setIsCreateStorefrontOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新建商店配置</DialogTitle>
            <DialogDescription>创建新的商店配置</DialogDescription>
          </DialogHeader>
          <Form {...storefrontCreateForm}>
            <form
              onSubmit={storefrontCreateForm.handleSubmit((d) =>
                createStorefrontMutation.mutate(d)
              )}
              className="space-y-4"
            >
              <FormField
                control={storefrontCreateForm.control}
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
                control={storefrontCreateForm.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>商店代码</FormLabel>
                    <FormControl>
                      <Input placeholder="如 default, promotion" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={storefrontCreateForm.control}
                name="is_default"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">设为默认商店</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={storefrontCreateForm.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">启用</FormLabel>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateStorefrontOpen(false)}
                >
                  取消
                </Button>
                <Button type="submit" disabled={createStorefrontMutation.isPending}>
                  {createStorefrontMutation.isPending ? '创建中…' : '创建'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* 编辑商店配置 */}
      <Dialog open={isEditStorefrontOpen} onOpenChange={setIsEditStorefrontOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑商店配置</DialogTitle>
            <DialogDescription>{selectedStorefront?.name}</DialogDescription>
          </DialogHeader>
          <Form {...storefrontEditForm}>
            <form
              onSubmit={storefrontEditForm.handleSubmit((d) => {
                if (!selectedStorefront) return;
                updateStorefrontMutation.mutate({
                  id: selectedStorefront.id,
                  data: d,
                });
              })}
              className="space-y-4"
            >
              <FormField
                control={storefrontEditForm.control}
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
                control={storefrontEditForm.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>商店代码</FormLabel>
                    <FormControl>
                      <Input {...field} disabled />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={storefrontEditForm.control}
                name="is_default"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">设为默认商店</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={storefrontEditForm.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(v) => field.onChange(v === true)}
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">启用</FormLabel>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditStorefrontOpen(false)}
                >
                  取消
                </Button>
                <Button type="submit" disabled={updateStorefrontMutation.isPending}>
                  {updateStorefrontMutation.isPending ? '保存中…' : '保存'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* 删除商店配置确认 */}
      <AlertDialog open={isDeleteStorefrontOpen} onOpenChange={setIsDeleteStorefrontOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除商店配置「{selectedStorefront?.name}」吗？此操作将同时删除所有商品配置。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedStorefront && deleteStorefrontMutation.mutate(selectedStorefront.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteStorefrontMutation.isPending ? '删除中…' : '删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 添加商店项 Dialog（用于从列表视图添加） */}
      <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl">
          <DialogHeader>
            <DialogTitle>添加服务到商店</DialogTitle>
            <DialogDescription>选择要添加的服务产品</DialogDescription>
          </DialogHeader>
          <Form {...itemForm}>
            <form
              onSubmit={itemForm.handleSubmit((d) => {
                if (!selectedStorefrontForItems) return;
                addItemMutation.mutate({
                  storefrontId: selectedStorefrontForItems.id,
                  data: {
                    service_id: d.service_id,
                    is_visible: d.is_visible,
                    sort_order: d.sort_order,
                    pricing_discounts: d.pricing_discounts?.length
                      ? (d.pricing_discounts as PricingDiscount[])
                      : undefined,
                  },
                });
              })}
              className="space-y-4"
            >
              <FormField
                control={itemForm.control}
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
                        {serviceProducts?.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={itemForm.control}
                name="is_visible"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="!mt-0">在客户端显示</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={itemForm.control}
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
              {renderDiscountFields()}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddItemOpen(false)}>
                  取消
                </Button>
                <Button type="submit" disabled={addItemMutation.isPending}>
                  {addItemMutation.isPending ? '添加中…' : '添加'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
