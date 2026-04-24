import { useState } from 'react';
import type { BillStatus } from '@/types';

export interface BillFiltersState {
  statusFilter: BillStatus | 'all';
  setStatusFilter: (v: BillStatus | 'all') => void;
}

export function useBillFilters(): BillFiltersState {
  const [statusFilter, setStatusFilter] = useState<BillStatus | 'all'>('all');

  return {
    statusFilter,
    setStatusFilter,
  };
}
