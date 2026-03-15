'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { DataTable } from '@/components/common/data-table';
import { TableActions } from '@/components/common/table-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { BOOLEAN_YES_NO_CONFIG } from '@/lib/status-config';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ColumnDef } from '@tanstack/react-table';
import {
  adminApiEndpoints,
  ServiceProduct,
  ServiceProductCreate,
  ServiceProductUpdate,
  ServicePricingCreate,
} from '@/lib/api/admin-client';
import { getErrorMessage } from '@/lib/utils/error';
import { Plus, Pencil, Trash2, DollarSign, Settings } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

// 定价项 Schema
const pricingItemSchema = z.object({
  months: z.number().min(1, '月数最小为1'),
  price: z.number().min(0, '价格不能为负'),
  is_active: z.boolean(),
  sort_order: z.number(),
});

const serviceProductCreateSchema = z.object({
  name: z.string().min(1, '请输入服务名称'),
  code: z.string().min(1, '请输入服务代码'),
  description: z.string().optional(),
  max_organizations: z.coerce.number().nullable(),
  max_apartments: z.coerce.number().min(1, '公寓数最小为1'),
  max_rooms: z.coerce.number().min(1, '房间数最小为1'),
  max_members: z.coerce.number().min(1, '成员数最小为1'),
  is_active: z.boolean(),
  sort_order: z.coerce.number().min(0),
  pricing: z.array(pricingItemSchema),
});

const serviceProductUpdateSchema = serviceProductCreateSchema;

type ServiceProductForm = z.infer<typeof serviceProductCreateSchema>;

export default function ServicePricingPage() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceProduct | null>(null);
  const [editTab, setEditTab] = useState<string>('pricing');

  const { data: services, isLoading } = useQuery({
    queryKey: ['admin', 'service-products'],
    queryFn: async () => {
      const res = await adminApiEndpoints.listServiceProducts({ is_active: undefined });
      return (res.data ?? []) as ServiceProduct[];
    },
  });

  const createForm = useForm<ServiceProductForm>({
    resolver: zodResolver(serviceProductCreateSchema),
    defaultValues: {
      name: '',
      code: '',
      description: '',
      max_organizations: 1,
      max_apartments: 1,
      max_rooms: 100,
      max_members: 1,
      is_active: true,
      sort_order: 0,
      pricing: [{ months: 1, price: 0, is_active: true, sort_order: 0 }],
    },
  });

  const {
    fields: createPricingFields,
    append: createAppendPricing,
    remove: createRemovePricing,
  } = useFieldArray<ServiceProductForm>({
    control: createForm.control,
    name: 'pricing',
  });

  const editForm = useForm<ServiceProductForm>({
    resolver: zodResolver(serviceProductUpdateSchema),
  });

  const {
    fields: editPricingFields,
    append: editAppendPricing,
    remove: editRemovePricing,
  } = useFieldArray<ServiceProductForm>({
    control: editForm.control,
    name: 'pricing',
  });

  const createMutation = useMutation({
    mutationFn: (data: ServiceProductForm) =>
      adminApiEndpoints.createServiceProduct({
        name: data.name,
        code: data.code,
        description: data.description || undefined,
        max_organizations: data.max_organizations ?? undefined,
        max_apartments: data.max_apartments,
        max_rooms: data.max_rooms,
        max_members: data.max_members,
        is_active: data.is_active,
        sort_order: data.sort_order,
        pricing: data.pricing,
      } as ServiceProductCreate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'service-products'] });
      setIsCreateOpen(false);
      createForm.reset();
      toast.success('服务产品创建成功');
    },
    onError: (error) => toast.error(getErrorMessage(error, '创建失败，请重试')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ServiceProductUpdate }) =>
      adminApiEndpoints.updateServiceProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'service-products'] });
      toast.success('服务产品已更新');
    },
    onError: (error) => toast.error(getErrorMessage(error, '更新失败，请重试')),
  });

  const updatePricingMutation = useMutation({
    mutationFn: ({ id, pricing }: { id: string; pricing: ServicePricingCreate[] }) =>
      adminApiEndpoints.updateServiceProductPricing(id, { pricing }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'service-products'] });
      toast.success('定价已更新');
    },
    onError: (error) => toast.error(getErrorMessage(error, '更新定价失败，请重试')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApiEndpoints.deleteServiceProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'service-products'] });
      setIsDeleteOpen(false);
      setSelectedService(null);
      toast.success('服务产品已删除');
    },
    onError: (error) => toast.error(getErrorMessage(error, '删除失败，请重试')),
  });

  const handleEdit = (service: ServiceProduct) => {
    setSelectedService(service);
    setEditTab('pricing');
    editForm.reset({
      name: service.name,
      code: service.code,
      description: service.description ?? '',
      max_organizations: service.max_organizations,
      max_apartments: service.max_apartments,
      max_rooms: service.max_rooms,
      max_members: service.max_members,
      is_active: service.is_active,
      sort_order: service.sort_order,
      pricing:
        service.pricing && service.pricing.length > 0
          ? service.pricing.map((p) => ({
              months: p.months,
              price: Number(p.price),
              is_active: p.is_active,
              sort_order: p.sort_order,
            }))
          : [{ months: 1, price: 0, is_active: true, sort_order: 0 }],
    });
    setIsEditOpen(true);
  };

  const columns: ColumnDef<ServiceProduct>[] = [
    { accessorKey: 'name', header: '服务名称' },
    { accessorKey: 'code', header: '代码' },
    {
      id: 'pricing',
      header: '定价',
      cell: ({ row }) => {
        const s = row.original;
        if (s.pricing && s.pricing.length > 0) {
          const activePricing = s.pricing.filter((pr) => pr.is_active);
          if (activePricing.length > 0) {
            return activePricing.map((pr) => `${pr.months}月¥${pr.price}`).join(' / ');
          }
        }
        return '-';
      },
    },
    {
      id: 'limits',
      header: '服务内容',
      cell: ({ row }) => {
        const s = row.original;
        const orgs = s.max_organizations == null ? '∞' : s.max_organizations;
        return `组织${orgs} / 公寓${s.max_apartments} / 房间${s.max_rooms} / 成员${s.max_members}`;
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
    { accessorKey: 'sort_order', header: '排序' },
    {
      id: 'actions',
      header: '操作',
      cell: ({ row }) => (
        <TableActions
          actions={[
            { icon: Pencil, label: '编辑', onClick: () => handleEdit(row.original) },
            {
              icon: Trash2,
              label: '删除',
              variant: 'destructive',
              onClick: () => {
                setSelectedService(row.original);
                setIsDeleteOpen(true);
              },
            },
          ]}
        />
      ),
    },
  ];

  // 渲染定价表单
  const renderPricingFields = (
    fields: { id: string }[],
    form: ReturnType<typeof useForm<ServiceProductForm>>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    append: (value: any) => void,
    remove: (index: number) => void
  ) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>周期定价</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ months: 1, price: 0, is_active: true, sort_order: 0 })}
        >
          <Plus className="mr-1 h-3 w-3" />
          添加周期
        </Button>
      </div>
      <div className="space-y-2">
        {fields.map((field, index) => (
          <div key={field.id} className="rounded border p-2">
            <div className="flex items-end gap-2">
              <FormField
                control={form.control}
                name={`pricing.${index}.months`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel className="text-xs">月数</FormLabel>
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
                control={form.control}
                name={`pricing.${index}.price`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel className="text-xs">价格</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              {fields.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(index)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="flex items-center gap-4 mt-2">
              <FormField
                control={form.control}
                name={`pricing.${index}.is_active`}
                render={({ field }) => (
                  <FormItem className="flex items-center gap-1">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="text-xs">启用</FormLabel>
                  </FormItem>
                )}
              />
            </div>
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

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold" data-testid="service-pricing-heading">
          服务定价
        </h2>
        <Button onClick={() => setIsCreateOpen(true)} data-testid="service-pricing-create-btn">
          <Plus className="mr-2 h-4 w-4" />
          新建服务
        </Button>
      </div>

      <DataTable columns={columns} data={services ?? []} testid="service-pricing-list" />

      {/* 新建 */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl">
          <DialogHeader>
            <DialogTitle>新建服务产品</DialogTitle>
            <DialogDescription>创建新的服务产品及定价</DialogDescription>
          </DialogHeader>
          <Form {...createForm}>
            <form
              onSubmit={createForm.handleSubmit((d) => createMutation.mutate(d))}
              className="space-y-4"
            >
              <FormField
                control={createForm.control}
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
                control={createForm.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>服务代码</FormLabel>
                    <FormControl>
                      <Input placeholder="如 basic, pro" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>描述（选填）</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Tabs defaultValue="pricing" className="w-full">
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
                  {renderPricingFields(
                    createPricingFields,
                    createForm,
                    createAppendPricing,
                    createRemovePricing
                  )}
                </TabsContent>

                <TabsContent value="limits" className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <FormField
                      control={createForm.control}
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
                              onChange={(e) =>
                                field.onChange(e.target.value === '' ? null : Number(e.target.value))
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
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
                      control={createForm.control}
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
                      control={createForm.control}
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
                control={createForm.control}
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
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  取消
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? '提交中…' : '创建'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* 编辑 - 使用抽屉组件 */}
      <Sheet open={isEditOpen} onOpenChange={setIsEditOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto max-h-screen">
          <SheetHeader>
            <SheetTitle>编辑服务产品</SheetTitle>
            <SheetDescription>{selectedService?.name}</SheetDescription>
          </SheetHeader>
          <Form {...editForm}>
            <form
              onSubmit={editForm.handleSubmit((d) => {
                if (!selectedService) return;
                // 根据当前 Tab 决定更新哪些内容
                if (editTab === 'pricing') {
                  const pricing = d.pricing ?? [];
                  updatePricingMutation.mutate({ id: selectedService.id, pricing });
                }
                // 始终更新基本信息
                updateMutation.mutate({
                  id: selectedService.id,
                  data: {
                    name: d.name,
                    description: d.description || null,
                    max_organizations: d.max_organizations ?? undefined,
                    max_apartments: d.max_apartments,
                    max_rooms: d.max_rooms,
                    max_members: d.max_members,
                    is_active: d.is_active,
                    sort_order: d.sort_order,
                  } as ServiceProductUpdate,
                });
              })}
              className="space-y-4 mt-4"
            >
              <FormField
                control={editForm.control}
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
                control={editForm.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>服务代码</FormLabel>
                    <FormControl>
                      <Input {...field} disabled />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>描述</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Tabs value={editTab} onValueChange={setEditTab} className="w-full">
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
                  {renderPricingFields(
                    editPricingFields,
                    editForm,
                    editAppendPricing,
                    editRemovePricing
                  )}
                </TabsContent>

                <TabsContent value="limits" className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
                    <FormField
                      control={editForm.control}
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
                              onChange={(e) =>
                                field.onChange(e.target.value === '' ? null : Number(e.target.value))
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={editForm.control}
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
                      control={editForm.control}
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
                      control={editForm.control}
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
                control={editForm.control}
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
              <FormField
                control={editForm.control}
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
              <SheetFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                  取消
                </Button>
                <Button type="submit" disabled={updateMutation.isPending || updatePricingMutation.isPending}>
                  {updateMutation.isPending || updatePricingMutation.isPending ? '保存中…' : '保存'}
                </Button>
              </SheetFooter>
            </form>
          </Form>
        </SheetContent>
      </Sheet>

      {/* 删除确认 */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除服务产品「{selectedService?.name}」吗？此操作不可恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedService && deleteMutation.mutate(selectedService.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? '删除中…' : '删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
