'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SUBSCRIPTION_STATUS_CONFIG } from '@/lib/status-config';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  CreditCard,
  Package,
  Building2,
  Home,
  Users,
  Calendar,
  ShoppingCart,
} from 'lucide-react';
import { subscriptionsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth/context';

const SUBSCRIPTION = {
  HEADING: 'subscription-heading',
  CURRENT_SUBSCRIPTION: 'subscription-current',
  USAGE_CARD: 'subscription-usage-card',
  UPGRADE_BUTTON: 'subscription-upgrade-btn',
} as const;

export default function SubscriptionPage() {
  const router = useRouter();
  const { organization } = useAuth();
  const orgId = organization?.id;

  // 获取当前订阅状态
  const { data: subscriptionStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['subscription-status', orgId],
    queryFn: () => subscriptionsApi.getSubscriptionStatus(orgId!),
    enabled: !!orgId,
  });

  // 获取使用量统计
  const { data: usage, isLoading: usageLoading } = useQuery({
    queryKey: ['organization-usage', orgId],
    queryFn: () => subscriptionsApi.getUsage(orgId!),
    enabled: !!orgId,
  });

  const isLoading = statusLoading || usageLoading;

  const getUsagePercent = (used: number, max: number) => {
    if (max <= 0) return 0;
    return Math.min(100, Math.round((used / max) * 100));
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('zh-CN');
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/settings')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回
          </Button>
          <div className="flex-1">
            <h1 className="flex items-center gap-2 text-3xl font-bold" data-testid={SUBSCRIPTION.HEADING}>
              <CreditCard className="h-8 w-8" />
              我的订阅
            </h1>
            <p className="text-muted-foreground">查看订阅状态与使用量</p>
          </div>
          <Button onClick={() => router.push('/settings/subscription/purchase')} data-testid={SUBSCRIPTION.UPGRADE_BUTTON}>
            <ShoppingCart className="mr-2 h-4 w-4" />
            购买套餐
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : (
          <>
            {/* 当前订阅卡片 */}
            <Card data-testid={SUBSCRIPTION.CURRENT_SUBSCRIPTION}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  当前套餐
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-2xl font-bold">{subscriptionStatus?.plan?.name || '免费版'}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">状态:</span>
                      <Badge
                        variant={
                          SUBSCRIPTION_STATUS_CONFIG[subscriptionStatus?.status ?? 'none']?.variant ??
                          'secondary'
                        }
                      >
                        {SUBSCRIPTION_STATUS_CONFIG[subscriptionStatus?.status ?? 'none']?.label ??
                          subscriptionStatus?.status ??
                          '未订阅'}
                      </Badge>
                    </div>
                    {subscriptionStatus?.is_active && subscriptionStatus.end_date && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        到期日期: {formatDate(subscriptionStatus.end_date)}
                        {subscriptionStatus.days_remaining !== null && subscriptionStatus.days_remaining > 0 && (
                          <span className="ml-2 text-amber-600">
                            (剩余 {subscriptionStatus.days_remaining} 天)
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 配额使用卡片 */}
            <Card data-testid={SUBSCRIPTION.USAGE_CARD}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  配额使用
                </CardTitle>
                <CardDescription>当前组织的资源使用情况</CardDescription>
              </CardHeader>
              <CardContent>
                {usage ? (
                  <div className="grid gap-6 md:grid-cols-3">
                    {/* 公寓 */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">公寓</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {usage.apartments_used} / {usage.max_apartments === -1 ? '∞' : usage.max_apartments}
                        </span>
                      </div>
                      {usage.max_apartments > 0 && (
                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${getUsagePercent(usage.apartments_used, usage.max_apartments)}%` }}
                          />
                        </div>
                      )}
                      {usage.apartments_remaining !== null && usage.apartments_remaining >= 0 && (
                        <p className="text-xs text-muted-foreground">
                          剩余 {usage.apartments_remaining} 个
                        </p>
                      )}
                    </div>

                    {/* 房间 */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Home className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">房间</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {usage.rooms_used} / {usage.max_rooms === -1 ? '∞' : usage.max_rooms}
                        </span>
                      </div>
                      {usage.max_rooms > 0 && (
                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${getUsagePercent(usage.rooms_used, usage.max_rooms)}%` }}
                          />
                        </div>
                      )}
                      {usage.rooms_remaining !== null && usage.rooms_remaining >= 0 && (
                        <p className="text-xs text-muted-foreground">
                          剩余 {usage.rooms_remaining} 间
                        </p>
                      )}
                    </div>

                    {/* 成员 */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">成员</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {usage.members_used} / {usage.max_members === -1 ? '∞' : usage.max_members}
                        </span>
                      </div>
                      {usage.max_members > 0 && (
                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${getUsagePercent(usage.members_used, usage.max_members)}%` }}
                          />
                        </div>
                      )}
                      {usage.members_remaining !== null && usage.members_remaining >= 0 && (
                        <p className="text-xs text-muted-foreground">
                          剩余 {usage.members_remaining} 人
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">暂无使用数据</p>
                )}
              </CardContent>
            </Card>

            {/* 续费/升级提示 */}
            {subscriptionStatus?.plan?.code === 'free' && (
              <Card className="border-primary/50 bg-primary/5">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">升级获取更多功能</p>
                      <p className="text-sm text-muted-foreground">
                        解锁更多公寓、房间和成员配额
                      </p>
                    </div>
                    <Button onClick={() => router.push('/settings/subscription/purchase')}>
                      查看套餐
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
}
