import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { billsApi } from '@/api/bills';
import { leasesApi } from '@/api/leases';
import type { Bill } from '@/types';

interface BillStatusStats {
  pending: Bill[];
  billed: Bill[];
  settled: Bill[];
  billedAmount: number;
  collectedAmount: number;
  estimatedTotal: number;
  upstreamCost: number;
}

export function useBillStatusCard(orgId: string | undefined) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const { data: bills = [], isLoading: billsLoading } = useQuery({
    queryKey: ['bills-monthly', orgId, currentYear, currentMonth],
    queryFn: () => billsApi.list({ year: currentYear, month: currentMonth }),
    enabled: !!orgId,
  });

  const { data: leases = [], isLoading: leasesLoading } = useQuery({
    queryKey: ['leases', orgId],
    queryFn: () => leasesApi.list(true),
    enabled: !!orgId,
  });

  const stats = useMemo((): BillStatusStats => {
    const pending = bills.filter((b) => b.status === 'pending');
    const billed = bills.filter((b) => b.status === 'partial' || b.status === 'overdue');
    const settled = bills.filter((b) => b.status === 'paid');

    const billedAmount = [...billed, ...settled].reduce((sum, b) => sum + b.total_amount, 0);
    const collectedAmount =
      settled.reduce((sum, b) => sum + b.paid_amount, 0) +
      billed.reduce((sum, b) => sum + b.paid_amount, 0);

    // Estimated: sum of monthly_rent for active leases (rough estimate for pending bills)
    const estimatedTotal = leases.reduce((sum, l) => sum + (l.monthly_rent || 0), 0);

    // Upstream cost: placeholder — actual would need utility costs
    const upstreamCost = estimatedTotal * 0.8;

    return { pending, billed, settled, billedAmount, collectedAmount, estimatedTotal, upstreamCost };
  }, [bills, leases]);

  return {
    stats,
    currentYear,
    currentMonth,
    isLoading: billsLoading || leasesLoading,
  };
}
