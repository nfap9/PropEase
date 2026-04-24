/**
 * SubscriptionView - 订阅管理视图
 *
 * 自包含视图，内部管理：
 * - 订阅状态展示
 * - 配额使用展示
 */
import { useNavigate } from 'react-router-dom';
import { Button, Card, Tag, Skeleton } from 'antd';
import { SUBSCRIPTION_STATUS_CONFIG, type BadgeVariant } from '@/constants/status';
import {
  Package,
  Building2,
  Home,
  Users,
  Calendar,
  ShoppingCart,
} from 'lucide-react';
import { useAuth } from '@/contexts/auth';
import { tenantI18n, tenantMessages } from '@/i18n';
import { useSubscriptionPage } from '../hooks/use-subscription-page';

const BADGE_VARIANT_TO_TAG_COLOR: Record<BadgeVariant, string> = {
  default: 'blue',
  secondary: 'default',
  destructive: 'red',
  outline: 'gold',
  success: 'green',
  warning: 'orange',
  info: 'processing',
};

export function SubscriptionView() {
  const navigate = useNavigate();
  const { subscriptionStatus, usage, isLoading, getUsagePercent, formatDate } = useSubscriptionPage();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-end">
        <Button
          onClick={() => navigate('/workspace/subscription/purchase')}
          data-testid="subscription-upgrade-btn"
          icon={<ShoppingCart className="h-4 w-4" />}
        >
          {tenantMessages.settings.subscriptionPage.buyService}
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <Skeleton active avatar paragraph={{ rows: 3 }} />
          <Skeleton active avatar paragraph={{ rows: 5 }} />
        </div>
      ) : (
        <>
          {/* 当前订阅卡片 */}
          <Card
            data-testid="subscription-current"
            title={
              <span className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                {tenantMessages.settings.subscriptionPage.currentServiceTitle}
              </span>
            }
          >
            {subscriptionStatus?.has_subscription && subscriptionStatus.service ? (
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-2xl font-bold">{subscriptionStatus.service.name}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {tenantMessages.settings.subscriptionPage.statusLabel}
                    </span>
                    <Tag
                      color={
                        BADGE_VARIANT_TO_TAG_COLOR[
                          SUBSCRIPTION_STATUS_CONFIG[subscriptionStatus.status ?? 'none']?.variant ?? 'secondary'
                        ]
                      }
                    >
                      {SUBSCRIPTION_STATUS_CONFIG[subscriptionStatus.status ?? 'none']?.label ??
                        subscriptionStatus.status ??
                        tenantMessages.settings.subscriptionPage.none}
                    </Tag>
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
                <Button
                  onClick={() => navigate('/workspace/subscription/purchase')}
                  icon={<ShoppingCart className="h-4 w-4" />}
                >
                  {tenantMessages.settings.subscriptionPage.buyService}
                </Button>
              </div>
            )}
          </Card>

          {/* 配额使用卡片 */}
          <Card
            data-testid="subscription-usage-card"
            title={
              <span className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {tenantMessages.settings.subscriptionPage.usageTitle}
              </span>
            }
          >
            <div className="mb-4 text-muted-foreground">
              {tenantMessages.settings.subscriptionPage.usageDescription}
            </div>
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
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-blue-500 transition-all"
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
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-blue-500 transition-all"
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
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-blue-500 transition-all"
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
          </Card>

          {/* 续费/升级提示 */}
          {subscriptionStatus?.service?.code === 'free' && (
            <Card className="border-blue-500/50 bg-blue-500/5">
              <div className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{tenantMessages.settings.subscriptionPage.upgradeTitle}</p>
                    <p className="text-sm text-muted-foreground">
                      {tenantMessages.settings.subscriptionPage.upgradeDescription}
                    </p>
                  </div>
                  <Button onClick={() => navigate('/workspace/subscription/purchase')}>
                    {tenantMessages.settings.subscriptionPage.viewServices}
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
