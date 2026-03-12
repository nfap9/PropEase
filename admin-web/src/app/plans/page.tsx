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
  FormDescription,
} from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ColumnDef } from '@tanstack/react-table';
import { adminApiEndpoints, AdminPlan, AdminPlanUpdate, type AdminPlanPricingCreate } from '@/lib/api/admin-client';
import { getErrorMessage } from '@/lib/utils/error';
import { Plus, Pencil, Trash2, DollarSign, Settings } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

// 周期定价项 Schema
const pricingItemSchema = z.object({
  months: z.number().min(1, '月数最小为1'),
  price: z.number().min(0, '价格不能为负'),
  is_active: z.boolean(),
  sort_order: z.number(),
});

const planCreateSchema = z.object({
  name: z.string().min(1, '请输入套餐名称'),
  code: z.string().min(1, '请输入套餐代码'),
  description: z.string().optional(),
  price_monthly: z.coerce.number().min(0, '月费不能为负'),
  price_yearly: z.coerce.number().min(0, '年费不能为负'),
  max_organizations: z.coerce.number().min(-1, '-1 表示无限制'),
  max_apartments: z.coerce.number().min(-1, '-1 表示无限制'),
  max_rooms: z.coerce.number().min(-1, '-1 表示无限制'),
  max_members: z.coerce.number().min(-1, '-1 表示无限制'),
  sort_order: z.coerce.number().min(0),
  // 周期定价
  pricing: z.array(pricingItemSchema).optional(),
});

const planUpdateSchema = planCreateSchema.extend({
  is_active: z.boolean(),
});

type PlanCreateForm = z.infer<typeof planCreateSchema>;
type PlanUpdateForm = z.infer<typeof planUpdateSchema>;
type PricingItem = z.infer<typeof pricingItemSchema>;

export default function AdminPlansPage() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<AdminPlan | null>(null);
  const [editTab, setEditTab] = useState<string>('pricing');

  const { data: plans, isLoading } = useQuery({
    queryKey: ['admin', 'plans'],
    queryFn: async () => {
      const res = await adminApiEndpoints.listPlans({ active_only: false });
      return (res.data ?? []) as AdminPlan[];
    },
  });

  const createForm = useForm<PlanCreateForm>({
    resolver: zodResolver(planCreateSchema),
    defaultValues: {
      name: '',
      code: '',
      description: '',
      price_monthly: 0,
      price_yearly: 0,
      max_organizations: 1,
      max_apartments: 1,
      max_rooms: 100,
      max_members: 1,
      sort_order: 0,
      pricing: [],
    },
  });

  const editForm = useForm<PlanUpdateForm>({
    resolver: zodResolver(planUpdateSchema),
  });

  const { fields: editPricingFields, append: editAppendPricing, remove: editRemovePricing } = useFieldArray<PlanUpdateForm>({
    control: editForm.control,
    name: 'pricing',
  });

  const createMutation = useMutation({
    mutationFn: (data: PlanCreateForm) =>
      adminApiEndpoints.createPlan({
        name: data.name,
        code: data.code,
        description: data.description || undefined,
        price_monthly: data.price_monthly,
        price_yearly: data.price_yearly,
        max_organizations: data.max_organizations === -1 ? null : data.max_organizations,
        max_apartments: data.max_apartments,
        max_rooms: data.max_rooms,
        max_members: data.max_members,
        sort_order: data.sort_order,
        pricing: data.pricing && data.pricing.length > 0 ? data.pricing : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'plans'] });
      setIsCreateOpen(false);
      createForm.reset();
      toast.success('套餐创建成功');
    },
    onError: (error) => toast.error(getErrorMessage(error, '创建失败，请重试')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: AdminPlanUpdate }) =>
      adminApiEndpoints.updatePlan(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'plans'] });
      setIsEditOpen(false);
      setSelectedPlan(null);
      toast.success('套餐已更新');
    },
    onError: (error) => toast.error(getErrorMessage(error, '更新失败，请重试')),
  });

  const updatePricingMutation = useMutation({
    mutationFn: ({ planId, pricing }: { planId: string; pricing: AdminPlanPricingCreate[] }) =>
      adminApiEndpoints.updatePlanPricing(planId, pricing),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'plans'] });
      toast.success('周期定价已更新');
    },
    onError: (error) => toast.error(getErrorMessage(error, '更新定价失败，请重试')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApiEndpoints.deletePlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'plans'] });
      setIsDeleteOpen(false);
      setSelectedPlan(null);
      toast.success('套餐已删除');
    },
    onError: (error) => toast.error(getErrorMessage(error, '删除失败，请重试')),
  });

  const handleEdit = (plan: AdminPlan) => {
    setSelectedPlan(plan);
    setEditTab('pricing');
    editForm.reset({
      name: plan.name,
      code: plan.code,
      description: plan.description ?? '',
      price_monthly: plan.price_monthly,
      price_yearly: plan.price_yearly,
      max_organizations: plan.max_organizations ?? -1,
      max_apartments: plan.max_apartments,
      max_rooms: plan.max_rooms,
      max_members: plan.max_members,
      sort_order: plan.sort_order,
      is_active: plan.is_active,
      pricing: plan.pricing ?? [{ months: 1, price: plan.price_monthly, is_active: true, sort_order: 0 }],
    });
    setIsEditOpen(true);
  };

  const columns: ColumnDef<AdminPlan>[] = [
    { accessorKey: 'name', header: '名称' },
    { accessorKey: 'code', header: '代码' },
    {
      accessorKey: 'price_monthly',
      header: '月价',
      cell: ({ row }) => `¥${row.original.price_monthly}`,
    },
    {
      accessorKey: 'price_yearly',
      header: '年价',
      cell: ({ row }) => `¥${row.original.price_yearly}`,
    },
    {
      id: 'limits',
      header: '限制',
      cell: ({ row }) => {
        const p = row.original;
        const orgs =
          p.max_organizations == null || p.max_organizations < 0 ? '∞' : p.max_organizations;
        const apt = p.max_apartments < 0 ? '∞' : p.max_apartments;
        const rooms = p.max_rooms < 0 ? '∞' : p.max_rooms;
        const members = p.max_members < 0 ? '∞' : p.max_members;
        return `组织${orgs} / 公寓${apt} / 房间${rooms} / 成员${members}`;
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
                setSelectedPlan(row.original);
                setIsDeleteOpen(true);
              },
            },
          ]}
        />
      ),
    },
  ];

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
        <h2 className="text-xl font-semibold" data-testid="admin-plans-heading">套餐配置</h2>
        <Button onClick={() => setIsCreateOpen(true)} data-testid="admin-plans-create-btn">
          <Plus className="mr-2 h-4 w-4" />
          新建套餐
        </Button>
      </div>

      <DataTable columns={columns} data={plans ?? []} testid="admin-plans-list" />

      {/* 新建 */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>新建套餐</DialogTitle>
            <DialogDescription>创建新的订阅套餐</DialogDescription>
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
                    <FormLabel>套餐名称</FormLabel>
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
                    <FormLabel>套餐代码</FormLabel>
                    <FormControl>
                      <Input placeholder="如 free, pro" {...field} />
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
                    价格配置
                  </TabsTrigger>
                  <TabsTrigger value="limits" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    用量配置
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="pricing" className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={createForm.control}
                      name="price_monthly"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>默认月价</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} />
                          </FormControl>
                          <FormDescription>用于无周期定价时的默认价格</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="price_yearly"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>默认年价</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
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
                            <Input type="number" placeholder="-1 表示不限制" {...field} />
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

      {/* 编辑 */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl">
          <DialogHeader>
            <DialogTitle>编辑套餐</DialogTitle>
            <DialogDescription>{selectedPlan?.name}</DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form
              onSubmit={editForm.handleSubmit((d) => {
                if (!selectedPlan) return;
                // 根据当前 Tab 决定更新哪些内容
                if (editTab === 'pricing') {
                  // 更新周期定价
                  const pricing = d.pricing ?? [];
                  updatePricingMutation.mutate({ planId: selectedPlan.id, pricing });
                }
                // 始终更新基本信息
                updateMutation.mutate({
                  id: selectedPlan.id,
                  data: {
                    name: d.name,
                    description: d.description || null,
                    ...(selectedPlan?.code !== 'free' && {
                      price_monthly: d.price_monthly,
                      price_yearly: d.price_yearly,
                    }),
                    max_organizations: d.max_organizations === -1 ? null : d.max_organizations,
                    max_apartments: d.max_apartments,
                    max_rooms: d.max_rooms,
                    max_members: d.max_members,
                    is_active: d.is_active,
                    sort_order: d.sort_order,
                  },
                });
              })}
              className="space-y-4"
            >
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>套餐名称</FormLabel>
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
                    <FormLabel>套餐代码</FormLabel>
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
                    价格配置
                  </TabsTrigger>
                  <TabsTrigger value="limits" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    用量配置
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="pricing" className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={editForm.control}
                      name="price_monthly"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>默认月价</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              {...field}
                              disabled={selectedPlan?.code === 'free'}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={editForm.control}
                      name="price_yearly"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>默认年价</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              {...field}
                              disabled={selectedPlan?.code === 'free'}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* 周期定价列表 */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>周期定价</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => editAppendPricing({ months: 1, price: 0, is_active: true, sort_order: 0 })}
                      >
                        <Plus className="mr-1 h-3 w-3" />
                        添加周期
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {editPricingFields.map((field, index) => (
                        <div key={field.id} className="flex items-end gap-2 rounded border p-2">
                          <FormField
                            control={editForm.control}
                            name={`pricing.${index}.months`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormLabel className="text-xs">月数</FormLabel>
                                <FormControl>
                                  <Input type="number" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={editForm.control}
                            name={`pricing.${index}.price`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormLabel className="text-xs">价格</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={editForm.control}
                            name={`pricing.${index}.is_active`}
                            render={({ field }) => (
                              <FormItem className="flex items-center gap-1">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <FormLabel className="text-xs">启用</FormLabel>
                              </FormItem>
                            )}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => editRemovePricing(index)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="limits" className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <FormField
                      control={editForm.control}
                      name="max_organizations"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>最大组织数</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="-1 表示不限制" {...field} />
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
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                  取消
                </Button>
                <Button type="submit" disabled={updateMutation.isPending || updatePricingMutation.isPending}>
                  {updateMutation.isPending || updatePricingMutation.isPending ? '保存中…' : '保存'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* 删除确认 */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除套餐「{selectedPlan?.name}」吗？若已有组织使用该套餐，可能影响业务。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedPlan && deleteMutation.mutate(selectedPlan.id)}
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
