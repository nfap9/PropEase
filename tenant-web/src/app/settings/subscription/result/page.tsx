'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/lib/auth/context';

function SubscriptionResultContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const { organization } = useAuth();
  const orgId = organization?.id;
  const status = searchParams.get('status'); // success | fail
  const orderId = searchParams.get('order_id');

  const isSuccess = status === 'success';

  // 支付成功后预刷新订阅状态，确保返回订阅页面时显示最新数据
  useEffect(() => {
    if (isSuccess && orgId) {
      queryClient.invalidateQueries({ queryKey: ['subscription-status', orgId] });
      queryClient.invalidateQueries({ queryKey: ['organization-usage', orgId] });
    }
  }, [isSuccess, orgId, queryClient]);

  const handleBack = () => {
    router.push('/settings/subscription');
  };

  return (
    <MainLayout>
      <div className="mx-auto max-w-md space-y-6">
        <Card className={isSuccess ? 'border-green-500/50' : 'border-destructive/50'}>
          <CardHeader>
            <div className="flex items-center gap-3">
              {isSuccess ? (
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              ) : (
                <XCircle className="h-10 w-10 text-destructive" />
              )}
              <div>
                <CardTitle>{isSuccess ? '支付成功' : '支付未完成'}</CardTitle>
                <CardDescription>
                  {isSuccess
                    ? '您的订阅已开通/续费/升级，感谢使用！'
                    : '支付已取消或失败，您可返回订阅管理重新下单。'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          {orderId && (
            <CardContent>
              <p className="text-sm text-muted-foreground">订单号：{orderId}</p>
            </CardContent>
          )}
        </Card>
        <Button className="w-full" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回订阅管理
        </Button>
      </div>
    </MainLayout>
  );
}

export default function SubscriptionResultPage() {
  return (
    <Suspense
      fallback={
        <MainLayout>
          <div className="mx-auto max-w-md space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </MainLayout>
      }
    >
      <SubscriptionResultContent />
    </Suspense>
  );
}
