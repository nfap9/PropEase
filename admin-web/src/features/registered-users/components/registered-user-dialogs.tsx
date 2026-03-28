'use client';

import type { UseFormReturn } from 'react-hook-form';
import { Gift } from 'lucide-react';
import { Badge } from '@apartment-ultra/shared-ui/components/ui';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
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
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@apartment-ultra/shared-ui/components/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@apartment-ultra/shared-ui/components/ui';
import { Skeleton } from '@apartment-ultra/shared-ui/components/ui';
import type { AdminPlan, AdminRegisteredUserDetail } from '@/lib/api/admin-client';
import { formatDateTime } from '@/lib/date-utils';
import { ORG_STATUS_CONFIG } from '@/lib/status-config';
import type { GiftSubscriptionForm } from '../registered-users.schemas';

type SelectedPricing = NonNullable<AdminPlan['pricing']>[number];

export function DisableRegisteredUserDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确认停用</AlertDialogTitle>
          <AlertDialogDescription>确定要停用该账号吗？停用后该用户将无法登录系统。</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? '处理中…' : '确定停用'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function DeleteRegisteredUserDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确认删除</AlertDialogTitle>
          <AlertDialogDescription>确定要删除该注册用户吗？删除后账号及其关联数据将无法恢复。</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? '处理中…' : '确定删除'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function RegisteredUserDetailSheet({
  open,
  onOpenChange,
  detailUserId,
  detail,
  detailLoading,
  onOpenGift,
  onDisable,
  onEnable,
  onDelete,
  isSetActivePending,
  isDeletePending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  detailUserId: string | null;
  detail: AdminRegisteredUserDetail | null | undefined;
  detailLoading: boolean;
  onOpenGift: () => void;
  onDisable: () => void;
  onEnable: () => void;
  onDelete: () => void;
  isSetActivePending: boolean;
  isDeletePending: boolean;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
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
                        detail.is_active ? ORG_STATUS_CONFIG.active.variant : ORG_STATUS_CONFIG.inactive.variant
                      }
                    >
                      {detail.is_active ? ORG_STATUS_CONFIG.active.label : ORG_STATUS_CONFIG.inactive.label}
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
                      {detail.organizations.map((organization) => (
                        <li
                          key={organization.id}
                          className="flex items-center justify-between rounded border px-2 py-1 text-sm"
                        >
                          <span>{organization.name}</span>
                          <Badge variant="outline">{organization.role}</Badge>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={onOpenGift}
                    disabled={detail.organizations.length === 0}
                  >
                    <Gift className="mr-2 h-4 w-4" />
                    赠送服务
                  </Button>
                  {detail.is_active ? (
                    <Button variant="destructive" size="sm" onClick={onDisable} disabled={isSetActivePending}>
                      停用账号
                    </Button>
                  ) : (
                    <Button variant="default" size="sm" onClick={onEnable} disabled={isSetActivePending}>
                      启用账号
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    onClick={onDelete}
                    disabled={isDeletePending}
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
  );
}

export function GiftSubscriptionDialog({
  open,
  onOpenChange,
  detail,
  plans,
  plansLoading,
  selectedGiftPlan,
  selectedPricing,
  form,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  detail: AdminRegisteredUserDetail | null | undefined;
  plans: AdminPlan[];
  plansLoading: boolean;
  selectedGiftPlan: AdminPlan | null;
  selectedPricing: SelectedPricing | null;
  form: UseFormReturn<GiftSubscriptionForm>;
  onSubmit: (data: GiftSubscriptionForm) => void;
  isPending: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>赠送服务</DialogTitle>
          <DialogDescription>
            为该用户所属团队发起 0 元赠送订单。若团队当前已有同服务生效订阅，会在现有到期日后顺延；不同服务切换仍需走正常订阅调整流程。
          </DialogDescription>
        </DialogHeader>
        {detail ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="organization_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>目标团队</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="请选择团队" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {detail.organizations.map((organization) => (
                          <SelectItem key={organization.id} value={organization.id}>
                            {organization.name} ({organization.role})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="service_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>赠送服务</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        const nextPlan = plans.find((plan) => plan.id === value) ?? null;
                        const nextPricingId = nextPlan?.pricing?.[0]?.id ?? '';
                        form.setValue('pricing_id', nextPricingId, { shouldValidate: true });
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
                control={form.control}
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
                control={form.control}
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
                  本次将按原价 ¥{selectedPricing.price.toLocaleString()} 记录为运营赠送，基础周期 {selectedPricing.months} 个月，附加赠送 {form.watch('gift_months')} 个月。
                </div>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  取消
                </Button>
                <Button type="submit" disabled={isPending || detail.organizations.length === 0}>
                  {isPending ? '赠送中...' : '确认赠送'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : (
          <p className="text-sm text-muted-foreground">请先选择目标用户。</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
