'use client';

import { useCallback, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Loader2, Smartphone } from 'lucide-react';
import { subscriptionsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth/context';

const POLL_INTERVAL_MS = 2500;

export default function SubscriptionPayPage() {
  const router = useRouter();
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
    return (
      <MainLayout>
        <div className="space-y-6">
          <p className="text-muted-foreground">
            {order.status === 'cancelled' ? '订单已取消' : '支付失败'}
          </p>
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
              金额 ¥{order.amount.toFixed(2)}，支付完成后将自动刷新
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
            ) : (
              <p className="text-muted-foreground text-center py-8">
                当前环境未配置支付，无法展示二维码。请联系管理员配置微信支付。
              </p>
            )}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              等待支付中…
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
