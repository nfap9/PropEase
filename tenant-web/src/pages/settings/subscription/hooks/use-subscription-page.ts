import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { subscriptionsApi } from '@/api/subscriptions';
import { useAuth } from '@/contexts/auth';
import type { SubscriptionStatus, OrganizationUsage } from '@/types';

export interface SubscriptionPageState {
  // Data
  subscriptionStatus: SubscriptionStatus | undefined;
  usage: OrganizationUsage | undefined;
  isLoading: boolean;

  // Computed helpers
  getUsagePercent: (used: number, max: number) => number;
  formatDate: (dateStr: string | null) => string;
}

export function useSubscriptionPage(): SubscriptionPageState {
  const { organization } = useAuth();
  const orgId = organization?.id;

  const { data: subscriptionStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['subscription-status', orgId],
    queryFn: () => subscriptionsApi.getSubscriptionStatus(orgId!),
    enabled: !!orgId,
  });

  const { data: usage, isLoading: usageLoading } = useQuery({
    queryKey: ['organization-usage', orgId],
    queryFn: () => subscriptionsApi.getUsage(orgId!),
    enabled: !!orgId,
  });

  const isLoading = statusLoading || usageLoading;

  const getUsagePercent = useMemo(() => (used: number, max: number) => {
    if (max <= 0) return 0;
    return Math.min(100, Math.round((used / max) * 100));
  }, []);

  const formatDate = useMemo(() => (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('zh-CN');
  }, []);

  return {
    subscriptionStatus,
    usage,
    isLoading,
    getUsagePercent,
    formatDate,
  };
}
