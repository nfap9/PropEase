
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { appToast } from '@apartment-ultra/shared-ui/components/ui';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@apartment-ultra/shared-ui/components/ui';
import { Badge } from '@apartment-ultra/shared-ui/components/ui';
import { Skeleton } from '@apartment-ultra/shared-ui/components/ui';
import {
  Check,
  Crown,
  Zap,
  Building2,
  Loader2,
  Tag,
  Gift,
  ArrowUpCircle,
  RefreshCw,
  PlusCircle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@apartment-ultra/shared-ui/components/ui';
import { subscriptionsApi } from '@/api';
import { getErrorMessage } from '@/utils/error';
import { useAuth } from '@/auth/context';
import type { StorefrontService, StorefrontServicePricing } from '@/api/subscriptions';
import { getPricingSummary } from './pricing';
import { tenantI18n, tenantMessages } from '@/i18n';

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

type OrderPreview = {
  action_type: 'purchase' | 'renew' | 'upgrade' | 'downgrade';
  service_name: string;
  current_service_name: string | null;
  original_price: number;
  credit: number;
  final_price: number;
  billing_months: number;
};

const ACTION_TYPE_CONFIG = {
  purchase: { label: '购买', icon: PlusCircle, color: 'text-blue-600' },
  renew: { label: '续费', icon: RefreshCw, color: 'text-green-600' },
  upgrade: { label: '升级', icon: ArrowUpCircle, color: 'text-amber-600' },
  downgrade: { label: '降级', icon: RefreshCw, color: 'text-gray-600' },
};

export default function SubscriptionPurchasePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { organization } = useAuth();
  const orgId = organization?.id;

  const [selectedService, setSelectedService] = useState<StorefrontService | null>(null);
  const [selectedPricing, setSelectedPricing] = useState<StorefrontServicePricing | null>(null);
  const [orderPreview, setOrderPreview] = useState<OrderPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

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
      setOrderPreview(null);
      navigate(`/settings/subscription/pay?order_id=${order.id}`);
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
      setOrderPreview(null);
      navigate('/settings/subscription');
    },
    onError: (error) =>
      appToast.error(
        getErrorMessage(error, tenantMessages.settings.subscriptionPage.purchase.subscribeFailed)
      ),
  });

  // 获取订单预览
  const fetchOrderPreview = async (serviceId: string, billingMonths: number) => {
    if (!orgId) return null;
    try {
      setPreviewLoading(true);
      const preview = await subscriptionsApi.previewOrder(orgId, { service_id: serviceId, billing_months: billingMonths });
      setOrderPreview(preview);
      return preview;
    } catch {
      setOrderPreview(null);
      return null;
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSubscribe = async (service: StorefrontService, pricing?: StorefrontServicePricing) => {
    setSelectedService(service);
    setSelectedPricing(pricing ?? null);
    setOrderPreview(null);
    // 获取订单预览
    const billingMonths = pricing?.months ?? 1;
    await fetchOrderPreview(service.id, billingMonths);
  };

  const handleConfirmSubscribe = () => {
    if (!selectedService) return;

    const billingMonths = selectedPricing?.months ?? 1;
    const price = orderPreview?.final_price ?? getPricingSummary(selectedPricing).finalPrice;

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
    if (limit == null || limit >= 999999) {
      return tenantMessages.settings.subscriptionPage.purchase.unlimited;
    }
    return limit.toString();
  };

  const isPending = subscribeMutation.isPending || createOrderMutation.isPending;
  // 只显示已设置定价的服务
  const services = (storefront?.services ?? []).filter((s) => (s.pricing ?? []).length > 0);
  const selectedPricingSummary = getPricingSummary(selectedPricing);

  const actionConfig = orderPreview ? ACTION_TYPE_CONFIG[orderPreview.action_type] : null;

  return (
    <div className="space-y-6">
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
                    isCurrentPlan ? 'ring-2 ring-amber-500' : ''
                  }`}
                  data-testid={SUBSCRIPTION.SERVICE_CARD}
                >
                  {isCurrentPlan && (
                    <div className="absolute -top-px -right-px -mr-px -mt-px">
                      <Badge className="bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow-md rounded-none rounded-tr-md rounded-bl-md">
                        {tenantMessages.settings.subscriptionPage.purchase.currentBadge}
                      </Badge>
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
                              disabled={isPending}
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
                        disabled={isPending}
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
              <DialogTitle>
                {actionConfig ? (
                  <span className={`flex items-center gap-2 ${actionConfig.color}`}>
                    {(() => {
                      const Icon = actionConfig.icon;
                      return <Icon className="h-5 w-5" />;
                    })()}
                    {actionConfig.label}确认
                  </span>
                ) : (
                  tenantMessages.settings.subscriptionPage.purchase.confirmTitle
                )}
              </DialogTitle>
              <DialogDescription>
                {orderPreview ? (
                  <>
                    {orderPreview.action_type === 'upgrade' && orderPreview.current_service_name && (
                      <span className="text-amber-600">
                        从 {orderPreview.current_service_name} 升级到 {orderPreview.service_name}
                      </span>
                    )}
                    {orderPreview.action_type === 'renew' && orderPreview.current_service_name && (
                      <span className="text-green-600">
                        续费 {orderPreview.service_name}
                      </span>
                    )}
                    {orderPreview.action_type === 'purchase' && (
                      <span>购买 {orderPreview.service_name}</span>
                    )}
                    {orderPreview.action_type === 'downgrade' && orderPreview.current_service_name && (
                      <span className="text-gray-600">
                        从 {orderPreview.current_service_name} 降级到 {orderPreview.service_name}
                      </span>
                    )}
                    {selectedPricing && ` (${selectedPricing.months}个月)`}
                  </>
                ) : (
                  tenantI18n.t('settings.subscriptionPage.purchase.confirmDescription', {
                    name: selectedService?.name ?? '',
                    duration: selectedPricing
                      ? ` (${tenantI18n.t('settings.subscriptionPage.purchase.durationMonths', {
                          months: selectedPricing.months,
                        })})`
                      : '',
                  })
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {previewLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : orderPreview ? (
                <div className="space-y-3 rounded-lg border p-4">
                  <div className="flex justify-between">
                    <span>原价</span>
                    <span>¥{orderPreview.original_price.toFixed(2)}</span>
                  </div>
                  {orderPreview.credit > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>抵扣（升级）</span>
                      <span>-¥{orderPreview.credit.toFixed(2)}</span>
                    </div>
                  )}
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
                    <span className="text-xl">{formatPrice(orderPreview.final_price)}</span>
                  </div>
                </div>
              ) : selectedPricing ? (
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
              ) : null}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedService(null)}>
                {tenantMessages.common.cancel}
              </Button>
              <Button onClick={handleConfirmSubscribe} disabled={isPending || previewLoading}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {tenantMessages.common.confirm}
                {orderPreview && orderPreview.final_price > 0
                  ? tenantMessages.settings.subscriptionPage.purchase.confirmAndPay
                  : tenantMessages.settings.subscriptionPage.purchase.subscribe}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
  );
}
