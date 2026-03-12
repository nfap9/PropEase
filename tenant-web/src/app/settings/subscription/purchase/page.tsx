'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Check, Crown, Zap, Building2, ArrowLeft, Loader2, ShoppingCart, Tag } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { subscriptionsApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/utils/error';
import { useAuth } from '@/lib/auth/context';
import type { SubscriptionPlan, PlanPricing } from '@/types';

const SUBSCRIPTION = {
  HEADING: 'subscription-purchase-heading',
  BACK_BTN: 'subscription-purchase-back-btn',
  PLANS_GRID: 'subscription-purchase-plans-grid',
  CONFIRM_DIALOG: 'subscription-purchase-confirm-dialog',
  PLAN_CARD: 'subscription-purchase-plan-card',
  SUBSCRIBE_BTN: 'subscription-purchase-subscribe-btn',
} as const;

const PLAN_ICONS: Record<string, typeof Crown> = {
  free: Building2,
  pro: Zap,
  enterprise: Crown,
};

const PLAN_COLORS: Record<string, string> = {
  free: 'border-muted',
  pro: 'border-primary',
  enterprise: 'border-yellow-500',
};

export default function SubscriptionPurchasePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { organization } = useAuth();
  const orgId = organization?.id;

  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [selectedPricing, setSelectedPricing] = useState<PlanPricing | null>(null);

  // 获取套餐列表
  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: () => subscriptionsApi.listPlans(true),
    enabled: !!orgId,
  });

  // 获取当前订阅状态
  const { data: subscriptionStatus } = useQuery({
    queryKey: ['subscription-status', orgId],
    queryFn: () => subscriptionsApi.getSubscriptionStatus(orgId!),
    enabled: !!orgId,
  });

  // 免费套餐直接订阅
  const subscribeMutation = useMutation({
    mutationFn: (params: { planId: string; billingMonths: number }) =>
      subscriptionsApi.subscribe(orgId!, {
        plan_id: params.planId,
        billing_cycle: params.billingMonths === 12 ? 'yearly' : 'monthly',
        auto_renew: true,
      }),
    onSuccess: () => {
      toast.success('订阅成功！');
      queryClient.invalidateQueries({ queryKey: ['subscription-status', orgId] });
      queryClient.invalidateQueries({ queryKey: ['organization-usage', orgId] });
      setSelectedPlan(null);
      router.push('/settings/subscription');
    },
    onError: (error) => toast.error(getErrorMessage(error, '订阅失败，请重试')),
  });

  // 付费套餐：创建订单后跳转支付页
  const createOrderMutation = useMutation({
    mutationFn: (params: { planId: string; billingMonths: number }) =>
      subscriptionsApi.createOrder(orgId!, {
        plan_id: params.planId,
        billing_cycle: params.billingMonths === 12 ? 'yearly' : 'monthly',
        billing_months: params.billingMonths,
      }),
    onSuccess: (order) => {
      setSelectedPlan(null);
      router.push(`/settings/subscription/pay?order_id=${order.id}`);
    },
    onError: (error) => toast.error(getErrorMessage(error, '创建订单失败，请重试')),
  });

  const handleSubscribe = (plan: SubscriptionPlan, pricing?: PlanPricing) => {
    setSelectedPlan(plan);
    setSelectedPricing(pricing ?? null);
  };

  const handleConfirmSubscribe = () => {
    if (!selectedPlan) return;

    const billingMonths = selectedPricing?.months ?? 1;
    const price = selectedPricing?.price ?? (billingMonths === 12 ? selectedPlan.price_yearly : selectedPlan.price_monthly);

    if (price <= 0) {
      subscribeMutation.mutate({ planId: selectedPlan.id, billingMonths });
    } else {
      createOrderMutation.mutate({ planId: selectedPlan.id, billingMonths });
    }
  };

  const formatPrice = (price: number) => {
    return price === 0 ? '免费' : `¥${price}`;
  };

  const getLimitText = (limit: number | null) => {
    return limit == null || limit === -1 ? '无限制' : limit.toString();
  };

  const isPending = subscribeMutation.isPending || createOrderMutation.isPending;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/settings/subscription')}
            data-testid={SUBSCRIPTION.BACK_BTN}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回
          </Button>
          <div className="flex-1">
            <h1
              className="flex items-center gap-2 text-3xl font-bold"
              data-testid={SUBSCRIPTION.HEADING}
            >
              <ShoppingCart className="h-8 w-8" />
              套餐购买
            </h1>
            <p className="text-muted-foreground">选择适合您的订阅套餐</p>
          </div>
        </div>

        {/* Plans Grid */}
        {plansLoading ? (
          <div className="grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="relative">
                <CardHeader>
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="mt-2 h-4 w-full" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : plans && plans.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-3" data-testid={SUBSCRIPTION.PLANS_GRID}>
            {plans.map((plan) => {
              const Icon = PLAN_ICONS[plan.code] || Building2;
              const isCurrentPlan = subscriptionStatus?.plan?.code === plan.code;
              const pricing = plan.pricing ?? [];

              return (
                <Card
                  key={plan.id}
                  className={`relative ${PLAN_COLORS[plan.code] || ''} ${
                    isCurrentPlan ? 'ring-2 ring-primary' : ''
                  }`}
                  data-testid={SUBSCRIPTION.PLAN_CARD}
                >
                  {isCurrentPlan && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge>当前套餐</Badge>
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Icon className="h-6 w-6" />
                      <CardTitle>{plan.name}</CardTitle>
                    </div>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* 周期定价选择 */}
                    {pricing.length > 0 ? (
                      <div className="space-y-2">
                        {pricing.map((p) => (
                          <button
                            key={p.id}
                            className="flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors hover:bg-muted"
                            onClick={() => handleSubscribe(plan, p)}
                            disabled={isCurrentPlan || isPending}
                          >
                            <div>
                              <p className="font-medium">{p.months} 个月</p>
                              {p.months >= 12 && (
                                <Badge variant="outline" className="text-xs">
                                  <Tag className="mr-1 h-3 w-3" />
                                  优惠
                                </Badge>
                              )}
                            </div>
                            <p className="text-lg font-bold">{formatPrice(Number(p.price))}</p>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <>
                        <div className="text-3xl font-bold">
                          {formatPrice(plan.price_monthly)}
                          {plan.price_monthly > 0 && (
                            <span className="text-sm font-normal text-muted-foreground">/月</span>
                          )}
                        </div>
                        <Button
                          className="w-full"
                          variant={isCurrentPlan ? 'outline' : 'default'}
                          disabled={isCurrentPlan || isPending}
                          onClick={() => handleSubscribe(plan)}
                          data-testid={SUBSCRIPTION.SUBSCRIBE_BTN}
                        >
                          {isCurrentPlan ? '当前套餐' : '立即订阅'}
                        </Button>
                      </>
                    )}

                    {/* 功能列表 */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>组织: {getLimitText(plan.max_organizations)} 个</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>公寓: {getLimitText(plan.max_apartments)} 个</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>房间: {getLimitText(plan.max_rooms)} 间</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>成员: {getLimitText(plan.max_members)} 人</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                暂无可订阅的付费套餐，免费套餐已在注册时自动开通。请联系运营方配置更多套餐。
              </p>
            </CardContent>
          </Card>
        )}

        {/* 付费套餐确认弹窗 */}
        <Dialog open={!!selectedPlan} onOpenChange={(open) => !open && setSelectedPlan(null)}>
          <DialogContent data-testid={SUBSCRIPTION.CONFIRM_DIALOG}>
            <DialogHeader>
              <DialogTitle>确认订阅</DialogTitle>
              <DialogDescription>
                确认订阅 {selectedPlan?.name}
                {selectedPricing && ` (${selectedPricing.months} 个月)`}？
                {selectedPricing && selectedPricing.price > 0 && (
                  <span className="block mt-2 font-medium text-foreground">
                    支付金额: ¥{selectedPricing.price}
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedPlan(null)}>
                取消
              </Button>
              <Button onClick={handleConfirmSubscribe} disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                确认{selectedPricing?.price && selectedPricing.price > 0 ? '并去支付' : '订阅'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
