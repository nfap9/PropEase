'use client';

import { Search, X } from 'lucide-react';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { DateRangePicker } from '@apartment-ultra/shared-ui/components/ui';
import { FilterField } from '@apartment-ultra/shared-ui/components/ui';
import { Input } from '@apartment-ultra/shared-ui/components/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@apartment-ultra/shared-ui/components/ui';
import type { LeaseFiltersState } from '../leases.schemas';

interface LeaseFiltersProps {
  apartments: { id: string; name: string }[];
  filters: LeaseFiltersState;
  onFilterChange: (key: keyof LeaseFiltersState, value: unknown) => void;
  onClearFilters: () => void;
}

export function LeaseFilters({ apartments, filters, onFilterChange, onClearFilters }: LeaseFiltersProps) {
  const hasApartment = Boolean(filters.apartmentId);
  const hasKeyword = Boolean(filters.keyword?.trim());
  const hasDates =
    Boolean(filters.startDateFrom) ||
    Boolean(filters.startDateTo) ||
    Boolean(filters.endDateFrom) ||
    Boolean(filters.endDateTo);
  const hasActiveFilters = hasApartment || hasKeyword || hasDates;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        <FilterField label="公寓">
          <Select
            value={filters.apartmentId || 'all'}
            onValueChange={(value) => onFilterChange('apartmentId', value === 'all' ? null : value)}
          >
            <SelectTrigger className="w-full" data-testid="leases-apartment-filter">
              <SelectValue placeholder="全部公寓" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部公寓</SelectItem>
              {apartments.map((apartment) => (
                <SelectItem key={apartment.id} value={apartment.id}>
                  {apartment.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>

        <FilterField label="搜索">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="房间号、租客姓名、手机号或身份证号"
              className="pl-10"
              value={filters.keyword ?? ''}
              onChange={(event) => onFilterChange('keyword', event.target.value.trim() || null)}
            />
          </div>
        </FilterField>
      </div>

      <div className="flex flex-wrap gap-4">
        <FilterField label="开始日期范围">
          <DateRangePicker
            value={{ from: filters.startDateFrom, to: filters.startDateTo }}
            placeholder="选择开始日期范围"
            onChange={(range) => {
              onFilterChange('startDateFrom', range.from);
              onFilterChange('startDateTo', range.to);
            }}
          />
        </FilterField>
        <FilterField label="结束日期范围">
          <DateRangePicker
            value={{ from: filters.endDateFrom, to: filters.endDateTo }}
            placeholder="选择结束日期范围"
            onChange={(range) => {
              onFilterChange('endDateFrom', range.from);
              onFilterChange('endDateTo', range.to);
            }}
          />
        </FilterField>
      </div>

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={onClearFilters}>
          <X className="mr-1 h-4 w-4" />
          清除筛选
        </Button>
      )}
    </div>
  );
}
