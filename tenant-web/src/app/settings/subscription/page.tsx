'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@apartment-ultra/shared-ui/components/ui';
import { Badge } from '@apartment-ultra/shared-ui/components/ui';
import { SUBSCRIPTION_STATUS_CONFIG } from '@/lib/status-config';
import { Skeleton } from '@apartment-ultra/shared-ui/components/ui';
import {
  ShoppingBag,
  Package,
  Building2,
  Home,
  Users,
  Calendar,
  ShoppingCart,
} from 'lucide-react';
import { subscriptionsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth/context';
import { tenantI18n, tenantMessages } from '@/lib/i18n';

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
    <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight" data-testid={SUBSCRIPTION.HEADING}>
              <ShoppingBag className="h-8 w-8" />
              {tenantMessages.settings.subscriptionPage.heading}
            </h1>
          </div>
          <Button onClick={() => router.push('/settings/subscription/purchase')} data-testid={SUBSCRIPTION.UPGRADE_BUTTON}>
            <ShoppingCart className="mr-2 h-4 w-4" />
            {tenantMessages.settings.subscriptionPage.buyService}
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
                  {tenantMessages.settings.subscriptionPage.currentServiceTitle}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {subscriptionStatus?.has_subscription && subscriptionStatus.service ? (
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-2xl font-bold">{subscriptionStatus.service.name}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {tenantMessages.settings.subscriptionPage.statusLabel}
                        </span>
                        <Badge
                          variant={
                            SUBSCRIPTION_STATUS_CONFIG[subscriptionStatus.status ?? 'none']?.variant ??
                            'secondary'
                          }
                        >
                          {SUBSCRIPTION_STATUS_CONFIG[subscriptionStatus.status ?? 'none']?.label ??
                            subscriptionStatus.status ??
                            tenantMessages.settings.subscriptionPage.none}
                        </Badge>
                      </div>
                      {subscriptionStatus.is_active && subscriptionStatus.end_date && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {tenantI18n.t('settings.subscriptionPage.validUntil', {
                            date: formatDate(subscriptionStatus.end_date),
                          })}
                          {subscriptionStatus.days_remaining !== null && subscriptionStatus.days_remaining > 0 && (
                            <span className="ml-2 text-amber-600">
                              {tenantI18n.t('settings.subscriptionPage.daysRemaining', {
                                days: subscriptionStatus.days_remaining,
                              })}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-4 py-4">
                    <p className="text-muted-foreground">{tenantMessages.settings.subscriptionPage.noService}</p>
                    <Button onClick={() => router.push('/settings/subscription/purchase')}>
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      {tenantMessages.settings.subscriptionPage.buyService}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 配额使用卡片 */}
            <Card data-testid={SUBSCRIPTION.USAGE_CARD}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  {tenantMessages.settings.subscriptionPage.usageTitle}
                </CardTitle>
                <CardDescription>{tenantMessages.settings.subscriptionPage.usageDescription}</CardDescription>
              </CardHeader>
              <CardContent>
                {usage ? (
                  <div className="grid gap-6 md:grid-cols-3">
                    {/* 公寓 */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{tenantMessages.settings.subscriptionPage.apartment}</span>
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
                          {tenantI18n.t('settings.subscriptionPage.remainingApartments', {
                            count: usage.apartments_remaining,
                          })}
                        </p>
                      )}
                    </div>

                    {/* 房间 */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Home className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{tenantMessages.settings.subscriptionPage.room}</span>
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
                          {tenantI18n.t('settings.subscriptionPage.remainingRooms', {
                            count: usage.rooms_remaining,
                          })}
                        </p>
                      )}
                    </div>

                    {/* 成员 */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{tenantMessages.settings.subscriptionPage.member}</span>
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
                          {tenantI18n.t('settings.subscriptionPage.remainingMembers', {
                            count: usage.members_remaining,
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">{tenantMessages.settings.subscriptionPage.noUsage}</p>
                )}
              </CardContent>
            </Card>

            {/* 续费/升级提示 */}
            {subscriptionStatus?.service?.code === 'free' && (
              <Card className="border-primary/50 bg-primary/5">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{tenantMessages.settings.subscriptionPage.upgradeTitle}</p>
                      <p className="text-sm text-muted-foreground">
                        {tenantMessages.settings.subscriptionPage.upgradeDescription}
                      </p>
                    </div>
                    <Button onClick={() => router.push('/settings/subscription/purchase')}>
                      {tenantMessages.settings.subscriptionPage.viewServices}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
  );
}
