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
import {
  Check,
  Crown,
  Zap,
  Building2,
  ArrowLeft,
  Loader2,
  CreditCard,
} from 'lucide-react';
import { subscriptionsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth/context';
import { SubscriptionPlan, SubscriptionStatus } from '@/types';

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

  // 订阅套餐
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
    onError: (error: Error) => {
      toast.error(`订阅失败: ${error.message}`);
    },
  });

  const handleSubscribe = (planId: string) => {
    if (planId === 'free') {
      // 免费套餐不需要支付
      subscribeMutation.mutate(planId);
    } else {
      // 付费套餐需要确认
      setSelectedPlan(planId);
    }
  };

  const handleConfirmSubscribe = () => {
    if (selectedPlan) {
      subscribeMutation.mutate(selectedPlan);
    }
  };

  const formatPrice = (price: number) => {
    return price === 0 ? '免费' : `¥${price}`;
  };

  const getLimitText = (limit: number) => {
    return limit === -1 ? '无限制' : limit.toString();
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
                  <p className="text-sm text-muted-foreground">
                    状态:
                    <Badge variant={subscriptionStatus.is_active ? 'default' : 'secondary'} className="ml-2">
                      {subscriptionStatus.status === 'active' ? '已激活' : subscriptionStatus.status}
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
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            {plans?.map((plan) => {
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
                      disabled={isCurrentPlan || subscribeMutation.isPending}
                      onClick={() => handleSubscribe(plan.id)}
                    >
                      {subscribeMutation.isPending && selectedPlan === plan.id ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      {isCurrentPlan ? '当前套餐' : plan.code === 'free' ? '切换到免费版' : '立即订阅'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Confirm Dialog (simplified) */}
        {selectedPlan && selectedPlan !== 'free' && (
          <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
            <CardContent className="pt-6">
              <p className="text-center mb-4">
                确认订阅 {plans?.find((p) => p.id === selectedPlan)?.name}？
                (实际支付功能待集成)
              </p>
              <div className="flex justify-center gap-4">
                <Button variant="outline" onClick={() => setSelectedPlan(null)}>
                  取消
                </Button>
                <Button onClick={handleConfirmSubscribe} disabled={subscribeMutation.isPending}>
                  {subscribeMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  确认订阅
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
