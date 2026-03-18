'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { DataTable } from '@/components/common/data-table';
import { TableActions } from '@/components/common/table-actions';
import { Badge } from '@apartment-ultra/shared-ui/components/ui';
import { ORG_STATUS_CONFIG } from '@/lib/status-config';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { Input } from '@apartment-ultra/shared-ui/components/ui';
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
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@apartment-ultra/shared-ui/components/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@apartment-ultra/shared-ui/components/ui';
import {
  adminApiEndpoints,
  AdminPlan,
  AdminRegisteredUser,
  AdminRegisteredUserDetail,
} from '@/lib/api/admin-client';
import { getErrorMessage } from '@/lib/utils/error';
import { formatDateTime } from '@/lib/date-utils';
import { ColumnDef } from '@tanstack/react-table';
import { Eye, Gift, Power, PowerOff, Trash2 } from 'lucide-react';
import { Skeleton } from '@apartment-ultra/shared-ui/components/ui';

type FilterActive = 'all' | 'active' | 'inactive';

const giftSubscriptionSchema = z.object({
  organization_id: z.string().min(1, '请选择赠送组织'),
  service_id: z.string().min(1, '请选择服务'),
  pricing_id: z.string().min(1, '请选择赠送周期'),
  gift_months: z.coerce
    .number()
    .int()
    .min(0, '附加赠送月数不能小于 0')
    .max(24, '附加赠送月数不能超过 24'),
});

type GiftSubscriptionForm = z.infer<typeof giftSubscriptionSchema>;

export default function AdminRegisteredUsersPage() {
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState<FilterActive>('all');
  const [search, setSearch] = useState('');
  const [searchSubmitted, setSearchSubmitted] = useState('');
  const [detailUserId, setDetailUserId] = useState<string | null>(null);
  /** 待停用确认的用户 id，用于二次确认弹窗 */
  const [disableConfirmUserId, setDisableConfirmUserId] = useState<string | null>(null);
  /** 待删除确认的用户 id */
  const [deleteConfirmUserId, setDeleteConfirmUserId] = useState<string | null>(null);
  const [isGiftOpen, setIsGiftOpen] = useState(false);

  const isActiveParam = activeFilter === 'all' ? undefined : activeFilter === 'active';

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin', 'registered-users', isActiveParam, searchSubmitted],
    queryFn: async () => {
      const res = await adminApiEndpoints.listRegisteredUsers({
        limit: 500,
        is_active: isActiveParam,
        search: searchSubmitted || undefined,
      });
      return (res.data ?? []) as AdminRegisteredUser[];
    },
  });

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ['admin', 'registered-users', 'detail', detailUserId],
    queryFn: async () => {
      if (!detailUserId) return null;
      const res = await adminApiEndpoints.getRegisteredUser(detailUserId);
      return (res.data ?? null) as AdminRegisteredUserDetail | null;
    },
    enabled: !!detailUserId,
  });

  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ['admin', 'plans', 'gift-options'],
    queryFn: async () => {
      const res = await adminApiEndpoints.listPlans({ active_only: true });
      return ((res.data ?? []) as AdminPlan[]).filter(
        (plan) => plan.is_active && plan.code !== 'free' && (plan.pricing?.length ?? 0) > 0
      );
    },
    enabled: isGiftOpen,
  });

  const giftForm = useForm<GiftSubscriptionForm>({
    resolver: zodResolver(giftSubscriptionSchema),
    defaultValues: {
      organization_id: '',
      service_id: '',
      pricing_id: '',
      gift_months: 0,
    },
  });

  const selectedGiftPlan = plans.find((plan) => plan.id === giftForm.watch('service_id')) ?? null;
  const selectedPricing =
    selectedGiftPlan?.pricing?.find((pricing) => pricing.id === giftForm.watch('pricing_id')) ??
    null;

  const setActiveMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      adminApiEndpoints.setRegisteredUserActive(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'registered-users'] });
      if (detailUserId) {
        queryClient.invalidateQueries({
          queryKey: ['admin', 'registered-users', 'detail', detailUserId],
        });
      }
      setDisableConfirmUserId(null);
      toast.success('已更新');
    },
    onError: (error) => toast.error(getErrorMessage(error, '操作失败，请重试')),
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => adminApiEndpoints.deleteRegisteredUser(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'registered-users'] });
      if (detailUserId === id) setDetailUserId(null);
      setDeleteConfirmUserId(null);
      toast.success('已删除');
    },
    onError: (error) => toast.error(getErrorMessage(error, '删除失败，请重试')),
  });

  const giftSubscriptionMutation = useMutation({
    mutationFn: async (values: GiftSubscriptionForm) => {
      const pricing =
        plans
          .find((plan) => plan.id === values.service_id)
          ?.pricing?.find((item) => item.id === values.pricing_id) ?? null;

      if (!pricing) {
        throw new Error('请选择赠送周期');
      }

      return adminApiEndpoints.giftSubscription({
        organization_id: values.organization_id,
        service_id: values.service_id,
        pricing_id: values.pricing_id,
        billing_months: pricing.months,
        gift_months: values.gift_months,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'subscriptions'] });
      if (detailUserId) {
        queryClient.invalidateQueries({
          queryKey: ['admin', 'registered-users', 'detail', detailUserId],
        });
      }
      setIsGiftOpen(false);
      giftForm.reset({
        organization_id: detail?.organizations[0]?.id ?? '',
        service_id: '',
        pricing_id: '',
        gift_months: 0,
      });
      toast.success('赠送已生效，订阅有效期已更新');
    },
    onError: (error) => toast.error(getErrorMessage(error, '赠送失败，请重试')),
  });

  const openGiftDialog = (userDetail: AdminRegisteredUserDetail) => {
    giftForm.reset({
      organization_id: userDetail.organizations[0]?.id ?? '',
      service_id: '',
      pricing_id: '',
      gift_months: 0,
    });
    setIsGiftOpen(true);
  };

  const columns: ColumnDef<AdminRegisteredUser>[] = [
    { accessorKey: 'phone', header: '手机号' },
    { accessorKey: 'full_name', header: '姓名' },
    {
      accessorKey: 'is_active',
      header: '状态',
      cell: ({ row }) => {
        const config = row.original.is_active
          ? ORG_STATUS_CONFIG.active
          : ORG_STATUS_CONFIG.inactive;
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    {
      accessorKey: 'created_at',
      header: '注册时间',
      cell: ({ row }) => formatDateTime(row.original.created_at),
    },
    {
      id: 'actions',
      header: '操作',
      cell: ({ row }) => {
        const user = row.original;
        return (
          <TableActions
            actions={[
              {
                icon: Eye,
                label: '详情',
                onClick: () => setDetailUserId(user.id),
              },
              ...(user.is_active
                ? [
                    {
                      icon: PowerOff,
                      label: '停用',
                      variant: 'destructive' as const,
                      onClick: () => setDisableConfirmUserId(user.id),
                    },
                  ]
                : [
                    {
                      icon: Power,
                      label: '启用',
                      onClick: () =>
                        setActiveMutation.mutate({
                          id: user.id,
                          is_active: true,
                        }),
                    },
                  ]),
              {
                icon: Trash2,
                label: '删除',
                variant: 'destructive',
                onClick: () => setDeleteConfirmUserId(user.id),
              },
            ]}
          />
        );
      },
    },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchSubmitted(search);
  };

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
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-semibold" data-testid="admin-registered-users-heading">用户管理</h2>
        <div className="flex flex-wrap items-center gap-2">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <Input
              placeholder="手机号或姓名"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-40"
            />
            <Button type="submit" variant="secondary" size="sm">
              搜索
            </Button>
          </form>
          <Select value={activeFilter} onValueChange={(v) => setActiveFilter(v as FilterActive)}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="状态筛选" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              <SelectItem value="active">启用</SelectItem>
              <SelectItem value="inactive">停用</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable columns={columns} data={users ?? []} testid="admin-registered-users-list" />

      <AlertDialog
        open={!!disableConfirmUserId}
        onOpenChange={(open) => !open && setDisableConfirmUserId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认停用</AlertDialogTitle>
            <AlertDialogDescription>
              确定要停用该账号吗？停用后该用户将无法登录系统。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (disableConfirmUserId) {
                  setActiveMutation.mutate({
                    id: disableConfirmUserId,
                    is_active: false,
                  });
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {setActiveMutation.isPending ? '处理中…' : '确定停用'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!deleteConfirmUserId}
        onOpenChange={(open) => !open && setDeleteConfirmUserId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除该注册用户吗？删除后账号及其关联数据将无法恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteConfirmUserId) {
                  deleteUserMutation.mutate(deleteConfirmUserId);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteUserMutation.isPending ? '处理中…' : '确定删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Sheet open={!!detailUserId} onOpenChange={(open) => !open && setDetailUserId(null)}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>用户详情</SheetTitle>
          </SheetHeader>
          {detailUserId && (
            <div className="mt-6">
              {detailLoading ? (
                <Skeleton className="h-32 w-full" />
              ) : detail ? (
                <div className="space-y-4">
                  <div>
                    <span className="text-muted-foreground">手机号</span>
                    <p className="font-medium">{detail.phone}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">姓名</span>
                    <p className="font-medium">{detail.full_name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">状态</span>
                    <p>
                      <Badge
                        variant={
                          detail.is_active
                            ? ORG_STATUS_CONFIG.active.variant
                            : ORG_STATUS_CONFIG.inactive.variant
                        }
                      >
                        {detail.is_active
                          ? ORG_STATUS_CONFIG.active.label
                          : ORG_STATUS_CONFIG.inactive.label}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">注册时间</span>
                    <p className="font-medium">{formatDateTime(detail.created_at)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">所属组织</span>
                    {detail.organizations.length === 0 ? (
                      <p className="text-sm text-muted-foreground">暂无</p>
                    ) : (
                      <ul className="mt-1 space-y-1">
                        {detail.organizations.map((org) => (
                          <li
                            key={org.id}
                            className="flex items-center justify-between rounded border px-2 py-1 text-sm"
                          >
                            <span>{org.name}</span>
                            <Badge variant="outline">{org.role}</Badge>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => openGiftDialog(detail)}
                      disabled={detail.organizations.length === 0}
                    >
                      <Gift className="mr-2 h-4 w-4" />
                      赠送服务
                    </Button>
                    {detail.is_active ? (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDisableConfirmUserId(detail.id)}
                        disabled={setActiveMutation.isPending}
                      >
                        停用账号
                      </Button>
                    ) : (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => {
                          setActiveMutation.mutate({
                            id: detail.id,
                            is_active: true,
                          });
                        }}
                        disabled={setActiveMutation.isPending}
                      >
                        启用账号
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => setDeleteConfirmUserId(detail.id)}
                      disabled={deleteUserMutation.isPending}
                    >
                      删除账号
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">加载失败</p>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={isGiftOpen} onOpenChange={setIsGiftOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>赠送服务</DialogTitle>
            <DialogDescription>
              为该用户所属组织发起 0 元赠送订单。若组织当前已有同服务生效订阅，会在现有到期日后顺延；不同服务切换仍需走正常订阅调整流程。
            </DialogDescription>
          </DialogHeader>
          {detail ? (
            <Form {...giftForm}>
              <form
                onSubmit={giftForm.handleSubmit((values) =>
                  giftSubscriptionMutation.mutate(values)
                )}
                className="space-y-4"
              >
                <FormField
                  control={giftForm.control}
                  name="organization_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>目标组织</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="请选择组织" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {detail.organizations.map((org) => (
                            <SelectItem key={org.id} value={org.id}>
                              {org.name} ({org.role})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={giftForm.control}
                  name="service_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>赠送服务</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                          const nextPlan = plans.find((plan) => plan.id === value) ?? null;
                          const nextPricing = nextPlan?.pricing?.[0]?.id ?? '';
                          giftForm.setValue('pricing_id', nextPricing, { shouldValidate: true });
                        }}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={plansLoading ? '加载中...' : '请选择服务'} />
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
                  control={giftForm.control}
                  name="pricing_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>赠送周期</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="请选择周期" />
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
                  control={giftForm.control}
                  name="gift_months"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>附加赠送月数</FormLabel>
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
                    本次将按原价 ¥{selectedPricing.price.toLocaleString()} 记录为运营赠送，
                    基础周期 {selectedPricing.months} 个月，
                    附加赠送 {giftForm.watch('gift_months')} 个月。
                  </div>
                )}

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsGiftOpen(false)}>
                    取消
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      giftSubscriptionMutation.isPending || detail.organizations.length === 0
                    }
                  >
                    {giftSubscriptionMutation.isPending ? '赠送中...' : '确认赠送'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          ) : (
            <p className="text-sm text-muted-foreground">请先选择目标用户。</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
