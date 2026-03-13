'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { DataTable } from '@/components/common/data-table';
import { TableActions } from '@/components/common/table-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { ColumnDef } from '@tanstack/react-table';
import {
  adminApiEndpoints,
  Promotion,
  PromotionCreate,
  PromotionUpdate,
  AdminPlan,
} from '@/lib/api/admin-client';
import { getErrorMessage } from '@/lib/utils/error';
import { Plus, Pencil, Trash2, Tag, Gift, Percent } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const promotionSchema = z.object({
  name: z.string().min(1, '请输入活动名称'),
  code: z.string().min(1, '请输入活动代码'),
  description: z.string().optional(),
  type: z.enum(['discount', 'gift', 'mixed'], { required_error: '请选择活动类型' }),
  discount_type: z.enum(['percent', 'fixed']).optional().nullable(),
  discount_value: z.coerce.number().min(0).optional().nullable(),
  gift_months: z.coerce.number().int().min(0).optional().nullable(),
  start_date: z.string().min(1, '请选择开始日期'),
  end_date: z.string().optional().nullable(),
  is_active: z.boolean(),
  plan_ids: z.array(z.string()).optional(),
}).refine({
  // 折扣类型验证：percent 时 discount_value 应该在 0-1 之间
  discount_value: z.custom().refine((data) => {
    if (data.discount_type === 'percent') {
      return data.discount_value !== null && data.discount_value >= 0 && data.discount_value <= 1;
    }
    return true;
  }),
});

type PromotionForm = z.infer<typeof promotionSchema>;

const PROMOTION_TYPE_LABELS: Record<string, { label: string; icon: typeof Tag; color: string }> = {
  discount: { label: '折扣', icon: Percent, color: 'bg-blue-100 text-blue-800' },
  gift: { label: '赠送', icon: Gift, color: 'bg-green-100 text-green-800' },
  mixed: { label: '混合', icon: Tag, color: 'bg-purple-100 text-purple-800' },
};

export default function AdminPromotionsPage() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);

  const { data: promotions, isLoading } = useQuery({
    queryKey: ['admin', 'promotions'],
    queryFn: async () => {
      const res = await adminApiEndpoints.listPromotions();
      return (res.data ?? []) as Promotion[];
    },
  });

  const { data: plans } = useQuery({
    queryKey: ['admin', 'plans'],
    queryFn: async () => {
      const res = await adminApiEndpoints.listPlans({ active_only: true });
      return (res.data ?? []) as AdminPlan[];
    },
  });

  const createForm = useForm<PromotionForm>({
    resolver: zodResolver(promotionSchema),
    defaultValues: {
      name: '',
      code: '',
      description: '',
      type: 'discount',
      discount_type: 'percent',
      discount_value: null,
      gift_months: null,
      start_date: new Date().toISOString().slice(0, 10),
      end_date: null,
      is_active: true,
      plan_ids: [],
    },
  });

  const editForm = useForm<PromotionForm>({
    resolver: zodResolver(promotionSchema),
  });

  const createMutation = useMutation({
    mutationFn: (data: PromotionForm) =>
      adminApiEndpoints.createPromotion({
        name: data.name,
        code: data.code,
        description: data.description || undefined,
        type: data.type,
        discount_type: data.discount_type ?? undefined,
        discount_value: data.discount_value,
        gift_months: data.gift_months,
        start_date: data.start_date,
        end_date: data.end_date || undefined,
        is_active: data.is_active,
        plan_ids: data.plan_ids,
      } as PromotionCreate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'promotions'] });
      setIsCreateOpen(false);
      createForm.reset();
      toast.success('活动创建成功');
    },
    onError: (error) => toast.error(getErrorMessage(error, '创建失败，请重试')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: PromotionUpdate }) =>
      adminApiEndpoints.updatePromotion(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'promotions'] });
      setIsEditOpen(false);
      setSelectedPromotion(null);
      toast.success('活动已更新');
    },
    onError: (error) => toast.error(getErrorMessage(error, '更新失败，请重试')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApiEndpoints.deletePromotion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'promotions'] });
      setIsDeleteOpen(false);
      setSelectedPromotion(null);
      toast.success('活动已删除');
    },
    onError: (error) => toast.error(getErrorMessage(error, '删除失败，请重试')),
  });

  const handleEdit = (promotion: Promotion) => {
    setSelectedPromotion(promotion);
    editForm.reset({
      name: promotion.name,
      code: promotion.code,
      description: promotion.description ?? '',
      type: promotion.type,
      discount_type: promotion.discount_type ?? 'percent',
      discount_value: promotion.discount_value,
      gift_months: promotion.gift_months,
      start_date: promotion.start_date.slice(0, 10),
      end_date: promotion.end_date?.slice(0, 10) ?? null,
      is_active: promotion.is_active,
      plan_ids: promotion.plans?.map((p) => p.plan_id) ?? [],
    });
    setIsEditOpen(true);
  };

  const columns: ColumnDef<Promotion>[] = [
    { accessorKey: 'name', header: '活动名称' },
    { accessorKey: 'code', header: '代码' },
    {
      accessorKey: 'type',
      header: '类型',
      cell: ({ row }) => {
        const type = row.original.type;
        const config = PROMOTION_TYPE_LABELS[type] || PROMOTION_TYPE_LABELS.discount;
        const Icon = config.icon;
        return (
          <Badge variant="outline" className={config.color}>
            <Icon className="mr-1 h-3 w-3" />
            {config.label}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'discount_value',
      header: '折扣',
      cell: ({ row }) => {
        const value = row.original.discount_value;
        const discountType = row.original.discount_type;
        if (value == null) return '-';
        const numVal = Number(value);
        if (discountType === 'percent' || (!discountType && numVal < 1)) {
          return `${Math.round(numVal * 100)}% (${Math.round(numVal * 10)}折)`;
        }
        return `立减 ¥${numVal}`;
      },
    },
    {
      accessorKey: 'gift_months',
      header: '赠送月数',
      cell: ({ row }) => {
        const months = row.original.gift_months;
        return months != null ? `${months} 个月` : '-';
      },
    },
    {
      id: 'duration',
      header: '活动时间',
      cell: ({ row }) => {
        const start = row.original.start_date;
        const end = row.original.end_date;
        const startStr = new Date(start).toLocaleDateString('zh-CN');
        const endStr = end ? new Date(end).toLocaleDateString('zh-CN') : '长期';
        return `${startStr} ~ ${endStr}`;
      },
    },
    {
      accessorKey: 'is_active',
      header: '状态',
      cell: ({ row }) => {
        const config = row.original.is_active
          ? BOOLEAN_YES_NO_CONFIG.yes
          : BOOLEAN_YES_NO_CONFIG.no;
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
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
                setSelectedPromotion(row.original);
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

  const renderFormFields = (form: typeof createForm | typeof editForm, isEdit: boolean) => (
    <>
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>活动名称</FormLabel>
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
              <FormLabel>活动代码</FormLabel>
              <FormControl>
                <Input placeholder="如 spring2024" {...field} disabled={isEdit} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
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

      <FormField
        control={form.control}
        name="type"
        render={({ field }) => (
          <FormItem>
            <FormLabel>活动类型</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="选择类型" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="discount">折扣优惠</SelectItem>
                <SelectItem value="gift">赠送时长</SelectItem>
                <SelectItem value="mixed">混合优惠</SelectItem>
              </SelectContent>
            </Select>
            <FormDescription>
              折扣：减免金额或打折；赠送：增加订阅时长；混合：同时享受两种优惠
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {(form.watch('type') === 'discount' || form.watch('type') === 'mixed') && (
        <>
          <FormField
            control={form.control}
            name="discount_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>折扣类型</FormLabel>
                <Select onValueChange={field.onChange} value={field.value ?? 'percent'}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="选择折扣类型" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="percent">百分比折扣（如 8 折）</SelectItem>
                    <SelectItem value="fixed">固定金额减免（如立减 50 元）</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="discount_value"
            render={({ field }) => {
              const discountType = form.watch('discount_type');
              const isPercent = discountType === 'percent' || (!discountType && form.watch('type') === 'discount');
              return (
                <FormItem>
                  <FormLabel>{isPercent ? '折扣率' : '减免金额'}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step={isPercent ? '0.01' : '1'}
                      placeholder={isPercent ? '0.8 表示 8 折' : '输入减免金额（如 50）'}
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        field.onChange(val === '' ? null : parseFloat(val));
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    {isPercent
                      ? '输入折扣率，如 0.8 表示 8 折（即 80% 价格）'
                      : '输入固定减免金额，如 50 表示立减 50 元'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
        />
      )}

      {(form.watch('type') === 'gift' || form.watch('type') === 'mixed') && (
        <FormField
          control={form.control}
          name="gift_months"
          render={({ field }) => (
            <FormItem>
              <FormLabel>赠送月数</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="如 2 表示赠送 2 个月"
                  {...field}
                  value={field.value ?? ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    field.onChange(val === '' ? null : parseInt(val, 10));
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="start_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>开始日期</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="end_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>结束日期（选填）</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  {...field}
                  value={field.value ?? ''}
                  onChange={(e) => {
                    field.onChange(e.target.value || null);
                  }}
                />
              </FormControl>
              <FormDescription>留空表示长期有效</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="plan_ids"
        render={({ field }) => (
          <FormItem>
            <FormLabel>关联套餐（选填）</FormLabel>
            <div className="grid grid-cols-2 gap-2 rounded border p-2">
              {plans?.map((plan) => (
                <label
                  key={plan.id}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Checkbox
                    checked={field.value?.includes(plan.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        field.onChange([...(field.value || []), plan.id]);
                      } else {
                        field.onChange(field.value?.filter((id) => id !== plan.id));
                      }
                    }}
                  />
                  <span className="text-sm">{plan.name}</span>
                </label>
              ))}
            </div>
            <FormDescription>不选择则对所有套餐生效</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
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
    </>
  );

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold" data-testid="admin-promotions-heading">
          优惠活动管理
        </h2>
        <Button onClick={() => setIsCreateOpen(true)} data-testid="admin-promotions-create-btn">
          <Plus className="mr-2 h-4 w-4" />
          新建活动
        </Button>
      </div>

      <DataTable columns={columns} data={promotions ?? []} testid="admin-promotions-list" />

      {/* 新建 */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>新建优惠活动</DialogTitle>
            <DialogDescription>创建新的促销活动</DialogDescription>
          </DialogHeader>
          <Form {...createForm}>
            <form
              onSubmit={createForm.handleSubmit((d) => createMutation.mutate(d))}
              className="space-y-4"
            >
              {renderFormFields(createForm, false)}
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
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>编辑优惠活动</DialogTitle>
            <DialogDescription>{selectedPromotion?.name}</DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form
              onSubmit={editForm.handleSubmit((d) => {
                if (!selectedPromotion) return;
                updateMutation.mutate({
                  id: selectedPromotion.id,
                  data: {
                    name: d.name,
                    description: d.description || null,
                    type: d.type,
                    discount_type: d.discount_type ?? null,
                    discount_value: d.discount_value,
                    gift_months: d.gift_months,
                    start_date: d.start_date,
                    end_date: d.end_date || null,
                    is_active: d.is_active,
                  },
                });
              })}
              className="space-y-4"
            >
              {renderFormFields(editForm, true)}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                  取消
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? '保存中…' : '保存'}
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
              确定要删除优惠活动「{selectedPromotion?.name}」吗？此操作不可恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedPromotion && deleteMutation.mutate(selectedPromotion.id)}
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
