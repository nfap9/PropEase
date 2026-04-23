// ============ Default form values (from former schemas/) ============

import type { LeaseFiltersState } from '@/types';

export function getDefaultLeaseFilters(): LeaseFiltersState {
  return {
    apartmentId: null,
    keyword: null,
    startDateFrom: null,
    startDateTo: null,
    endDateFrom: null,
    endDateTo: null,
  };
}
