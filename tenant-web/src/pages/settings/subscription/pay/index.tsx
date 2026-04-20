import { Suspense, useCallback, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Tag, Skeleton } from 'antd';
import { ORDER_STATUS_CONFIG, type BadgeVariant } from '@/utils/status';
import { ArrowLeft, Loader2, Zap } from 'lucide-react';
import { subscriptionsApi } from '@/api/subscriptions';
import { useAuth } from '@/contexts/auth';
import { toast } from 'sonner';
import { tenantI18n, tenantMessages } from '@/i18n';

const POLL_INTERVAL_MS = 2500;

const BADGE_VARIANT_TO_TAG_COLOR: Record<BadgeVariant, string> = {
  default: 'blue',
  secondary: 'default',
  destructive: 'red',
  outline: 'gold',
  success: 'green',
  warning: 'orange',
  info: 'processing',
};

function SubscriptionPayContent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id');
  const { organization } = useAuth();
  const orgId = organization?.id;

  const {
    data: order,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['subscription-order', orgId, orderId],
    queryFn: () => subscriptionsApi.getOrder(orgId!, orderId!),
    enabled: !!orgId && !!orderId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'paid' || status === 'failed' || status === 'cancelled') return false;
      return POLL_INTERVAL_MS;
    },
  });

  // 开发环境直接完成订阅（用于测试）
  const directCompleteMutation = useMutation({
    mutationFn: async () => {
      if (!orgId || !orderId) throw new Error('缺少 orgId 或 orderId');
      await subscriptionsApi.simulatePay(orgId, orderId);
    },
    onSuccess: () => {
      toast.success('直接完成订阅成功（开发环境）');
      queryClient.invalidateQueries({ queryKey: ['subscription-status', orgId] });
      queryClient.invalidateQueries({ queryKey: ['organization-usage', orgId] });
      navigate('/workspace/subscription');
    },
    onError: (error) => {
      toast.error(`直接完成订阅失败: ${error instanceof Error ? error.message : '未知错误'}`);
    },
  });

  const handleBack = useCallback(() => {
    navigate('/workspace/subscription');
  }, [navigate]);

  useEffect(() => {
    if (order?.status === 'paid') {
      navigate(`/workspace/subscription/result?order_id=${orderId}&status=success`, { replace: true });
    }
  }, [order?.status, orderId, navigate]);

  if (!orderId || !orgId) {
    return (
      <div className="space-y-6">
        <p className="text-muted-foreground">{tenantMessages.settings.subscriptionPage.pay.missingOrder}</p>
        <Button variant="outlined" onClick={handleBack} icon={<ArrowLeft className="h-4 w-4" />}>
          {tenantMessages.settings.subscriptionPage.pay.backToSubscription}
        </Button>
      </div>
    );
  }

  if (isLoading && !order) {
    return (
      <div className="space-y-6">
        <Skeleton.Input active size="small" className="w-48" />
        <Card>
          <Skeleton active avatar={false} paragraph={{ rows: 3 }} />
        </Card>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="space-y-6">
        <p className="text-red-500">{tenantMessages.settings.subscriptionPage.pay.loadFailed}</p>
        <Button variant="outlined" onClick={handleBack} icon={<ArrowLeft className="h-4 w-4" />}>
          {tenantMessages.settings.subscriptionPage.pay.backToSubscription}
        </Button>
      </div>
    );
  }

  if (order.status === 'paid') {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <p>{tenantMessages.settings.subscriptionPage.pay.paidRedirecting}</p>
      </div>
    );
  }

  if (order.status === 'failed' || order.status === 'cancelled') {
    const config =
      order.status === 'cancelled' ? ORDER_STATUS_CONFIG.cancelled : ORDER_STATUS_CONFIG.failed;
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Tag color={BADGE_VARIANT_TO_TAG_COLOR[config.variant]}>{config.label}</Tag>
        </div>
        <Button variant="outlined" onClick={handleBack} icon={<ArrowLeft className="h-4 w-4" />}>
          {tenantMessages.settings.subscriptionPage.pay.backToSubscription}
        </Button>
      </div>
    );
  }

  const isExpired = order.status === 'pending' && new Date(order.expires_at).getTime() < Date.now();
  if (isExpired) {
    const config = ORDER_STATUS_CONFIG.expired;
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Tag color={BADGE_VARIANT_TO_TAG_COLOR[config.variant]}>{config.label}</Tag>
          <span className="text-muted-foreground">{tenantMessages.settings.subscriptionPage.pay.expiredHint}</span>
        </div>
        <Button variant="outlined" onClick={handleBack} icon={<ArrowLeft className="h-4 w-4" />}>
          {tenantMessages.settings.subscriptionPage.pay.backToSubscription}
        </Button>
      </div>
    );
  }

  const qrUrl = order.code_url
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(order.code_url)}`
    : null;

  return (
    <div className="space-y-6">
        <Card className="mx-auto max-w-md" title={tenantI18n.t('settings.subscriptionPage.pay.orderNumber', { orderNo: order.order_no })}>
          <div className="mb-4 text-muted-foreground">
            {order.plan?.name ? (
              tenantI18n.t('settings.subscriptionPage.pay.orderAmountWithPlan', {
                planName: order.plan.name,
                amount: Number(order.amount).toFixed(2),
              })
            ) : (
              tenantI18n.t('settings.subscriptionPage.pay.orderAmountOnly', {
                amount: Number(order.amount).toFixed(2),
              })
            )}
            ，{tenantMessages.settings.subscriptionPage.pay.autoRefresh}
          </div>
          <div className="flex flex-col items-center gap-6">
            {qrUrl ? (
              <>
                {/* 动态二维码 URL 使用 img，next/image 需配置 remotePatterns */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrUrl}
                  alt={tenantMessages.settings.subscriptionPage.pay.qrAlt}
                  className="rounded-lg border border-input bg-background p-2"
                  width={220}
                  height={220}
                />
                <p className="text-center text-sm text-muted-foreground">
                  {tenantMessages.settings.subscriptionPage.pay.qrHint}
                </p>
              </>
            ) : order.simulate_pay_available || import.meta.env.MODE === 'development' ? (
              <div className="flex flex-col items-center gap-4 py-4">
                <p className="text-center text-muted-foreground">
                  {tenantMessages.settings.subscriptionPage.pay.devHint}
                </p>
                <Button
                  onClick={() => directCompleteMutation.mutate()}
                  disabled={directCompleteMutation.isPending}
                  type="primary"
                  className="gap-2"
                  icon={directCompleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                >
                  直接完成订阅（开发测试）
                </Button>
              </div>
            ) : (
              <p className="py-8 text-center text-muted-foreground">
                {tenantMessages.settings.subscriptionPage.pay.unavailable}
              </p>
            )}
            {qrUrl && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {tenantMessages.settings.subscriptionPage.pay.waiting}
              </div>
            )}
          </div>
        </Card>
      </div>
  );
}

export default function SubscriptionPayPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton.Input active size="small" className="w-48" />
          <Card>
            <Skeleton active avatar={false} paragraph={{ rows: 3 }} />
          </Card>
        </div>
      }
    >
      <SubscriptionPayContent />
    </Suspense>
  );
}
