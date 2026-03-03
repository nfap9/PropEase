'use client';

import { Suspense, useCallback, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ORDER_STATUS_CONFIG } from '@/lib/status-config';
import { ArrowLeft, Loader2, Smartphone, FlaskConical } from 'lucide-react';
import { subscriptionsApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/utils/error';
import { useAuth } from '@/lib/auth/context';
import { toast } from 'sonner';

const POLL_INTERVAL_MS = 2500;

function SubscriptionPayContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');
  const { organization } = useAuth();
  const orgId = organization?.id;

  const { data: order, isLoading, isError } = useQuery({
    queryKey: ['subscription-order', orgId, orderId],
    queryFn: () => subscriptionsApi.getOrder(orgId!, orderId!),
    enabled: !!orgId && !!orderId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'paid' || status === 'failed' || status === 'cancelled') return false;
      return POLL_INTERVAL_MS;
    },
  });

  const simulatePayMutation = useMutation({
    mutationFn: () => subscriptionsApi.simulatePay(orgId!, orderId!),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['subscription-order', orgId, orderId] });
      if (updated?.status === 'paid') {
        router.replace(`/settings/subscription/result?order_id=${orderId}&status=success`);
      }
    },
    onError: (err) => toast.error(getErrorMessage(err, '模拟支付失败，请重试')),
  });

  const handleBack = useCallback(() => {
    router.push('/settings/subscription');
  }, [router]);

  useEffect(() => {
    if (order?.status === 'paid') {
      router.replace(`/settings/subscription/result?order_id=${orderId}&status=success`);
    }
  }, [order?.status, orderId, router]);

  if (!orderId || !orgId) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <p className="text-muted-foreground">缺少订单信息</p>
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回订阅管理
          </Button>
        </div>
      </MainLayout>
    );
  }

  if (isLoading && !order) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <Card>
            <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <Skeleton className="h-48 w-48 rounded" />
              <Skeleton className="h-4 w-64" />
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  if (isError || !order) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <p className="text-destructive">无法加载订单</p>
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回订阅管理
          </Button>
        </div>
      </MainLayout>
    );
  }

  if (order.status === 'paid') {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center gap-4 py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>支付成功，正在跳转...</p>
        </div>
      </MainLayout>
    );
  }

  if (order.status === 'failed' || order.status === 'cancelled') {
    const config =
      order.status === 'cancelled' ? ORDER_STATUS_CONFIG.cancelled : ORDER_STATUS_CONFIG.failed;
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Badge variant={config.variant}>{config.label}</Badge>
          </div>
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回订阅管理
          </Button>
        </div>
      </MainLayout>
    );
  }

  const isExpired =
    order.status === 'pending' && new Date(order.expires_at).getTime() < Date.now();
  if (isExpired) {
    const config = ORDER_STATUS_CONFIG.expired;
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Badge variant={config.variant}>{config.label}</Badge>
            <span className="text-muted-foreground">请返回订阅管理重新下单</span>
          </div>
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回订阅管理
          </Button>
        </div>
      </MainLayout>
    );
  }

  const qrUrl = order.code_url
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(order.code_url)}`
    : null;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Smartphone className="h-7 w-7" />
              微信扫码支付
            </h1>
            <p className="text-muted-foreground">请使用微信扫描下方二维码完成支付</p>
          </div>
        </div>

        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>订单号：{order.order_no}</CardTitle>
            <CardDescription>
              {order.plan?.name ? (
                <>
                  {order.plan.name} · 金额 ¥{Number(order.amount).toFixed(2)}
                </>
              ) : (
                <>金额 ¥{Number(order.amount).toFixed(2)}</>
              )}
              ，支付完成后将自动刷新
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6">
            {qrUrl ? (
              <>
                {/* 动态二维码 URL 使用 img，next/image 需配置 remotePatterns */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrUrl}
                  alt="支付二维码"
                  className="rounded-lg border bg-white p-2"
                  width={220}
                  height={220}
                />
                <p className="text-sm text-muted-foreground text-center">
                  请使用微信扫描二维码完成支付
                </p>
              </>
            ) : order.simulate_pay_available ? (
              <div className="flex flex-col items-center gap-4 py-4">
                <p className="text-muted-foreground text-center">
                  开发环境：微信支付未配置，可使用模拟支付完成流程
                </p>
                <Button
                  onClick={() => simulatePayMutation.mutate()}
                  disabled={simulatePayMutation.isPending}
                  variant="outline"
                  className="gap-2"
                >
                  {simulatePayMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FlaskConical className="h-4 w-4" />
                  )}
                  模拟支付
                </Button>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                当前环境未配置支付，无法展示二维码。请联系管理员配置微信支付。
              </p>
            )}
            {qrUrl && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                等待支付中…
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

export default function SubscriptionPayPage() {
  return (
    <Suspense
      fallback={
        <MainLayout>
          <div className="space-y-6">
            <Skeleton className="h-10 w-48" />
            <Card>
              <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
              <CardContent className="flex flex-col items-center gap-4">
                <Skeleton className="h-48 w-48 rounded" />
                <Skeleton className="h-4 w-64" />
              </CardContent>
            </Card>
          </div>
        </MainLayout>
      }
    >
      <SubscriptionPayContent />
    </Suspense>
  );
}
