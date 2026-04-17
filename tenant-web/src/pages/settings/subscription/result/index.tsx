
import { Suspense, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@apartment-ultra/shared-ui/components/ui';
import { Skeleton } from '@apartment-ultra/shared-ui/components/ui';
import { CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/auth';
import { tenantI18n, tenantMessages } from '@/i18n';

function SubscriptionResultContent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
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
    navigate('/workspace/subscription');
  };

  return (
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
                <CardTitle>
                  {isSuccess
                    ? tenantMessages.settings.subscriptionPage.result.successTitle
                    : tenantMessages.settings.subscriptionPage.result.failedTitle}
                </CardTitle>
                <CardDescription>
                  {isSuccess
                    ? tenantMessages.settings.subscriptionPage.result.successDescription
                    : tenantMessages.settings.subscriptionPage.result.failedDescription}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          {orderId && (
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {tenantI18n.t('settings.subscriptionPage.result.orderNumber', { orderId })}
              </p>
            </CardContent>
          )}
        </Card>
        <Button className="w-full" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {tenantMessages.settings.subscriptionPage.result.back}
        </Button>
      </div>
  );
}

export default function SubscriptionResultPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-md space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      }
    >
      <SubscriptionResultContent />
    </Suspense>
  );
}
