'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SUBSCRIPTION_STATUS_CONFIG } from '@/lib/status-config';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Check,
  Crown,
  Zap,
  Building2,
  ArrowLeft,
  Loader2,
  CreditCard,
} from 'lucide-react';
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

export default function SubscriptionPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { organization } = useAuth();
  const orgId = organization?.id;

  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  // 获取套餐列表
  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: () => subscriptionsApi.listPlans(true),
    enabled: !!orgId,
  });

  // 获取当前订阅状态
  const { data: subscriptionStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['subscription-status', orgId],
    queryFn: () => subscriptionsApi.getSubscriptionStatus(orgId!),
    enabled: !!orgId,
  });

  // 免费套餐直接订阅
  const subscribeMutation = useMutation({
    mutationFn: (planId: string) =>
      subscriptionsApi.subscribe(orgId!, {
        plan_id: planId,
        billing_cycle: billingCycle,
        auto_renew: true,
      }),
    onSuccess: () => {
      toast.success('订阅成功！');
      queryClient.invalidateQueries({ queryKey: ['subscription-status', orgId] });
      queryClient.invalidateQueries({ queryKey: ['organization-usage', orgId] });
      setSelectedPlan(null);
    },
    onError: (error) => toast.error(getErrorMessage(error, '订阅失败，请重试')),
  });

  // 付费套餐：创建订单后跳转支付页
  const createOrderMutation = useMutation({
    mutationFn: (planId: string) =>
      subscriptionsApi.createOrder(orgId!, {
        plan_id: planId,
        billing_cycle: billingCycle,
      }),
    onSuccess: (order) => {
      setSelectedPlan(null);
      router.push(`/settings/subscription/pay?order_id=${order.id}`);
    },
    onError: (error) => toast.error(getErrorMessage(error, '创建订单失败，请重试')),
  });

  const handleSubscribe = (planId: string) => {
    const plan = plans?.find((p) => p.id === planId);
    const price = plan ? (billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly) : 0;
    if (price <= 0) {
      subscribeMutation.mutate(planId);
    } else {
      setSelectedPlan(planId);
    }
  };

  const handleConfirmSubscribe = () => {
    if (!selectedPlan) return;
    const plan = plans?.find((p) => p.id === selectedPlan);
    const price = plan ? (billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly) : 0;
    if (price <= 0) {
      subscribeMutation.mutate(selectedPlan);
    } else {
      createOrderMutation.mutate(selectedPlan);
    }
  };

  const formatPrice = (price: number) => {
    return price === 0 ? '免费' : `¥${price}`;
  };

  const getLimitText = (limit: number | null) => {
    return limit == null || limit === -1 ? '无限制' : limit.toString();
  };

  const isLoading = plansLoading || statusLoading;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/settings')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <CreditCard className="h-8 w-8" />
              订阅管理
            </h1>
            <p className="text-muted-foreground">选择适合您的订阅套餐</p>
          </div>
        </div>

        {/* Current Plan */}
        {subscriptionStatus && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">当前套餐</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{subscriptionStatus.plan?.name || '免费版'}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    状态:
                    <Badge
                      variant={
                        SUBSCRIPTION_STATUS_CONFIG[subscriptionStatus.status]?.variant ?? 'secondary'
                      }
                    >
                      {SUBSCRIPTION_STATUS_CONFIG[subscriptionStatus.status]?.label ??
                        subscriptionStatus.status}
                    </Badge>
                  </p>
                  {subscriptionStatus.days_remaining !== null && subscriptionStatus.days_remaining > 0 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      剩余 {subscriptionStatus.days_remaining} 天
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Billing Cycle Toggle */}
        <div className="flex items-center gap-2">
          <Button
            variant={billingCycle === 'monthly' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setBillingCycle('monthly')}
          >
            月付
          </Button>
          <Button
            variant={billingCycle === 'yearly' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setBillingCycle('yearly')}
          >
            年付 (省2个月)
          </Button>
        </div>

        {/* Plans Grid */}
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="relative">
                <CardHeader>
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-4 w-full mt-2" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : plans && plans.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((plan) => {
              const Icon = PLAN_ICONS[plan.code] || Building2;
              const price = billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly;
              const isCurrentPlan = subscriptionStatus?.plan?.code === plan.code;

              return (
                <Card
                  key={plan.id}
                  className={`relative ${PLAN_COLORS[plan.code] || ''} ${
                    isCurrentPlan ? 'ring-2 ring-primary' : ''
                  }`}
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
                    <div className="text-3xl font-bold">
                      {formatPrice(price)}
                      {price > 0 && (
                        <span className="text-sm font-normal text-muted-foreground">
                          /{billingCycle === 'monthly' ? '月' : '年'}
                        </span>
                      )}
                    </div>

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

                    <Button
                      className="w-full"
                      variant={isCurrentPlan ? 'outline' : 'default'}
                      disabled={
                        isCurrentPlan ||
                        subscribeMutation.isPending ||
                        (price > 0 && createOrderMutation.isPending)
                      }
                      onClick={() => handleSubscribe(plan.id)}
                    >
                      {(subscribeMutation.isPending || createOrderMutation.isPending) &&
                      selectedPlan === plan.id ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      {isCurrentPlan
                        ? '当前套餐'
                        : (billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly) <= 0
                          ? '立即开通'
                          : '立即订阅'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-center">
                暂无可订阅的付费套餐，免费套餐已在注册时自动开通。请联系运营方配置更多套餐。
              </p>
            </CardContent>
          </Card>
        )}

        {/* 付费套餐确认弹窗：跳转微信扫码支付 */}
        <Dialog open={!!selectedPlan} onOpenChange={(open) => !open && setSelectedPlan(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>确认订阅</DialogTitle>
              <DialogDescription>
                确认订阅 {plans?.find((p) => p.id === selectedPlan)?.name}？确认后将跳转至微信扫码支付。
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedPlan(null)}>
                取消
              </Button>
              <Button
                onClick={handleConfirmSubscribe}
                disabled={subscribeMutation.isPending || createOrderMutation.isPending}
              >
                {(subscribeMutation.isPending || createOrderMutation.isPending) && (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                )}
                确认并去支付
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
