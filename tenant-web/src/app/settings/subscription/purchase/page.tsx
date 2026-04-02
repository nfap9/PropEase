'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { appToast } from '@apartment-ultra/shared-ui/components/ui';
import { Button } from '@/components/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';
import { Badge } from '@apartment-ultra/shared-ui/components/ui';
import { Skeleton } from '@/components/ui';
import {
  Check,
  Crown,
  Zap,
  Building2,
  ArrowLeft,
  Loader2,
  ShoppingCart,
  Tag,
  Gift,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@apartment-ultra/shared-ui/components/ui';
import { subscriptionsApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/utils/error';
import { useAuth } from '@/lib/auth/context';
import type { StorefrontService, StorefrontServicePricing } from '@/lib/api/subscriptions';
import { getPricingSummary } from './pricing';
import { tenantI18n, tenantMessages } from '@/lib/i18n';

const SUBSCRIPTION = {
  HEADING: 'subscription-purchase-heading',
  BACK_BTN: 'subscription-purchase-back-btn',
  SERVICES_GRID: 'subscription-purchase-services-grid',
  CONFIRM_DIALOG: 'subscription-purchase-confirm-dialog',
  SERVICE_CARD: 'subscription-purchase-service-card',
  SUBSCRIBE_BTN: 'subscription-purchase-subscribe-btn',
} as const;

const SERVICE_ICONS: Record<string, typeof Crown> = {
  free: Building2,
  pro: Zap,
  enterprise: Crown,
};

const SERVICE_COLORS: Record<string, string> = {
  free: 'border-muted',
  pro: 'border-primary',
  enterprise: 'border-yellow-500',
};

export default function SubscriptionPurchasePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { organization } = useAuth();
  const orgId = organization?.id;

  const [selectedService, setSelectedService] = useState<StorefrontService | null>(null);
  const [selectedPricing, setSelectedPricing] = useState<StorefrontServicePricing | null>(null);

  // 获取商店视图
  const { data: storefront, isLoading: storefrontLoading } = useQuery({
    queryKey: ['storefront'],
    queryFn: () => subscriptionsApi.getStorefront(),
    enabled: !!orgId,
  });

  // 获取当前订阅状态
  const { data: subscriptionStatus } = useQuery({
    queryKey: ['subscription-status', orgId],
    queryFn: () => subscriptionsApi.getSubscriptionStatus(orgId!),
    enabled: !!orgId,
  });

  // 创建订单
  const createOrderMutation = useMutation({
    mutationFn: (params: { planId: string; billingMonths: number }) =>
      subscriptionsApi.createOrder(orgId!, {
        service_id: params.planId,
        billing_months: params.billingMonths,
      }),
    onSuccess: (order) => {
      setSelectedService(null);
      router.push(`/settings/subscription/pay?order_id=${order.id}`);
    },
    onError: (error) =>
      appToast.error(
        getErrorMessage(error, tenantMessages.settings.subscriptionPage.purchase.createOrderFailed)
      ),
  });

  // 免费服务直接订阅
  const subscribeMutation = useMutation({
    mutationFn: (params: { planId: string; billingMonths: number }) =>
      subscriptionsApi.subscribe(orgId!, {
        plan_id: params.planId,
        billing_cycle: params.billingMonths === 12 ? 'yearly' : 'monthly',
        auto_renew: true,
      }),
    onSuccess: () => {
      appToast.success(tenantMessages.settings.subscriptionPage.purchase.subscribeSuccess);
      queryClient.invalidateQueries({ queryKey: ['subscription-status', orgId] });
      queryClient.invalidateQueries({ queryKey: ['organization-usage', orgId] });
      setSelectedService(null);
      router.push('/settings/subscription');
    },
    onError: (error) =>
      appToast.error(
        getErrorMessage(error, tenantMessages.settings.subscriptionPage.purchase.subscribeFailed)
      ),
  });

  const handleSubscribe = (service: StorefrontService, pricing?: StorefrontServicePricing) => {
    setSelectedService(service);
    setSelectedPricing(pricing ?? null);
  };

  const handleConfirmSubscribe = () => {
    if (!selectedService) return;

    const billingMonths = selectedPricing?.months ?? 1;
    const price = getPricingSummary(selectedPricing).finalPrice;

    if (price <= 0) {
      subscribeMutation.mutate({ planId: selectedService.id, billingMonths });
    } else {
      createOrderMutation.mutate({
        planId: selectedService.id,
        billingMonths,
      });
    }
  };

  const formatPrice = (price: number) => {
    return price === 0 ? tenantMessages.settings.subscriptionPage.purchase.free : `¥${price.toFixed(2)}`;
  };

  const getLimitText = (limit: number | null) => {
    return limit == null || limit === -1
      ? tenantMessages.settings.subscriptionPage.purchase.unlimited
      : limit.toString();
  };

  const isPending = subscribeMutation.isPending || createOrderMutation.isPending;
  const services = storefront?.services ?? [];
  const selectedPricingSummary = getPricingSummary(selectedPricing);

  return (
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
            {tenantMessages.settings.subscriptionPage.purchase.back}
          </Button>
          <div className="flex-1">
            <h1
              className="flex items-center gap-2 text-2xl font-semibold tracking-tight"
              data-testid={SUBSCRIPTION.HEADING}
            >
              <ShoppingCart className="h-8 w-8" />
              {tenantMessages.settings.subscriptionPage.purchase.heading}
            </h1>
          </div>
        </div>

        {/* Services Grid */}
        {storefrontLoading ? (
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
        ) : services.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-3" data-testid={SUBSCRIPTION.SERVICES_GRID}>
            {services.map((service) => {
              const Icon = SERVICE_ICONS[service.code] || Building2;
              const isCurrentPlan = subscriptionStatus?.service?.code === service.code;
              const pricing = service.pricing ?? [];

              return (
                <Card
                  key={service.id}
                  className={`relative ${SERVICE_COLORS[service.code] || ''} ${
                    isCurrentPlan ? 'ring-2 ring-primary' : ''
                  }`}
                  data-testid={SUBSCRIPTION.SERVICE_CARD}
                >
                  {isCurrentPlan && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge>{tenantMessages.settings.subscriptionPage.purchase.currentBadge}</Badge>
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Icon className="h-6 w-6" />
                      <CardTitle>{service.name}</CardTitle>
                    </div>
                    <CardDescription>{service.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* 周期定价选择 */}
                    {pricing.length > 0 ? (
                      <div className="space-y-2">
                        {pricing.map((p) => {
                          const pricingSummary = getPricingSummary(p);

                          return (
                            <button
                              key={p.id}
                              className="flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors hover:bg-muted"
                              onClick={() => handleSubscribe(service, p)}
                              disabled={isCurrentPlan || isPending}
                            >
                              <div>
                                <p className="font-medium">
                                  {tenantI18n.t('settings.subscriptionPage.purchase.durationMonths', {
                                    months: p.months,
                                  })}
                                </p>
                                {pricingSummary.giftMonths > 0 && (
                                  <Badge variant="outline" className="text-xs text-purple-600">
                                    <Gift className="mr-1 h-3 w-3" />
                                    {tenantI18n.t('settings.subscriptionPage.purchase.giftMonths', {
                                      months: pricingSummary.giftMonths,
                                    })}
                                  </Badge>
                                )}
                                {pricingSummary.discountAmount > 0 && (
                                  <Badge variant="outline" className="text-xs text-green-600">
                                    <Tag className="mr-1 h-3 w-3" />
                                    {tenantI18n.t('settings.subscriptionPage.purchase.discountAmount', {
                                      amount: pricingSummary.discountAmount.toFixed(0),
                                    })}
                                  </Badge>
                                )}
                              </div>
                              <div className="text-right">
                                {pricingSummary.discountAmount > 0 && (
                                  <p className="text-sm text-muted-foreground line-through">
                                    ¥{pricingSummary.originalPrice.toFixed(2)}
                                  </p>
                                )}
                                <p className="text-lg font-bold">
                                  {formatPrice(pricingSummary.finalPrice)}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <Button
                        className="w-full"
                        variant={isCurrentPlan ? 'outline' : 'default'}
                        disabled={isCurrentPlan || isPending}
                        onClick={() => handleSubscribe(service)}
                        data-testid={SUBSCRIPTION.SUBSCRIBE_BTN}
                      >
                        {isCurrentPlan
                          ? tenantMessages.settings.subscriptionPage.purchase.currentBadge
                          : tenantMessages.settings.subscriptionPage.purchase.immediateSubscribe}
                      </Button>
                    )}

                    {/* 功能列表 */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>
                          {tenantI18n.t('settings.subscriptionPage.purchase.teamLimit', {
                            count: getLimitText(service.max_organizations),
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>
                          {tenantI18n.t('settings.subscriptionPage.purchase.apartmentLimit', {
                            count: getLimitText(service.max_apartments),
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>
                          {tenantI18n.t('settings.subscriptionPage.purchase.roomLimit', {
                            count: getLimitText(service.max_rooms),
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>
                          {tenantI18n.t('settings.subscriptionPage.purchase.memberLimit', {
                            count: getLimitText(service.max_members),
                          })}
                        </span>
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
                {tenantMessages.settings.subscriptionPage.purchase.empty}
              </p>
            </CardContent>
          </Card>
        )}

        {/* 确认弹窗 */}
        <Dialog open={!!selectedService} onOpenChange={(open) => !open && setSelectedService(null)}>
          <DialogContent className="max-w-lg" data-testid={SUBSCRIPTION.CONFIRM_DIALOG}>
            <DialogHeader>
              <DialogTitle>{tenantMessages.settings.subscriptionPage.purchase.confirmTitle}</DialogTitle>
              <DialogDescription>
                {tenantI18n.t('settings.subscriptionPage.purchase.confirmDescription', {
                  name: selectedService?.name ?? '',
                  duration: selectedPricing
                    ? ` (${tenantI18n.t('settings.subscriptionPage.purchase.durationMonths', {
                        months: selectedPricing.months,
                      })})`
                    : '',
                })}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* 价格明细 */}
              {selectedPricing && (
                <div className="space-y-3 rounded-lg border p-4">
                  <div className="flex justify-between">
                    <span>{tenantMessages.settings.subscriptionPage.purchase.originalPrice}</span>
                    <span>¥{selectedPricingSummary.originalPrice.toFixed(2)}</span>
                  </div>
                  {selectedPricingSummary.discountAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>
                        <Tag className="mr-1 inline h-4 w-4" />
                        {tenantMessages.settings.subscriptionPage.purchase.discount}
                      </span>
                      <span>-¥{selectedPricingSummary.discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {selectedPricingSummary.giftMonths > 0 && (
                    <div className="flex justify-between text-purple-600">
                      <span>
                        <Gift className="mr-1 inline h-4 w-4" />
                        {tenantMessages.settings.subscriptionPage.purchase.giftDuration}
                      </span>
                      <span>
                        +{tenantI18n.t('settings.subscriptionPage.purchase.durationMonths', {
                          months: selectedPricingSummary.giftMonths,
                        })}
                      </span>
                    </div>
                  )}
                  <div className="border-t flex justify-between pt-2 font-bold">
                    <span>{tenantMessages.settings.subscriptionPage.purchase.finalPrice}</span>
                    <span className="text-xl">{formatPrice(selectedPricingSummary.finalPrice)}</span>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedService(null)}>
                {tenantMessages.common.cancel}
              </Button>
              <Button onClick={handleConfirmSubscribe} disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {tenantMessages.common.confirm}
                {selectedPricing && selectedPricingSummary.finalPrice > 0
                  ? tenantMessages.settings.subscriptionPage.purchase.confirmAndPay
                  : tenantMessages.settings.subscriptionPage.purchase.subscribe}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
  );
}
