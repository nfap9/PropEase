import { Suspense, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Button, Card, Skeleton } from 'antd';
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
        <Card
          className={isSuccess ? 'border-green-500/50' : 'border-red-500/50'}
          title={
            <div className="flex items-center gap-3">
              {isSuccess ? (
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              ) : (
                <XCircle className="h-10 w-10 text-red-600" />
              )}
              <div>
                <div className="text-lg font-semibold">
                  {isSuccess
                    ? tenantMessages.settings.subscriptionPage.result.successTitle
                    : tenantMessages.settings.subscriptionPage.result.failedTitle}
                </div>
                <div className="text-sm font-normal text-muted-foreground">
                  {isSuccess
                    ? tenantMessages.settings.subscriptionPage.result.successDescription
                    : tenantMessages.settings.subscriptionPage.result.failedDescription}
                </div>
              </div>
            </div>
          }
        >
          {orderId && (
            <p className="text-sm text-muted-foreground">
              {tenantI18n.t('settings.subscriptionPage.result.orderNumber', { orderId })}
            </p>
          )}
        </Card>
        <Button className="w-full" onClick={handleBack} icon={<ArrowLeft className="h-4 w-4" />}>
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
          <Skeleton active paragraph={{ rows: 3 }} />
          <Skeleton active />
        </div>
      }
    >
      <SubscriptionResultContent />
    </Suspense>
  );
}
