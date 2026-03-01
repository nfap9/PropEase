'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';

function SubscriptionResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const status = searchParams.get('status'); // success | fail
  const orderId = searchParams.get('order_id');

  const isSuccess = status === 'success';

  const handleBack = () => {
    router.push('/settings/subscription');
  };

  return (
    <MainLayout>
      <div className="space-y-6 max-w-md mx-auto">
        <Card className={isSuccess ? 'border-green-500/50' : 'border-destructive/50'}>
          <CardHeader>
            <div className="flex items-center gap-3">
              {isSuccess ? (
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              ) : (
                <XCircle className="h-10 w-10 text-destructive" />
              )}
              <div>
                <CardTitle>
                  {isSuccess ? '支付成功' : '支付未完成'}
                </CardTitle>
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
          <ArrowLeft className="h-4 w-4 mr-2" />
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
          <div className="space-y-6 max-w-md mx-auto">
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
