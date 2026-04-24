import { useCallback, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { subscriptionsApi } from '@/api/subscriptions';
import { useAuth } from '@/contexts/auth';

const POLL_INTERVAL_MS = 2500;

export interface SubscriptionPayPageState {
  orderId: string | null;
  order: Awaited<ReturnType<typeof subscriptionsApi.getOrder>> | undefined;
  isLoading: boolean;
  isError: boolean;
  isPaid: boolean;
  isFailed: boolean;
  isCancelled: boolean;
  isExpired: boolean;
  qrUrl: string | null;
  directCompleteMutation: ReturnType<typeof useMutation<void, Error, void>>;
  handleBack: () => void;
}

export function useSubscriptionPayPage(): SubscriptionPayPageState {
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

  const qrUrl = order?.code_url
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(order.code_url)}`
    : null;

  return {
    orderId,
    order,
    isLoading,
    isError,
    isPaid: order?.status === 'paid',
    isFailed: order?.status === 'failed',
    isCancelled: order?.status === 'cancelled',
    isExpired: order?.status === 'pending' && new Date(order.expires_at).getTime() < Date.now(),
    qrUrl,
    directCompleteMutation,
    handleBack,
  };
}
